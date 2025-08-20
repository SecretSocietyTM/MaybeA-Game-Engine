const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;
import { Cube, cube_vertices, cube_indices } from "./util/cube.js";
import graph from "./util/graph.js";
import floor from "./util/floor.js";
import glUtil from "./util/gl_utils.js";
import vsSrc from "../shaders/vertexshader.js";
import fsSrc from "../shaders/fragmentshader.js";

const WIDTH = 800;
const HEIGHT = 600;

let view_matrix = null;
let proj_matrix = null;
let current_ray = {};

function main() {
    const canvas = document.getElementById("canvas");
    canvas.addEventListener("click", generateRayDir);

    const gl = glUtil.getContext(canvas);
    const program = glUtil.createProgram(gl, vsSrc, fsSrc);

    const pos_attrib = gl.getAttribLocation(program, "a_pos");
    const clr_attrib = gl.getAttribLocation(program, "a_clr");

    const model_uniform = gl.getUniformLocation(program, "u_model");
    const view_uniform = gl.getUniformLocation(program, "u_view");
    const proj_uniform = gl.getUniformLocation(program, "u_proj");

    if (pos_attrib < 0 || clr_attrib < 0 || 
        !model_uniform || !view_uniform || !proj_uniform) {
        glUtil.showError(`Failed to get attribs/uniforms:\n`  +
            `pos=${pos_attrib}\ncolor=${clr_attrib}\n` +
            `u_model=${!!model_uniform}\nu_view=${!!view_uniform}\nu_proj=${!!proj_uniform}`);
        return;
    }

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

    //
    // Create matrices
    const UP_VECTOR = [0, 1, 0];
    const CAM_POS = [4, 4, 4];
    current_ray.origin = CAM_POS;
    let model = mat4.create();
    let view = mat4.create();
    let proj = mat4.create();

    mat4.lookAt(view, CAM_POS, [0, 0, 0], [0, 1, 0]);
    mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);

    view_matrix = view;
    proj_matrix = proj;

    glUtil.setupRender(gl, canvas, WIDTH, HEIGHT, [0.75, 0.85, 0.8, 1.0]);

    gl.useProgram(program);

    gl.uniformMatrix4fv(view_uniform, gl.FALSE, view);
    gl.uniformMatrix4fv(proj_uniform, gl.FALSE, proj);

    //
    // Create entities
    const cubes = [
        new Cube([0, 0, 0], 1, UP_VECTOR, 45, cube_vao),

    ];

    const frame = function (should_loop) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // draw the graph
        gl.uniformMatrix4fv(model_uniform, false, model);

        gl.bindVertexArray(floor_vao);
        gl.drawElements(gl.TRIANGLES, floor.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        gl.bindVertexArray(graph_vao);
        gl.drawArrays(gl.LINES, 0, graph.vertices.length / 6);
        gl.bindVertexArray(null);


        // draw the cubes
        cubes.forEach(cube => {
            if (current_ray.dir) {
                if (cube.isIntersecting(current_ray)) console.log(cube);
                current_ray.dir = null;
            }
            cube.draw(gl, model_uniform);
        });

        if (should_loop) requestAnimationFrame(frame);
    }

    frame(false);
}

main();


function generateRayDir(e) {
    const rect = canvas.getBoundingClientRect();
    const mouse_x = e.clientX - rect.left;
    const mouse_y = e.clientY - rect.top;
    
    const x_ndc = (2 * mouse_x) / WIDTH - 1;
    const y_ndc = 1 - (2 * mouse_y) / HEIGHT;

    const ray_clip = [x_ndc, y_ndc, -1.0, 1.0];

    const ray_eye = vec4.transformMat4([], ray_clip, mat4.invert([], proj_matrix));
    ray_eye[2] = -1,
    ray_eye[3] = 0;

    let ray_world = vec4.transformMat4([], ray_eye, mat4.invert([], view_matrix));
    ray_world = [ray_world[0], ray_world[1], ray_world[2]];
    vec3.normalize(ray_world, ray_world);

    current_ray.dir = ray_world;
}