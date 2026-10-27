# VELNEST avatar system

## Product decision

VELNEST does not ship three fixed characters or furry mascots. It ships three **humanoid identity bases** that share one skeleton and one prop system while accepting streamer-specific themes.

## The three bases

### Riff — the social spark

A compact, energetic humanoid with a rounded short-jacket silhouette. Best for chat-heavy, variety, party, and cozy streams.

### Arc — the active player

A balanced, athletic humanoid with a cropped performance-jacket silhouette. Best for games, esports, speedruns, and competition themes.

### Muse — the creator

A slightly taller, relaxed humanoid with a lightweight long-overshirt silhouette. Best for music, art, Just Chatting, and narrative streams.

All three use the same headwear scale, simplified hand shape, shoe footprint, animation skeleton, and attachment coordinates. A prop is authored once and can be reused across all three.

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
- all-ages safe without reading as preschool or toy-like
- strong silhouette at 64–128 px on a livestream
- mostly neutral/recolorable surfaces
- no user-uploaded art in the MVP
- original assets only; no third-party game characters or logos

