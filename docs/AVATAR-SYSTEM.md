# VELNEST avatar system

## Product decision

VELNEST ships three simple **chibi humanoid identity bases** that share one skeleton and one prop system while accepting streamer-specific themes. Their visual language is smooth, rounded, low-poly 3D: readable like a collectible game figure, but restrained enough to avoid a preschool look.

## The three bases

### Riff — the social spark

A compact, energetic humanoid with a rounded short-jacket silhouette. Best for chat-heavy, variety, party, and cozy streams.

### Arc — the active player

A balanced, athletic humanoid with a cropped performance-jacket silhouette. Best for games, esports, speedruns, and competition themes.

### Muse — the creator

A slightly taller, relaxed humanoid with a lightweight long-overshirt silhouette. Best for music, art, Just Chatting, and narrative streams.

All three use one large rounded head, dot eyes, mitten hands, short limbs, the same headwear scale, shoe footprint, animation skeleton, and attachment coordinates. Personality comes from a single hairstyle, one outerwear silhouette, pose, and color blocking—not surface clutter. A prop is authored once and can be reused across all three.

## Shared customization contract

Every base exposes the same six logical slots:

1. crown/head
2. face or display
3. chest emblem
4. back attachment
5. hand effect or prop
6. foot/hover/trail effect

The current MVP offers the original look, headphones, backpack and lightstick on every base. The exported attachment names are `Head`, `slot_head`, `slot_face`, `slot_chest`, `slot_back`, `slot_hand_L` and `slot_hand_R`; the runtime currently uses `Head`, `slot_back` and `slot_hand_R`. The logical foot/effect slot above is a planning target, not an exported socket in this build. Theme packs can later extend the compatible item set.

## What we learned from existing systems

- Roblox separates identity/body from wearable layers and standardizes attachment points so accessories survive across body combinations.
- Fall Guys makes customization legible through a small number of slots such as color, pattern, face, upper, lower, and nameplate.
- VRChat treats outfit switches, appearance toggles, and expressions as saved parameters rather than separate hard-coded avatars.

VELNEST applies those lessons to the current Blender/Three.js room: shared attachment coordinates, three distinct silhouettes, parameterized cosmetics and fixed allow-listed assets.

## Art constraints

- non-furry and non-animal
- all-ages safe, cute without reading as preschool
- strong silhouette at 64–128 px on a livestream
- matte vinyl and soft-fabric materials with large neutral/recolorable regions
- no armor, masks, tiny accessories, dangling pieces, intricate patterns, or cyberpunk clutter
- no user-uploaded art in the MVP
- original assets only; no third-party game characters or logos

The Blender production handoff is specified in `docs/BLENDER-ASSET-BRIEF.md`.

## Motion language

The current exported rig has six named clips: Idle, Walk, Wave, Cheer, Dance and Sit. The earlier handoff's separate Celebrate proposal has not been implemented as a seventh clip; current celebration uses Cheer. Wave, Cheer and Dance share the realtime room channel with movement and seating. Reference turnarounds and shared action poses live under `art/reference/`.

The [production pose review](../art/blender/review/README.md) covers one static sample of each of the 72 identity/accessory/clip combinations. Runtime tests exercise five times per combination, matching authored and temporary prop envelopes, animated attachment transforms and cleanup. They do not sign off every frame/angle, facial animation or all of the original handoff's performance targets.

