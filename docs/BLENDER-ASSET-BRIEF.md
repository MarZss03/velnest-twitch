# VELNEST Blender asset brief

## Goal

Turn the approved simple 3D lineup into three efficient, modular avatars for a browser-first Twitch world. The same rig, animations, proportions, sockets, and most cosmetics must work on Riff, Arc, and Muse.

## Shared base

- height: 1.0 Blender unit from sole to crown, excluding hair
- head: 0.38 units high; identical face plane and headwear envelope
- hands: simple mitten meshes, identical size and wrist location
- legs: short, neutral stance; identical hip, knee, ankle, and shoe contact points
- topology target: 6k–10k triangles per dressed character, 15k hard ceiling
- one humanoid armature with root, pelvis, spine, chest, neck, head, upper/lower arms, hands, upper/lower legs, and feet
- facial animation for MVP: eye blink plus optional mouth open; no full facial rig

## Identity-only differences

- **Riff:** compact energetic silhouette; one asymmetrical hair tuft; cropped hoodie
- **Arc:** balanced sporty silhouette; simple cap; clean short jacket
- **Muse:** slightly taller visual read achieved with hair and long overshirt only; skeleton joints remain unchanged

## Material system

Use one 1024×1024 atlas where practical and no more than four material slots:

1. skin
2. hair
3. primary clothing
4. accent/neutral clothing

Favor flat base color, gentle roughness variation, and baked ambient occlusion. Avoid unique micro-textures so streamers can recolor materials with a small palette definition.

## Modular sockets

Name empties consistently on every avatar:

- `slot_head`
- `slot_face`
- `slot_chest`
- `slot_back`
- `slot_hand_r`
- `slot_fx_root`

Cosmetics should be separate objects, origin-aligned to their socket, and tested on all three bases before export.

## Export package

- `velnest_base_rig.blend`
- `riff.glb`, `arc.glb`, `muse.glb`
- shared idle, walk, wave, cheer, dance, celebrate, and sit animation clips
- GLB with embedded textures, meters, +Y up after engine import normalization
- one neutral lighting turntable render per character for approval

## Acceptance checks

- readable at 96 px tall
- no clipping in idle, walk, wave, and one handheld prop pose
- wave reads through one raised forearm and body lean; cheer through a two-beat jump; dance through a four-beat side-to-side groove
- every shared cosmetic attaches without per-character position edits
- draw-call and triangle targets hold in a 50-avatar stress scene
