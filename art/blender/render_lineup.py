"""Render the actual editable character assets together for art review."""
import bpy
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for index,name in enumerate(['riff','arc','muse']):
    with bpy.data.libraries.load(str(ROOT/'art/blender'/f'{name}.blend'),link=False) as (source,target):
        target.objects=source.objects
    for obj in target.objects:
        bpy.context.collection.objects.link(obj)
        obj.animation_data_clear()
        if obj.type=='ARMATURE':
            for pose in obj.pose.bones:pose.matrix_basis.identity()
        if obj.parent is None:obj.location.x+=(index-1)*.9
    bpy.context.view_layer.update()
bpy.ops.mesh.primitive_plane_add(size=200)
bpy.context.object.location.z=.02
mat=bpy.data.materials.new('Review ground')
mat.diffuse_color=(.10,.085,.12,1)
bpy.context.object.data.materials.append(mat)
bpy.ops.object.camera_add(location=(1.7,-5,2))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.56))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=3.3
scene=bpy.context.scene
scene.camera=camera
for location,power,size in [((0,-3,5),500,5),((3,2,3),350,3)]:
    bpy.ops.object.light_add(type='AREA',location=location)
    light=bpy.context.object
    light.data.energy=power
    light.data.size=size
    light.rotation_euler=(Vector((0,0,.4))-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.render.resolution_x=1280
scene.render.resolution_y=720
scene.render.resolution_percentage=100
scene.world.color=(.14,.14,.14)
scene.render.filepath=str(ROOT/'art/blender/characters-preview.png')
bpy.ops.render.render(write_still=True)
# The selector uses the exact same geometry rather than concept-art stand-ins.
camera.location=(0,-5,1.6)
camera.rotation_euler=(Vector((0,0,.56))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale=2.9
scene.render.film_transparent=True
scene.render.resolution_x=1536
scene.render.resolution_y=1024
ground=[obj for obj in scene.objects if obj.type=='MESH' and obj.name.startswith('Plane')]
for obj in ground:obj.hide_render=True
scene.render.filepath=str(ROOT/'apps/web/public/avatars/identity-lineup.png')
bpy.ops.render.render(write_still=True)
