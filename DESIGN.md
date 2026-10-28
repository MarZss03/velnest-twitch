# VELNEST visual system

The primary surface is the community room itself. The page should help a Twitch viewer select a recognizable humanoid identity, join, move, react, and change accessories while the streamer sees the same activity in OBS.

## Material and hierarchy

- Neutral charcoal page, opaque panels, lavender primary action, warm low-poly furniture, sage accessories.
- Manrope is the interface face. Keep code styling confined to the OBS source URL.
- The shared 3D room leads the desktop composition; the selector occupies a quieter right rail. On phones these stack and the joined camera follows the local player.
- Use the actual Blender model renders for character cards. Concept art remains production reference rather than a substitute for the shipped model.

## Tokens

The source of truth is `apps/web/src/styles.css` at `:root`: ground `#151416`, panel `#222124`, ink `#f3f0f6`, muted `#b7b1bf`, line `#3c3842`, accent `#b99af5`, floor `#39323f`. Controls use 6–12 px radii, clear focus outlines, and at least 44 px touch height.

## Motion and interaction

Character clips are authored in Blender and verified through Three.js. Use 160 ms crossfades, authoritative movement and pathfinding, pointer rotation in the selector, and real-time cosmetic swaps. Honor reduced-motion preferences. Names and online counts always come from actual room state.

## Skill application and limits

Impeccable informed artifact-led hierarchy, browser inspection and corrective passes. Hallmark informed explicit tokens, visible focus, restrained copy and reduced-motion fallbacks. Taste informed replacing the generic marketing splash with the product in use. UI UX Pro Max supplied gaming/3D direction and accessible control guidance. HyperFrames is installed and its 3D guidance was consulted; no HyperFrames video has been produced yet. These are working methods and local instructions, not model training.

Outstanding: finish all viewport and cosmetic/animation combinations, stabilize font loading, complete the skills' final review gates, and create the requested motion presentation where it serves the product.
