# 3D production progress

The Blender generator at `art/blender/build_avatars.py` creates three editable modular humanoids, their named attachment points, and five transform animation clips: Idle, Walk, Wave, Cheer, Dance. Run it using the installed Blender executable on D:.

Outputs are `art/blender/{riff,arc,muse}.blend` and `apps/web/public/models/{riff,arc,muse}.glb`. Each GLB has five verified animation clips. These are geometric prototypes with joint hierarchies, not yet skinned production character rigs.

`AvatarPreview.tsx` loads the selected GLB with Three.js, supports pointer rotation and animation selection, and disposes GPU resources on character changes. Reduced-motion preferences disable clip playback.

`Room3D.tsx` now renders room participants from the same GLBs in one shared Three.js canvas. Socket state drives positions and animation clips; names are projected into screen space. The room includes a sofa, table, stage, screen, directional shadows, and a responsive camera.

Browser review confirmed the room and character render successfully. Remaining: refine silhouettes against the generated art references, add skinned rigs and walking, improve the authored environment, and verify multiple clients plus OBS with the new renderer.

## Latest verification

- Shared headphones, backpack, and lightstick attach through identical named GLB sockets. The selection is shown in the 3D preview and included in authoritative room state, including reconnect joins.
- GLB node inspection verified Head, slot_back, and slot_hand_R exist on every identity. Socket client verification passed persistence of a valid cosmetic and fallback to Original for an untrusted ID.
- Cosmetic geometry is currently authored in Three.js socket coordinates; Blender-authored prop meshes and visual clipping review are still pending.

- Walk clips exported and inspected in all three GLBs.
- Keyboard movement uses a fixed 70 ms input cadence with normalized diagonals; blur and key-up stop movement. Touch controls repeat while held and stop on release, cancellation, lost capture, or window blur.
- Room actors face their travel direction and select Walk while interpolating toward the authoritative position.
- Three Socket.IO clients verified two identities, movement received by an OBS observer, dance propagation, action expiry back to idle, and disconnect removal.
- Type check and production build passed. Browser control reconnection failed during this round, so visual verification of the new walking behavior is still pending.
