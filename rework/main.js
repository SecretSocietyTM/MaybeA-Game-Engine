const glm = glMatrix;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Renderer from "./renderer.js";
import Object from "./object.js";
import Camera from "./camera.js";


import vs_src from "../shaders/vertexshader.js";
import fs_src from "../shaders/fragmentshader.js";

// mesh
import { parsePLY } from "../mimp/parse_ply.js";
import apple_ply from "../mimp/models/apple_ply.js";
import cube_ply from "../mimp/models/cube_ply.js";
import cube from "../util/buffer_data/cube.js";


// meshes
const apple_mesh = parsePLY(apple_ply);
const cube_mesh2 = parsePLY(cube_ply);
const cube_mesh = cube;


//
// canvas variables
const WIDTH = 800;
const HEIGHT = 600;
const canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
const rect = canvas.getBoundingClientRect();

//
// state variables?
let cur_x;
let prev_x;
let cur_y;
let prev_y;
let pan_camera = false;
let orbit_camera = false;
const camera = new Camera([0,0,10], [0,0,0], [0,1,0]);


function main() {
    let view = mat4.create();
    let proj = mat4.create();
    mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);


    const renderer = new Renderer(canvas);
    renderer.createProgram(vs_src, fs_src);
    renderer.getShaderVariables();
    renderer.setupRender(WIDTH, HEIGHT, [0.3, 0.3, 0.3, 1.0]/* [0.45, 0.55, 0.5, 1.0] */);


    let objects = [];

    const cube1 = new Object([0,0,0], [1,1,1], [0,1,0], 0);
    cube1.assignMesh(cube_mesh);
    cube1.assignVao(renderer.addObjectVAO(cube_mesh));
    objects.push(cube1);

    const apple1 = new Object([2,0,0], [5,5,5], [0,1,0], 0);
    apple1.assignMesh(apple_mesh);
    apple1.assignVao(renderer.addObjectVAO(apple_mesh));
    objects.push(apple1);

    const cube2 = new Object([0,0,0], [1,1,1], [0,1,0], 0);
    cube2.assignMesh(cube_mesh2);
    cube2.assignVao(renderer.addObjectVAO(cube_mesh2));
    objects.push(cube2);


    function frame() {
        mat4.lookAt(view, camera.pos, vec3.subtract([], camera.pos, camera.dir), camera.up);
        renderer.renderFrame(view, proj, objects);
        requestAnimationFrame(frame);
    }

    frame();
}

main();

canvas.addEventListener("mousedown", (e) => {
    if (e.button === 1 && e.shiftKey) {
        pan_camera = true;
        cur_x = e.clientX - rect.left;
        cur_y = e.clientY - rect.top;
    } else if (e.button === 1) {
        orbit_camera = true;
        cur_x = e.clientX - rect.left;
        cur_y = e.clientY - rect.top;
    }
});

canvas.addEventListener("mouseup", (e) => {
    if (e.button === 1 || e.shiftKey) {
        pan_camera = false;
        orbit_camera = false;
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!pan_camera && !orbit_camera) return;
    prev_x = cur_x;
    prev_y = cur_y;

    cur_x = e.clientX - rect.left;
    cur_y = e.clientY - rect.top;

    let x_sign = 1;
    let y_sign = 1;

    if (prev_x < cur_x) x_sign = 1;
    else if (prev_x > cur_x) x_sign = -1;
    else x_sign = 0;

    if (prev_y < cur_y) y_sign = 1;
    else if (prev_y > cur_y) y_sign = -1;
    else y_sign = 0;
    
    if (pan_camera) camera.pan(1 * x_sign, -1 * y_sign);
    if (orbit_camera) camera.orbit(1 * x_sign, 1 * y_sign);
});

canvas.addEventListener("wheel", (e) => {
    camera.zoom(e.deltaY);
});


