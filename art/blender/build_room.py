"""VELNEST Afterparty: an original editable low-poly community lounge."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'apps/web/public/models'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name,color):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,1)
    m.use_nodes=True
    node=m.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value=(*color,1)
    node.inputs['Roughness'].default_value=.78
    return m

floor=material('Smoked lilac floor',(.19,.15,.22))
wall=material('Warm plum plaster',(.095,.075,.12))
violet=material('Lavender upholstery',(.43,.28,.58))
cream=material('Warm chalk',(.83,.75,.64))
mint=material('Sage ceramic',(.27,.48,.37))
leaf=material('Deep green leaves',(.075,.23,.14))
rug=material('Muted lavender rug',(.30,.23,.38))
screen=material('Screen ink',(.035,.026,.06))

def cube(name,loc,size,mat,bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    obj=bpy.context.object
    obj.name=name
    obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod=obj.modifiers.new('Soft manufactured edges','BEVEL')
        mod.width=bevel
        mod.segments=3
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def sphere(name,loc,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=loc)
    obj=bpy.context.object
    obj.name=name
    obj.scale=scale
    obj.data.materials.append(mat)
    for p in obj.data.polygons:p.use_smooth=True
    return obj

def text(name,value,loc,size,mat):
    bpy.ops.object.text_add(location=loc,rotation=(math.pi/2,0,0))
    obj=bpy.context.object
    obj.name=name
    obj.data.body=value
    obj.data.size=size
    obj.data.extrude=.006
    obj.data.materials.append(mat)
    bpy.ops.object.convert(target='MESH')

cube('Floor',(0,0,-.15),(10,7,.24),floor)
cube('Back wall',(0,3.5,1.1),(10,.16,2.7),wall)
cube('Skirting',(0,3.38,.12),(9.8,.12,.16),cream,.025)
cube('Community rug',(0,-.25,.002),(6.6,3.3,.035),rug,.15)
cube('Sofa plinth',(-2,1.6,.18),(2.8,.95,.23),wall)
cube('Sofa back',(-2,1.96,.69),(2.9,.26,.88),violet,.13)
for x in [-3.35,-.65]:cube('Sofa arm',(x,1.6,.56),(.26,1,.66),violet,.12)
for x in [-2.65,-2,-1.35]:cube('Seat cushion',(x,1.52,.41),(.63,.72,.22),violet,.09)
for x in [-2.8,-1.2]:cube('Loose pillow',(x,1.8,.75),(.38,.14,.36),cream,.09)
cube('Coffee table',(-1.9,.1,.47),(1.6,.8,.12),cream,.12)
for x in [-2.5,-1.3]:cube('Table legs',(x,.1,.22),(.08,.54,.45),floor,.03)
for x in [-2.15,-1.65]:
    sphere('Mug',(x,.12,.57),(.08,.08,.10),mint)
cube('Stage',(2,1.8,.06),(2.7,1.9,.28),rug,.10)
cube('Screen frame',(2,3.35,1.65),(2.65,.12,1.50),violet,.08)
cube('Display',(2,3.26,1.65),(2.48,.035,1.32),screen,.04)
text('Display title','ONE MORE GAME',(1.02,3.23,1.78),.20,cream)
text('Display subtitle','The afterparty is here.',(1.04,3.23,1.44),.12,violet)
text('Wall wordmark','velnest',(-3.28,3.36,1.72),.48,cream)
text('Wall subtitle','YOUR COMMUNITY ROOM',(-3.25,3.35,1.43),.105,violet)
for x in [-4.2,4.2]:
    sphere('Plant pot',(x,2.5,.30),(.26,.26,.34),mint)
    for i in range(5):
        angle=i*math.tau/5
        obj=sphere('Plant leaf',(x+math.cos(angle)*.16,2.5+math.sin(angle)*.16,.82),(.12,.08,.43),leaf)
        obj.rotation_euler=(math.sin(angle)*.4,math.cos(angle)*.4,angle)

# Export only authored scene geometry; web lighting remains adjustable.
bpy.ops.export_scene.gltf(filepath=str(OUT/'afterparty.glb'),export_format='GLB',export_animations=False)
bpy.ops.object.camera_add(location=(8,-12,10))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,.5,.4))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=12.8
bpy.context.scene.camera=camera
for loc,power,size in [((0,-3,8),1700,7),((-5,0,5),1000,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    light=bpy.context.object
    light.data.energy=power
    light.data.shape='DISK'
    light.data.size=size
    light.rotation_euler=(Vector((0,1,0))-light.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.render.resolution_x=1280
scene.render.resolution_y=800
scene.render.resolution_percentage=100
scene.world.color=(.16,.16,.16)
scene.render.filepath=str(ROOT/'art/blender/afterparty-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/blender/afterparty.blend'))
bpy.ops.render.render(write_still=True)
