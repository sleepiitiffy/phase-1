#!/usr/bin/env node
/*
  npm run phone

  Opens a temporary public HTTPS tunnel to this project and prints the
  tunnel URL as a QR code, so a phone can open the project by scanning it.

  It checks for a preview server on port 5500 first. If Live Server (Go Live
  in VS Code) is running, it uses that. If nothing answers, it starts its
  own small server for this folder, and stops it again with Ctrl+C.

  Needs Node.js and cloudflared (see README.md). Another port:
    PORT=8080 npm run phone          (Mac)
    $env:PORT=8080; npm run phone    (Windows PowerShell)
  Options:
    npm run phone -- --verbose   show every line cloudflared prints
    npm run phone -- --quic      use QUIC (UDP) instead of the default
    npm run phone -- --http2     use HTTP/2 (TCP), the default
*/

import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 5500; // Live Server's port
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); // the project folder
const LOCAL_URL = `http://localhost:${PORT}`;
const TUNNEL_URL = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
const QR_PACKAGE = "qrcode-terminal@0.12.0";
const MAX_RESTARTS = 8;

const verbose = process.argv.includes("--verbose");
// cloudflared prefers "quic" (UDP), but the OCAD network drops idle UDP
// sessions about once a minute, each one a brief reconnect. "http2" (TCP)
// stayed up several times longer in testing, so it is the default here.
const DEFAULT_PROTOCOL = "http2";
const protocol = process.argv.includes("--http2")
  ? "http2"
  : process.argv.includes("--quic")
    ? "quic"
    : DEFAULT_PROTOCOL;
const log = (...parts) => console.log(...parts);

// cloudflared reconnects by itself after a dropped connection. These
// lines describe that episode; they are summarised as one message.
const TRANSIENT =
  /datagram handler|accept incoming stream|failed to serve tunnel connection|Serve tunnel error|Retrying connection|Connection terminated|shutting down control stream/;

let tunnel = null;
let server = null; // the built-in preview server, when this command started one
let restarts = 0;
let stopping = false;

log("");
log("Phone preview");
log(`Local site: ${LOCAL_URL}`);

// Without a server behind it, the tunnel opens but the phone gets
// "502 Bad Gateway". So check first, and start one if nothing answers.
if (await localServerIsUp()) {
  log("Preview server: already running (Live Server, or your own)");
} else {
  server = await startPreviewServer();
  log(`Preview server: none was running, so this command started one for ${path.basename(ROOT)}.`);
  log("   It stops with Ctrl+C. You do not need Go Live while this runs.");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("exit", () => {
  if (tunnel && tunnel.exitCode === null) tunnel.kill();
  if (server) server.close();
});

startTunnel();

function startTunnel() {
  log("Opening tunnel...");
  const state = { url: null, connected: false, shown: false, dropped: false, lost: false, showTimer: null };
  const child = spawn("cloudflared", ["tunnel", "--protocol", protocol, "--url", LOCAL_URL], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  tunnel = child;

  child.on("error", (err) => {
    log("");
    if (err.code === "ENOENT") {
      log("cloudflared is not installed or is not on your PATH.");
      log("Install it (see README.md), open a new terminal, and run  npm run phone  again.");
    } else {
      log(`Could not start cloudflared: ${err.message}`);
    }
    process.exit(1);
  });

  const onLine = (line) => handleLine(line, state, child);
  readline.createInterface({ input: child.stdout }).on("line", onLine);
  readline.createInterface({ input: child.stderr }).on("line", onLine);

  child.on("close", (code) => {
    clearTimeout(state.showTimer);
    if (stopping) {
      log("");
      log("Tunnel closed.");
      process.exit(0);
    }
    if (restarts < MAX_RESTARTS) {
      const delay = Math.min(30, 2 ** restarts);
      restarts += 1;
      log("");
      log(
        state.lost
          ? "Cloudflare dropped this tunnel after the connection was lost. Opening a new one with a new URL..."
          : `cloudflared stopped (exit code ${code}). Opening a new tunnel in ${delay}s...`,
      );
      setTimeout(startTunnel, delay * 1000);
      return;
    }
    log("");
    log("Could not keep a tunnel open. Check the Wi-Fi, then run  npm run phone  again.");
    process.exit(code || 1);
  });
}

function handleLine(line, state, child) {
  if (verbose) log(line);
  const match = line.match(TUNNEL_URL);
  if (match && !state.url) {
    state.url = match[0];
    // Show the link even if the connection report is slow to arrive.
    state.showTimer = setTimeout(() => show(state), 10000);
  }
  if (/Registered tunnel connection/.test(line)) {
    restarts = 0;
    if (state.dropped) {
      state.dropped = false;
      if (!verbose) log("Tunnel reconnected. The same URL still works.");
    }
    state.connected = true;
  }
  if (state.url && state.connected) show(state);
  if (/Tunnel not found/.test(line) && !state.lost) {
    // After a long drop Cloudflare forgets a quick tunnel. Only a new one works.
    state.lost = true;
    child.kill();
    return;
  }
  if (verbose) return;
  if (TRANSIENT.test(line)) {
    if (!state.dropped) {
      state.dropped = true;
      log("Tunnel connection dropped. Reconnecting... (the URL stays the same)");
    }
    return;
  }
  if (/ ERR /.test(line)) log(`cloudflared: ${stripLogPrefix(line)}`);
}

async function show(state) {
  if (state.shown) return;
  state.shown = true;
  clearTimeout(state.showTimer);
  log("");
  log("Phone URL (public, temporary):");
  log("");
  log(`   ${state.url}`);
  log("");
  const qr = await makeQr(state.url);
  if (qr) {
    log(qr);
  } else {
    log("(No QR code this time. Type the URL into the phone's browser.)");
  }
  log("");
  log("Scan the code with the phone camera, or type the URL.");
  log("Edit your files, then reload on the phone. Anyone with the link can open");
  log("your project while this runs. If the link dies after a long Wi-Fi drop, a new");
  log("URL and code print here. Press Ctrl+C to stop.");
  log("");
}

function stop() {
  if (stopping) return;
  stopping = true;
  if (tunnel && tunnel.exitCode === null) {
    tunnel.kill();
  } else {
    process.exit(0);
  }
}

// A small static server for the project folder: no packages to install.
// It never serves hidden files (.git, .agents, .env), since the tunnel is
// public, and it answers byte ranges, which iPhones need for audio and video.
function startPreviewServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      serveFile(req, res).catch(() => send(res, 500, "Server error"));
    });
    srv.on("error", (err) => {
      log("");
      if (err.code === "EADDRINUSE") {
        log(`Port ${PORT} is busy, but nothing there answers as a web server.`);
        log("Close what is using it, or choose another port (see the top of scripts/phone.mjs).");
      } else {
        log(`Could not start a preview server: ${err.message}`);
      }
      process.exit(1);
    });
    srv.listen(PORT, "127.0.0.1", () => resolve(srv));
  });
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".m4a": "audio/mp4",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".otf": "font/otf", ".wasm": "application/wasm", ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json", ".obj": "text/plain; charset=utf-8", ".vert": "text/plain; charset=utf-8",
  ".frag": "text/plain; charset=utf-8",
};

async function serveFile(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed");
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return send(res, 400, "Bad request");
  }
  if (pathname.split("/").some((part) => part.startsWith("."))) return send(res, 404, "Not found");
  let file = path.join(ROOT, pathname);
  if (path.relative(ROOT, file).startsWith("..")) return send(res, 404, "Not found");

  let info = await stat(file).catch(() => null);
  if (info && info.isDirectory()) {
    if (!pathname.endsWith("/")) {
      res.writeHead(301, { Location: pathname + "/" });
      return res.end();
    }
    file = path.join(file, "index.html");
    info = await stat(file).catch(() => null);
  }
  if (!info || !info.isFile()) return send(res, 404, `Not found: ${pathname}`);

  const headers = {
    "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store", // every reload on the phone gets your latest save
    "Accept-Ranges": "bytes",
  };
  let start = 0;
  let end = info.size - 1;
  let status = 200;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (range && info.size > 0) {
    if (range[1] === "") {
      start = Math.max(0, info.size - Number(range[2])); // the last N bytes
    } else {
      start = Number(range[1]);
      if (range[2] !== "") end = Math.min(end, Number(range[2]));
    }
    if (start > end || start >= info.size) {
      res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
      return res.end();
    }
    status = 206;
    headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
  }
  headers["Content-Length"] = info.size === 0 ? 0 : end - start + 1;
  res.writeHead(status, headers);
  if (req.method === "HEAD" || info.size === 0) return res.end();
  createReadStream(file, { start, end }).pipe(res);
}

function send(res, status, text) {
  if (res.headersSent) return res.end();
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(text + "\n");
}

function localServerIsUp() {
  return new Promise((resolve) => {
    const req = http.get(LOCAL_URL, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function stripLogPrefix(line) {
  return line.replace(/^\S+\s+(INF|ERR|WRN|DBG)\s+/, "");
}

// Ask qrcode-terminal for the code (npx fetches it once, then reuses its
// cache), then redraw it half as tall with explicit colours so it scans
// on light and dark terminals alike. One retry covers a network blip.
async function makeQr(text) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const qr = await runQrTool(text);
    if (qr) return qr;
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  return null;
}

function runQrTool(text) {
  return new Promise((resolve) => {
    let raw = "";
    const child = spawn(`npx --yes --prefer-offline ${QR_PACKAGE}`, {
      shell: true,
      stdio: ["pipe", "pipe", "ignore"],
    });
    const timer = setTimeout(() => {
      child.kill();
      resolve(null);
    }, 45000);
    child.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.stdout.on("data", (chunk) => {
      raw += chunk;
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0 ? compactQr(raw) : null);
    });
    child.stdin.end(text + "\n");
  });
}

function compactQr(raw) {
  // qrcode-terminal draws each module as a two-space cell with an ANSI
  // background: 40 = dark, 47 = light. Read those back into a grid.
  const rows = [];
  for (const line of raw.split("\n")) {
    const cells = [...line.matchAll(/\x1b\[(40|47)m {2}\x1b\[0m/g)].map((m) => m[1] === "40");
    if (cells.length) rows.push(cells);
  }
  const size = rows.length;
  if (!size || rows.some((r) => r.length !== size)) return raw.trim() || null;

  const PAD = 2; // extra light margin around the library's own one-module border
  const width = size + PAD * 2;
  const light = () => new Array(width).fill(false);
  const grid = [];
  for (let i = 0; i < PAD; i++) grid.push(light());
  for (const r of rows) grid.push([...new Array(PAD).fill(false), ...r, ...new Array(PAD).fill(false)]);
  for (let i = 0; i < PAD; i++) grid.push(light());
  if (grid.length % 2) grid.push(light());

  // Two module rows per text line: block characters in white on black.
  const lines = [];
  for (let y = 0; y < grid.length; y += 2) {
    let s = "\x1b[97;40m";
    for (let x = 0; x < width; x++) {
      const top = grid[y][x];
      const bottom = grid[y + 1][x];
      s += top ? (bottom ? " " : "▄") : bottom ? "▀" : "█";
    }
    lines.push(s + "\x1b[0m");
  }
  return lines.join("\n");
}
