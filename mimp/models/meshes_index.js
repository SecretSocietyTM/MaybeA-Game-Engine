import { parsePLY } from "../parse_ply.js";
import ply_files from "./ply_index.js";
import aabb_wireframe_mesh from "./aabb_wireframe_mesh.js";

export default {
    unit_cube: parsePLY(ply_files.unit_cube),
    apple: parsePLY(ply_files.apple),
    weird_cube: parsePLY(ply_files.weird_cube),
    
    camera: parsePLY(ply_files.camera),
    camera_offcenter: parsePLY(ply_files.camera_offcenter),

    aabb_wireframe: aabb_wireframe_mesh,

    // gizmos
    rotate_gizmo: parsePLY(ply_files.rotate_gizmo),
    scale_gizmo: parsePLY(ply_files.scale_gizmo),


    // new gizmos
    translate_gizmo: parsePLY(ply_files.translate_gizmo2),
    scale_gizmo2: parsePLY(ply_files.scale_gizmo2),
    rotate_gizmo2: parsePLY(ply_files.rotate_gizmo2),

    // new new rotate gizmo
    rotate_gizmo3: parsePLY(ply_files.rotate_gizmo3),
}