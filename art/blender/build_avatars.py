"""Rebuild VELNEST's editable, modular 3D avatar library with Blender."""
import bpy
import math
from mathutils import Vector
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

def garment(name,location,size,mat,parent,radius=.025):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj=bpy.context.object
    obj.name=name
    obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bevel=obj.modifiers.new('Rounded garment seams','BEVEL')
    bevel.width=radius
    bevel.segments=3
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.parent=parent
    obj.location=location
    obj.data.materials.append(mat)
    return obj

for identity in ['riff','arc','muse']:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    root = joint('Root', (0,0,0))
    body = joint('Body', (0,0,.53), root)
    garment('Jacket', (0,0,0), (.33,.21,.32), purple, body,.045)
    garment('Shirt panel', (0,-.112,.025), (.145,.018,.25), cream, body,.012)
    garment('Hem', (0,-.002,-.145), (.33,.22,.035), cream, body,.012)
    head = joint('Head', (0,0,.29), body)
    shape('Face', (0,0,0), (.235,.19,.22), skin, head)
    shape('Hair', (0,.025,.10), (.24,.185,.145), hair if identity=='arc' else purple, head)
    for x in [-.135,0,.135]:
        fringe=shape('Fringe',(x,-.12,.105),(.085,.07,.105),hair if identity=='arc' else purple,head)
        fringe.rotation_euler.y=x*2
    for x in [-.23,.23]:shape('Ear',(x,0,-.01),(.035,.035,.05),skin,head)
    for x in [-.073,.073]:
        shape('Eye', (x,-.181,-.005), (.018,.014,.029), dark, head)
    arms=[]
    legs=[]
    for sign, side in [(-1,'L'),(1,'R')]:
        arm=joint('Arm_'+side,(sign*.16,0,.09),body)
        shape('Sleeve_'+side,(sign*.045,0,-.09),(.075,.083,.13),purple,arm)
        shape('Hand_'+side,(sign*.065,-.006,-.21),(.062,.06,.067),skin,arm)
        garment('Cuff_'+side,(sign*.06,0,-.17),(.12,.13,.045),cream,arm,.018)
        joint('slot_hand_'+side,(sign*.065,-.04,-.24),arm)
        arms.append(arm)
        leg=joint('Leg_'+side,(sign*.085,0,.34),root)
        legs.append(leg)
        garment('Trousers_'+side,(0,0,-.085),(.14,.16,.20),cream if identity=='muse' else purple,leg,.025)
        garment('Shoe_'+side,(0,-.035,-.25),(.15,.21,.095),cream,leg,.03)
        garment('Sole_'+side,(0,-.035,-.29),(.155,.215,.025),purple,leg,.009)
        garment('Shoe strap_'+side,(0,-.065,-.20),(.15,.055,.025),mint,leg,.01)
    if identity=='riff':
        shape('Hair tuft',(.04,0,.235),(.065,.06,.10),purple,head)
    elif identity=='arc':
        shape('Cap crown',(0,0,.17),(.245,.19,.09),cream,head)
        shape('Cap brim',(0,-.19,.14),(.20,.12,.025),purple,head)
    else:
        shape('Bob back',(0,.09,.01),(.25,.14,.23),purple,head)
        for x in [-.20,.20]:shape('Bob side',(x,0,-.015),(.065,.16,.18),purple,head)
        garment('Long overshirt',(0,.015,-.12),(.36,.22,.24),purple,body,.035)
    for name, pos, parent in [('slot_head',(0,0,.25),head),('slot_face',(0,-.20,0),head),('slot_back',(0,.13,.04),body),('slot_chest',(0,-.14,.05),body)]: joint(name,pos,parent)
    bpy.context.scene.render.fps=30
    animated = [root,body,*arms,*legs]
    clips = ['Idle','Walk','Wave','Cheer','Dance','Sit']
    for clip in clips:
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
            if clip=='Sit':
                # The seat cushion top is .52m. The jacket hem rests there while
                # the simple rigid legs extend forward in the shared toy style.
                root.location.z=.15
                body.rotation_euler.y=math.sin(t)*.012
                for leg in legs: leg.rotation_euler.x=-math.pi/2
                for arm in arms:
                    arm.rotation_euler.x=-.55
                    arm.rotation_euler.y=0
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
    # Convert modular rigid pieces to an actual skinned mesh rig. Each piece has
    # one joint weight, keeping the toy silhouette while exporting standard skins.
    controls=[root,body,head,*arms,*legs]
    bpy.context.scene.frame_set(1)
    for control in animated:
        for track in control.animation_data.nla_tracks: track.mute=True
        control.rotation_euler=(0,0,0)
    root.location.z=0
    bpy.context.view_layer.update()
    armature_data=bpy.data.armatures.new('VELNEST shared humanoid skeleton')
    rig=bpy.data.objects.new('VELNEST_Rig',armature_data)
    bpy.context.collection.objects.link(rig)
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    for control in controls:
        bone=armature_data.edit_bones.new('bone_'+control.name)
        bone.head=control.matrix_world.translation
        bone.tail=bone.head+Vector((0,.08,0))
        if control.parent in controls: bone.parent=armature_data.edit_bones['bone_'+control.parent.name]
    bpy.ops.object.mode_set(mode='OBJECT')
    meshes=[obj for obj in bpy.context.scene.objects if obj.type=='MESH']
    for obj in meshes:
        controller=obj.parent
        world=obj.matrix_world.copy()
        obj.parent=rig
        obj.matrix_world=world
        group=obj.vertex_groups.new(name='bone_'+controller.name)
        group.add(list(range(len(obj.data.vertices))),1.0,'REPLACE')
        modifier=obj.modifiers.new('Shared humanoid skin','ARMATURE')
        modifier.object=rig
    for clip in clips:
        for control in animated:
            for track in control.animation_data.nla_tracks:track.mute=track.name!=clip
        rig.animation_data_create()
        rig.animation_data.action=None
        for frame in range(1,62):
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            for control in controls:
                pose=rig.pose.bones['bone_'+control.name]
                pose.rotation_mode='QUATERNION'
                pose.matrix=control.matrix_world
                bpy.context.view_layer.update()
                for channel in ['location','rotation_quaternion','scale']:
                    pose.keyframe_insert(data_path=channel,frame=frame)
        action=rig.animation_data.action
        action.name=clip+'_Skin'
        track=rig.animation_data.nla_tracks.new()
        track.name=clip
        track.strips.new(clip,1,action)
        track.mute=True
        rig.animation_data.action=None
    for control in animated:
        for track in control.animation_data.nla_tracks:track.mute=False
    for track in rig.animation_data.nla_tracks:track.mute=False
    bpy.context.scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/blender'/f'{identity}.blend'))
    bpy.ops.export_scene.gltf(
        filepath=str(OUT/f'{identity}.glb'),export_format='GLB',
        export_animations=True,export_animation_mode='NLA_TRACKS',
        export_force_sampling=True,export_bake_animation=True,
        export_optimize_animation_size=False,
        export_optimize_animation_keep_anim_object=True,
    )
print('VELNEST avatar library exported to', OUT)
