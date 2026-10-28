"""Build editable prop source and GLB files in the common socket frame."""
import bpy
import math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'apps/web/public/models/props'
OUT.mkdir(parents=True,exist_ok=True)
for name in ['headphones','backpack','lightstick']:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    material=bpy.data.materials.new('Mint silicone')
    material.diffuse_color=(.35,.78,.62,1)
    def sphere(label,location,scale):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=location)
        obj=bpy.context.object
        obj.name=label
        obj.scale=scale
        obj.data.materials.append(material)
        for p in obj.data.polygons:p.use_smooth=True
    if name=='headphones':
        bpy.ops.mesh.primitive_torus_add(major_radius=.245,minor_radius=.018,major_segments=32,minor_segments=8,rotation=(math.pi/2,0,0))
        bpy.context.object.data.materials.append(material)
        for x in [-.245,.245]:sphere('Ear shell',(x,0,0),(.035,.065,.075))
    elif name=='backpack':
        sphere('Soft pack',(0,.055,-.03),(.12,.075,.15))
        sphere('Pocket',(0,.12,-.07),(.09,.025,.06))
    else:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.022,depth=.30,location=(0,0,.12))
        bpy.context.object.data.materials.append(material)
        sphere('Tip',(0,0,.28),(.04,.04,.04))
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/blender'/f'{name}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{name}.glb'),export_format='GLB',export_animations=False)
