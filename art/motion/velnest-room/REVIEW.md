# Motion review

## October 29 night-lounge refresh

The film now uses the current compressed room, local Draco decoder and the
website's lighting. HyperFrames check reports zero lint/runtime/layout/craft
errors or warnings. Snapshots at 1.4, 5.6, 8.2 and 11.5 seconds show the walk,
chair approach, seated trio and final pullback clearly.

The first multi-worker export produced white WebGL frames despite reporting
success; it was rejected after decoding. A single-worker `--low-memory-mode`
render fixed it. The replacement is 12 seconds / 360 frames, H.264/yuv420p,
1920×1080, 12,150,063 bytes, silent. Full FFmpeg decode passed; twelve sampled
frames are distinct, and their decoded contact sheet was visually inspected.
Use `node verify-render.mjs` to repeat the file checks. These new image checks
supersede the old-room render evidence below; reverse-seek pixel equality was
not re-measured for this refresh.

Creative decision: one continuous take follows a single character into the remaining sofa seat. The shipped Blender meshes, Wave/Walk/Sit clips and shared room pathfinding carry the story. A multi-cut character montage and a UI tutorial were not used: this short piece is about joining friends, and a real Twitch walkthrough is still pending.

## Visual review and fixes

- First pass: titles overlapped the sofa and wall display. Moved typography into a dedicated charcoal rail below the 1920×810 rendered image.
- Independent review identified the seated trio becoming too small at phone width. The sit now holds the sofa at approximately 40–45% of image width, followed by a restrained pullback to approximately 30–35%.
- Eight samples from 6.8–8.4 seconds confirm the stop, turn and sit remain readable. Full beat and 360px phone sheets were inspected. This is one take, so there is no inter-scene cut sheet.
- Live-editor testing caught a stale canvas after source reload. The composition now owns its seek listener, registers asset readiness and joins the GPU paint to the seek barrier. An 8.2 → 1.4 → 8.2 traversal produced identical pixels in the preview rectangle (344×194 inside a 1280×720 editor screenshot).
- HyperFrames `check --json`: latest pass reports zero lint, runtime and layout errors and no craft warnings. Earlier DOM-only dead-stretch warnings disappeared after composition-scoped seek registration.
- The motion-doctrine ledger contains zero seams. Stamp and gate ran successfully across zero seams; this does not claim validation of a transition the film does not contain.

The weakest moment is the brief body occlusion by the coffee table while approaching the sofa. The face and direction of travel remain legible, and the next close view reveals the complete seated pose. A future longer film could use a higher tracking camera there.

Sound: deliberately silent, 12 seconds, no voice or music requested. No sound was heard or measured. Product claims are limited to the existing models and lounge behavior; this is staged animation, not a live Twitch-session recording.

Delivery file inspection is recorded in `render-verification.json` after export. The HyperFrames editor preview was opened before the delivery render and remains available for editing.
