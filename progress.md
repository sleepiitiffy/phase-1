# Progress

## Where things are

Steps 1-5 of `plan.md` are built. Steps 6-21 are not started.

Two files changed:

- `sketch.js` — rewritten. Canvas, gesture lock, permission prompt, tone, wake lock.
- `index.html` — one line added: the `p5.sound@0.3.0` script tag between p5 and p5-phone.

## What is built

| Step | State |
|---|---|
| 1 — black screen, gesture lock, capped pixel density | built |
| 2 — served from an address that does not change | **not done — needs you** |
| 3 — one quiet prompt for motion + sound, `showDebug()` on | built |
| 4 — one short tone per touch | built |
| 5 — screen wake lock | built |

Tunables are at the top of `sketch.js`: `RESTING_FRAME_RATE`, `PIXEL_DENSITY_CAP`,
`TONE_BASE_HZ`, `TONE_HUE_SPREAD_HZ`, `TONE_ATTACK_MS`, `TONE_RELEASE_MS`,
`TONE_VOLUME`, `CREATURE_HUE`.

`CREATURE_HUE` is a stand-in at a fixed 40. Step 10 replaces it with the genome's hue,
which is what makes the same touch play a different note as the creature drifts.

## How it was checked

`sketch.js` passes a syntax check. That is all that has been verified.

**Nothing has been checked in a browser or on a phone.** No laptop check and no phone
check from Steps 1-5 has been run yet. Those are yours to run.

## Two things found and fixed while writing Step 4

- `setValueAtTime` / `linearRampToValueAtTime` / `exponentialRampToValueAtTime` **do not
  exist on p5.sound objects.** They are Web Audio `AudioParam` methods. p5's `Envelope`
  exposes `setADSR`, `setRange`, `setExp`, `play`, `triggerAttack`, `triggerRelease`,
  `ramp` — no ramp methods of that kind, and `p5.Oscillator.amp()` is the one that does.
  The tone now uses the oscillator's own `amp(value, rampTime, timeFromNow)`. A p5
  `Envelope` is not used anywhere in this sketch.
- **`p5.Oscillator.start(time)` and `stop(time)` both take a delay from now**, in
  seconds, not an absolute time — the source adds the current audio time internally. The
  earlier version passed a `millis()`-derived number to `stop()`, which would have
  scheduled the stop tens of seconds in the future.

`TONE_VOLUME` was raised from 0.06 to 0.12 so the first test confirms something audible.
The oscillator's own default gain is 0.5, and `amp()` overwrites it.

## What to check, in this order

**Laptop:**

1. A black rectangle fills the window, and it resizes when you resize the window.
2. Swiping and right-clicking do nothing.
3. A small semi-transparent pulsing icon sits over the black. Click it once.
4. Nothing else happens. No creature yet, and that is correct.

**Phone — use a permanent https address, not the `npm run phone` tunnel.** The tunnel
prints a new URL when it drops, and a new URL means new browser storage, which means an
empty creature. Test on GitHub Pages or any fixed address.

1. Open the address. You get black with one small quiet icon.
2. Tap the icon once. It disappears, the phone asks about motion, you allow it.
   That tap does not reach the sketch — it is spent on the overlay.
3. Tap again, anywhere on the black. You should hear one short soft note.
   Tap rapidly ten times: ten notes, no drone, no chord.
4. Now leave it alone for two minutes. The screen must still be lit.
   Lock the phone with the side button, unlock it, and confirm the sketch is back
   and the lock came back with it.
5. Check the debug readout on screen for `wake lock held`. If it says
   `wake lock refused`, the wake lock is not working and the screen will dim.

**If step 3 of the phone check gives no sound**, work through the plan's Step 4
fallbacks in order and note which you tried:

1. `p5.sound@0.3.0` is written against p5.js 2.2.3; this project loads 2.3.2. That
   pairing is the first suspect.
2. `index.html` has no compatibility shim. Add `p5.js-compatibility@0.2.0/src/preload.js`
   after p5 and before p5.sound.

## Next

Step 6 — prove the sensors read. Draws a white tilt readout and a `SHAKEN` flash, and
**Step 7 deletes that readout**, so it is temporary.

Then Step 8 — the genome. It defines all nine fields up front (`lobes`, `stretch`,
`hue`, `sat`, `bright`, `bandCount`, `bandGap`, `edgeBlur`, `breathPeriod`) and adds
`localStorage` persistence. This is the piece that makes a day's visitors accumulate,
so it is worth getting right before anything pretty is layered on top.

## Notes for later

- `mouseReleased()` already exists and already does two jobs (wake lock, tone). Step 16
  adds gesture detection to it. Do not create a second one.
- `showDebug()` stays on until the end. Several later steps depend on being able to read
  a message on the device.
- Only one file changed outside `sketch.js`, and it was the `index.html` script tag that
  Step 3 calls for.