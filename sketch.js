// A soft glowing creature on a phone.
// Steps 1-17 of plan.md.
//
// The creature is one plain object of nine numbers. A touch nudges one or two
// of them by a hair; everything else you see is those nine numbers being read.
// Nothing else in this sketch is allowed to change the genome.

// ---- Tunables -------------------------------------------------------------

const RESTING_FRAME_RATE = 30;
const PIXEL_DENSITY_CAP = 2;

const TONE_BASE_HZ = 220;
const TONE_HUE_SPREAD_HZ = 110;
const TONE_ATTACK_MS = 8;
const TONE_RELEASE_MS = 420;
const TONE_VOLUME = 0.12;

const SHAKE_THRESHOLD = 25;
const SHAKE_FLASH_MS = 600;

// How the phone is sitting in the sculpture. Fill these in from the Step 6
// readout while the piece is at rest, and re-measure if it is re-mounted.
const REST_TILT_X = 0;
const REST_TILT_Y = 0;
const REST_TILT_Z = 0;

// Body
const CREATURE_SIZE = 220; // diameter in pixels
const CREATURE_CENTRE_Y_FRAC = 0.5; // fraction of canvas height, not pixels
const GLOW_PASSES = 6;
const GLOW_ALPHA = 0.16;
const CREATURE_BLOOM_MIN = 0.92;
const CREATURE_BLOOM_MAX = 1.06;

// Silhouette
// Control points around the loop, and curve samples between each pair. Needs to
// be generous: at 7 lobes, 48 control points left only about 7 per lobe and the
// curve visibly faceted at each crest. 96 keeps the crests round for a few
// hundred vertices a frame, which is cheap.
const SILHOUETTE_SAMPLES = 96;
const OUTLINE_SAMPLES_PER_SEGMENT = 4;
const NOISE_DEPTH = 0.09; // fixed asymmetry, not a genome value
const NOISE_ORBIT_RADIUS = 0.35; // keep the noise term broad, not bumpy

// Colour drifting inside the body, mixed on a buffer under MULTIPLY so the
// colours combine subtractively and overlaps make a real third colour instead
// of stacking to white. See drawInnerColour.
const INNER_BLOBS = 4;
const INNER_BLOB_PASSES = 4;
const INNER_FLOW_SPEED = 9000; // ms for one loop
const INNER_BLOB_SIZE = 26;
const INNER_BLOB_ALPHA = 0.42;
const INNER_BLOB_MARGIN = 0.35; // how far inside the edge their centres stay
const INNER_COMPOSITE_ALPHA = 0.5; // how much of the mixed result lands
const INNER_MASK_ALPHA = 0.92; // keeps the colour inside the body, black outside
const INNER_MASK_PASSES = 2; // destination-in multiplies alpha, so keep this low
const INNER_BRIGHT_SCALE = 0.95; // multiply needs headroom to stay soft

// Three hues related to the creature's own: near it, across from it, between.
const INNER_HUE_OFFSETS = [0, 148, 74];
const INNER_SAT_RANGE = [1, 0.85, 0.6, 0.75];

// Banding
const BAND_STROKE = 1.6;
const BAND_ALPHA = 0.12;
const BAND_FLOOR = 0.18; // stop drawing rings below this fraction of the body

// Wandering
const WANDER_RADIUS_X = 26;
const WANDER_RADIUS_Y = 42;
const WANDER_PERIOD_X = 17000; // ms
const WANDER_PERIOD_Y = 23000; // ms
const WANDER_CEIL = 0.24; // fraction of canvas height
const WANDER_FLOOR = 0.76;

// One touch means one tiny bounded change
const NUDGE_SHAPE = 0.35;
const NUDGE_COLOUR = 7;
const NUDGE_MOVE = 180;
const NUDGE_SHAPE_CHANCE = 0.5; // chance a touch moves shape rather than colour
const NUDGE_EASE_IN = 0.05; // per 60fps frame, how fast the body catches up
const TEST_NUDGE_COUNT = 200;

// Reading a gesture
const TAP_MAX_MS = 260;
const TAP_MAX_MOVE_PX = 14;
const PRESS_MIN_MS = 420;
const GESTURE_RESET_MS = 15000; // watchdog for a touch that never releases

// Drag pushes and pulls
const DRAG_PUSH_GAIN = 0.35;
const DRAG_STRETCH_GAIN = 0.5; // local bulge toward the finger while dragging
const DRAG_MAX_OFFSET = 90; // the body cannot be dragged off the screen
const RETURN_SPRING = 0.012;
const RETURN_DAMPING = 0.9;

// Every touch ripples
const RIPPLE_MAX_RADIUS = 0.95; // fraction of the body radius
const RIPPLE_LIFE_MS = 1100;
const RIPPLE_ALPHA = 0.3;

// Tilt and shake nudge the same genome
const TILT_NUDGE_GAIN = 0.5; // a full touch is 1
const TILT_NUDGE_DEGREES = 6; // how far from rest it must move before it counts
const SHAKE_NUDGE_GAIN = 0.7;
const SHAKE_COOLDOWN_MS = 2500;

// Tap brightens, press swells
const BRIGHTEN_AMOUNT = 16;
const BRIGHTEN_SETTLE_MS = 700;
const SWELL_AMOUNT = 0.22; // fraction of the body radius
const SWELL_RADIUS = 0.7; // radians, how wide the swell is
const SWELL_EASE_IN = 0.18;
const SWELL_EASE_OUT = 0.07;

// Genome ranges
//
// The shape is three harmonics whose FREQUENCIES are fixed whole numbers (so the
// outline closes by construction) and whose AMPLITUDES are continuous (so the
// creature is not stuck in a handful of shapes). Phase is continuous too, and
// safe to drift, because cos(angle * n + phase) is periodic for any phase.
const HARMONIC_FREQ = [2, 3, 5];
const FORM_LO_MIN = -0.3;
const FORM_LO_MAX = 0.3;
const FORM_MID_MIN = -0.24;
const FORM_MID_MAX = 0.24;
const FORM_HI_MIN = -0.14;
const FORM_HI_MAX = 0.14;
// 2*PI, written out because p5's TWO_PI is not defined at load time.
const TAU = 6.283185307179586;
const PHASE_LO_MIN = 0;
const PHASE_LO_MAX = TAU;
const PHASE_MID_MIN = 0;
const PHASE_MID_MAX = TAU;
const PHASE_HI_MIN = 0;
const PHASE_HI_MAX = TAU;

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
const GENOME_DEFAULT = {
  formLo: 0.16,
  formMid: 0.1,
  formHi: 0.05,
  phaseLo: 0.7,
  phaseMid: 2.1,
  phaseHi: 4.0,
  stretch: 1,
  hue: 40,
  sat: 55,
  bright: 82,
  bandCount: 3,
  bandGap: 18,
  edgeBlur: 12,
  breathPeriod: 6000,
};

// ---- Genome ---------------------------------------------------------------

// The whole genome, declared up front. No later step adds a field.
const GENOME_FIELDS = [
  'formLo',
  'formMid',
  'formHi',
  'phaseLo',
  'phaseMid',
  'phaseHi',
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
  formLo: [FORM_LO_MIN, FORM_LO_MAX],
  formMid: [FORM_MID_MIN, FORM_MID_MAX],
  formHi: [FORM_HI_MIN, FORM_HI_MAX],
  phaseLo: [PHASE_LO_MIN, PHASE_LO_MAX],
  phaseMid: [PHASE_MID_MIN, PHASE_MID_MAX],
  phaseHi: [PHASE_HI_MIN, PHASE_HI_MAX],
  stretch: [STRETCH_MIN, STRETCH_MAX],
  hue: [HUE_MIN, HUE_MAX],
  sat: [SAT_MIN, SAT_MAX],
  bright: [BRIGHT_MIN, BRIGHT_MAX],
  bandCount: [BAND_COUNT_MIN, BAND_COUNT_MAX],
  bandGap: [BAND_GAP_MIN, BAND_GAP_MAX],
  edgeBlur: [EDGE_BLUR_MIN, EDGE_BLUR_MAX],
  breathPeriod: [BREATH_PERIOD_MIN, BREATH_PERIOD_MAX],
};

const SHAPE_FIELDS = ['formLo', 'formMid', 'formHi', 'stretch', 'phaseLo', 'phaseMid', 'phaseHi'];
const COLOUR_FIELDS = ['hue', 'sat', 'bright'];
const MOVE_FIELDS = ['breathPeriod'];

// genomeTarget is what a touch moves, what is pinned, and what is saved.
// genome is what gets drawn, easing toward the target so nothing ever snaps.
let genomeTarget = { ...GENOME_DEFAULT };
let genome = { ...GENOME_DEFAULT };

let genomeIsPinned = false;
let saveTimer = null;

// ---- State ----------------------------------------------------------------

let wakeLock = null;
let wantAwake = false;

// Off unless the address carries ?debug=1. Also where the gesture label shows.
let showReadout = false;
let shakeUntil = 0;

let gesture = null;
let gestureLabel = '';
let gestureLabelUntil = 0;

let brightenAt = -1e9;
let swellAngle = 0;
let swellAmount = 0;
let swellTarget = 0;

// Temporary displacement while a finger drags the body. A spring pulls it
// back to where it was; dragging never changes the genome.
let bodyOffsetX = 0;
let bodyOffsetY = 0;
let dragVelX = 0;
let dragVelY = 0;
let lastPointerX = 0;
let lastPointerY = 0;

let colourBuf = null;

// Every touch sends out one ring.
let rippleAt = -1e9;
let rippleX = 0;
let rippleY = 0;

// A tilt nudges once, when it changes, then waits to come back before it can
// nudge again. Without that, a sculpture sitting slightly off-level would
// push the creature on its own forever.
let tiltArmed = true;
let lastShakeAt = -1e9;

// ---- Sensors --------------------------------------------------------------

// rotationX wraps at plus and minus 180, so a raw subtraction spikes when it
// crosses. Fold it back into -180..180 first.
function wrapDegrees(delta) {
  let v = (delta + 540) % 360;
  if (v < 0) v += 360;
  return v - 180;
}

function deviceShaken() {
  if (!window.sensorsEnabled) return;
  shakeUntil = millis() + SHAKE_FLASH_MS;
  debug('sensors: shaken');
  const now = millis();
  if (now - lastShakeAt < SHAKE_COOLDOWN_MS) return;
  lastShakeAt = now;
  nudgeGenome(SHAKE_NUDGE_GAIN); // the same function a finger calls
}

// Nudge once on the change, then wait for it to come back near rest before it
// can nudge again. The gap between the two thresholds is the hysteresis.
function tiltNudge() {
  if (!window.sensorsEnabled) return;
  const off =
    Math.hypot(
      wrapDegrees(rotationX - REST_TILT_X),
      wrapDegrees(rotationY - REST_TILT_Y),
      wrapDegrees(rotationZ - REST_TILT_Z)
    );
  if (tiltArmed && off > TILT_NUDGE_DEGREES) {
    tiltArmed = false;
    nudgeGenome(TILT_NUDGE_GAIN);
  } else if (!tiltArmed && off < TILT_NUDGE_DEGREES * 0.5) {
    tiltArmed = true;
  }
}

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
  return TONE_BASE_HZ + map(genomeTarget.hue, 0, 360, -TONE_HUE_SPREAD_HZ, TONE_HUE_SPREAD_HZ);
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

function clampGenome(g) {
  for (const field of GENOME_FIELDS) {
    const [lo, hi] = GENOME_RANGES[field];
    g[field] = constrain(g[field], lo, hi);
  }
  return g;
}

function loadGenome() {
  try {
    const raw = localStorage.getItem(GENOME_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    for (const field of GENOME_FIELDS) {
      if (typeof saved[field] === 'number' && isFinite(saved[field])) {
        genomeTarget[field] = saved[field];
      }
    }
    clampGenome(genomeTarget);
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
      localStorage.setItem(GENOME_KEY, JSON.stringify(genomeTarget));
      debug('genome saved');
    } catch (err) {
      debugWarn('genome save failed: ' + err.message);
    }
  }, GENOME_SAVE_DELAY_MS);
}

// Any genome field can be pinned from the address, so both ends of every range
// can be looked at without waiting days for one to drift there:
//   ?formLo=0.25&formMid=-0.1&hue=210&edgeBlur=4
function applyUrlOverrides(params) {
  let pinned = false;
  for (const field of GENOME_FIELDS) {
    if (!params.has(field)) continue;
    const value = Number(params.get(field));
    if (isFinite(value)) {
      genomeTarget[field] = value;
      genome[field] = value;
      pinned = true;
    }
  }
  if (pinned) {
    genomeIsPinned = true;
    debug('genome pinned from url');
  }
}

// The centre of the piece: one touch moves one or two numbers by a hair.
// Nudging everything at once averages out into no visible change at all.
function nudgeGenome(weight = 1) {
  const roll = random();
  if (roll < NUDGE_SHAPE_CHANCE) {
    nudgeOne(pick(SHAPE_FIELDS), NUDGE_SHAPE * weight);
    nudgeOne(pick(SHAPE_FIELDS), NUDGE_SHAPE * 0.4 * weight);
  } else if (roll < NUDGE_SHAPE_CHANCE + 0.15) {
    nudgeOne(pick(MOVE_FIELDS), NUDGE_MOVE * weight);
  } else {
    nudgeOne(pick(COLOUR_FIELDS), NUDGE_COLOUR * weight);
    nudgeOne(pick(COLOUR_FIELDS), NUDGE_COLOUR * 0.5 * weight);
  }
  clampGenome(genomeTarget);
  saveGenome();
}

function nudgeOne(field, amount) {
  const [lo, hi] = GENOME_RANGES[field];
  if (field === 'hue') {
    // hue is a circle, so it wraps past 360 instead of sticking at the end
    genomeTarget.hue = wrapHue(genomeTarget.hue + random(-amount, amount));
  } else {
    genomeTarget[field] = constrain(genomeTarget[field] + random(-amount, amount), lo, hi);
  }
}

function pick(list) {
  return list[Math.floor(random() * list.length)];
}

function easeGenome() {
  // frame-rate independent, so a slow phone settles at the same speed
  const k = 1 - Math.pow(1 - NUDGE_EASE_IN, Math.max(0.1, deltaTime / 16.67));
  for (const field of GENOME_FIELDS) {
    genome[field] += (genomeTarget[field] - genome[field]) * k;
  }
}

// ---- Shape and colour -----------------------------------------------------

function wrapHue(h) {
  const range = HUE_MAX - HUE_MIN;
  let v = (h - HUE_MIN) % range;
  if (v < 0) v += range;
  return v + HUE_MIN;
}

function brightenNow() {
  const age = millis() - brightenAt;
  if (age < 0 || age > BRIGHTEN_SETTLE_MS) return 0;
  return BRIGHTEN_AMOUNT * Math.sin((age / BRIGHTEN_SETTLE_MS) * PI);
}

function bodyColour(alpha) {
  return color(genome.hue, genome.sat, genome.bright + brightenNow(), alpha);
}

// Smooth and stable: the same genome always produces the same creature.
//
// That noise term samples a circle of NOISE_ORBIT_RADIUS around a centre in
// noise space, so as the angle goes round, it walks that circle. At radius 1.3
// the loop was crossing eight or more Perlin cells, and the outline was
// stepping across them unevenly - that is what put a notch in one place. A
// small radius means one broad swell instead of a row of bumps.
// The outline is a sum of three harmonics. Their frequencies are fixed whole
// numbers, which is what makes the loop close; their amplitudes and phases come
// from the genome and are continuous, which is what stops the creature from
// living in a handful of shapes.
//
// Frequency 1 is deliberately absent: it fights the stretch term and doubles up
// with the noise term below.
function outlineVariation(angle) {
  let harmonics =
    genome.formLo * Math.cos(angle * HARMONIC_FREQ[0] + genome.phaseLo) +
    genome.formMid * Math.cos(angle * HARMONIC_FREQ[1] + genome.phaseMid) +
    genome.formHi * Math.cos(angle * HARMONIC_FREQ[2] + genome.phaseHi);
  const organic =
    noise(Math.cos(angle) * NOISE_ORBIT_RADIUS + 20, Math.sin(angle) * NOISE_ORBIT_RADIUS + 20) - 0.5;
  return 1 + harmonics + organic * NOISE_DEPTH;
}

// A soft press leaves a bulge under the finger. Nothing here touches the
// genome: it is temporary and it is gone a second later.
function swellOffset(angle, radius) {
  if (swellAmount <= 0.001) return 0;
  const d = wrapRadians(angle - swellAngle);
  const w = Math.exp(-(d * d) / (2 * SWELL_RADIUS * SWELL_RADIUS));
  return SWELL_AMOUNT * radius * swellAmount * w;
}

function wrapRadians(d) {
  let v = (d + PI) % TWO_PI;
  if (v < 0) v += TWO_PI;
  return v - PI;
}

// p5's splineVertex + endShape(CLOSE) does not close a curve cleanly. Measured
// on a plain circle it leaves the seam about a pixel inside the rest of the
// outline, which on a soft glow reads as a flat spot. So the closure is done
// here instead: a periodic Catmull-Rom evaluated over wrapped indices, then
// sampled densely. p5 only ever sees vertex() calls, and CLOSE joins two points
// that are already on top of each other, so its chord is invisible.
function closedSpline(control, samplesPerSegment) {
  const n = control.length;
  const out = [];
  const at = (i) => control[((i % n) + n) % n];
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}

function buildOutline(cx, cy, radius) {
  const control = [];
  for (let i = 0; i < SILHOUETTE_SAMPLES; i++) {
    const a = (i / SILHOUETTE_SAMPLES) * TWO_PI;
    const r = radius * outlineVariation(a) + swellOffset(a, radius);
    control.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * genome.stretch]);
  }
  return closedSpline(control, OUTLINE_SAMPLES_PER_SEGMENT);
}

function traceSpline(pts, cx, cy, scale) {
  beginShape();
  for (const p of pts) {
    vertex(cx + (p[0] - cx) * scale, cy + (p[1] - cy) * scale);
  }
  endShape(CLOSE);
}

// The softness is built from layered low-alpha fills, not from a canvas blur.
// A canvas blur is missing on some phones and fails silently there, taking
// the whole look with it.
function drawBody(pts, cx, cy) {
  // edgeBlur is in pixels of falloff; /100 turns it into a fraction of the
  // body size so the whole range is actually visible.
  const spread = genome.edgeBlur / 100;
  for (let i = GLOW_PASSES - 1; i >= 0; i--) {
    const t = i / (GLOW_PASSES - 1); // 0 is the outermost, faintest pass
    fill(bodyColour(GLOW_ALPHA * (0.3 + 0.7 * t)));
    traceSpline(pts, cx, cy, 1 + spread * (1 - t));
  }
}

// The colour inside the body is mixed SUBTRACTIVELY on a buffer, then the
// finished result is added back onto the main canvas.
//
// Everything drawn straight onto the main canvas uses 'lighter', and additive
// light can only add: two overlapping colours go brighter and drift toward
// white, and they can never make a third colour. That is why three inner blobs
// used to stack into a white disc in the middle. Drawing them onto a separate
// buffer under 'multiply' mixes them the way pigment does - blue over yellow
// really does go green - and only the already-mixed result is added back, so the
// body keeps its glow without losing its colour.
//
// They stay inside the body by distance, not by clipping: clipping to a hard
// outline would give a crisp rim and fight the soft edge the piece is built on.
function drawInnerColour(pts, cx, cy, radius) {
  const buf = colourBuffer();
  buf.clear();
  buf.blendMode(BLEND);

  // A near-white ground, so multiply has something to mix into.
  buf.push();
  buf.fill(255);
  buf.rect(0, 0, width, height);
  buf.blendMode(MULTIPLY);

  const t = millis();
  const reach = Math.max(0, radius * (1 - INNER_BLOB_MARGIN) - INNER_BLOB_SIZE);
  for (let i = 0; i < INNER_BLOBS; i++) {
    const a = (t / (INNER_FLOW_SPEED + i * 1400)) * TWO_PI + i * 2.1;
    const bx = cx + Math.cos(a) * reach * 0.6;
    const by = cy + Math.sin(a * 1.3) * reach * 0.6 * genome.stretch;
    const hue = innerHue(i);
    const sat = genome.sat * INNER_SAT_RANGE[i % INNER_SAT_RANGE.length];
    const bright = constrain(genome.bright + brightenNow(), 0, 100) * INNER_BRIGHT_SCALE;
    for (let p = INNER_BLOB_PASSES - 1; p >= 0; p--) {
      const u = p / (INNER_BLOB_PASSES - 1);
      const r = INNER_BLOB_SIZE * (0.45 + 0.55 * (1 - u));
      buf.fill(color(hue, sat, bright, INNER_BLOB_ALPHA * (0.35 + 0.65 * u)));
      buf.ellipse(bx, by, r * 2, r * 2 * genome.stretch);
    }
  }
  buf.pop();

  // Cut the mixed colour back to only where the body actually is. Without this
  // the buffer's white ground lifts the whole black background to dark grey,
  // which changes the piece's ground from black to charcoal. Cutting on alpha
  // keeps the colour inside the creature and leaves true black outside it.
  // DESTINATION_IN has no p5 constant, so set the Canvas2D value directly.
  buf.drawingContext.globalCompositeOperation = 'destination-in';
  buf.push();
  buf.noStroke();
  // destination-in MULTIPLIES alpha, so it compounds: six passes at 0.5 erase
  // everything. Two passes at high alpha give a soft edge that survives.
  for (let p = INNER_MASK_PASSES - 1; p >= 0; p--) {
    const u = p / (INNER_MASK_PASSES - 1);
    buf.fill(color(genome.hue, 0, 100, INNER_MASK_ALPHA * (0.82 + 0.18 * u)));
    traceSplineOnBuffer(buf, pts, cx, cy, 1 + (genome.edgeBlur / 100) * (1 - u) * 0.6);
  }
  buf.pop();
  buf.blendMode(BLEND);
  buf.drawingContext.globalCompositeOperation = 'source-over';

  drawingContext.globalCompositeOperation = 'lighter';
  drawingContext.globalAlpha = INNER_COMPOSITE_ALPHA;
  drawingContext.drawImage(buf.canvas, 0, 0, width, height);
  drawingContext.globalAlpha = 1;
}

function traceSplineOnBuffer(buf, pts, cx, cy, scale) {
  buf.beginShape();
  for (const p of pts) {
    buf.vertex(cx + (p[0] - cx) * scale, cy + (p[1] - cy) * scale);
  }
  buf.endShape(buf.CLOSE);
}

function colourBuffer() {
  if (!colourBuf || colourBuf.width !== width || colourBuf.height !== height) {
    if (colourBuf) colourBuf.remove();
    colourBuf = createGraphics(width, height);
    colourBuf.pixelDensity(1);
    colourBuf.noStroke();
  }
  return colourBuf;
}

// The palette follows the creature's own hue rather than being fixed, so it
// shifts as the creature drifts: one hue near the body, one across the wheel
// from it, one between. All stay desaturated and bright, so the creature keeps
// the soft register the reference has whatever hue it happens to be sitting at.
function innerHue(i) {
  return wrapHue(genome.hue + INNER_HUE_OFFSETS[i % INNER_HUE_OFFSETS.length]);
}

// Faint concentric rings inside the body, like the last panel of the reference.
function drawBanding(pts, cx, cy) {
  const step = genome.bandGap / CREATURE_SIZE;
  noFill();
  strokeWeight(BAND_STROKE);
  stroke(bodyColour(BAND_ALPHA));
  for (let i = 1; i <= Math.round(genome.bandCount); i++) {
    const scale = 1 - i * step;
    if (scale < BAND_FLOOR) break;
    traceSpline(pts, cx, cy, scale);
  }
  noStroke();
}

function breathScale(t) {
  const phase = (t % genome.breathPeriod) / genome.breathPeriod;
  return map(Math.sin(phase * TWO_PI), -1, 1, CREATURE_BLOOM_MIN, CREATURE_BLOOM_MAX);
}

function drawRipple(radius) {
  const age = millis() - rippleAt;
  if (age < 0 || age > RIPPLE_LIFE_MS) return;
  const t = age / RIPPLE_LIFE_MS;
  const r = radius * RIPPLE_MAX_RADIUS * t;
  noFill();
  strokeWeight(BAND_STROKE + 2);
  stroke(color(genome.hue, genome.sat, genome.bright + brightenNow(), RIPPLE_ALPHA * (1 - t) * (1 - t)));
  ellipse(rippleX, rippleY, r * 2, r * 2 * genome.stretch);
  noStroke();
}

function updateDrag() {
  if (gesture && gesture.dragged) {
    bodyOffsetX += dragVelX;
    bodyOffsetY += dragVelY;
    dragVelX *= 0.6; // heavy: it follows the finger rather than tracking it
    dragVelY *= 0.6;
  }
  dragVelX -= bodyOffsetX * RETURN_SPRING;
  dragVelY -= bodyOffsetY * RETURN_SPRING;
  dragVelX *= RETURN_DAMPING;
  dragVelY *= RETURN_DAMPING;
  bodyOffsetX += dragVelX;
  bodyOffsetY += dragVelY;

  const reach = Math.hypot(bodyOffsetX, bodyOffsetY);
  if (reach > DRAG_MAX_OFFSET) {
    bodyOffsetX = (bodyOffsetX / reach) * DRAG_MAX_OFFSET;
    bodyOffsetY = (bodyOffsetY / reach) * DRAG_MAX_OFFSET;
  }
}

function creatureCentre() {
  const t = millis();
  const cx = width / 2 + Math.sin((t / WANDER_PERIOD_X) * TWO_PI) * WANDER_RADIUS_X + bodyOffsetX;
  const cy = constrain(
    height * CREATURE_CENTRE_Y_FRAC + Math.sin((t / WANDER_PERIOD_Y) * TWO_PI) * WANDER_RADIUS_Y + bodyOffsetY,
    height * WANDER_CEIL,
    height * WANDER_FLOOR
  );
  return [cx, cy];
}

// ---- Reading a gesture ---------------------------------------------------

function showGesture(label) {
  gestureLabel = label;
  gestureLabelUntil = millis() + 900;
  debug('gesture: ' + label);
}

function classifyGesture(g) {
  const held = millis() - g.start;
  if (g.dragged) return 'drag';
  if (held <= TAP_MAX_MS) return 'tap';
  if (held >= PRESS_MIN_MS) return 'press';
  return 'hold';
}

function finishGesture() {
  if (!gesture) return;
  const kind = classifyGesture(gesture);
  showGesture(kind);
  if (kind === 'tap') brightenAt = millis();
  if (kind === 'press') {
    const [cx, cy] = creatureCentre();
    swellAngle = Math.atan2(pointerY() - cy, pointerX() - cx);
    swellTarget = 1;
  }
  if (kind === 'drag') swellTarget = 0;
  gesture = null;
}

// A touch the phone cancels never calls mouseReleased on p5 2.3.1 and later,
// so a gesture would sit there as a permanent press. The watchdog clears it.
// Timing rather than touches.length, so it behaves the same with a mouse.
function expireGesture() {
  if (gesture && millis() > gesture.deadline) {
    gesture = null;
    swellTarget = 0;
  }
}

function easeSwell() {
  const k = swellTarget > swellAmount ? SWELL_EASE_IN : SWELL_EASE_OUT;
  swellAmount += (swellTarget - swellAmount) * k;
  if (swellTarget === 0 && swellAmount < 0.002) swellAmount = 0;
}

// ---- Input ----------------------------------------------------------------
// Declared as function declarations, so p5 finds them no matter where
// lockGestures() snapshots its handlers. Never reassign window.mouseXxx —
// that replaces p5-phone's own wrapper. There is only one mouseReleased().

// For multi-touch, read touches[] and test touches.length > 0.
// mouseIsPressed goes false the instant *any* one finger lifts, even when
// others are still down, so it cannot answer "is a finger on the glass".
function pointerX() {
  return touches.length > 0 ? touches[0].x : mouseX;
}

function pointerY() {
  return touches.length > 0 ? touches[0].y : mouseY;
}

function mousePressed() {
  gesture = {
    start: millis(),
    deadline: millis() + GESTURE_RESET_MS,
    x: pointerX(),
    y: pointerY(),
    dragged: false,
  };
  lastPointerX = gesture.x;
  lastPointerY = gesture.y;
  dragVelX = 0;
  dragVelY = 0;
  return false;
}

function mouseDragged() {
  if (!gesture) return false;
  const px = pointerX();
  const py = pointerY();

  if (!gesture.dragged && dist(px, py, gesture.x, gesture.y) > TAP_MAX_MOVE_PX) {
    gesture.dragged = true;
  }

  if (gesture.dragged) {
    dragVelX += (px - lastPointerX) * DRAG_PUSH_GAIN;
    dragVelY += (py - lastPointerY) * DRAG_PUSH_GAIN;
    lastPointerX = px;
    lastPointerY = py;
    // Reuse the press swell as a local stretch toward the finger.
    const [cx, cy] = creatureCentre();
    swellAngle = Math.atan2(py - cy, px - cx);
    swellTarget = DRAG_STRETCH_GAIN;
  }
  return false;
}

function mouseReleased() {
  keepAwake();
  playTone();
  rippleX = pointerX();
  rippleY = pointerY();
  rippleAt = millis();
  nudgeGenome(); // the only place a finger moves the genome
  finishGesture();
  return false;
}

// ---- p5 -------------------------------------------------------------------

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(Math.min(window.devicePixelRatio, PIXEL_DENSITY_CAP));
  frameRate(RESTING_FRAME_RATE);
  angleMode(DEGREES); // rotationX/Y/Z are radians without this
  colorMode(HSB, 360, 100, 100, 1);
  background(0, 0, 0);

  lockGestures();
  enablePermissionsMinimal(['sensors', 'sound']);
  setShakeThreshold(SHAKE_THRESHOLD);

  const params = new URLSearchParams(location.search);
  showReadout = params.has('debug');
  // The debug console is a DOM panel that covers a real slice of a phone
  // screen, so it stays off unless asked for.
  if (showReadout) showDebug();

  if (params.has('reset')) {
    try {
      localStorage.removeItem(GENOME_KEY);
      debug('genome reset');
    } catch (err) {
      debugWarn('reset failed: ' + err.message);
    }
  }

  loadGenome();
  applyUrlOverrides(params);
  clampGenome(genomeTarget);
  genome = { ...genomeTarget }; // arrive instantly, no settling on load

  if (params.has('nudge')) {
    const times = Math.max(0, Math.min(20000, Number(params.get('nudge')) || 0));
    for (let i = 0; i < times; i++) nudgeGenome();
    debug('fired ' + times + ' nudges');
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
}

function draw() {
  background(0, 0, 0);

  easeGenome();
  easeSwell();
  updateDrag();
  tiltNudge();
  expireGesture();

  const [cx, cy] = creatureCentre();
  const radius = (CREATURE_SIZE / 2) * breathScale(millis());
  const pts = buildOutline(cx, cy, radius);

  // One composite mode for the whole body, reset before the next frame's
  // background() or the screen smears instead of clearing.
  drawBody(pts, cx, cy);
  drawInnerColour(pts, cx, cy, radius);
  drawingContext.globalCompositeOperation = 'lighter';
  drawBanding(pts, cx, cy);
  drawRipple(radius);
  drawingContext.globalCompositeOperation = 'source-over';

  if (showReadout) drawReadout();
}

function drawReadout() {
  push();
  textSize(13);
  textAlign(LEFT, TOP);
  fill(0, 0, 100);
  let y = 14;
  text('sensors ' + (window.sensorsEnabled ? 'on' : 'OFF'), 14, y);
  y += 16;
  if (window.sensorsEnabled) {
    text('tilt ' + nf(rotationX, 0, 1) + '  ' + nf(rotationY, 0, 1) + '  ' + nf(rotationZ, 0, 1), 14, y);
    y += 16;
    text('rest ' + nf(REST_TILT_X, 0, 1) + '  ' + nf(REST_TILT_Y, 0, 1) + '  ' + nf(REST_TILT_Z, 0, 1), 14, y);
    y += 16;
    text(millis() < shakeUntil ? 'SHAKEN' : 'shake -', 14, y);
    y += 16;
    text('tilt armed: ' + tiltArmed, 14, y);
  }
  y += 16;
  text(millis() < gestureLabelUntil ? 'gesture: ' + gestureLabel : 'gesture: -', 14, y);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}