// A soft glowing creature on a phone.
// Steps 1-10 of plan.md: canvas, gesture lock, the quiet first-run prompt,
// a short tone per touch, holding the screen awake, the sensors, the first
// glowing body, the saved genome, the drifting silhouette, and its colour.

// ---- Tunables -------------------------------------------------------------

const RESTING_FRAME_RATE = 30;
const PIXEL_DENSITY_CAP = 2;

const TONE_BASE_HZ = 220;
const TONE_HUE_SPREAD_HZ = 110;
const TONE_ATTACK_MS = 8;
const TONE_RELEASE_MS = 420;
const TONE_VOLUME = 0.12;

const SHAKE_THRESHOLD = 25;

// Body
const CREATURE_SIZE = 220; // diameter in pixels
const CREATURE_CENTRE_Y_FRAC = 0.5; // fraction of canvas height, not pixels
const GLOW_PASSES = 6;
const GLOW_ALPHA = 0.16;
const CREATURE_BLOOM_MIN = 0.92;
const CREATURE_BLOOM_MAX = 1.06;

// Silhouette
const SILHOUETTE_SAMPLES = 72;
const LOBE_DEPTH = 0.28; // fixed look, not a genome value

// Genome ranges. These are the only seven things a touch will ever change.
const LOBES_MIN = 2;
const LOBES_MAX = 7;
const STRETCH_MIN = 0.72;
const STRETCH_MAX = 1.45;
const HUE_MIN = 0;
const HUE_MAX = 360;
const SAT_MIN = 35;
const SAT_MAX = 78;
const BRIGHT_MIN = 62;
const BRIGHT_MAX = 96;
const BAND_COUNT_MIN = 2;
const BAND_COUNT_MAX = 6;
const BAND_GAP_MIN = 8;
const BAND_GAP_MAX = 34;
const EDGE_BLUR_MIN = 4;
const EDGE_BLUR_MAX = 30;
const BREATH_PERIOD_MIN = 4200;
const BREATH_PERIOD_MAX = 9000;

const GENOME_KEY = 'the-creature-genome';
const GENOME_SAVE_DELAY_MS = 400;

// ---- Genome ---------------------------------------------------------------

// The whole genome, declared up front. No later step adds a field.
const GENOME_FIELDS = [
  'lobes',
  'stretch',
  'hue',
  'sat',
  'bright',
  'bandCount',
  'bandGap',
  'edgeBlur',
  'breathPeriod',
];

const GENOME_RANGES = {
  lobes: [LOBES_MIN, LOBES_MAX],
  stretch: [STRETCH_MIN, STRETCH_MAX],
  hue: [HUE_MIN, HUE_MAX],
  sat: [SAT_MIN, SAT_MAX],
  bright: [BRIGHT_MIN, BRIGHT_MAX],
  bandCount: [BAND_COUNT_MIN, BAND_COUNT_MAX],
  bandGap: [BAND_GAP_MIN, BAND_GAP_MAX],
  edgeBlur: [EDGE_BLUR_MIN, EDGE_BLUR_MAX],
  breathPeriod: [BREATH_PERIOD_MIN, BREATH_PERIOD_MAX],
};

let genome = {
  lobes: 3,
  stretch: 1,
  hue: 40,
  sat: 55,
  bright: 82,
  bandCount: 3,
  bandGap: 18,
  edgeBlur: 12,
  breathPeriod: 6000,
};

// Set when a URL parameter pins the genome, so a test page never rewrites
// the creature that is actually saved on the phone.
let genomeIsPinned = false;
let saveTimer = null;

// ---- State ----------------------------------------------------------------

let wakeLock = null;
let wantAwake = false;

// ---- Screen wake lock (browser API, not p5-phone) -------------------------

function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  navigator.wakeLock
    .request('screen')
    .then((lock) => {
      wakeLock = lock;
      debug('wake lock held');
    })
    .catch((err) => {
      debugWarn('wake lock refused: ' + err.message);
    });
}

function keepAwake() {
  wantAwake = true;
  const held = wakeLock !== null && !wakeLock.released;
  if (!held) requestWakeLock();
}

function onVisibilityChange() {
  if (wantAwake && document.visibilityState === 'visible') requestWakeLock();
}

// ---- Tone -----------------------------------------------------------------

function toneFrequency() {
  return TONE_BASE_HZ + map(genome.hue, 0, 360, -TONE_HUE_SPREAD_HZ, TONE_HUE_SPREAD_HZ);
}

function playTone() {
  if (!window.soundEnabled) return;
  const attack = TONE_ATTACK_MS / 1000;
  const release = TONE_RELEASE_MS / 1000;
  try {
    // p5.sound schedules start() and stop() as a delay from now, not an
    // absolute time, so both take seconds-from-here.
    const osc = new p5.Oscillator(toneFrequency(), 'sine');
    osc.amp(0, 0); // silent from the very first sample, so no click
    osc.amp(TONE_VOLUME, attack); // fade up
    osc.amp(0, release, attack); // fade back down, starting at the top
    osc.start();
    osc.stop(attack + release + 0.06);
  } catch (err) {
    debugWarn('tone failed: ' + err.message);
  }
}

// ---- Genome ---------------------------------------------------------------

function clampGenome() {
  for (const field of GENOME_FIELDS) {
    const [lo, hi] = GENOME_RANGES[field];
    genome[field] = constrain(genome[field], lo, hi);
  }
}

function loadGenome() {
  try {
    const raw = localStorage.getItem(GENOME_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    for (const field of GENOME_FIELDS) {
      if (typeof saved[field] === 'number' && isFinite(saved[field])) {
        genome[field] = saved[field];
      }
    }
    debug('genome loaded');
  } catch (err) {
    debugWarn('genome load failed: ' + err.message);
  }
}

function saveGenome() {
  if (genomeIsPinned) return;
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      localStorage.setItem(GENOME_KEY, JSON.stringify(genome));
      debug('genome saved');
    } catch (err) {
      debugWarn('genome save failed: ' + err.message);
    }
  }, GENOME_SAVE_DELAY_MS);
}

// Any genome field can be pinned from the address, so both ends of every
// range can be looked at without waiting days for one to drift there:
//   ?lobes=2&stretch=1.4&hue=210&edgeBlur=4
function applyUrlOverrides() {
  const params = new URLSearchParams(location.search);
  let pinned = false;
  for (const field of GENOME_FIELDS) {
    if (!params.has(field)) continue;
    const value = Number(params.get(field));
    if (isFinite(value)) {
      genome[field] = value;
      pinned = true;
    }
  }
  if (pinned) {
    genomeIsPinned = true;
    debug('genome pinned from url');
  }
}

// ---- Shape and colour -----------------------------------------------------

function bodyColour(alpha) {
  return color(genome.hue, genome.sat, genome.bright, alpha);
}

// Smooth and stable: the same genome always produces the same creature.
function outlineVariation(angle) {
  const k = genome.lobes * 0.5;
  const n = noise(Math.cos(angle) * k + 20, Math.sin(angle) * k + 20);
  return 1 + LOBE_DEPTH * (n - 0.5) * 2;
}

function buildOutline(cx, cy, radius) {
  const pts = [];
  for (let i = 0; i < SILHOUETTE_SAMPLES; i++) {
    const a = (i / SILHOUETTE_SAMPLES) * TWO_PI;
    const r = radius * outlineVariation(a);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * genome.stretch]);
  }
  return pts;
}

// A spline is drawn through its neighbours, so the first point is repeated
// at the end. Without it the outline leaves a kink where it closes, and on
// a soft body that kink is the first thing the eye finds.
function traceSpline(pts, cx, cy, scale) {
  beginShape();
  for (const p of pts) {
    splineVertex(cx + (p[0] - cx) * scale, cy + (p[1] - cy) * scale);
  }
  splineVertex(cx + (pts[0][0] - cx) * scale, cy + (pts[0][1] - cy) * scale);
  endShape(CLOSE);
}

// The softness is built from layered low-alpha fills, not from a canvas
// blur. A canvas blur is missing on some phones and fails silently there,
// taking the whole look with it.
function drawBody(pts, cx, cy, radius) {
  const spread = genome.edgeBlur / CREATURE_SIZE;
  drawingContext.globalCompositeOperation = 'lighter';
  for (let i = GLOW_PASSES - 1; i >= 0; i--) {
    const t = i / (GLOW_PASSES - 1); // 0 is the outermost, faintest pass
    fill(bodyColour(GLOW_ALPHA * (0.3 + 0.7 * t)));
    traceSpline(pts, cx, cy, 1 + spread * (1 - t));
  }
  // Reset or the next frame's background() behaves differently and smears.
  drawingContext.globalCompositeOperation = 'source-over';
}

function breathScale(t) {
  const phase = (t % genome.breathPeriod) / genome.breathPeriod;
  return map(Math.sin(phase * TWO_PI), -1, 1, CREATURE_BLOOM_MIN, CREATURE_BLOOM_MAX);
}

// ---- Input ----------------------------------------------------------------
// Declared as function declarations, so p5 finds them no matter where
// lockGestures() snapshots its handlers. Never reassign window.mouseXxx —
// that replaces p5-phone's own wrapper. There is only one mouseReleased():
// later steps add gesture detection to it, not a second one.

function mouseReleased() {
  keepAwake();
  playTone();
  return false;
}

// ---- p5 -------------------------------------------------------------------

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(Math.min(window.devicePixelRatio, PIXEL_DENSITY_CAP));
  frameRate(RESTING_FRAME_RATE);
  colorMode(HSB, 360, 100, 100, 1);
  background(0);

  lockGestures();
  enablePermissionsMinimal(['sensors', 'sound']);
  setShakeThreshold(SHAKE_THRESHOLD);
  showDebug();

  loadGenome();
  applyUrlOverrides();
  clampGenome();

  document.addEventListener('visibilitychange', onVisibilityChange);
}

function draw() {
  background(0);
  if (!window.sensorsEnabled) return;

  const cx = width / 2;
  const cy = height * CREATURE_CENTRE_Y_FRAC;
  const radius = (CREATURE_SIZE / 2) * breathScale(millis());

  const pts = buildOutline(cx, cy, radius);
  drawBody(pts, cx, cy, radius);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}