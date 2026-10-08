# Progress

## Where things are

Steps 1-20 of `plan.md` are built. Step 21 is not started.

## Open problem, not yet diagnosed

**It does not work on an Android phone.** Nobody has said what that looks like, so it
is still unknown whether this is a crash, a blank screen, a stuck permission overlay, or
dead touch input. Do not assume the build is at fault. The first thing to do is find out
which of those it is.

Two live suspects, in order of likelihood:

1. **`enablePermissionsMinimal()` may not get out of the way on Android.** iOS throws a
   system permission dialog, so the tap visibly does something and the overlay's
   dismissal is obvious. Android Chrome grants motion with no prompt at all, so if the
   overlay only hides after a visible grant it can sit there permanently — dimming the
   screen and swallowing every touch, which reads as "nothing works". The laptop would
   never show this, because a desktop also has no prompt.
2. **`showDebug()` renders a DOM panel.** On a small Android screen it may cover most of
   the view. Everything else in the sketch is canvas; that one is HTML.

Fastest discriminator: load the plain address, then load it with `?debug=1`, and compare.
If the two look materially different, suspect 2. If the plain address is dimmed or stuck,
suspect 1.

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