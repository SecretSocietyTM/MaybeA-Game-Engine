import unit_cube_ply from "./js_ply_files/unit_cube.js";
import apple_ply from "./js_ply_files/apple_ply.js";
import cube_ply from "./js_ply_files/cube_ply.js";
import translate_gizmo_ply from "./js_ply_files/arrow_ply.js";
import rotate_gizmo_ply from "./js_ply_files/half_torus_ply.js";
import scale_gizmo_ply from "./js_ply_files/scale_gizmo_ply.js";
import camera2_ply from "./js_ply_files/camera2_ply.js";
import camera_offcenter_ply from "./js_ply_files/camera_offcenter_ply.js";


import translate_gizmo2_ply from "./js_ply_files/translate_gizmo_ply.js";
import scale_gizmo_improved_ply from "./js_ply_files/scale_gizmo_improved_ply.js";
import rotate_gizmo2_ply from "./js_ply_files/rotate_gizmo_ply.js";

export default {
    unit_cube: unit_cube_ply,
    apple: apple_ply,
    weird_cube: cube_ply,

    translate_gizmo: translate_gizmo_ply,
    rotate_gizmo: rotate_gizmo_ply,
    scale_gizmo: scale_gizmo_ply,

    camera: camera2_ply,
    camera_offcenter: camera_offcenter_ply,


    // new gizmos
    translate_gizmo2: translate_gizmo2_ply,
    scale_gizmo2: scale_gizmo_improved_ply,
    rotate_gizmo2: rotate_gizmo2_ply,
}