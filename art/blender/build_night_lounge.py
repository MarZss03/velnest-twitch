"""Editable esports lounge: checked CC0 furniture plus original VELNEST set design."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mat(name,c,rough=.5,metal=0,emission=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*c,1)
    p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emission
    return m
ink=mat('Midnight powder coated steel',(.021,.029,.048),.38,.55)
wall=mat('Blue charcoal acoustic felt',(.028,.039,.065),.95)
floor=mat('Graphite terrazzo',(.055,.068,.092),.4,.18)
seam=mat('Anodized edge trim',(.12,.17,.23),.32,.75)
wood=mat('Smoked walnut',(.12,.064,.036),.5)
rubber=mat('Black rubber',(.009,.012,.018),.9)
fabric=mat('Midnight woven textile',(.048,.038,.095),.94)
violet=mat('Neon violet',(.43,.13,1),.27,.15,5)
cyan=mat('Neon glacier',(.035,.8,1),.27,.15,4)
warm=mat('Warm task light',(1,.55,.22),.35,0,3)
screen=mat('Screen navy',(.008,.019,.045),.3,.05,.4)
white=mat('Soft chalk',(.6,.7,.83),.5)

def cube(name,loc,size,m,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(m)
    if bevel:
        b=o.modifiers.new('Manufactured edges','BEVEL');b.width=bevel;b.segments=3
        bpy.ops.object.modifier_apply(modifier=b.name)
    o.select_set(False)
    return o

def tube(name,points,m,r=.018,closed=False):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3
    s=d.splines.new('POLY');s.points.add(len(points)-1)
    for p,v in zip(s.points,points):p.co=(*v,1)
    s.use_cyclic_u=closed
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(m)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o

def ring(name,c,r,m,thickness=.018,vertical=False):
    pts=[]
    for i in range(48):
        a=i*math.tau/48;offset=(math.cos(a)*r,0,math.sin(a)*r) if vertical else (math.cos(a)*r,math.sin(a)*r,0)
        pts.append(tuple(c[j]+offset[j] for j in range(3)))
    return tube(name,pts,m,thickness,True)

font=bpy.data.fonts.load(str(ROOT/'art/motion/velnest-room/assets/fonts/manrope-800.ttf'))
def text(name,body,loc,size,m):
    bpy.ops.object.text_add(location=loc,rotation=(math.pi/2,0,0))
    o=bpy.context.object;o.name=name;o.data.font=font;o.data.body=body;o.data.size=size
    o.data.align_x='CENTER';o.data.extrude=.003;o.data.resolution_u=3
    o.data.bevel_depth=.003 if size>.3 else 0;o.data.bevel_resolution=1
    o.data.materials.append(m);bpy.ops.object.convert(target='MESH');o.select_set(False)

library={}
def asset(key,loc,scale=(1,1,1),rotation=0):
    if key not in library:
        before=set(bpy.context.scene.objects)
        bpy.ops.import_scene.gltf(filepath=str(ROOT/f'art/vendor/polyhaven/{key}/{key}_1k.gltf'))
        imported=set(bpy.context.scene.objects)-before;meshes=[o for o in imported if o.type=='MESH']
        points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
        origin=Vector(((min(v.x for v in points)+max(v.x for v in points))/2,(min(v.y for v in points)+max(v.y for v in points))/2,min(v.z for v in points)))
        for o in meshes:
            transform=o.matrix_world.copy();o.parent=None;o.matrix_world=Matrix.Identity(4)
            for v in o.data.vertices:v.co=transform@v.co-origin
            triangles=sum(len(p.vertices)-2 for p in o.data.polygons)
            if triangles>16000:
                bpy.context.view_layer.objects.active=o
                mod=o.modifiers.new('Web silhouette budget','DECIMATE');mod.ratio=14000/triangles
                bpy.ops.object.modifier_apply(modifier=mod.name)
            for p in o.data.polygons:p.use_smooth=True
        library[key]=meshes
        for o in imported:
            for collection in list(o.users_collection):collection.objects.unlink(o)
    for template in library[key]:
        o=template.copy();o.name='CC0 '+key;bpy.context.collection.objects.link(o)
        o.location=loc;o.scale=scale;o.rotation_euler.z=rotation;o.select_set(False)

# Architecture and recessed perimeter lighting; floor coordinates remain unchanged.
cube('Floating foundation',(0,0,-.2),(10.4,7.4,.28),ink,.12)
cube('Terrazzo floor',(0,0,-.045),(10,7,.12),floor,.05)
for x in [-3.3,-1.65,0,1.65,3.3]:cube('Floor joint',(x,0,.017),(.012,6.88,.005),seam,0)
for y in [-2.3,-.7,.9,2.5]:cube('Floor joint',(0,y,.017),(9.9,.012,.005),seam,0)
cube('Back wall',(0,3.56,1.6),(10.4,.24,3.6),wall,.04)
for x in [-5.08,5.08]:cube('Side return',(x,2.25,1.15),(.2,2.7,2.65),wall,.04)
for x in [-4.7,-.15,4.7]:cube('Structural column',(x,3.35,1.65),(.12,.16,3.15),ink)
for i in range(19):cube('Acoustic timber fin',(-4.45+i*.21,3.35,1.42),(.065,.10,2.55),wood,.01)
cube('Sign backing plate',(-2.6,3.23,2.05),(3.72,.1,1.22),ink,.1)
text('VELNEST neon wordmark','VELNEST',(-2.6,3.15,2.11),.48,violet)
text('Lounge descriptor','AFTER HOURS / ALWAYS TOGETHER',(-2.6,3.14,1.8),.082,white)
tube('Sign cyan underline',[(-4.08,3.13,1.7),(-1.15,3.13,1.7)],cyan,.012)
ring('Nest neon insignia',(-4.35,3.13,2.29),.22,cyan,.018,True)
tube('Nest insignia V',[(-4.48,3.1,2.33),(-4.35,3.1,2.19),(-4.22,3.1,2.33)],violet)
tube('Wall perimeter light',[(-4.9,3.35,.16),(-4.9,3.35,3.15),(4.9,3.35,3.15),(4.9,3.35,.16)],violet)
for x in [-4.93,4.93]:tube('Cyan skirting return',[(x,-2.8,.1),(x,3.35,.1)],cyan,.016)
tube('Front floating underglow',[(-4.85,-3.57,-.15),(4.85,-3.57,-.15)],violet)

# CC0 leather seating and inlaid coffee table, fitted to the existing seat anchors.
cube('Lounge seating base',(-2,1.64,.065),(2.6,1.04,.12),ink,.06)
for x in [-2.65,-2,-1.35]:asset('modern_arm_chair_01',(x,1.6,.1),(.79,.81,.92))
cube('Seating front light',(-2,1.07,.085),(2.45,.025,.02),cyan,.008)
cube('Woven lounge rug',(-2,-.03,.029),(3.55,1.67,.025),fabric,.12)
asset('modern_coffee_table_02',(-1.9,.1,.045),(1.25,.64,1.17))
for x,y in [(-2.35,.09),(-1.55,.22)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.075,depth=.12,location=(x,y,.56))
    bpy.context.object.name='Ceramic coffee cup';bpy.context.object.data.materials.append(white);bpy.context.object.select_set(False)
    ring('Cup rim',(x,y,.623),.064,ink,.008)
cube('Controller on table',(-1.9,.1,.54),(.26,.14,.06),ink,.045)
for x in [-1.97,-1.83]:ring('Controller sticks',(x,.1,.575),.026,cyan,.008)

# Gaming workbench and authored hardware; all obstacles stay beyond walkable bounds.
cube('Gaming riser',(2,1.8,.105),(2.7,1.9,.2),ink,.08)
tube('Riser edge light',[(.7,.86,.15),(3.3,.86,.15),(3.3,2.7,.15)],cyan,.012)
cube('Workbench top',(2.05,2.99,.92),(3.85,.64,.10),wood,.045)
for x in [.35,3.75]:cube('Desk steel leg',(x,2.99,.46),(.085,.48,.88),ink)
cube('Desk cable tray',(2.05,3.2,.73),(3.4,.12,.12),ink)
cube('Ultrawide monitor body',(1.84,3.05,1.55),(2.55,.14,1.08),ink,.065)
cube('Illuminated screen',(1.84,2.966,1.55),(2.43,.016,.96),screen,.035)
cube('Monitor stand',(1.84,3.05,1.03),(.12,.12,.32),seam)
cube('Monitor foot',(1.84,2.99,.98),(.57,.29,.035),ink)
text('Monitor title','ONE MORE GAME',(1.84,2.95,1.67),.155,cyan)
text('Monitor status','THE COMMUNITY IS HERE',(1.84,2.947,1.43),.068,white)
for i in range(15):
    h=.04+((i*7)%11)*.008
    cube('Screen equalizer',(.93+i*.13,2.945,1.23+h/2),(.055,.008,h),violet,.003)
cube('Desk mat',(1.83,2.83,.982),(1.7,.3,.008),rubber,.04)
cube('Mechanical keyboard',(1.6,2.82,1.006),(.62,.2,.035),ink,.018)
for row in range(4):
    for col in range(13):cube('RGB key',(1.323+col*.046,2.75+row*.045,1.029),(.035,.032,.014),white if row else cyan,.004)
cube('Gaming mouse',(2.38,2.82,1.015),(.1,.15,.055),ink,.035)
cube('PC chassis',(3.58,3,1.31),(.48,.48,.69),ink,.045)
cube('PC glass panel',(3.58,2.748,1.31),(.415,.012,.6),screen,.02)
for z in [1.14,1.46]:
    ring('RGB PC fan',(3.58,2.732,z),.125,cyan,.016,True)
    ring('PC fan hub',(3.58,2.722,z),.035,violet,.012,True)
for x in [.38,3.03]:
    cube('Monitor speaker',(x,2.99,1.16),(.22,.24,.38),ink)
    for z in [1.08,1.23]:ring('Speaker driver',(x,2.859,z),.065,seam,.008,True)
asset('desk_lamp_arm_01',(.05,3.02,.98),(.58,.58,.58),-.6)
cube('Task light wash',(.14,2.82,1.43),(.15,.11,.018),warm,.012)
for x in [-4.24,4.35]:
    cube('Plant pedestal',(x,2.48,.28),(.66,.68,.53),ink,.045)
    asset('potted_plant_02',(x,2.48,.55),(1.48,1.48,1.48))
    tube('Pedestal reveal',[(x-.3,2.13,.16),(x+.3,2.13,.16)],violet,.012)
for x in [-4.55,4.55]:
    cube('Corner lamp base',(x,3.02,.06),(.34,.34,.08),ink)
    tube('Corner tube lamp',[(x,3.02,.12),(x,3.02,2.95)],cyan,.025)
for x in [.65,1.45,2.25,3.05,3.85]:
    cube('Upper acoustic panel',(x,3.37,2.72),(.69,.1,.66),ink,.055)
    tube('Panel light slash',[(x-.18,3.3,2.52),(x+.18,3.3,2.92)],cyan if x<2 else violet,.012)
for y in [-1.9,-1.78,-1.66]:cube('Walkway marker',(.28,y,.024),(.29,.025,.006),cyan,.006)

# Save component-level editability, then batch the export by material for the web.
scene=bpy.context.scene;scene.world.color=(.012,.018,.035)
bpy.ops.object.camera_add(location=(7,-12,8.3));camera=bpy.context.object
camera.rotation_euler=(Vector((0,.65,1))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=13.6;scene.camera=camera
for loc,color,power,size,target in [((0,-3,6),(.65,.75,1),700,7,(0,0,0)),((-3,2.6,3),(.45,.12,1),250,3,(-2,1,0)),((3,2.5,3),(.04,.7,1),200,3,(2,1,0))]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object
    o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1600;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.filepath=str(ROOT/'art/blender/afterparty-preview.png')
for image in bpy.data.images:
    if image.size[0]>512 or image.size[1]>512:
        ratio=512/max(image.size);image.scale(round(image.size[0]*ratio),round(image.size[1]*ratio))
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/blender/afterparty.blend'))
meshes=[o for o in scene.objects if o.type=='MESH']
for o in scene.objects:o.select_set(o in meshes)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();batch=bpy.context.object
batch.name='VELNEST night lounge / CC0 furniture and original set'
out=ROOT/'apps/web/public/models/afterparty.glb'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_animations=False,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
report={'theme':'esports night lounge','source_assets':list(library),'triangles':sum(len(p.vertices)-2 for p in batch.data.polygons),'materials':len(batch.data.materials),'bytes':out.stat().st_size,'seat_centers_blender':[[-2.65,1.52],[-2,1.52],[-1.35,1.52]],'source':'art/vendor/polyhaven/*/source.json'}
(ROOT/'art/blender/night-lounge-manifest.json').write_text(json.dumps(report,indent=2))
bpy.ops.render.render(write_still=True)
