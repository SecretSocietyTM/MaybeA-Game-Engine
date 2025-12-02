import { PlyFile } from "../rework3/mimp/parse_ply.js";
import ply_files from "./ply_index.js";
import aabb_wireframe_mesh from "./aabb_wireframe_mesh.js";

const ply_file = new PlyFile();

export default {
    unit_cube: ply_file.parsePLY(ply_files.unit_cube),
    apple: ply_file.parsePLY(ply_files.apple),
    weird_cube: ply_file.parsePLY(ply_files.weird_cube),
    
    camera: ply_file.parsePLY(ply_files.camera),
    camera_offcenter: ply_file.parsePLY(ply_files.camera_offcenter),

    aabb_wireframe: aabb_wireframe_mesh,

    // gizmos
    rotate_gizmo: ply_file.parsePLY(ply_files.rotate_gizmo),
    scale_gizmo: ply_file.parsePLY(ply_files.scale_gizmo),


    // new gizmos
    translate_gizmo: ply_file.parsePLY(ply_files.translate_gizmo2),
    scale_gizmo2: ply_file.parsePLY(ply_files.scale_gizmo2),
    rotate_gizmo2: ply_file.parsePLY(ply_files.rotate_gizmo2),

    // new new rotate gizmo
    rotate_gizmo3: ply_file.parsePLY(ply_files.rotate_gizmo3),
}