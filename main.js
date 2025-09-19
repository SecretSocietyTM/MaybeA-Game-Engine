const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;


import glUtil from "./util/gl_utils.js";
import Meshes from "./util/meshes.js";
import Object2 from "./util/object.js";
import Entity from "./util/Entity.js";
import Entities from "./util/entities2.js";
import { Cube, cube_vertices, cube_indices } from "./util/cube.js";

// meshes
import graph from "./util/buffer_data/graph.js";
import floor from "./util/buffer_data/floor.js";
import cube from "./util/buffer_data/cube.js";
const floor_mesh = floor;
const cube_mesh = cube;

import vsSrc from "../shaders/vertexshader.js";
import fsSrc from "../shaders/fragmentshader.js";


import apple_ply from "./mimp/models/apple_ply.js";
import cube_ply from "./mimp/models/cube_ply.js";
import { parsePLY } from "./mimp/parse_ply.js";

const WIDTH = 800;
const HEIGHT = 600;

let view_matrix = null;
let proj_matrix = null;
let current_ray = {};

let global_cam_pos = null;
let cur_selected_entity = null;

const entities = new Entity();
const entities2 = new Entities();

function main() {
    const canvas = document.getElementById("canvas");

    //
    // Event Listeners
    document.addEventListener("keydown", (e) => {
        if (e.key === "w") {
            vec3.add(CAM_POS, CAM_POS, [0, 0, -0.25]);
        } else if (e.key === "s") {
            vec3.add(CAM_POS, CAM_POS, [0, 0, 0.25]);
        } else if (e.key === "a") {
            vec3.add(CAM_POS, CAM_POS, [-0.25, 0, 0]);
        } else if (e.key === "d") {
            vec3.add(CAM_POS, CAM_POS, [0.25, 0, 0]);
        }
    })
    canvas.addEventListener("click", (e) => {
        if (cur_selected_entity) {
            cur_selected_entity = null;
            return;
        }
        current_ray.dir = generateRayDir(e);
        cur_selected_entity = entities2.checkRayIntersection(current_ray);
        console.log(cur_selected_entity);
    });
    canvas.addEventListener("mousemove", (e) => {
        if (!cur_selected_entity) return;
        current_ray.dir = generateRayDir(e);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);
        cur_selected_entity.updatePos([new_pos[0], 0, new_pos[2]]);
    });

    //
    // Program Initialization
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


    //
    // Graph Init
    const graph_vbo = glUtil.createStaticVertexBuffer(gl, graph.vertices);
    const graph_vao = glUtil.createVertexVao(
        gl, graph_vbo, pos_attrib, clr_attrib);



    //
    // Test Object class 2
    const apple_mesh = parsePLY(apple_ply);
    const cube_mesh2 = parsePLY(cube_ply);

    const meshes = new Meshes(gl, pos_attrib, clr_attrib);
    meshes.addMesh("cube", cube_mesh);
    meshes.addMesh("floor", floor_mesh);
    meshes.addMesh("apple", apple_mesh);
    meshes.addMesh("cube2", cube_mesh2);

    const cube_entity = new Object2([0,0,0], [1,1,1], [0,1,0], 45, 
        cube_mesh, meshes.getMesh("cube").vao);

    const cube2_entity = new Object2([0,0,0], [1,1,1], [0,1,0], 0,
        cube_mesh2, meshes.getMesh("cube2").vao);

    const floor_entity = new Object2([0,0,0], [1,1,1], [0,1,0], 0,
        floor_mesh, meshes.getMesh("floor").vao);

    const apple_entity = new Object2([2,0,0], [5,5,5], [0,1,0], 0,
        apple_mesh, meshes.getMesh("apple").vao);

    entities2.addEntity(apple_entity);
    entities2.addEntity(cube_entity);
    entities2.addEntity(cube2_entity);
    entities2.addEntity(floor_entity);
    entities2.setupEntitiesAABB(gl, pos_attrib, clr_attrib, [0.4, 1.0, 0.2]);



    //
    // Create matrices
    const UP_VECTOR = [0, 1, 0];
    const CAM_POS = [5, 0.2, 10];
    const CAM_DIR = vec3.subtract([], CAM_POS, [0,0,0]);
    global_cam_pos = CAM_POS;     // global variable
    current_ray.origin = CAM_POS; // global variable
    let model = mat4.create();
    let view = mat4.create();
    let proj = mat4.create();

    mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);
    view_matrix = view; // global variable
    proj_matrix = proj; // global variable

    //
    // Prepare Program
    glUtil.setupRender(gl, canvas, WIDTH, HEIGHT, [0.45, 0.55, 0.5, 1.0]);
    gl.useProgram(program);

    //
    // Setup Uniforms
    gl.uniformMatrix4fv(proj_uniform, gl.FALSE, proj);


    const frame = function (should_loop) {
        mat4.lookAt(view, CAM_POS, vec3.subtract([], CAM_POS, CAM_DIR), UP_VECTOR);
        gl.uniformMatrix4fv(view_uniform, gl.FALSE, view);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(model_uniform, false, model);

        // draw axis
        gl.disable(gl.DEPTH_TEST);
        gl.bindVertexArray(graph_vao);
        gl.drawArrays(gl.LINES, 0, graph.vertices.length / 6 - 10); //10 is num of v's used for y axis
        gl.enable(gl.DEPTH_TEST);
        gl.drawArrays(gl.LINES,  graph.vertices.length / 6 - 10, 10);
        gl.bindVertexArray(null);

        entities2.drawEntities(gl, model_uniform);
        entities2.drawEntitiesAABB(gl, model_uniform);

        if (should_loop) requestAnimationFrame(frame);
    }

    frame(true);
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

    return ray_world;
}

function calculatePlaneIntersectionPoint(dir) {
    // Hard coded values - since we know our plane
    let n = [0, 1, 0];
    let p0 = [0, -0.5, 0]; // aribitrary point ON the plane
    let d = -vec3.dot(n, p0);

    let numerator = vec3.dot(global_cam_pos, n) + d;
    let denominator = vec3.dot(dir, n);
    if (denominator === 0) { // ray missed plane
        console.log("ray missed plane");
        return;
    }
    let t = -(numerator / denominator);
    
    // point on plane given our vector
    let p = vec3.scaleAndAdd([], global_cam_pos, dir, t);

    return p;
}
