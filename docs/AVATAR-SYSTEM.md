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

MVP uses one neutral look per base. Theme packs can later define a compatible item for any subset of those slots.

## What we learned from existing systems

- Roblox separates identity/body from wearable layers and standardizes attachment points so accessories survive across body combinations.
- Fall Guys makes customization legible through a small number of slots such as color, pattern, face, upper, lower, and nameplate.
- VRChat treats outfit switches, appearance toggles, and expressions as saved parameters rather than separate hard-coded avatars.

VELNEST combines those lessons at a much smaller 2D hackathon scope: one shared slot schema, three distinct silhouettes, parameterized cosmetics, and fixed allow-listed assets.

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

The shared rig supports idle, locomotion, wave, cheer, dance, celebrate, and sit. The Day 1 web prototype broadcasts wave, cheer, and dance over the same realtime room channel as movement, so controller actions appear immediately in the OBS overlay. Reference turnarounds and shared action poses live under `art/reference/`.

