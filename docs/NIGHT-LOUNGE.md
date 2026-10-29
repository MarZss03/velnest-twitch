# Esports night lounge

The owner selected dark materials, violet/cyan neon and gaming equipment.
This replaces the first blockout room while preserving its floor,
three seat anchors, server movement rules and existing character identities.

## Shipped scene

- Four genuine CC0 sources from Poly Haven: leather lounge chair, inlaid coffee
  table, articulated desk lamp and plant. Chairs and plants reuse source mesh
  data in Blender; the export is batched into 20 material primitives.
- Original VELNEST illuminated wordmark and nest insignia, acoustic timber fins,
  corner lamps, skirting light, seat-base light and floating-floor reveal.
- Authored ultrawide monitor, mechanical keyboard, mouse, controller, speakers
  and a PC chassis with two luminous fan rings.
- Dark PBR materials, environment reflections, four static colored fill lights,
  one shadow-casting key and restrained HDR bloom. No idle light flicker.
- Runtime textures are at most 512 px. The final embedded GLB is 2,381,552 bytes,
  160,397 triangles and 20 material batches. The first unoptimized export was
  18,964,480 bytes. The initial interface bundle remains separate from Three.js.
- Draco decoding is self-hosted; its Apache-2.0 notice is included. No live API,
  font CDN, model CDN or decoder CDN is required at runtime.

The source records and checksums are in `art/vendor/polyhaven/*/source.json`.
See [source credits](../art/vendor/polyhaven/LICENSE.md). NVIDIA SimReady was
researched, not bundled: its furniture pack is much larger and its libraries
have asset-specific licenses, rather than one universal open-source license.

## Edit and rebuild

The editable source is `art/blender/afterparty.blend`, with individual named
components and packed textures. Run Blender with
`--background --python art/blender/build_room.py` to regenerate the source,
optimized GLB, manifest and still. This entry point invokes
`build_night_lounge.py`; the old blockout generator has been removed.

`art/tools/fetch_room_assets.py` fetches the four authoring sources and verifies
upstream checksums. Downloads remain inside the D-drive project. The normal
website uses only the GLB, so source fetching and Blender are not setup steps
for someone trying the application.

## Verification

- Production build and typecheck passed.
- Three asset tests check actual GLB size, triangle and batch budgets, emissive
  materials, embedded textures, local decoders and every source SHA-256.
- Three seating integration tests and three pathfinding tests passed.
- Hosting tests serve the GLB and local WASM decoder, reject private/source
  paths and confirm the developer art-review page is absent from production.
- Browser inspection verified the actual compressed scene, three sampled
  characters with seating/reactions, a 24-character art fixture, and the 390 px
  entrance layout. No browser errors or horizontal mobile overflow were seen.
- The developer-only `http://localhost:5173/dev/room-review.html` explicitly
  labels its participants as simulated and makes no Twitch request. It is an
  art inspection tool, not evidence of real multi-account Twitch authorization.
- Native OBS 33 successfully rendered the new room through the existing
  `VELNEST Live Room` browser source. A local 27.5-second recording was saved
  on D: at `downloads/recordings/2026-10-29 02-49-48.mp4` (H.264,
  1280 × 720, 30 fps, 20,590,177 bytes); full FFmpeg decoding passed.
  OBS reported its previous NVIDIA encoder unavailable at startup; its output
  settings showed the available software x264 encoder. No driver changes were
  made, no broadcast was started, and both audio inputs remained muted.

Physical phone frame rate, a second real Twitch viewer and public deployment
remain unverified. The room still uses the existing 24-avatar admission limit.
This redesign does not complete the actual Twitch broadcast/YouTube submission.
