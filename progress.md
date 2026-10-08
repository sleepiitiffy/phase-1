# Progress

## Where things are

Steps 1-10 of `plan.md` are built. Steps 11-21 are not started.

## Files changed

- `sketch.js` — rewritten through Step 10.
- `index.html` — one line added: the `p5.sound@0.3.0` script tag between p5 and p5-phone (Step 3).
- `plan.md` — Steps 8, 9, 10 and 15 edited to fix an ordering fault (below).

## What is built

| Step | State |
|---|---|
| 1 — black screen, gesture lock, capped pixel density | built |
| 2 — served from an address that does not change | **not done — needs you** |
| 3 — one quiet prompt for motion + sound, `showDebug()` on | built |
| 4 — one short tone per touch | built |
| 5 — screen wake lock | built |
| 6 — sensors read; `?debug=1` readout | built |
| 7 — soft glowing body, breathing | built |
| 8 — genome, `localStorage`, URL pinning | built |
| 9 — silhouette from lobes and stretch | built |
| 10 — colour from the genome | built |

`saveGenome()` exists and is called from nothing yet. That is deliberate — Step 15 is the
first thing that changes the genome, and it calls it.

## The ordering fault, and the fix

Steps 9 and 10 originally told you to check the silhouette and the colour **by clicking to
change them**, but the thing that changes them does not exist until Step 15. Steps 12 and
13 had the same problem in milder form: "check both ends of the range" with no way to get
to either end.

Fixed by pinning any genome field from the address:

    ?lobes=2&stretch=1.4&hue=210&edgeBlur=4&debug=1

`?debug=1` shows the Step 6 sensor readout, which is otherwise off. A pinned genome is
never saved back, so a test page cannot overwrite the real creature.

## Two bugs found while writing Step 9

- **Lobe count did not control lobe count.** The outline was sampling Perlin noise around
  a circle whose radius scaled with `genome.lobes`, but the radius was too small
  relative to the noise's feature size, so every value produced roughly the same one or
  two humps. Replaced with a `cos(angle * lobes)` bump term, so `genome.lobes` is now
  literally the number of bumps, plus a small noise term to break the symmetry.
- **The edge-softness range was invisible.** `edgeBlur` was being divided by
  `CREATURE_SIZE`, which made its whole range span about two percent of the body. Now
  divided by 100, giving 4% to 30% falloff.

## How it was checked

`sketch.js` passes a syntax check. That is all.

**Nothing has been checked in a browser or on a phone.** Every check below is yours.

## What to check

Use a permanent https address, not the `npm run phone` tunnel. A new tunnel URL is a new
browser origin, which means a brand-new empty creature.

**Laptop:**

1. Open the plain address. Black, one quiet icon, click it once. Nothing else — no
   creature yet on a laptop is fine, but you should see the body appear.
2. The body should be a soft glowing shape in the middle, slowly swelling and shrinking
   on its own. No wobble, no jitter.
3. Open `?lobes=2`, then `?lobes=7`. Clearly different numbers of bumps.
4. Open `?hue=210&sat=78&bright=96`. Plainly a different colour.
5. Open `?edgeBlur=4`, then `?edgeBlur=30`. The first has a defined rim, the second is
   vapour.
6. Open the plain address again. The creature must be the one from step 2 — pinning must
   not have written anything back.

**Phone:**

1. Open `?debug=1`. Tap the icon, allow motion.
2. The readout should say `sensors on`. Tilt the phone: `tilt` numbers move. Shake it:
   `SHAKEN` flashes, and `sensors: shaken` appears in the debug log.
3. **While the piece is lying still, write the three `tilt` numbers into `REST_TILT_X`,
   `REST_TILT_Y`, `REST_TILT_Z` at the top of `sketch.js`.** They are all zero now, which
   is only correct if the phone will sit perfectly flat. Re-measure if you re-mount it.
4. Tap anywhere. One short soft note. Tap fast ten times: ten notes, no drone.
5. Leave it two minutes. The screen is still lit. Side-button lock, unlock: sketch back,
   lock back.
6. Open the plain address, reload, and confirm the body comes back identical. Then
   open `?lobes=5`, reload, and open plain again — still the original.

## Next

Step 11 — colour flows inside the body. This is the one that makes it alive between
visitors, so it is the step worth checking most carefully. The internal colour has to stay
inside the body by distance, not by clipping to a hard outline path, which would give a
crisp rim and fight the soft edge.

Then Step 12 (banding), 13 (edge as a genome value), 14 (wandering), and Step 15, which
is the centre of the piece.

## Notes for later

- `mouseReleased()` already exists and does two jobs (wake lock, tone). Step 16 adds
  gesture detection to it. Do not create a second one.
- `?debug=1` is worth keeping for Step 20 — it is the only way to see whether tilt and
  shake are reporting without taking the finished piece apart.
- `showDebug()` stays on until the end.