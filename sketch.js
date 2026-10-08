// A soft glowing creature on a phone.
// Steps 1-5 of plan.md: the canvas, the gesture lock, the quiet first-run
// prompt, one short tone per touch, and holding the screen awake.

// ---- Tunables -------------------------------------------------------------

const RESTING_FRAME_RATE = 30;
const PIXEL_DENSITY_CAP = 2;

const TONE_BASE_HZ = 220;
const TONE_HUE_SPREAD_HZ = 110;
const TONE_ATTACK_MS = 8;
const TONE_RELEASE_MS = 420;
const TONE_VOLUME = 0.12;

// Temporary stand-in. Step 10 makes hue part of the saved genome.
const CREATURE_HUE = 40;

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
  return (
    TONE_BASE_HZ + map(CREATURE_HUE, 0, 360, -TONE_HUE_SPREAD_HZ, TONE_HUE_SPREAD_HZ)
  );
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
  background(0);

  lockGestures();
  enablePermissionsMinimal(['sensors', 'sound']);
  showDebug();

  document.addEventListener('visibilitychange', onVisibilityChange);
}

function draw() {
  background(0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}