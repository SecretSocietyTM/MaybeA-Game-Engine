import state from "./state.js";
import { initRenderer, renderFrame } from "./renderer.js";
import Entity from "../util/Entity.js";
import graph from "../util/buffer_data/graph.js";
import floor from "../util/buffer_data/floor.js";
import { Cube, cube_vertices, cube_indices } from "../util/cube.js";

// set the height, and width
const WIDTH = 800;
const HEIGHT = 600;

const canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

// equivalent to phoboslab game_load
function main() {
    let vao_buffer = [];

    const gl = initRenderer(canvas);

    // load entity models here? Create vaos?
    const cube_vbo = glUtil.createStaticVertexBuffer(gl, cube_vertices);
    const cube_ebo = glUtil.createStaticIndexBuffer(gl, cube_indices);
    const cube_vao = glUtil.createVertexElementVAO(
        gl, cube_vbo, cube_ebo, pos_attrib, clr_attrib);

    const graph_vbo = glUtil.createStaticVertexBuffer(gl, graph.vertices);
    const graph_vao = glUtil.createVertexVao(
        gl, graph_vbo, pos_attrib, clr_attrib);

    const floor_vbo = glUtil.createStaticVertexBuffer(gl, floor.vertices);
    const floor_ebo = glUtil.createStaticIndexBuffer(gl, floor.indices);
    const floor_vao = glUtil.createVertexElementVAO(
        gl, floor_vbo, floor_ebo, pos_attrib, clr_attrib);

    state.cam_up = [0, 1, 0];
    state.cam_pos = [0, 9, 10];

    state.model_matrix = mat4.create();
    state.view_matrix = mat4.create();
    state.proj_matrix = mat4.perspective(
        proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);

    state.entities = new Entity();
    state.entities.addEntity(new Cube([0, 0, 0], 1, UP_VECTOR, 45, cube_vao));
    state.entities.addEntity(new Cube([2, 0, 0], 1.5, UP_VECTOR, 45, cube_vao));
    state.entities.addEntity(new Cube([3, 0, 3], 1, UP_VECTOR, 45, cube_vao));
    state.entities.createEntitiesAABBVao()

    // need to figure out a way to get separate graph
    // until then I have to pass all vao's like this.
    renderFrame(cube_vao, graph_vao, floor_vao);
}

main();


