# Production character and cosmetic review

Three identities × four cosmetic choices × six clips = **72 static samples**. Each board is a deterministic Blender render of the editable production assets, not an AI approximation of them.

- [Riff](riff-pose-board.png)
- [Arc](arc-pose-board.png)
- [Muse](muse-pose-board.png)

Columns are Idle, Walk, Wave, Cheer, Dance and Sit. Rows are Original, Headphones, Backpack and Lightstick. The backpack row deliberately faces backward so its attachment can be inspected. Walk uses frame 8; other clips use frame 16 at 30 fps. These are review poses on an empty background, so a sitting character has no rendered cushion beneath it.

## Changes found through verification

The runtime's temporary geometric props used the old Z-up coordinates while the exported props and sockets use glTF's Y-up coordinates. This could put a loading lightstick sideways and misplace the backpack/headband. Fallbacks now match the authored prop envelopes. Cleanup uses the shared disposal helper so a fallback material shared by multiple meshes is disposed once.

The Blender prop source materials lacked shader nodes, causing Cycles review renders to show white props while the GLB material was mint. The generator now authors the mint base color and matte roughness explicitly, and all three prop `.blend`/GLB pairs have been rebuilt. Final boards were rendered after that rebuild and visually inspected for missing models, obvious detachment and material consistency at the selected poses.

## Runtime evidence

From the repository root:

```powershell
pnpm test:cosmetics
pnpm test:animations
```

`test:cosmetics` calls the actual `attachCosmetic` implementation and loads the actual GLBs through a loopback HTTP fixture. It checks all 360 identity/cosmetic/clip/time samples, nine deliberately delayed prop loads, authored/fallback bounding-envelope alignment, socket positions/orientations, switching cleanup and three responses arriving after an item was already removed. No per-character prop correction is used.

To write a report bound to the tested GLB hashes:

```powershell
pnpm test:cosmetics --report=art/blender/review/cosmetic-matrix.json
```

The checked-in report records the final assets tested on October 28, 2026. The pose manifest records each Blender sample's frame and triangle count, including the prop.

## Rebuild boards

Use the installed Blender executable from the repository root:

```text
blender --background --factory-startup --python art/blender/review_matrix.py
```

The inspected local renders used the existing Blender 5.4.0 Alpha binary on D:. No new Blender installation was required. The script bakes the evaluated poses into an isolated review scene without overwriting the editable avatar sources.

## Limits

These samples do not establish absence of clipping at every instant/viewpoint, every responsive viewport combination, physical-mobile frame rate, the original 50-avatar handoff stress target or facial-animation acceptance. Runtime coordinate tests do not replace visual inspection, and Blender renders do not prove Twitch operation. Live Twitch authorization and the final contest demonstration remain separate unfinished work.
