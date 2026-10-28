"""Rebuild VELNEST's editable, modular 3D avatar library with Blender."""
import bpy
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'apps/web/public/models'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = .72
    return m

skin = material('Skin — warm porcelain', (.76,.52,.36))
cream = material('Clothing — chalk', (.88,.84,.75))
purple = material('Clothing — violet', (.31,.16,.55))
dark = material('Eyes and soles', (.045,.032,.065))
mint = material('Accent — mint', (.31,.74,.57))
hair = material('Hair — plum', (.12,.065,.19))

def joint(name, location, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    return obj

def shape(name, location, scale, mat, parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8)
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.scale = scale
    obj.data.materials.append(mat)
    for p in obj.data.polygons: p.use_smooth = True
    return obj

for identity in ['riff','arc','muse']:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    root = joint('Root', (0,0,0))
    body = joint('Body', (0,0,.53), root)
    shape('Torso', (0,0,0), (.17,.115,.20), purple, body)
    shape('Shirt', (0,-.105,.025), (.10,.025,.135), cream, body)
    head = joint('Head', (0,0,.29), body)
    shape('Face', (0,0,0), (.235,.19,.22), skin, head)
    shape('Hair', (0,.025,.10), (.24,.185,.145), hair if identity=='arc' else purple, head)
    for x in [-.073,.073]:
        shape('Eye', (x,-.181,-.005), (.018,.014,.029), dark, head)
    arms=[]
    legs=[]
    for sign, side in [(-1,'L'),(1,'R')]:
        arm=joint('Arm_'+side,(sign*.16,0,.09),body)
        shape('Sleeve_'+side,(sign*.045,0,-.09),(.075,.083,.13),purple,arm)
        shape('Hand_'+side,(sign*.065,-.006,-.21),(.062,.06,.067),skin,arm)
        joint('slot_hand_'+side,(sign*.065,-.04,-.24),arm)
        arms.append(arm)
        leg=joint('Leg_'+side,(sign*.085,0,.34),root)
        legs.append(leg)
        shape('Trousers_'+side,(0,0,-.085),(.071,.083,.11),cream if identity=='muse' else purple,leg)
        shape('Shoe_'+side,(0,-.035,-.25),(.08,.115,.06),cream,leg)
    if identity=='riff':
        shape('Hair tuft',(.04,0,.235),(.065,.06,.10),purple,head)
    elif identity=='arc':
        shape('Cap crown',(0,0,.17),(.245,.19,.09),cream,head)
        shape('Cap brim',(0,-.19,.14),(.20,.12,.025),purple,head)
    else:
        shape('Bob back',(0,.09,.01),(.25,.14,.23),purple,head)
        shape('Long overshirt',(0,.015,-.12),(.19,.12,.14),purple,body)
    for name, pos, parent in [('slot_head',(0,0,.25),head),('slot_face',(0,-.20,0),head),('slot_back',(0,.13,.04),body),('slot_chest',(0,-.14,.05),body)]: joint(name,pos,parent)
    bpy.context.scene.render.fps=30
    animated = [root,body,*arms,*legs]
    for clip in ['Idle','Walk','Wave','Cheer','Dance']:
        for obj in animated:
            if obj.animation_data:
                obj.animation_data.action = None
            obj.rotation_euler=(0,0,0)
        for frame in range(1,62,5):
            t=(frame-1)/60*math.tau
            root.location.z = max(0,math.sin(t))*.13 if clip=='Cheer' else 0
            body.rotation_euler.y=math.sin(t)*(.16 if clip=='Dance' else .025)
            arms[1].rotation_euler.y=(-1.9+math.sin(t*2)*.3) if clip=='Wave' else (-1.7 if clip=='Cheer' else math.sin(t)*.22)
            arms[0].rotation_euler.y=1.7 if clip=='Cheer' else -math.sin(t)*.22 if clip=='Dance' else 0
            for index, leg in enumerate(legs):
                leg.rotation_euler.x = math.sin(t*2+index*math.pi)*.42 if clip=='Walk' else 0
            if clip=='Walk':
                arms[0].rotation_euler.x=math.sin(t*2)*.28
                arms[1].rotation_euler.x=-math.sin(t*2)*.28
                root.location.z=abs(math.sin(t*2))*.025
            for obj in animated:
                obj.keyframe_insert(data_path='location',frame=frame)
                obj.keyframe_insert(data_path='rotation_euler',frame=frame)
        for obj in animated:
            action=obj.animation_data.action
            action.name=clip+'_'+obj.name
            track=obj.animation_data.nla_tracks.new()
            track.name=clip
            track.strips.new(clip,1,action)
            obj.animation_data.action=None
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/blender'/f'{identity}.blend'))
    bpy.ops.export_scene.gltf(
        filepath=str(OUT/f'{identity}.glb'),export_format='GLB',
        export_animations=True,export_animation_mode='NLA_TRACKS',
        export_force_sampling=True,export_bake_animation=True,
        export_optimize_animation_size=False,
        export_optimize_animation_keep_anim_object=True,
    )
print('VELNEST avatar library exported to', OUT)
