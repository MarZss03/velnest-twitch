# 3D production progress

The Blender generator at `art/blender/build_avatars.py` creates three editable modular humanoids, their named attachment points, and four transform animation clips: Idle, Wave, Cheer, Dance. Run it using the installed Blender executable on D:.

Outputs are `art/blender/{riff,arc,muse}.blend` and `apps/web/public/models/{riff,arc,muse}.glb`. Each GLB has four verified animation clips and is approximately 105–112 KB. These are geometric prototypes with joint hierarchies, not yet skinned production character rigs.

`AvatarPreview.tsx` loads the selected GLB with Three.js, supports pointer rotation and animation selection, and disposes GPU resources on character changes. Reduced-motion preferences disable clip playback.

`Room3D.tsx` now renders room participants from the same GLBs in one shared Three.js canvas. Socket state drives positions and animation clips; names are projected into screen space. The room includes a sofa, table, stage, screen, directional shadows, and a responsive camera.

Browser review confirmed the room and character render successfully. Remaining: refine silhouettes against the generated art references, add skinned rigs and walking, improve the authored environment, and verify multiple clients plus OBS with the new renderer.
