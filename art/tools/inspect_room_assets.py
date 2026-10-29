import bpy
import json
from pathlib import Path
from mathutils import Vector
root = Path(__file__).resolve().parents[2]
report = []
for path in (root/'art/vendor/polyhaven').glob('*/*.gltf'):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(path))
    meshes = [o for o in bpy.context.scene.objects if o.type=='MESH']
    points = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    report.append({'asset':path.parent.name,'objects':len(meshes),
                   'min':[min(v[i] for v in points) for i in range(3)],
                   'max':[max(v[i] for v in points) for i in range(3)],
                   'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)})
(root/'downloads/room-asset-bounds.json').write_text(json.dumps(report,indent=2))
