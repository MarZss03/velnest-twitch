# VELNEST motion study

A 12-second, 1920×1080, 30fps silent film showing Riff joining Arc and Muse in the lounge chairs. This is a staged presentation using the current game's Blender GLBs, animations and pathfinding. It is not the final Twitch hackathon demonstration.

From this folder, after installing the root workspace dependencies:

```powershell
node build.mjs
& ../hf.ps1 check --json
& ../hf.ps1 preview --background --port 3017
& ../hf.ps1 render --quality delivery --low-memory-mode --output renders/velnest-room.mp4
```

The PowerShell wrapper pins HyperFrames 0.8.209 and keeps package, font and render caches on D:. It reuses the installed Chrome. The preview URL is `http://127.0.0.1:3017/#project/velnest-room`.

Edit the camera/choreography in `scene.mjs`, typography in `compositions/lounge.html`, and text variables in `index.html`. `build.mjs` refreshes the copied game models and bundles the Three.js scene. `SPEC.md`, `STORYBOARD.md` and `REVIEW.md` explain the direction and evidence. The local `.hyperframes` history and audit frames are preserved but excluded from Git.

Sources and licenses:

- Models: VELNEST's editable Blender assembly and characters in `art/blender`;
  the room includes four CC0 Poly Haven sources, with credits and checksums in
  `art/vendor/polyhaven`. Draco decoding is local (Apache-2.0 notice included).
- Camera math: adapted from HyperFrames registry `camera-dolly-zoom`; the installed reference block is retained in `compositions/`.
- Three.js: workspace version 0.186.1, MIT; license beside the bundled scene.
- GSAP 3.14.2: pinned local distribution from jsDelivr; its license notice and official terms link are included.
- Manrope 800: Google Fonts static TTF, SIL Open Font License in `assets/fonts/OFL.txt`.

The final contest package still needs real Twitch operation, the Codex-use segment, narration/copy review if added, and a completed submission.
