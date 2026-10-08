# Progress

## Where things are

Steps 1-20 of `plan.md` are built. Step 21 is not started.

## Verified in a browser, not just parsed

The sketch is now verified running in a real browser against p5 2.3.2 and p5-phone 1.15.3.
A throwaway static server is enough — sensors and sound do not work there, but rendering
and the touch pipeline do.

- **No console errors or warnings.** (Two were found and fixed; see below.)
- **The touch pipeline works end to end.** Dispatching `pointerdown` then `pointerup` on
  the canvas ran `mouseReleased`, nudged the genome (hue 40 to 46.34) and wrote it to
  `localStorage`.
- **The p5-phone warning about assigning handlers before `lockGestures()` is a false
  positive here.** `window.mouseReleased` is p5-phone's delegator, which calls the p5
  instance's handler and returns `false`, so gesture blocking is intact.
- **`showDebug()` is a DOM panel, not canvas**, and it covered a large slice of the
  screen. It is now off unless the address carries `?debug=1`. If the Android problem
  was partly "a grey bar across the top of the screen", that is fixed.

## Fixed: the seam was a sharp corner

`traceSpline()` repeated the first outline point at the end. In p5 that does **not**
close a spline smoothly — it gives Catmull-Rom two identical neighbours, which collapses
the tangent at the seam and puts a visible corner on the soft body. Wrapping the ends
the other way is worse: `endShape(CLOSE)` then draws a straight chord across the shape.

Verified by rendering the real outline both ways. Feed every point exactly once and
`endShape(CLOSE)` closes it cleanly. Fixed in `sketch.js` and in Step 9 of `plan.md`.

## Fixed: two console complaints

- A local `const hue` collided with `p5.hue()`. Renamed to `blobHue`.
- `showDebug()` now only runs with `?debug=1`.

## Still unresolved

**It does not work on an Android phone, and nobody has said what that looks like.** The
one lead left is `enablePermissionsMinimal()`: iOS throws a system permission dialog so
the tap visibly does something, but Android Chrome grants motion with no prompt at all.
If that overlay only hides after a visible grant, it can sit there permanently — dimming
the screen and swallowing every touch. A desktop would never show it, because a desktop
also has no prompt.

Compare the plain address against `?debug=1` on the phone. If the two look materially
different, it was the debug panel and is now fixed. If the plain address is dimmed or
stuck, it is the overlay.

## Two things that will need tuning

- **The inner blobs blow out to a white disc** where all three overlap. That is additive
  blending doing exactly what was predicted: more overlap, brighter, drifting toward
  white. `INNER_BLOB_ALPHA` wants lowering.
- **The body reads brown/olive** rather than the soft orange of the reference. The
  layered passes are too dim individually and the additive result lands muddy. More
  passes or a higher alpha on the inner passes will fix it.

## Files changed

- `sketch.js` — rewritten through Step 17.
- `index.html` — one line added: the `p5.sound@0.3.0` script tag (Step 3).
- `plan.md` — Steps 8, 9, 10 and 15 edited (ordering fault) and Step 16 edited (the
  gesture watchdog must be timed, not `touches`-based).

## What is built

| Step | State |
|---|---|
| 1-5 canvas, prompt, tone, wake lock | built |
| 6 sensors, `?debug=1` readout | built |
| 7 soft glowing body, breathing | built |
| 8 genome, `localStorage`, URL pinning | built |
| 9 silhouette from lobes and stretch | built |
| 10 colour from the genome | built |
| 11 colour flowing inside the body | built |
| 12 banding packs and unpacks | built |
| 13 edge softness as a genome value | already live from Step 7, verified here |
| 14 body wanders in the middle third | built |
| 15 one touch = one tiny bounded change | built |
| 16 gesture read, label only | built |
| 17 tap brightens, press swells | built |
| 18 drag pushes and pulls, springs back | built |
| 19 every touch ripples | built |
| 20 tilt and shake nudge the same genome | built |

## Address parameters

    ?lobes=2&hue=210&edgeBlur=4     pin any genome field (never saved back)
    ?debug=1                        sensor readout + gesture label
    ?nudge=200                      fire 200 nudges at once, and they do save
    ?reset=1                        clear the saved genome

`?nudge=` deliberately saves, so the accumulate-then-reload chain can be tested end to
end. `?reset=1` is the only way back to a clean state afterwards.

## Design decisions worth knowing

- **`genomeTarget` versus `genome`.** `genomeTarget` is what a touch moves, what is
  pinned, and what is written to storage. `genome` is what gets drawn, easing toward the
  target so nothing ever snaps. That is where `NUDGE_EASE_IN` does its work.
- **`nudgeGenome()` is called from exactly one place**, the tail of `mouseReleased()`.
  Nothing else in the sketch may move the genome.
- **Inner blobs and bands are kept inside by distance, not clipping.** The lobes dip to
  72% of the nominal radius, so the inner-blob margin is set against that worst case.
- **`nudgeGenome(weight)` takes a weight.** 1 is a full finger. Tilt passes 0.5 and a
  shake passes 0.7, so a sensor is a gentler contributor than a person. Same function,
  not a second path.
- **Tilt uses hysteresis, not a cooldown.** It nudges once when the phone moves more than
  `TILT_NUDGE_DEGREES` from rest, then re-arms only once it comes back within half that.
  A cooldown would still let a steadily-held tilt keep nudging. `?debug=1` shows
  `tilt armed:` so you can watch it arm and disarm.
- **Drag reuses the press swell** as a local stretch toward the finger, rather than
  building a second deformation. `DRAG_STRETCH_GAIN` sets how much.
- **`pointerX()` / `pointerY()`** read `touches[]` and test `touches.length > 0`, falling
  back to `mouseX`/`mouseY`. `mouseIsPressed` is never used: it goes false the instant
  any one finger lifts, even when others are still down.
- **Everything in the body draws under one `lighter` composite**, reset to
  `source-over` before the next frame's `background()`. Left set, the screen smears
  instead of clearing.

## How it was checked

`sketch.js` passes a syntax check. That is all.

**Nothing has been checked in a browser or on a phone.** Every check below is yours, and
the Android problem above should be resolved before any of them mean much.

## What to check

Use a permanent https address, not the `npm run phone` tunnel. A new tunnel URL is a new
browser origin, which means a brand-new empty creature.

**Laptop:**

1. Plain address: a soft body, breathing on its own, with colour drifting inside it and
   faint rings. No wobble, no jitter.
2. `?lobes=2` then `?lobes=7` — clearly different bump counts.
3. `?bandGap=8` then `?bandGap=34` — tight rings then wide ones.
4. `?edgeBlur=4` then `?edgeBlur=30` — defined rim then vapour.
5. `?debug=1` — readout top-left. Click fast: `gesture: tap`. Hold: `press`.
   Drag: `drag`.
6. Drag slowly across the body and let go. It follows heavily, then drifts back to centre.
   It must not snap, and must not slide off the screen.
7. Tap. A ring spreads from the point of contact and fades fully — no leftover trail.
8. `?reset=1`, then reload plain. Back to the starting creature.
9. `?nudge=200`, then reload plain. Noticeably different, and it persists.

**Phone:**

1. Resolve the Android problem above first.
2. `?debug=1`, tap the icon, allow motion. `sensors on`.
3. **While the piece lies still, write the three `tilt` numbers into `REST_TILT_X/Y/Z`.**
   They are zero now, correct only if the phone sits perfectly flat.
4. Tilt more than a few degrees: `tilt armed:` flips to false and the body nudges. Hold
   that tilt for ten seconds — it must nudge **once**, not keep going. Bring it back to
   rest and it re-arms.
5. Shake: `SHAKEN` flashes and the body nudges. Shake continuously — it must not nudge
   more than once every `SHAKE_COOLDOWN_MS`.
6. Tap: brightens, settles, and ripples. Press and hold: bulges under your finger.
   Drag: follows and springs back.
7. `?nudge=200`, then reload. It changed and it stuck.
8. `?reset=1`, reload. Back to the start.

## Next

Step 21 — tuning, and nothing else. The feel of the whole piece is in the constants at
the top of `sketch.js`: size, breathing rate, how fast the inner colour flows, how faint
a nudge is, how long a press counts as a press, and both ends of the softness range.

The one that most needs your eye is `NUDGE_SHAPE` and `NUDGE_COLOUR`. Fire
`?nudge=200` on the phone: the creature should be clearly a different animal but still
obviously a creature, not something broken.

## Notes for later

- `mouseReleased()` does the whole touch pipeline now: wake lock, tone, ripple, nudge,
  gesture classification. Still only one.
- `?debug=1` is how you watch tilt arming. Keep it until Step 21 is signed off.