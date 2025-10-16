import { parsePLY } from "../parse_ply.js";
import ply_files from "./ply_index.js";
import aabb_wireframe_mesh from "./aabb_wireframe_mesh.js";

export default {
    unit_cube: parsePLY(ply_files.unit_cube),
    apple: parsePLY(ply_files.apple),
    weird_cube: parsePLY(ply_files.weird_cube),
    translate_gizmo: parsePLY(ply_files.translate_gizmo),
    rotate_gizmo: parsePLY(ply_files.rotate_gizmo),
    scale_gizmo: parsePLY(ply_files.scale_gizmo),
    aabb_wireframe: aabb_wireframe_mesh
}