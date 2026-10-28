"""Render deterministic pose boards from the editable production Blender assets.

One board per identity: four cosmetics by six authored clips. These are static
review samples, not a replacement for the browser's animation/loading tests.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'art/blender/review'
OUT.mkdir(parents=True,exist_ok=True)
CLIPS=['Idle','Walk','Wave','Cheer','Dance','Sit']
COSMETICS=['none','headphones','backpack','lightstick']

def load_objects(path):
    with bpy.data.libraries.load(str(path),link=False) as (source,target):
        target.objects=source.objects
    for obj in target.objects:bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.update()
    return target.objects

def text(body,location,size,material):
    data=bpy.data.curves.new('Review caption','FONT')
    data.body=body;data.size=size;data.align_x='CENTER'
    obj=bpy.data.objects.new(body,data);bpy.context.collection.objects.link(obj)
    obj.location=location;obj.rotation_euler=(math.pi/2,0,0)
    data.materials.append(material)

report={'source':'editable production .blend assets','samples':[],'scope':'one static sample per combination; backpack row is viewed from behind'}
for identity in ['riff','arc','muse']:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene
    caption=bpy.data.materials.new('Review chalk');caption.diffuse_color=(.88,.84,.94,1)
    title=bpy.data.materials.new('Review lavender');title.diffuse_color=(.60,.43,.84,1)
    for row,cosmetic in enumerate(COSMETICS):
        for column,clip in enumerate(CLIPS):
            original=load_objects(ROOT/'art/blender'/f'{identity}.blend')
            available={track.name for obj in original if obj.type=='ARMATURE' and obj.animation_data for track in obj.animation_data.nla_tracks}
            assert available==set(CLIPS),(identity,available)
            for obj in original:
                if obj.animation_data:
                    obj.animation_data.action=None
                    for track in obj.animation_data.nla_tracks:
                        track.mute=track.name!=clip;track.is_solo=False
            props=[]
            if cosmetic!='none':
                props=load_objects(ROOT/'art/blender'/f'{cosmetic}.blend')
                socket_name='Head' if cosmetic=='headphones' else 'slot_back' if cosmetic=='backpack' else 'slot_hand_R'
                socket=next(obj for obj in original if obj.name.split('.')[0]==socket_name)
                for obj in props:
                    local=obj.matrix_world.copy()
                    obj.parent=socket;obj.matrix_parent_inverse=Matrix.Identity(4);obj.matrix_basis=local
            frame=8 if clip=='Walk' else 16
            scene.frame_set(frame);bpy.context.view_layer.update()
            depsgraph=bpy.context.evaluated_depsgraph_get()
            cell=bpy.data.objects.new(f'{identity}/{cosmetic}/{clip}',None)
            bpy.context.collection.objects.link(cell)
            triangles=0
            for obj in original+props:
                if obj.type!='MESH':continue
                evaluated=obj.evaluated_get(depsgraph)
                mesh=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=depsgraph)
                mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles)
                frozen=bpy.data.objects.new(f'review_{obj.name}',mesh)
                bpy.context.collection.objects.link(frozen)
                frozen.parent=cell;frozen.matrix_basis=evaluated.matrix_world.copy()
            for obj in props+original:bpy.data.objects.remove(obj,do_unlink=True)
            cell.location=((column-2.5)*1.06,0,(3-row)*1.45)
            cell.rotation_euler.z=math.pi-.35 if cosmetic=='backpack' else .28
            name='Original' if cosmetic=='none' else cosmetic.title()
            text(f'{clip} / {name}',(cell.location.x,-.85,cell.location.z-.17),.075,caption)
            report['samples'].append({'identity':identity,'cosmetic':cosmetic,'clip':clip,'frame':frame,'trianglesIncludingProp':triangles})
    text(f'VELNEST / {identity.upper()}',(0,-.85,5.83),.18,title)
    text('PRODUCTION POSE REVIEW  |  6 CLIPS x 4 COSMETICS',(0,-.85,5.60),.068,caption)
    bpy.ops.object.camera_add(location=(0,-20,2.78))
    camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,2.78))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=7.6;scene.camera=camera
    for location,power,size in [((-4,-5,7),1200,8),((5,-2,4),900,7),((0,4,7),1300,8)]:
        bpy.ops.object.light_add(type='AREA',location=location)
        light=bpy.context.object;light.data.energy=power;light.data.size=size
        light.rotation_euler=(Vector((0,0,2.5))-light.location).to_track_quat('-Z','Y').to_euler()
    scene.world.use_nodes=True
    scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.045,.035,.06,1)
    scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.8
    scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
    scene.render.resolution_x=2160;scene.render.resolution_y=1920;scene.render.resolution_percentage=100
    scene.render.film_transparent=False
    scene.render.image_settings.file_format='PNG'
    scene.render.filepath=str(OUT/f'{identity}-pose-board.png')
    bpy.ops.render.render(write_still=True)
    print('REVIEW_BOARD_COMPLETE',identity,flush=True)
(OUT/'pose-board-manifest.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print('REVIEW_MATRIX_COMPLETE',len(report['samples']),flush=True)
