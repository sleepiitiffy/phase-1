# Plan: The Creature

<!-- Everything above Steps is yours. Write it yourself, in your own words.
     The agent writes the Steps. You cut them down before anything is built. -->

## Project
Phone as [what], to [do what], for [whom].

## The question
[What this prototype tests. What would tell you it works.]

## The experience
[What one person does, from picking up the phone to the end.
Where they stand or sit. What the people watching can see.]

## Input, transformation, output, fallback
- Input: touch. Tilt. Shake. Sound on touch.
- Transformation: [what happens to that input, with the numbers that matter]
- Output: a soft glowing creature on black. A quick tap brightens the whole body. A slow press swells it under the finger. A drag pushes and pulls it. Every touch ripples and makes a soft tone. Tilt and shake nudge it.
- Fallback: [what happens on a laptop, or when the input is missing]

## References
| File | Use it as | Take | Leave |
|---|---|---|---|
| references/reference.png | inspiration: the feel | the soft luminous glow on pure black; colour bleeding and layering inside the body; the faint concentric banding | the six different silhouettes — this prototype's silhouette drifts slowly instead; the phone drawings and the hand-drawn arrows |

## Limits
- Change only sketch.js.
- Not now: the sculpture. Sculpture will come later. There will be people testing it.

## How I will check it
- On my laptop: [what I should see]
- On my phone: [what I should see, hear or feel]

## Steps

Every step changes only `sketch.js` unless it says otherwise. Every number named here goes at the top of `sketch.js` as a named constant so you can tune it without hunting.

There are no assets in this sketch — no image, no font, no audio file — so nothing is ever loaded and `async setup()` is not needed. Plain synchronous `setup()` is correct throughout.

### Step 1 — A black screen that behaves like an app
Replace the grey-square sketch with a canvas that fills the browser window at whatever size the phone is, filled black. Call `lockGestures()` in `setup()`. Cap the pixel density and set the frame rate.

- Functions: `createCanvas(windowWidth, windowHeight)`, `background()`, `lockGestures()`, `pixelDensity()`, `frameRate()`, `windowResized()`.
- Numbers: `RESTING_FRAME_RATE`, `PIXEL_DENSITY_CAP`.
- **Ordering rule for the whole sketch: define every mouse and touch callback as a global *before* calling `lockGestures()`.** p5-phone snapshots the touch callbacks when gestures lock, and assigning one afterwards replaces p5-phone's own wrapper and breaks touch handling. Every callback returns `false`. There is only ever **one** `mouseReleased()` in the sketch — from Step 5 it will also do gesture detection, so do not add a second one later.
- Cap the pixel density on purpose. A phone reports a density of 2 or 3, so an uncapped full-screen canvas is drawing two to nine times the pixels, and a soft glow is the worst case for judder. If the piece ever stutters, this is the first thing to lower.
- Laptop: a black rectangle that fills the window, and it resizes when you resize the window.
- Phone: black, edge to edge, no grey bars, no scroll-behind, no pull-to-refresh, and no text you have to select. Swipe hard anywhere and nothing happens.

### Step 2 — Get it onto the phone, from a URL that does not change
`npm run phone` opens a public tunnel and prints a temporary URL. When the tunnel drops it prints a *different* URL, up to eight times without you doing anything.

That matters more than it sounds: browser storage belongs to one exact address, so a new URL is a brand-new empty creature and everything the last hundred visitors did is gone. It will look like the creature is forgetting.

So serve this from an address that stays the same between sessions — publish the folder to GitHub Pages, or any fixed https address — and use `npm run phone` only for quick throwaway checks. Hardware needs https anyway; a bare `http://` address over the local network will not give you sensors on a phone.

- Numbers: none.
- Laptop: open the permanent address and the sketch runs.
- Phone: open the permanent address. Come back tomorrow and confirm it is the same address. If it changed, the creature has reset and the address is wrong.

### Step 3 — One quiet prompt that turns on motion and sound
Show a single small semi-transparent pulsing icon, no text box. The first tap on it asks the phone for motion sensors and sound output together, in one activation. One call, because iOS only grants one activation window per gesture.

- Functions: `enablePermissionsMinimal(['sensors', 'sound'])`, `showDebug()`, `debug()`. Gate everything on `window.sensorsEnabled` and `window.soundEnabled`.
- **Needs one line added to `index.html`** — the `p5.sound` script tag, placed after p5 and before p5-phone. This is the one place the "change only sketch.js" rule has to bend; the sound in Step 4 is not possible without it.
- Turn on `showDebug()` from this step onward and do not turn it off. A phone gives you no other way to see why a permission or a sensor is not reporting, and several later steps depend on being able to read a message on the device.
- Laptop: the icon appears, you can click it, `sensorsEnabled` goes true, but every sensor value stays at zero.
- Phone: the icon sits there quietly. Tap it once, it disappears, and the phone shows its own motion prompt. After that, nothing but black. That first tap is spent on the overlay and does not also reach the sketch.

### Step 4 — One short tone, early, to find out if sound works at all
Do the sound now rather than near the end, because it is the most likely thing in the whole piece to fail on a phone and you want to find out while there is still room to react.

Play one short soft tone on every touch, pitched from the creature's current hue so the same gesture makes a different note as the colour drifts. Start and stop the oscillator each time — never leave one running.

- Functions: p5.sound `p5.Oscillator` and `p5.Envelope`, gated on `window.soundEnabled`. Do not write your own first-tap audio unlock; the Step 3 permission already handles it.
- Numbers: `TONE_BASE_HZ`, `TONE_HUE_SPREAD_HZ`, `TONE_ATTACK_MS`, `TONE_RELEASE_MS`, `TONE_VOLUME`.
- If there is no sound: `p5.sound` 0.3.0 is written against p5.js 2.2.3 and this project loads 2.3.2, so that pairing is the first suspect. The second suspect is that `index.html` has no compatibility shim; the `p5.js-compatibility` preload script is the thing to try next. Note on a phone which of the two you tried, so you do not repeat it later.
- Laptop: nothing. There is no real sound permission path on desktop.
- Phone: tap and you hear one short soft note. Tap repeatedly, quickly, and confirm it never builds into a drone or stacks into a chord.

### Step 5 — The screen never goes dark
Hold a screen wake lock for as long as the page is open, and ask for it again every time the page comes back into view.

- Functions: `navigator.wakeLock.request('screen')` — this is a browser API, not a p5-phone function, there is no `keepScreenOn()`. Request it from `mouseReleased()`, because iOS refuses the first request unless a touch has just lifted, and `userSetupComplete()` is too late. Listen for `visibilitychange` and re-request. Wrap it in a try/catch and call `debugWarn()` in the catch.
- Numbers: none.
- The permission overlay in Step 3 swallows the first tap, so the first wake lock request only succeeds on the *second* touch. If you check this straight after Step 3 and the screen still dims, that is why — tap once more before deciding it is broken.
- Laptop: nothing visible.
- Phone: tap once, then leave it alone for two minutes. The screen is still lit. Lock the phone with the side button, unlock it, and confirm the sketch came back and the lock came back with it.
- Note: the wake lock fails inside the p5.js Web Editor preview iframe. Test on your own page.

### Step 6 — Prove the sensors actually read
Draw a small plain white readout on the black: the current tilt, and a word that flips to `SHAKEN` for a moment when the phone is shaken. **This readout is temporary — Step 7 removes it**, because the finished piece is the creature on black and nothing else.

- Functions: `rotationX`, `rotationY`, `rotationZ`, and `pRotationX/Y/Z` for the change since last frame. `angleMode(DEGREES)` in `setup()` — without it these are radians and the numbers are meaningless. `deviceShaken()` as a global callback, `setShakeThreshold()`.
- Numbers: `SHAKE_THRESHOLD`, `REST_TILT_X`, `REST_TILT_Y`, `REST_TILT_Z`.
- Laptop: every number stays at zero and `SHAKEN` never appears.
- Phone: tilt and the numbers move. Shake and `SHAKEN` appears. Hold the phone still for a few seconds, write down the resting numbers into `REST_TILT_X/Y/Z` — from then on tilt means the *change* from how the piece is sitting, never an absolute direction.
- Watch for: `rotationX` wraps at plus and minus 180 degrees. A tilt that reads 179 then -179 has barely moved, and anything comparing them naively will spike. There is no rotation-rate global in p5.js, so do not go looking for one.

### Step 7 — The first soft glowing body, and the readout goes
Draw one soft blob in the middle of the screen: the glow built from a radial gradient falling off to fully transparent black, with several more low-alpha passes over the top so the colour layers and bleeds. Make it breathe — the whole thing slowly growing and shrinking. Delete the white readout from Step 6 in the same pass.

- Functions: `drawingContext.createRadialGradient()` for the falloff, `fill()` / `ellipse()`, `drawingContext.globalCompositeOperation` for the layering. Plain 2D. No WebGL, no `loadPixels()`.
- **Build the softness out of the layered low-alpha passes, not out of a blur.** A canvas blur filter is not available on every phone, and where it is missing it fails silently — no error, just a hard-edged shape and no slime at all. Layered passes work everywhere and cost the same thing. You can add a blur later as an enhancement, never as the thing the look depends on.
- Reset `globalCompositeOperation` back to normal at the end of every frame. Left set, it changes how the next frame's `background()` behaves and everything smears.
- Numbers: `CREATURE_SIZE`, `CREATURE_CENTRE_Y`, `GLOW_PASSES`, `GLOW_ALPHA`, `CREATURE_BLOOM_MIN`, `CREATURE_BLOOM_MAX`, `BREATH_PERIOD`.
- Laptop: a luminous soft-edged blob, centred, slowly swelling and shrinking.
- Phone: the same, and it holds smooth frame rate for a full minute of watching. If it judders, lower `PIXEL_DENSITY_CAP` from Step 1 first, then `GLOW_PASSES`.

### Step 8 — The genome, in one place, and a phone that remembers it
Define the whole genome now as a single plain object with every field the finished piece will ever need — even the ones no step draws yet — and save it to the phone's storage whenever it changes, loading it back at startup. Declaring the full set now is what keeps later values from silently failing to persist.

The fields are: lobes, stretch, hue, sat, bright, bandCount, bandGap, edgeBlur, breathPeriod. Steps 9 to 13 fill them in; none of them add a new field.

- Functions: `localStorage` `setItem()` / `getItem()`, called synchronously. This is not asset loading, so there is nothing to `await` and `setup()` stays a normal function. A plain object is the right container — p5's `createStringDict()` and `p5.TypedDict` no longer exist in p5.js 2. Native array methods like `splice()` and `sort()` are the ordinary JavaScript ones and are fine; it is only the p5 versions that are gone.
- Numbers: `GENOME_KEY`, `GENOME_SAVE_DELAY_MS`.
- Laptop: change something, reload, it comes back changed.
- Phone: change something, switch to another app, come back — still changed. Put it in airplane mode and reload — still changed.

### Step 9 — The silhouette drifts
Make the outline a closed loop built from a number of lobes of differing size, so it has bumps and legs rather than being a circle. Add a stretch so it can be tall and thin or round and heavy.

- Functions: `beginShape()` / `splineVertex()` / `endShape(CLOSE)`. The p5.js 2 rename matters here: `curveVertex()` is now `splineVertex()`.
- **Repeat the first point as the last point** before closing. A spline calculates from its neighbours, so without the repeated point the outline leaves a kink exactly where it closes, and on a soft glowing shape that kink is the first thing the eye finds.
- Numbers: `LOBES_MIN`, `LOBES_MAX`, `STRETCH_MIN`, `STRETCH_MAX`.
- Laptop: click and the outline shifts a little toward its next form. Nothing should happen between clicks.
- Phone: touch and the outline shifts a little. It never jumps to a different animal; over a whole day of touching it should be visibly not what it was this morning.

### Step 10 — Colour drifts
Give the creature a hue, a saturation and a brightness, each with its own range, and let the hue travel all the way around the colour wheel. Keep the palette soft — low-to-mid saturation, high brightness, nothing neon and nothing brown.

- Functions: `colorMode(HSB)`, `color()`, `fill()`, and a small helper that keeps hue inside 0–360 by wrapping rather than clamping, so the colour travels past 360 instead of sticking to the end of the range.
- Numbers: `HUE_MIN`, `HUE_MAX`, `SAT_MIN`, `SAT_MAX`, `BRIGHT_MIN`, `BRIGHT_MAX`.
- Laptop: click repeatedly and the colour walks around the wheel, never jumping or snapping.
- Phone: same, one touch at a time.

### Step 11 — Colour flows inside the body
Put two or three soft blobs of colour inside the creature that drift slowly around inside it on their own, between touches. Leave the page alone and confirm they never leave the body.

- **Keep them in by distance, not by clipping.** Cutting the internal colour to a hard outline path gives a crisp rim that fights the soft bleeding edge the whole piece is built on, and p5's `beginShape()` does not build a native path to clip against anyway. Instead draw each inner blob as its own soft gradient and keep its centre inside `INNER_BLOB_MARGIN` of the silhouette, so it fades out before it ever reaches an edge. If you later need a true mask, it is `destination-in` onto an offscreen buffer — not a clip.
- Numbers: `INNER_BLOBS`, `INNER_FLOW_SPEED`, `INNER_BLOB_SIZE`, `INNER_BLOB_MARGIN`.
- Laptop: leave it running. The colour inside is never still; the outline and the palette do not change at all.
- Phone: same. This is the thing that makes it look alive between visitors.

### Step 12 — The banding packs and unpacks
Add the faint concentric banding from the reference, and let it pack tighter or looser.

- Numbers: `BAND_COUNT_MIN`, `BAND_COUNT_MAX`, `BAND_GAP_MIN`, `BAND_GAP_MAX`.
- Keep all three ranges in Steps 9, 11 and 12 conservative rather than generous. Lobe count, stretch and band density all move independently over days, and the combinations at the wide ends of all three at once can look broken rather than alive. If it ever does, narrow a range here rather than adding a clamp.
- Laptop: at both ends of the range the banding should read as clearly different but not as a hard graphic pattern — it is a faint thing inside a soft body, like the last panel of the reference.
- Phone: same, and check that tight banding does not flicker at 30fps.

### Step 13 — The edge softens and sharpens
Make the softness of the outside edge a genome value, so the creature can go from vapour to something with a defined rim and back.

- Numbers: `EDGE_BLUR_MIN`, `EDGE_BLUR_MAX` — but these scale the layered passes from Step 7, not a canvas blur filter. See the note in Step 7.
- Laptop: the difference between the two ends should be obvious at a glance.
- Phone: check the sharpest end of the range for judder.

### Step 14 — The body wanders a little
Keep the creature in the middle third of the screen but let its centre drift slowly inside that, so it is never pinned to one spot.

- Numbers: `WANDER_RADIUS_X`, `WANDER_RADIUS_Y`, `WANDER_PERIOD_X`, `WANDER_PERIOD_Y`, `WANDER_FLOOR`, `WANDER_CEIL` (so it never wanders under the phone's browser bars).
- Laptop: leave it running a minute. It should move noticeably but never leave the middle of the screen.
- Phone: same. Confirm the bottom of the creature never disappears behind the browser bar.

### Step 15 — One touch means one tiny bounded change
This is the centre of the piece. Build a single function that nudges the genome — a small random amount on one or two values, never more than a hair, always clamped back inside its range. Call it once per touch and from nowhere else. Nothing else in the sketch is allowed to change the genome.

- Functions: `random()`, `map()`, `constrain()`, `lerp()`, and a save call behind the same delay as Step 8.
- **Build a way to fire many nudges at once before you test this.** Slow accumulation is the whole thesis and clicking two hundred times by hand is how you end up convinced it does not work. A query parameter on the address that fires `TEST_NUDGE_COUNT` nudges on load is the cheapest way, and it is the only way to check the thing you actually care about.
- Numbers: `NUDGE_SHAPE`, `NUDGE_COLOUR`, `NUDGE_MOVE`, `NUDGE_SHAPE_CHANCE` (chance that a touch moves shape rather than colour), `NUDGE_EASE_IN` (how long a change takes to arrive, so nothing snaps), `TEST_NUDGE_COUNT`.
- Laptop: fire twenty nudges and nothing should look different enough to point at. Fire two hundred and it should be clearly a different creature.
- Phone: same, with a finger, in real time.

### Step 16 — Read the gesture, with nothing drawn yet
Before any of the four responses exist, work out *which* gesture the person is making and print the answer as a small label. This step builds only the reading of the gesture; the visuals come in Steps 17 to 19.

A quick tap is short and barely moved. A slow press is held still. A drag is movement beyond the threshold. Everything else is decided from how long it was held and how far it travelled.

- Functions: `mousePressed()`, `mouseReleased()`, `millis()`, `mouseX`, `mouseY`. p5.js 2 removed `touchStarted` / `touchEnded` entirely — the mouse callbacks are the touch callbacks. These were already declared before `lockGestures()` in Step 1; this step fills in their bodies.
- **A cancelled touch does not call `mouseReleased()`.** On p5.js 2.3.1 and later — and this project is on 2.3.2 — p5 handles cancelled touches itself and skips that callback, where older versions called it with a `pointercancel` event. A tap that gets cancelled half-way therefore never resolves, and a gesture left mid-way would sit there as a permanent press. Reset any in-progress gesture on a timer as well as on release, and clear it when the touch list empties.
- Numbers: `TAP_MAX_MS`, `TAP_MAX_MOVE_PX`, `PRESS_MIN_MS`, `GESTURE_RESET_MS`.
- Laptop: click fast and the label reads tap. Click, hold still, and it reads press. Drag and it reads drag.
- Phone: the same three, and set `TAP_MAX_MS` by feel — it wants to be forgiving enough that an ordinary tap counts as a tap.

### Step 17 — Tap brightens, press swells
Now give the two stationary gestures their responses, using what Step 16 already decided. A quick tap brightens the whole body briefly and settles. A slow press swells the body outward under the finger and relaxes back.

- Numbers: `BRIGHTEN_AMOUNT`, `BRIGHTEN_SETTLE_MS`, `SWELL_AMOUNT`, `SWELL_RADIUS`, `SWELL_EASE_IN`, `SWELL_EASE_OUT`.
- Laptop: click quickly — the body brightens and settles. Press and hold — it swells and relaxes.
- Phone: same with a finger. Both must be clearly temporary. Nothing here may change the genome, because the creature is meant to carry no mark from a single touch.

### Step 18 — Drag pushes and pulls
A finger dragged across the body moves it, and the body follows slowly and heavily rather than snapping to the finger. Let go and it drifts back to where it was.

- Functions: `mouseDragged()`. For multi-touch, read `touches[]` and test `touches.length > 0` — `mouseIsPressed` goes false the instant *any* one finger lifts, even with others still down.
- Numbers: `DRAG_PUSH_GAIN`, `DRAG_STRETCH_GAIN`, `RETURN_SPRING`, `RETURN_DAMPING`.
- Laptop: drag with the mouse and it follows and springs back.
- Phone: drag with one finger and with two. It should not snap and it should not teleport. Dragging is movement on the creature, never a genome change.

### Step 19 — Every touch ripples
A soft ring spreads out from the point of contact across the body and fades.

- Numbers: `RIPPLE_MAX_RADIUS`, `RIPPLE_LIFE_MS`.
- Laptop: it appears and fades with a click.
- Phone: same, and confirm the ring fades fully rather than leaving a trail, since the creature is redrawn from nothing every frame.

### Step 20 — Tilt and shake nudge the same genome
Route both sensors from Step 6 into exactly the nudge function from Step 15, not a separate one. A change in tilt from `REST_TILT_*`, and a shake, each nudge the genome as slightly as a touch does.

- Functions: `rotationX - REST_TILT_X` style comparisons, `deviceShaken()`, gated on `window.sensorsEnabled`.
- Numbers: `TILT_NUDGE_GAIN`, `SHAKE_NUDGE_GAIN`, `SHAKE_COOLDOWN_MS`.
- Laptop: nothing. No sensors, no nudges.
- Phone: lean the sculpture and the creature shifts a little. Knock the table gently and it shifts a little. A steady held tilt must nudge **once, on the change** — or a sculpture sitting slightly off-level would push the creature on its own forever. The cooldown is what stops a shake event repeating.

### Step 21 — Tune it on the phone
Now sit with the numbers at the top of `sketch.js` and set the feel: the size, the speed of the breathing, how slow the internal colour flows, how faint a nudge is, how long a press counts as a press, and the two ends of the softness range. These are the only things left to decide.

- Laptop: run it for two minutes and watch for anything that jumps or flickers.
- Phone: run it for two minutes and watch for the same, then fire a few hundred nudges and confirm the creature still looks like a creature rather than drifting into something broken.

## Assumptions

- **p5.sound needs a second script tag in `index.html`.** Sound cannot be done without it, and "change only sketch.js" has to give way in Step 2. If you would rather it did not, say so and sound comes out of the piece instead.
- **`localStorage` is the memory.** The creature survives reloads, a locked phone and days. It does not survive someone clearing the browser's data for the site, and it does not travel to another phone.
- **A desktop mouse counts as a touch.** Every gesture in this piece works with a click or drag on a laptop, which is what makes it checkable there. The only things a laptop cannot do are read sensors and make sound.
- **The resting tilt is captured once, by hand.** Step 4 has you write the at-rest numbers into `REST_TILT_X/Y/Z`. That means tilt is measured relative to however the sculpture is actually mounted, so if you re-mount the phone those three numbers have to be re-measured.
- **Tilt nudges once, on the change.** A held-steady tilt does not keep nudging, or a sculpture sitting slightly off-level would slowly push the creature on its own forever.
- **One touch nudges one or two values, not all of them.** Nudging everything at once would average out into no visible change at all.
- **The screen wake lock only holds while the page is in front of you.** It cannot wake a dark screen, cannot run in the background, and cannot survive the page being closed. For a piece that must run unattended for days it is necessary but not sufficient, and the sculpture will still need power.
- **No WebGL, no shaders, no per-pixel field.** Everything is plain 2D drawing, because the metaball look is faked with layered gradients and that is what will hold frame rate on a phone.
- **The colour drifting between touches is a visual effect, not a genome change.** The genome is frozen except when a finger, a tilt or a shake nudges it.

## Changes