# VELNEST demo delivery — October 29, 2026

Historical 103-second assembly record. The owner subsequently selected a new
3-minute film; current delivery/publication status is in [FINAL-SUBMISSION.md](FINAL-SUBMISSION.md).

The owner explicitly authorized a public demonstration on meemokiller. OBS sent
only the room Browser Source, with microphone and desktop audio muted. The actual
Twitch player displayed the room, correct title, category and LIVE indicator.
The stream was stopped after approximately three minutes. OBS was subsequently
verified to show both Start streaming and Start recording.

## Final edit

Local file: `downloads/final-demo/VELNEST-demo.mp4` (ignored private media).
Duration: 103.02 seconds. H.264, 1280×720, 30 fps; AAC English narration.
SHA-256: `e2974da7d657b5ba55647cd1baaa5804f7130e4fa3455c2d21310f10f2c18694`.

The edit is reproducible with `node scripts/assemble-demo.mjs` when the locally
recorded source files and narration tracks are present. Those private inputs are
intentionally excluded from Git. FFmpeg must be installed and on PATH. Narration
was generated locally using Windows Zira, without a paid voice service.

| Time | Evidence |
|---|---|
| 0–9 s | Clearly labeled authored opening from the existing HyperFrames motion study |
| 9–19 s | Actual Twitch player capture from the authorized live demonstration |
| 19–30 s | Actual signed-in broadcaster identity and character selection interface |
| 30–42 s | Recorded Arc entry with a lightstick |
| 42–54 s | Recorded synchronized character reactions |
| 54–65 s | Recorded approach and lounge seating |
| 65–77 s | Actual Blender asset script in the public repository; Codex contribution explained |
| 77–92 s | Actual successful Windows/Linux QA workflow |
| 92–103 s | Recorded room and repository address |

Full decode passed. Eighteen frames sampled at six-second intervals were visually
inspected, including the Twitch player, identity screen, code and QA results.
All clips share explicit BT.709 metadata, avoiding decoder reconfiguration at
boundaries. The synthesized narration has nonzero audio and no detected clipping
(peak approximately -4.3 dB before the metadata-only rerender).

## Scope

The demonstration uses one real broadcaster account. It does not claim a second
independent viewer, a physical-phone test, or a live moderation test. Additional
viewer/moderation behavior has simulated-provider automated coverage. The staged
opening is not represented as live footage.

## Remaining publication actions

YouTube Studio is signed in as Kapy Ai. The upload dialog explicitly requires
acceptance of YouTube terms and community guidelines; owner confirmation is
pending. The real public video URL must be verified and inserted into Devpost.
Devpost final declarations must be reviewed before the final submission action.
