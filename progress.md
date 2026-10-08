# Progress

## Where things are

Steps 1-17 of `plan.md` are built. Steps 18-21 are not started.

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
5. `?debug=1` — readout appears top-left. Click fast: `gesture: tap`. Hold: `press`.
   Drag: `drag`.
6. `?reset=1`, then reload plain. Back to the starting creature.
7. `?nudge=200`, then reload plain. Noticeably different, and it persists.

**Phone:**

1. Resolve the Android problem above first.
2. `?debug=1`, tap the icon, allow motion. `sensors on`. Tilt moves the numbers, shake
   flashes `SHAKEN`.
3. **While the piece lies still, write the three `tilt` numbers into `REST_TILT_X/Y/Z`.**
   They are zero now, correct only if the phone sits perfectly flat.
4. Tap: the body brightens and settles. Press and hold: it bulges under your finger and
   relaxes. Drag: the label says drag.
5. `?nudge=200`, then reload. It changed and it stuck.
6. `?reset=1`, reload. Back to the start.

## Next

Step 18 — drag pushes and pulls. `bodyOffsetX/Y` are already threaded through
`creatureCentre()` and are always zero; Step 18 gives them a spring so the body follows a
finger heavily and drifts back.

Then Step 19 (ripple), 20 (tilt and shake nudging the same genome), 21 (tuning).

## Notes for later

- `mouseReleased()` now does three jobs: wake lock, tone, and the nudge. Still only one.
- `?debug=1` earns its keep in Step 20 — it is the only way to see whether tilt and shake
  are reporting without taking the piece apart.