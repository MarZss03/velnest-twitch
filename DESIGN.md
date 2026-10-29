# VELNEST visual system

The primary surface is the community room itself. The page should help a Twitch viewer select a recognizable humanoid identity, join, move, react, and change accessories while the streamer sees the same activity in OBS.

## Material and hierarchy

- Neutral charcoal page, opaque panels, lavender primary action and sage character accessories. The owner replaced the first simple room with an esports night lounge: graphite floor, dark acoustic walls, walnut fins, genuine CC0 leather furniture and violet/cyan neon. Static layered lighting and restrained HDR bloom preserve material detail. See docs/NIGHT-LOUNGE.md for sources, budgets and scoped verification.
- Manrope is the interface face. Keep code styling confined to the OBS source URL.
- The shared 3D room leads the desktop composition; the selector occupies a quieter right rail. On phones these stack and the joined camera follows the local player.
- Use the actual Blender model renders for character cards. Concept art remains production reference rather than a substitute for the shipped model.

## Tokens

The source of truth is `apps/web/src/styles.css` at `:root`: ground `#151416`, panel `#222124`, ink `#f3f0f6`, muted `#b7b1bf`, line `#3c3842`, accent `#b99af5`, floor `#39323f`. Controls use 6–12 px radii, clear focus outlines, and at least 44 px touch height.

## Motion and interaction

Character clips are authored in Blender and verified through Three.js. Use 160 ms crossfades, authoritative movement and pathfinding, pointer rotation in the selector, and real-time cosmetic swaps. Honor reduced-motion preferences. Names and online counts always come from actual room state.

Event-driven 3D motion: an expanding floor ring marks arrivals; valid floor clicks show a destination ring; Wave lifts a ring, Cheer throws 18 violet/sage confetti pieces, and Dance sends three floor pulses. All effects expire within 1.6 seconds, share geometry, and cap at 16 concurrent cues. Hidden tabs pause rendering. Reduced motion preserves a stationary destination confirmation and textual action/nameplate feedback while suppressing celebration movement. Controls confirm the server's active action and appear immediately on joining.

The three sofa cushions are interactive targets with an equivalent keyboard-accessible seat chooser. A server reservation holds the selected cushion while the character walks around furniture to its approach point. Arrival selects the authored Sit clip; standing crossfades back and restores a valid floor point. Moving, leaving, disconnecting or losing authorization releases the reservation. Seated reactions require standing, while accessory changes remain available. Reduced motion holds the seated pose instead of suppressing that state. Nearby nameplates move apart with fine leader lines. On desktop the room stays at a stable viewport height as its control rail scrolls; on phones, entering or choosing a seat brings the scene into view.

## Skill application and limits

Room occupancy shows the authoritative count against the 24-character limit. A full room keeps rendering while entry is disabled; the explanation states that entry reopens after a participant leaves. Stale capacity-denial messages clear when the room has space. Nameplates search nearby positions in both axes and remain inside the scene. The local participant and current reactions take priority. If nearby space is exhausted, excess visual labels are suppressed; a screen-reader roster retains every participant name and seated/reaction state. Leader lines connect relocated labels back to their anchors and have bounded reach.

Broadcaster management lives below the existing identity/control rail. It uses a plain participant list and an inline removal confirmation, with a live result and focus returning to the heading after completion. The room remains visible while the host manages it. The server exclusively decides moderator authority and timeout duration; demo mode does not expose pretend administration.

Impeccable informed artifact-led hierarchy, browser inspection and corrective passes. Hallmark informed explicit tokens, visible focus, restrained copy and reduced-motion fallbacks. Taste informed replacing the generic marketing splash with the product in use. UI UX Pro Max supplied gaming/3D direction and accessible control guidance. HyperFrames now supplies an editable 12-second 1080p motion study using the actual Blender GLBs, character clips and shared pathfinding, with deterministic seeking and a verified local MP4. These are working methods and local instructions, not model training.

Manrope is self-hosted with six Unicode subsets and a Latin preload. The room and optional animation inspector load separately; scene loading failures offer a page reload. The initial application script is about 277 KB before compression; Three.js is split into separate core and renderer chunks.

October 28 frontend review: Hallmark rendered five desktop/mobile captures with zero failures, reflexes or warnings. Its avatar-control height exception is intentional: these controls show full-body Blender previews. Its adjacent-primary source finding is answered by the text-link sign-out and mutually exclusive character selectors. A fresh-context reviewer requested consistent offline messaging, unknown occupancy while disconnected, and a solid mobile caption surface; all three were corrected and visually checked at 1440 and 375 px. Taste's production inspector reports no findings at 1440, 768 and 390 px, with Manrope loaded and zero horizontal overflow. Lavender is explicitly retained as the user's Twitch identity, with the inspector's purple-palette allowance.

Outstanding: exhaustively check every viewport and cosmetic/animation combination, profile on physical mobile hardware, and capture the real Twitch operation needed for the contest demonstration. Local demo and simulated-provider checks do not establish live Twitch integration.
