# 3D production progress

The Blender generator at `art/blender/build_avatars.py` creates three editable modular humanoids, their named attachment points, and five transform animation clips: Idle, Walk, Wave, Cheer, Dance. Run it using the installed Blender executable on D:.

Outputs are `art/blender/{riff,arc,muse}.blend` and `apps/web/public/models/{riff,arc,muse}.glb`. Each GLB has five verified animation clips. These are geometric prototypes with joint hierarchies, not yet skinned production character rigs.

`AvatarPreview.tsx` loads the selected GLB with Three.js, supports pointer rotation and animation selection, and disposes GPU resources on character changes. Reduced-motion preferences disable clip playback.

`Room3D.tsx` now renders room participants from the same GLBs in one shared Three.js canvas. Socket state drives positions and animation clips; names are projected into screen space. The room includes a sofa, table, stage, screen, directional shadows, and a responsive camera.

Browser review confirmed the room and character render successfully. Remaining: refine silhouettes against the generated art references, add skinned rigs and walking, improve the authored environment, and verify multiple clients plus OBS with the new renderer.

## Latest verification

- Furniture collision is authoritative in `packages/shared/src/room.ts`, matching the Afterparty sofa and table footprints with avatar clearance. Spawn points are checked and diagonal movement is normalized.
- Click-to-walk raycasts the room floor, sends a bounded destination to the server, and moves at the same cadence as keyboard input. Manual input cancels the destination. This uses straight-line travel with obstacle sliding, not full pathfinding; a blocked route stops.
- Stage elevation is applied to 3D actors. Direct checks passed furniture occupancy rejection, blocked movement, stage height, non-finite input rejection, and a Socket.IO moveTo arrival.

- The authored Afterparty environment is built in Blender by `art/blender/build_room.py`: rounded upholstered sofa, cushions, coffee table, rug, stage, wall display, original VELNEST lettering, and potted plants. Editable source: `afterparty.blend`; web asset: `models/afterparty.glb`; inspected Cycles still: `art/blender/afterparty-preview.png`.
- The web room loads this environment and disposes the blockout geometry on success. A load failure retains the blockout. Type check and production build passed after integration.

- Shared headphones, backpack, and lightstick attach through identical named GLB sockets. The selection is shown in the 3D preview and included in authoritative room state, including reconnect joins.
- GLB node inspection verified Head, slot_back, and slot_hand_R exist on every identity. Socket client verification passed persistence of a valid cosmetic and fallback to Original for an untrusted ID.
- Prop source now lives in `art/blender/build_props.py`, with editable headphones, backpack, and lightstick `.blend` files and exported GLBs under `apps/web/public/models/props/`. The renderer loads these assets into the shared socket frame and retains a geometric fallback on load failure.
- In-room accessory selection broadcasts `changeCosmetic` without resetting position or identity. A socket check verified consecutive live changes from Original to Backpack to Lightstick. Old prop geometry is disposed during replacement.
- Visual clipping review of every prop on every identity remains pending.

- Walk clips exported and inspected in all three GLBs.
- Keyboard movement uses a fixed 70 ms input cadence with normalized diagonals; blur and key-up stop movement. Touch controls repeat while held and stop on release, cancellation, lost capture, or window blur.
- Room actors face their travel direction and select Walk while interpolating toward the authoritative position.
- Three Socket.IO clients verified two identities, movement received by an OBS observer, dance propagation, action expiry back to idle, and disconnect removal.
- Type check and production build passed. Browser control reconnection failed during this round, so visual verification of the new walking behavior is still pending.
