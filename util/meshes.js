import glUtil from "./gl_utils.js";

export default class Meshes {
    constructor(gl, attr_pos_loc, attr_clr_loc) {
        this.meshes = {};

        this.gl = gl;
        this.attr_pos_loc = attr_pos_loc;
        this.attr_clr_loc = attr_clr_loc;
    }

    addMesh(mesh_name, mesh) {
        this.meshes[mesh_name] = {};
        this.meshes[mesh_name].mesh = mesh;
        this.meshes[mesh_name].vao = createVao(
            this.gl, 
            this.attr_pos_loc, 
            this.attr_clr_loc, 
            mesh
        );
    }

    getMesh(mesh_name) {
        return this.meshes[mesh_name];
    }
}

function createVao(gl, attr_pos_loc, attr_clr_loc, mesh) {
    const p_vbo = glUtil.createStaticVertexBuffer(gl, mesh.vertices);
    const c_vbo = glUtil.createStaticVertexBuffer(gl, mesh.vertex_colors);
    const ebo = glUtil.createStaticIndexBuffer(gl, mesh.indices);
    const vao = glUtil.createNonInterleavedVao(gl, p_vbo, c_vbo, ebo, attr_pos_loc, attr_clr_loc);

    return vao;
}