from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "models"


COLORS = {
    "black": (0.02, 0.025, 0.045, 1),
    "dark": (0.035, 0.07, 0.1, 1),
    "steel": (0.09, 0.17, 0.22, 1),
    "bright_steel": (0.52, 0.61, 0.72, 1),
    "ink": (0.012, 0.012, 0.026, 1),
    "blade_cloth": (0.06, 0.035, 0.12, 1),
    "purple": (0.34, 0.17, 0.62, 1),
    "purple_mid": (0.48, 0.25, 0.88, 1),
    "purple_hi": (0.68, 0.46, 1.0, 1),
    "magenta_edge": (0.92, 0.18, 0.82, 1),
    "deep_purple": (0.08, 0.035, 0.16, 1),
    "shadow": (0.025, 0.018, 0.04, 1),
    "cyan": (0.36, 0.9, 1.0, 1),
    "cyan_soft": (0.72, 0.96, 1.0, 1),
    "pink": (1.0, 0.25, 0.64, 1),
    "green": (0.41, 1.0, 0.62, 1),
    "amber": (1.0, 0.82, 0.4, 1),
    "yellow": (1.0, 0.92, 0.22, 1),
    "red": (1.0, 0.36, 0.48, 1),
}


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.context.scene.unit_settings.system = "METRIC"


def loc3(v):
    x, y, z = v
    return (x, -z, y)


def scale3(v):
    x, y, z = v
    return (x, z, y)


def rot3(v):
    x, y, z = v
    return (x, -z, y)


def material(name: str, color, emission=None, strength: float = 0.0, alpha: float | None = None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color if alpha is None else (color[0], color[1], color[2], alpha)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = mat.diffuse_color
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = mat.diffuse_color[3]
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = 0.35
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.42
        if emission and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
        if emission and "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = strength
    if alpha is not None and alpha < 1:
        mat.blend_method = "BLEND"
        mat.use_screen_refraction = True
    return mat


def mats():
    return {
        "black": material("mat_black", COLORS["black"]),
        "dark": material("mat_dark_steel", COLORS["dark"]),
        "steel": material("mat_brushed_steel", COLORS["steel"]),
        "bright_steel": material("mat_bright_steel", COLORS["bright_steel"], (0.18, 0.22, 0.28, 1), 0.2),
        "ink": material("mat_deep_ink", COLORS["ink"], (0.01, 0.0, 0.03, 1), 0.2),
        "blade_cloth": material("mat_blade_cloth", COLORS["blade_cloth"], (0.05, 0.01, 0.1, 1), 0.35),
        "purple": material("mat_byte_shell", COLORS["purple"], (0.08, 0.03, 0.16, 1), 0.35),
        "purple_mid": material("mat_polished_violet", COLORS["purple_mid"], (0.12, 0.04, 0.2, 1), 0.55),
        "purple_hi": material("mat_violet_edge_highlight", COLORS["purple_hi"], (0.18, 0.08, 0.32, 1), 0.45),
        "magenta_edge": material("mat_magenta_edge_light", COLORS["magenta_edge"], COLORS["magenta_edge"], 2.4),
        "deep_purple": material("mat_shadow_purple", COLORS["deep_purple"], (0.04, 0.01, 0.09, 1), 0.25),
        "shadow": material("mat_ink_shadow", COLORS["shadow"], (0.02, 0.0, 0.04, 1), 0.18),
        "cyan": material("mat_cyan_emissive", COLORS["cyan"], COLORS["cyan"], 3.4),
        "cyan_soft": material("mat_cyan_soft", COLORS["cyan_soft"], COLORS["cyan_soft"], 2.4),
        "pink": material("mat_pink_emissive", COLORS["pink"], COLORS["pink"], 3.1),
        "green": material("mat_green_emissive", COLORS["green"], COLORS["green"], 2.8),
        "amber": material("mat_amber_emissive", COLORS["amber"], COLORS["amber"], 3.0),
        "yellow": material("mat_blade_yellow_visor", COLORS["yellow"], COLORS["yellow"], 4.2),
        "red": material("mat_red_emissive", COLORS["red"], COLORS["red"], 3.0),
        "glass_cyan": material("mat_cyan_glass", COLORS["cyan"], COLORS["cyan"], 1.4, 0.22),
        "glass_pink": material("mat_pink_glass", COLORS["pink"], COLORS["pink"], 1.5, 0.24),
    }


def shade(obj) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_smooth()
    except RuntimeError:
        pass
    obj.select_set(False)


def bevel(obj, amount=0.025, segments=2) -> None:
    mod = obj.modifiers.new("softened_edges", "BEVEL")
    mod.width = amount
    mod.segments = segments
    mod.affect = "EDGES"
    normal = obj.modifiers.new("weighted_normals", "WEIGHTED_NORMAL")
    normal.keep_sharp = True


def cube(name, loc, scale, mat, rot=(0, 0, 0), bevel_width=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc3(loc), rotation=rot3(rot))
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale3(scale)
    obj.data.materials.append(mat)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel_width:
        bevel(obj, bevel_width)
    return obj


def cylinder(name, loc, radius, depth, mat, vertices=24, rot=(0, 0, 0), bevel_width=0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc3(loc), rotation=rot3(rot))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    shade(obj)
    if bevel_width:
        bevel(obj, bevel_width)
    return obj


def cone(name, loc, radius1, radius2, depth, mat, vertices=24, rot=(0, 0, 0), bevel_width=0):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=loc3(loc),
        rotation=rot3(rot),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    shade(obj)
    if bevel_width:
        bevel(obj, bevel_width)
    return obj


def sphere(name, loc, radius, mat, scale=(1, 1, 1), segments=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(8, segments // 2), radius=radius, location=loc3(loc))
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale3(scale)
    obj.data.materials.append(mat)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    shade(obj)
    return obj


def torus(name, loc, major, minor, mat, rot=(0, 0, 0), seg=72):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=seg,
        minor_segments=10,
        major_radius=major,
        minor_radius=minor,
        location=loc3(loc),
        rotation=rot3(rot),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    shade(obj)
    return obj


def limb(name, start, end, radius, mat):
    start_v = Vector(loc3(start))
    end_v = Vector(loc3(end))
    mid = (start_v + end_v) * 0.5
    direction = end_v - start_v
    bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=radius, depth=direction.length, location=mid)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    obj.data.materials.append(mat)
    shade(obj)
    bevel(obj, radius * 0.12, 1)
    return obj


def cable(name, points, radius, mat):
    curve = bpy.data.curves.new(name, type="CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = radius
    curve.bevel_resolution = 4
    poly = curve.splines.new("BEZIER")
    poly.bezier_points.add(len(points) - 1)
    for point, coords in zip(poly.bezier_points, points):
        point.co = Vector(loc3(coords))
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def flat_star(name, loc, outer, inner, depth, mat, points=4, rot=0.0):
    verts = []
    front = []
    back = []
    for i in range(points * 2):
        angle = rot + math.tau * i / (points * 2)
        radius = outer if i % 2 == 0 else inner
        # Local X/Z plane maps to game X/Y, local Y provides thickness/depth.
        front.append(len(verts))
        verts.append((math.cos(angle) * radius, -depth * 0.5, math.sin(angle) * radius))
        back.append(len(verts))
        verts.append((math.cos(angle) * radius, depth * 0.5, math.sin(angle) * radius))

    faces = [front, list(reversed(back))]
    for i in range(points * 2):
        j = (i + 1) % (points * 2)
        faces.append([front[i], front[j], back[j], back[i]])

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc3(loc)
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    shade(obj)
    bevel(obj, outer * 0.045, 1)
    return obj


def export(name: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{name}.glb"
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"wrote {path}")


def build_byte() -> None:
    reset_scene()
    m = mats()
    torus("BYTE_Aura", (0, 0.045, 0), 1.43, 0.026, m["glass_cyan"], (math.pi / 2, 0, 0), 96)
    torus("BYTE_Aura_Inner", (0, 0.055, 0), 1.08, 0.012, m["cyan"], (math.pi / 2, 0, 0), 72)
    cylinder("BYTE_PlatformShadow", (0, 0.025, 0), 1.05, 0.024, m["shadow"], vertices=64)

    cube("BYTE_Pelvis", (0.03, 0.74, 0.01), (0.44, 0.17, 0.28), m["purple_mid"], bevel_width=0.045)
    cube("BYTE_Body", (0, 1.28, 0), (0.66, 0.52, 0.34), m["purple_mid"], bevel_width=0.075)
    cube("BYTE_Body_BackShell", (0, 1.28, -0.26), (0.61, 0.48, 0.08), m["purple"], bevel_width=0.04)
    cube("BYTE_Body_TopTrim", (0, 1.64, 0.02), (0.56, 0.055, 0.34), m["purple_hi"], bevel_width=0.018)
    cube("BYTE_Body_BottomTrim", (0, 0.94, 0.02), (0.54, 0.055, 0.32), m["purple_hi"], bevel_width=0.018)
    cube("BYTE_ChestPanel", (0, 1.32, 0.36), (0.48, 0.31, 0.035), m["deep_purple"], bevel_width=0.03)
    cube("BYTE_ChestGlass", (-0.18, 1.3, 0.397), (0.11, 0.23, 0.014), m["glass_cyan"], bevel_width=0.014)
    cube("BYTE_ChestSliderTrack", (-0.18, 1.3, 0.414), (0.032, 0.17, 0.012), m["shadow"], bevel_width=0.006)
    cube("BYTE_ChestSliderGlow", (-0.15, 1.22, 0.428), (0.024, 0.056, 0.012), m["cyan"], bevel_width=0.004)
    for i, color in enumerate(["pink", "cyan", "green"]):
        sphere(f"BYTE_StatusLight_{i}", (0.02 + i * 0.075, 1.08, 0.414), 0.026, m[color], scale=(1, 1, 0.42), segments=16)

    torus("BYTE_ChestGearOuter", (0.24, 1.34, 0.414), 0.18, 0.018, m["cyan_soft"], (math.pi / 2, 0, 0), 44)
    torus("BYTE_ChestGearInner", (0.245, 1.34, 0.422), 0.088, 0.014, m["amber"], (math.pi / 2, 0, 0), 32)
    cylinder("BYTE_ChestGearCore", (0.245, 1.34, 0.43), 0.046, 0.026, m["deep_purple"], vertices=24, rot=(math.pi / 2, 0, 0))
    for i in range(10):
        angle = math.tau * i / 10
        cube(
            f"BYTE_ChestGearTooth_{i}",
            (0.24 + math.cos(angle) * 0.18, 1.34 + math.sin(angle) * 0.18, 0.43),
            (0.018, 0.045, 0.013),
            m["cyan_soft"],
            rot=(0, 0, angle),
            bevel_width=0.003,
        )

    cylinder("BYTE_Neck", (0, 1.78, 0), 0.23, 0.25, m["steel"], vertices=28)
    for i in range(4):
        cylinder(f"BYTE_NeckCable_{i}", (0, 1.68 + i * 0.06, 0.01), 0.19 + i * 0.01, 0.022, m["cyan" if i % 2 else "steel"], vertices=28)

    cube("BYTE_Head", (0, 2.16, 0), (0.70, 0.42, 0.34), m["purple_mid"], bevel_width=0.085)
    cube("BYTE_Head_TopTrim", (0, 2.50, 0.02), (0.56, 0.05, 0.30), m["purple_hi"], bevel_width=0.018)
    cube("BYTE_Head_CornerLeft", (-0.51, 2.02, 0.31), (0.05, 0.11, 0.035), m["purple_hi"], bevel_width=0.012)
    cube("BYTE_Head_CornerRight", (0.51, 2.02, 0.31), (0.05, 0.11, 0.035), m["purple_hi"], bevel_width=0.012)
    cube("BYTE_Face", (0, 2.16, 0.36), (0.50, 0.24, 0.024), m["deep_purple"], bevel_width=0.024)
    sphere("BYTE_EyeLeft", (-0.19, 2.23, 0.393), 0.108, m["cyan"], scale=(1.32, 0.84, 0.24), segments=32)
    sphere("BYTE_EyeRight", (0.19, 2.23, 0.393), 0.108, m["cyan"], scale=(1.32, 0.84, 0.24), segments=32)
    torus("BYTE_EyeLeft_Ring", (-0.19, 2.23, 0.398), 0.13, 0.012, m["bright_steel"], (math.pi / 2, 0, 0), 40)
    torus("BYTE_EyeRight_Ring", (0.19, 2.23, 0.398), 0.13, 0.012, m["bright_steel"], (math.pi / 2, 0, 0), 40)
    for i in range(5):
        cube(f"BYTE_Mouth_{i}", (-0.18 + i * 0.09, 2.02, 0.39), (0.032, 0.026, 0.014), m["cyan_soft"], bevel_width=0.004)

    cylinder("BYTE_EarLeft", (-0.72, 2.14, 0), 0.15, 0.11, m["purple"], vertices=24, rot=(0, math.pi / 2, 0), bevel_width=0.012)
    cylinder("BYTE_EarRight", (0.72, 2.14, 0), 0.15, 0.11, m["purple"], vertices=24, rot=(0, math.pi / 2, 0), bevel_width=0.012)
    limb("BYTE_AntennaLeft_Stem", (-0.42, 2.48, 0), (-0.58, 2.88, 0.02), 0.028, m["bright_steel"])
    limb("BYTE_AntennaRight_Stem", (0.42, 2.48, 0), (0.58, 2.88, 0.02), 0.028, m["bright_steel"])
    sphere("BYTE_AntennaLeft", (-0.58, 2.88, 0.02), 0.09, m["cyan"], segments=24)
    sphere("BYTE_AntennaRight", (0.58, 2.88, 0.02), 0.09, m["cyan"], segments=24)

    for side, sign in (("Left", -1), ("Right", 1)):
        shoulder = (sign * 0.67, 1.55, 0.02)
        elbow = (sign * (1.02 if sign < 0 else 1.04), 1.08 if sign < 0 else 1.96, 0.08)
        wrist = (sign * (1.07 if sign < 0 else 1.22), 0.82 if sign < 0 else 2.18, 0.14)
        sphere(f"BYTE_{side}Shoulder", shoulder, 0.18, m["purple_hi"], scale=(1.1, 0.9, 0.92), segments=24)
        limb(f"BYTE_{side}UpperArm", shoulder, elbow, 0.083, m["purple_mid"])
        limb(f"BYTE_{side}Forearm", elbow, wrist, 0.078, m["purple_mid"])
        sphere(f"BYTE_{side}ElbowJoint", elbow, 0.105, m["cyan"], scale=(1, 1, 0.72), segments=20)
        sphere(f"BYTE_{side}Hand", wrist, 0.14, m["purple_hi"], scale=(1.05, 0.9, 0.8), segments=20)
        for finger in range(3):
            offset = (finger - 1) * 0.055
            limb(f"BYTE_{side}Finger_{finger}", (wrist[0] + sign * 0.08, wrist[1] + offset, wrist[2] + 0.03), (wrist[0] + sign * 0.2, wrist[1] + offset * 1.2, wrist[2] + 0.055), 0.022, m["purple_hi"])
        for band in range(2):
            sphere(f"BYTE_{side}ArmGlowBand_{band}", (elbow[0] * 0.82 + wrist[0] * 0.18, elbow[1] * 0.82 + wrist[1] * 0.18 + band * 0.07, 0.145), 0.047, m["cyan"], scale=(1.35, 0.28, 0.25), segments=16)

    for side, sign in (("Left", -1), ("Right", 1)):
        hip = (sign * 0.31, 0.72, 0)
        knee = (sign * (0.46 if sign < 0 else 0.50), 0.35, 0.08 if sign < 0 else -0.02)
        ankle = (sign * (0.52 if sign < 0 else 0.56), 0.16, 0.1 if sign < 0 else 0.02)
        sphere(f"BYTE_{side}Hip", hip, 0.14, m["purple_hi"], scale=(1.0, 0.8, 0.8), segments=20)
        limb(f"BYTE_{side}Thigh", hip, knee, 0.094, m["purple_mid"])
        limb(f"BYTE_{side}Shin", knee, ankle, 0.092, m["purple_mid"])
        sphere(f"BYTE_{side}Knee", knee, 0.12, m["cyan"], scale=(1.0, 1.0, 0.62), segments=20)
        cube(f"BYTE_{side}Foot", (sign * 0.54, 0.07, 0.15 if sign < 0 else 0.06), (0.25, 0.075, 0.39), m["purple_hi"], bevel_width=0.04)
        cube(f"BYTE_{side}SoleGlow", (sign * 0.54, 0.04, 0.34 if sign < 0 else 0.25), (0.22, 0.014, 0.07), m["cyan"], bevel_width=0.006)
    export("byte_robot")


def build_blade() -> None:
    reset_scene()
    m = mats()
    torus("BLADE_Aura", (0, 0.045, 0), 1.34, 0.026, m["glass_pink"], (math.pi / 2, 0, 0), 96)
    torus("BLADE_Aura_Inner", (0, 0.055, 0), 0.98, 0.012, m["pink"], (math.pi / 2, 0, 0), 72)
    cylinder("BLADE_PlatformShadow", (0, 0.025, 0), 1.0, 0.024, m["shadow"], vertices=64)

    cylinder("BLADE_Body", (0, 1.16, 0), 0.42, 1.2, m["blade_cloth"], vertices=8, rot=(0, 0, math.pi / 8), bevel_width=0.018)
    cube("BLADE_TorsoShadow", (0.03, 1.18, 0.25), (0.39, 0.82, 0.055), m["ink"], bevel_width=0.018)
    cube("BLADE_CoreArmor", (0, 1.37, 0.32), (0.37, 0.62, 0.07), m["purple"], bevel_width=0.02)
    cube("BLADE_ChestWrap_Upper", (-0.04, 1.58, 0.39), (0.56, 0.075, 0.065), m["purple_hi"], rot=(0, 0, -0.36), bevel_width=0.012)
    cube("BLADE_ChestWrap_Lower", (0.02, 1.27, 0.40), (0.55, 0.07, 0.065), m["purple_hi"], rot=(0, 0, 0.34), bevel_width=0.012)
    cube("BLADE_CyanChestTrimLeft", (-0.23, 1.39, 0.44), (0.035, 0.42, 0.018), m["cyan"], rot=(0, 0, -0.25), bevel_width=0.004)
    cube("BLADE_CyanChestTrimRight", (0.21, 1.42, 0.44), (0.035, 0.35, 0.018), m["cyan"], rot=(0, 0, 0.28), bevel_width=0.004)
    cube("BLADE_Sash", (-0.04, 0.99, 0.38), (0.56, 0.075, 0.07), m["magenta_edge"], rot=(0, 0, -0.22), bevel_width=0.012)
    cube("BLADE_Belt", (0.02, 0.83, 0.18), (0.50, 0.07, 0.28), m["purple_mid"], rot=(0, 0, 0.08), bevel_width=0.012)
    sphere("BLADE_BeltNode", (0.29, 0.86, 0.36), 0.06, m["cyan"], scale=(1, 1, 0.45), segments=16)

    sphere("BLADE_Hood", (0, 2.06, 0), 0.46, m["purple"], scale=(1.02, 1.25, 0.9), segments=48)
    sphere("BLADE_HoodBackFlare", (0.02, 2.05, -0.18), 0.42, m["blade_cloth"], scale=(1.08, 1.08, 0.44), segments=32)
    sphere("BLADE_FaceShadow", (0, 2.03, 0.21), 0.32, m["ink"], scale=(1.02, 0.74, 0.48), segments=32)
    cube("BLADE_Mask", (0, 1.99, 0.41), (0.42, 0.18, 0.03), m["ink"], bevel_width=0.014)
    cube("BLADE_VisorBridge", (0, 2.095, 0.462), (0.34, 0.060, 0.022), m["amber"], bevel_width=0.006)
    cube("BLADE_EyeLeft", (-0.155, 2.10, 0.488), (0.17, 0.054, 0.024), m["yellow"], rot=(0, 0, -0.17), bevel_width=0.004)
    cube("BLADE_EyeRight", (0.155, 2.10, 0.488), (0.17, 0.054, 0.024), m["yellow"], rot=(0, 0, 0.17), bevel_width=0.004)
    cube("BLADE_EyeLeft_HotCore", (-0.155, 2.10, 0.516), (0.11, 0.024, 0.012), m["amber"], rot=(0, 0, -0.17), bevel_width=0.003)
    cube("BLADE_EyeRight_HotCore", (0.155, 2.10, 0.516), (0.11, 0.024, 0.012), m["amber"], rot=(0, 0, 0.17), bevel_width=0.003)
    cube("BLADE_HoodBrow", (0, 2.18, 0.432), (0.47, 0.065, 0.024), m["ink"], rot=(0, 0, 0.02), bevel_width=0.006)
    torus("BLADE_HoodCyanRim", (0, 2.06, 0.42), 0.36, 0.012, m["cyan"], (math.pi / 2, 0, 0), 64)
    cube("BLADE_HoodCrest", (0.03, 2.45, -0.04), (0.28, 0.25, 0.09), m["purple_mid"], rot=(0.35, 0, 0), bevel_width=0.02)
    cube("BLADE_NeckWrap", (0, 1.74, 0.07), (0.38, 0.09, 0.26), m["ink"], bevel_width=0.012)

    # The 2D art sells BLADE through a crouched diagonal silhouette, not a neutral stance.
    left_shoulder = (-0.44, 1.56, 0.04)
    left_elbow = (-0.88, 1.05, 0.20)
    left_wrist = (-1.05, 0.58, 0.36)
    right_shoulder = (0.42, 1.58, 0.03)
    right_elbow = (0.98, 1.92, 0.20)
    right_wrist = (1.30, 2.28, 0.43)
    for side, sign, shoulder, elbow, wrist in (
        ("Left", -1, left_shoulder, left_elbow, left_wrist),
        ("Right", 1, right_shoulder, right_elbow, right_wrist),
    ):
        cube(f"BLADE_{side}ShoulderPlate", (shoulder[0] + sign * 0.08, shoulder[1], 0.16), (0.21, 0.095, 0.25), m["purple_mid"], rot=(0, 0, sign * 0.34), bevel_width=0.018)
        limb(f"BLADE_{side}UpperArm", shoulder, elbow, 0.076, m["purple_mid"])
        limb(f"BLADE_{side}LowerArm", elbow, wrist, 0.066, m["blade_cloth"])
        sphere(f"BLADE_{side}ElbowWrap", elbow, 0.092, m["magenta_edge"], scale=(1.0, 0.72, 0.62), segments=18)
        cube(f"BLADE_{side}WristGuard", wrist, (0.15, 0.06, 0.10), m["purple_hi"], rot=(0, 0, sign * 0.24), bevel_width=0.01)
        cube(f"BLADE_{side}ForearmGlow", ((elbow[0] + wrist[0]) * 0.5, (elbow[1] + wrist[1]) * 0.5, wrist[2] + 0.035), (0.025, 0.22, 0.012), m["cyan"], rot=(0, 0, sign * 0.32), bevel_width=0.003)

    for side, sign in (("Left", -1), ("Right", 1)):
        hip = (sign * 0.20, 0.70, 0)
        knee = (sign * (0.70 if sign < 0 else 0.86), 0.32 if sign < 0 else 0.45, 0.18 if sign < 0 else -0.08)
        ankle = (sign * (0.94 if sign < 0 else 1.22), 0.15 if sign < 0 else 0.20, 0.24 if sign < 0 else -0.14)
        limb(f"BLADE_{side}Thigh", hip, knee, 0.087, m["blade_cloth"])
        limb(f"BLADE_{side}Shin", knee, ankle, 0.078, m["blade_cloth"])
        cube(f"BLADE_{side}KneeGuard", knee, (0.16, 0.075, 0.10), m["purple_mid"], rot=(0, 0, -sign * 0.24), bevel_width=0.014)
        cube(f"BLADE_{side}ShinGlow", (knee[0] * 0.55 + ankle[0] * 0.45, knee[1] * 0.55 + ankle[1] * 0.45, ankle[2] + 0.09), (0.035, 0.24, 0.014), m["cyan"], rot=(0, 0, sign * 0.26), bevel_width=0.004)
        cube(f"BLADE_{side}Foot", (sign * (0.98 if sign < 0 else 1.25), 0.09 if sign < 0 else 0.15, 0.26 if sign < 0 else -0.13), (0.36, 0.065, 0.14), m["purple_mid"], rot=(0, 0, sign * 0.20), bevel_width=0.018)

    cube("BLADE_BackScabbard", (-0.34, 1.72, -0.24), (0.09, 0.98, 0.08), m["ink"], rot=(0, 0, 0.68), bevel_width=0.012)
    cube("BLADE_BackSwordGrip", (-0.72, 2.32, -0.20), (0.12, 0.42, 0.09), m["purple_hi"], rot=(0, 0, 0.68), bevel_width=0.016)
    for dot in range(4):
        sphere(f"BLADE_BackGripDot_{dot}", (-0.82 + dot * 0.07, 2.43 - dot * 0.10, -0.13), 0.027, m["cyan"], scale=(1, 1, 0.35), segments=12)

    cube("BLADE_SwordBlade", (0.76, 2.23, 0.54), (0.075, 1.48, 0.024), m["cyan"], rot=(0, 0, -0.78), bevel_width=0.012)
    cube("BLADE_SwordEdge", (0.92, 2.38, 0.57), (0.018, 1.34, 0.012), m["cyan_soft"], rot=(0, 0, -0.78), bevel_width=0.004)
    cube("BLADE_SwordSpine", (0.58, 2.06, 0.515), (0.022, 1.28, 0.014), m["bright_steel"], rot=(0, 0, -0.78), bevel_width=0.004)
    cone("BLADE_SwordTip", (1.44, 2.95, 0.55), 0.075, 0.0, 0.19, m["cyan_soft"], vertices=4, rot=(0, math.pi / 2, -0.78), bevel_width=0.003)
    cube("BLADE_SwordGuard", (1.13, 2.16, 0.46), (0.30, 0.055, 0.044), m["purple_hi"], rot=(0, 0, -0.78), bevel_width=0.01)
    cube("BLADE_SwordHandle", (1.02, 2.02, 0.43), (0.095, 0.34, 0.06), m["ink"], rot=(0, 0, -0.78), bevel_width=0.012)
    cylinder("BLADE_SwordPommel", (0.86, 1.84, 0.39), 0.06, 0.055, m["magenta_edge"], vertices=18, bevel_width=0.004)

    cube("BLADE_Scarf", (-0.48, 1.94, -0.10), (0.54, 0.065, 0.03), m["magenta_edge"], rot=(0, 0.12, -0.34), bevel_width=0.008)
    cube("BLADE_ScarfTail_0", (-0.86, 1.83, -0.20), (0.48, 0.05, 0.024), m["magenta_edge"], rot=(0, 0.2, -0.55), bevel_width=0.007)
    cube("BLADE_ScarfTail_1", (-1.16, 1.60, -0.28), (0.39, 0.041, 0.02), m["magenta_edge"], rot=(0, 0.28, -0.78), bevel_width=0.006)
    flat_star("BLADE_ShadowShuriken", (-1.05, 0.47, 0.44), 0.23, 0.078, 0.035, m["cyan"], points=4, rot=math.pi / 4)
    cylinder("BLADE_ShuriCenter", (-1.05, 0.47, 0.465), 0.045, 0.02, m["ink"], vertices=18, rot=(math.pi / 2, 0, 0), bevel_width=0.002)
    export("blade_ninja")


def build_core() -> None:
    reset_scene()
    m = mats()
    cylinder("Core_Pedestal", (0, 0.21, 0), 1.48, 0.42, m["dark"], vertices=24, bevel_width=0.025)
    cylinder("Core_Column", (0, 1.7, 0), 0.72, 2.95, m["steel"], vertices=24, bevel_width=0.018)
    sphere("Core_InnerGlow", (0, 2.36, 0), 0.42, m["cyan"], segments=32)
    sphere("Core_Glass", (0, 2.0, 0), 1.1, m["glass_cyan"], scale=(1, 1.24, 1), segments=32)
    torus("Core_Ring_0", (0, 2.0, 0), 1.26, 0.032, m["cyan"], (math.pi / 2, 0, 0), 72)
    torus("Core_Ring_1", (0, 1.52, 0), 0.92, 0.026, m["pink"], (math.pi / 2, 0.45, 0), 56)
    torus("Core_Ring_2", (0, 2.45, 0), 0.78, 0.022, m["cyan"], (math.pi / 2, -0.4, 0), 52)
    for i in range(6):
        angle = math.tau * i / 6
        cube(f"Core_CodeShard_{i}", (math.cos(angle) * 0.8, 1.72, math.sin(angle) * 0.8), (0.055, 0.23, 0.02), m["cyan"], rot=(0, 0, -angle), bevel_width=0.004)
    export("nexus_core")


def build_gate() -> None:
    reset_scene()
    m = mats()
    cube("Gate_LeftPylon", (-2.28, 1.68, 0), (0.21, 1.68, 0.21), m["steel"], bevel_width=0.025)
    cube("Gate_RightPylon", (2.28, 1.68, 0), (0.21, 1.68, 0.21), m["steel"], bevel_width=0.025)
    cube("Gate_Top", (0, 3.25, 0), (2.48, 0.21, 0.24), m["dark"], bevel_width=0.025)
    cube("Gate_LeftDoor", (-0.48, 1.42, 0.03), (0.46, 1.18, 0.055), m["pink"], bevel_width=0.018)
    cube("Gate_RightDoor", (0.48, 1.42, 0.03), (0.46, 1.18, 0.055), m["pink"], bevel_width=0.018)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.24, location=loc3((0, 1.58, 0.16)))
    lock = bpy.context.object
    lock.name = "Gate_Lock"
    lock.data.materials.append(m["red"])
    shade(lock)
    for i in range(4):
        cube(f"Gate_ScanLine_{i}", (0, 0.7 + i * 0.5, 0.12), (1.6, 0.018, 0.02), m["pink"], bevel_width=0.002)
    export("nexus_gate")


def build_system_node() -> None:
    reset_scene()
    m = mats()
    cylinder("Node_Base", (0, 0.14, 0), 0.74, 0.28, m["dark"], vertices=10, rot=(0, 0, math.pi / 10), bevel_width=0.012)
    cylinder("Node_Tower", (0, 0.86, 0), 0.42, 1.28, m["steel"], vertices=16, bevel_width=0.012)
    cube("Node_Screen", (0, 1.12, 0.42), (0.42, 0.21, 0.03), m["red"], rot=(-0.08, 0, 0), bevel_width=0.01)
    sphere("Node_Beacon", (0, 1.66, 0), 0.15, m["red"], segments=20)
    torus("Node_RingTop", (0, 1.55, 0), 0.55, 0.025, m["red"], (math.pi / 2, 0, 0), 48)
    torus("Node_RingMid", (0, 0.78, 0), 0.44, 0.018, m["red"], (math.pi / 2, 0, 0), 40)
    for i in range(3):
        cube(f"Node_StatusLight_{i}", (-0.24 + i * 0.24, 1.12, 0.465), (0.05, 0.025, 0.03), m["cyan"], bevel_width=0.004)
    export("system_node")


def build_arena_props() -> None:
    reset_scene()
    m = mats()
    cube("Arena_BaseFloor", (0, -0.08, -0.6), (8.75, 0.07, 7.25), m["dark"], bevel_width=0.0)
    cube("Arena_CommandDeck", (0, 0.018, -2.45), (1.55, 0.014, 1.85), m["steel"], bevel_width=0.012)
    cube("Arena_BYTE_Pad", (-1.12, 0.055, -1.44), (0.70, 0.013, 0.78), m["glass_cyan"], bevel_width=0.008)
    cube("Arena_BLADE_Pad", (1.15, 0.055, -1.38), (0.72, 0.013, 0.78), m["glass_pink"], bevel_width=0.008)
    for i in range(5):
        cube(f"Arena_HorizontalRail_{i}", (0, 0.075, -5.35 + i * 0.95), (5.4, 0.012, 0.012), m["steel"], bevel_width=0.0)
    for i in range(3):
        cube(f"Arena_VerticalRail_{i}", (-3.4 + i * 3.4, 0.078, -3.45), (0.012, 0.012, 3.15), m["steel"], bevel_width=0.0)
    for side in (-1, 1):
        for i in range(4):
            x = side * 7.1
            z = -5.2 + i * 2.15
            cube(f"Arena_Server_{side}_{i}", (x, 1.3, z), (0.36, 1.32, 0.52), m["dark"], rot=(0, -side * 0.18, 0), bevel_width=0.02)
            for slot in range(5):
                cube(f"Arena_ServerLight_{side}_{i}_{slot}", (x - side * 0.39, 0.45 + slot * 0.38, z - 0.17), (0.025, 0.023, 0.31), m["cyan" if slot % 2 == 0 else "pink"], rot=(0, -side * 0.18, 0), bevel_width=0.003)
    cable("Arena_Cable_BYTE", [Vector((-5.2, 0.065, -3.35)), Vector((-2.55, 0.08, -3.0)), Vector((-1.35, 0.07, -2.3))], 0.012, m["glass_cyan"])
    cable("Arena_Cable_BLADE", [Vector((5.2, 0.065, -3.3)), Vector((2.55, 0.08, -3.0)), Vector((1.35, 0.07, -2.3))], 0.012, m["glass_pink"])
    cable("Arena_Cable_Resolve", [Vector((-1.6, 0.065, -3.6)), Vector((0, 0.08, -3.15)), Vector((1.6, 0.065, -3.6))], 0.012, m["glass_cyan"])
    export("arena_props")


def main() -> None:
    build_byte()
    build_blade()
    build_core()
    build_gate()
    build_system_node()
    build_arena_props()


if __name__ == "__main__":
    main()
