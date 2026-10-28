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
        curve=bpy.data.curves.new('Upper headband arc','CURVE')
        curve.dimensions='3D'
        curve.bevel_depth=.018
        curve.bevel_resolution=3
        spline=curve.splines.new('POLY')
        spline.points.add(32)
        for i,point in enumerate(spline.points):
            angle=i/32*math.pi
            point.co=(math.cos(angle)*.245,0,math.sin(angle)*.245,1)
        band=bpy.data.objects.new('Headband',curve)
        bpy.context.collection.objects.link(band)
        band.data.materials.append(material)
        bpy.context.view_layer.objects.active=band
        band.select_set(True)
        bpy.ops.object.convert(target='MESH')
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
