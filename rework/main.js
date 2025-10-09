const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Renderer from "./renderer.js";
import Object from "./object.js";
import Camera from "./camera.js";


import vs_src from "../shaders/vertexshader.js";
import fs_src from "../shaders/fragmentshader.js";

import ui_pass_vs_src from "../shaders/ui_pass/vertexshader.js";
import ui_pass_fs_src from "../shaders/ui_pass/fragmentshader.js";

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
// ui elements
// TODO: Object.freeze({}) normally goes here but Object conflicts with Object
// need to change my class Name.
const gizmo_ui = document.getElementById("gizmo_pos");
const pos_ui = document.getElementById("position");
const rot_ui = document.getElementById("rotation");
const scl_ui = document.getElementById("scale");
const OBJECT_INFO_UI = {
    name:  document.getElementById("name"),
    pos: [pos_ui.querySelector(".x"), pos_ui.querySelector(".y"), pos_ui.querySelector(".z")],
    rot: [rot_ui.querySelector(".x"), rot_ui.querySelector(".y"), rot_ui.querySelector(".z")],
    scl: [scl_ui.querySelector(".x"), scl_ui.querySelector(".y"), scl_ui.querySelector(".z")]
};
const SCENE_OBJECT_LIST_UI = document.getElementById("scene_objects_list");
const FILE_INPUT = document.getElementById("file_input");

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
let gizmo_radius = 10;
let gizmo_center = null;
let gizmo_interact = false;

let cur_x;
let prev_x;
let cur_y;
let prev_y;
let pan_camera = false;
let orbit_camera = false;
const camera = new Camera([0,0,10], [0,0,0], [0,1,0]);

let cur_selection = null;
let prev_selection = null;
let current_ray = {
    origin: camera.pos,
    dir: null
}

let objects = [];

let view = mat4.create();
let proj = mat4.create();
mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);

const renderer = new Renderer(canvas);

function main() {
    // programs MUST BE "3D" and "UI"
    renderer.createProgram(vs_src, fs_src);
    renderer.createUIPassProgram(ui_pass_vs_src, ui_pass_fs_src);
    renderer.getShaderVariables();
    renderer.getUIPassShaderVariables();
    renderer.setupRender(WIDTH, HEIGHT, [0.3, 0.3, 0.3, 1.0]/* [0.45, 0.55, 0.5, 1.0] */);


    const cube1 = new Object("cube", [0,0,0], [1,1,1], [0,0,0]);
    cube1.assignMesh(cube_mesh);
    cube1.assignVao(renderer.addObjectVAO(cube_mesh));
    objects.push(cube1);
    cube1.generateAABB();
    cube1.aabb.setAABBColor([0.4, 1.0, 0.2]);
    cube1.aabb.assignVao(renderer.addObjectVAO(cube1.aabb.mesh));


    const apple1 = new Object("apple", [2,0,0], [9,9,9], [0,0,0]);
    apple1.assignMesh(apple_mesh);
    apple1.assignVao(renderer.addObjectVAO(apple_mesh));
    objects.push(apple1);
    apple1.generateAABB();
    apple1.aabb.setAABBColor([0.4, 1.0, 0.2]);
    apple1.aabb.assignVao(renderer.addObjectVAO(apple1.aabb.mesh));

    const cube2 = new Object("weird cube", [0,0,0], [1,1,1], [0,0,0]);
    cube2.assignMesh(cube_mesh2);
    cube2.assignVao(renderer.addObjectVAO(cube_mesh2));
    objects.push(cube2);
    cube2.generateAABB();
    cube2.aabb.setAABBColor([0.4, 1.0, 0.2]); // Nice orange color: [1.0, 0.65, 0.0]
    cube2.aabb.assignVao(renderer.addObjectVAO(cube2.aabb.mesh));

    objects.forEach(object => {
        const list_item = document.createElement("p");
        list_item.textContent = object.name;
        SCENE_OBJECT_LIST_UI.appendChild(list_item);
    });


    function frame() {
        mat4.lookAt(view, camera.pos, vec3.subtract([], camera.pos, camera.dir), camera.up);
        renderer.renderFrame(view, proj, objects, gizmo_center);

        requestAnimationFrame(frame);
    }

    frame();
}

main();

canvas.addEventListener("click", (e) => {
    const mouse_x = e.clientX - rect.left;
    const mouse_y = e.clientY - rect.top;
    current_ray.dir = generateRayDir(mouse_x, mouse_y);

    let selected = null;
    for (let i = 0; i < objects.length; i++) {
        selected = objects[i].aabb.isIntersecting(current_ray);

        if (selected) {

            // update the state
            cur_selection = objects[i];
            gizmo_center = calculateObjectCenterScreenCoord(cur_selection);

            // update the UI
            OBJECT_INFO_UI.name.textContent = cur_selection.name;
            OBJECT_INFO_UI.pos[0].value = Math.round(cur_selection.pos[0] * 100) / 100;
            OBJECT_INFO_UI.pos[1].value = Math.round(cur_selection.pos[1] * 100) / 100;
            OBJECT_INFO_UI.pos[2].value = Math.round(cur_selection.pos[2] * 100) / 100;

            OBJECT_INFO_UI.rot[0].value = cur_selection.rotation_angles[0];
            OBJECT_INFO_UI.rot[1].value = cur_selection.rotation_angles[1];
            OBJECT_INFO_UI.rot[2].value = cur_selection.rotation_angles[2];

            OBJECT_INFO_UI.scl[0].value = cur_selection.scale[0];
            OBJECT_INFO_UI.scl[1].value = cur_selection.scale[1];
            OBJECT_INFO_UI.scl[2].value = cur_selection.scale[2];

            gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                    ${Math.round(gizmo_center[1] * 100) / 100})`;

            break;
        }
    }

    if (!selected) {
        prev_selection = cur_selection;
        cur_selection = null;
        gizmo_center = null;
        gizmo_interact = false;
    }

    if (gizmo_center) {
        gizmo_interact = isIntersectingGizmo(mouse_x, mouse_y);
    }
});

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
    // do x if item is currently selected
    const mouse_x = e.clientX - rect.left;
    const mouse_y = e.clientY - rect.top;
    if (pan_camera || orbit_camera) {
        prev_x = cur_x;
        prev_y = cur_y;

        cur_x = mouse_x;
        cur_y = mouse_y;

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
        current_ray.origin = camera.pos;
    } else if (gizmo_interact) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);
        cur_selection.updatePos(new_pos);
        gizmo_center = calculateObjectCenterScreenCoord(cur_selection);

        // update the ui
        OBJECT_INFO_UI.pos[0].value = Math.round(cur_selection.pos[0] * 100) / 100;
        OBJECT_INFO_UI.pos[1].value = Math.round(cur_selection.pos[1] * 100) / 100;
        OBJECT_INFO_UI.pos[2].value = Math.round(cur_selection.pos[2] * 100) / 100;

        gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                 ${Math.round(gizmo_center[1] * 100) / 100})`;
    }
});

canvas.addEventListener("wheel", (e) => {
    camera.zoom(e.deltaY);
    current_ray.origin = camera.pos;
});


function generateRayDir(x, y) {
    const x_ndc = (2 * x) / WIDTH - 1;
    const y_ndc = 1 - (2 * y) / HEIGHT;

    const ray_clip = [x_ndc, y_ndc, -1.0, 1.0];

    const ray_eye = vec4.transformMat4([], ray_clip, mat4.invert([], proj));
    ray_eye[2] = -1,
    ray_eye[3] = 0;

    let ray_world = vec4.transformMat4([], ray_eye, mat4.invert([], view));
    ray_world = [ray_world[0], ray_world[1], ray_world[2]];
    vec3.normalize(ray_world, ray_world);

    return ray_world;
}

function calculatePlaneIntersectionPoint(dir) {
    let n = camera.dir;
    let p0 = cur_selection.pos;
    let d = -vec3.dot(n, p0);

    let numerator = vec3.dot(camera.pos, n) + d;
    let denominator = vec3.dot(dir, n);
    if (denominator === 0) { // ray missed plane
        console.log("ray missed plane");
        return;
    }
    let t = -(numerator / denominator);
    
    // point on plane given our vector
    let p = vec3.scaleAndAdd([], camera.pos, dir, t);

    return p;
}


function calculateObjectCenterScreenCoord(object) {
    const cntr = vec4.fromValues(object.pos[0], object.pos[1], object.pos[2], 1);
    vec4.transformMat4(cntr, cntr, view); // world space --> view space
    vec4.transformMat4(cntr, cntr, proj); // view space  --> clip space
    vec4.scale(cntr, cntr, 1 / cntr[3]);   // clip space  --> NDC coords
    const cntr_ndc = [cntr[0], cntr[1]];

    const screen_x = (cntr_ndc[0] * 0.5 + 0.5) * WIDTH;
    const screen_y = (cntr_ndc[1] * 0.5 + 0.5) * HEIGHT;
    return [screen_x, screen_y];
}


function isIntersectingGizmo(mouse_x, mouse_y) {
    const mouse_pos = [mouse_x, mouse_y];

    const dist = vec2.length(vec2.subtract([], mouse_pos, gizmo_center));
    console.log("mouse pos", mouse_pos);
    console.log("gizmo pos", gizmo_center);
    console.log("");

    if (dist <= gizmo_radius) {
        return true;
    }
    return false;
}

// HTML interactactions


// input event listeners

// position inputs
OBJECT_INFO_UI.pos[0].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        prev_selection.updatePos([+OBJECT_INFO_UI.pos[0].value, prev_selection.pos[1], prev_selection.pos[2]]);
    }
});

OBJECT_INFO_UI.pos[1].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        prev_selection.updatePos([prev_selection.pos[0], +OBJECT_INFO_UI.pos[1].value, prev_selection.pos[2]]);
    }
});

OBJECT_INFO_UI.pos[2].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        prev_selection.updatePos([prev_selection.pos[0], prev_selection.pos[1], +OBJECT_INFO_UI.pos[2].value]);
    }
});

// rotation inputs
OBJECT_INFO_UI.rot[0].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        prev_selection.updateRot([+OBJECT_INFO_UI.rot[0].value, prev_selection.rotation_angles[1], prev_selection.rotation_angles[2]]);
    }
});

OBJECT_INFO_UI.rot[1].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        prev_selection.updateRot([prev_selection.rotation_angles[0], +OBJECT_INFO_UI.rot[1].value, prev_selection.rotation_angles[2]]);
    }
});

OBJECT_INFO_UI.rot[2].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        prev_selection.updateRot([prev_selection.rotation_angles[0], prev_selection.rotation_angles[1], +OBJECT_INFO_UI.rot[2].value]);
    }
});

// scale inputs
OBJECT_INFO_UI.scl[0].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        prev_selection.updateScale([+OBJECT_INFO_UI.scl[0].value, prev_selection.scale[1], prev_selection.scale[2]]);
    }
});

OBJECT_INFO_UI.scl[1].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        prev_selection.updateScale([prev_selection.scale[0], +OBJECT_INFO_UI.scl[1].value, prev_selection.scale[2]]);
    }
});

OBJECT_INFO_UI.scl[2].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        prev_selection.updateScale([prev_selection.scale[0], prev_selection.scale[1], +OBJECT_INFO_UI.scl[2].value]);
    }
});

// file input
FILE_INPUT.addEventListener("change", (e) => {
    const file = FILE_INPUT.files[0];

    if (!file) {
        alert("No file selected.");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        console.log(reader.result);
        
        // parse the file to get the necessary mesh data
        const mesh_ply = reader.result;
        const mesh = parsePLY(mesh_ply);

        // splice the file name to name the object
        const name = file.name.split(".")[0];

        // create the object with the mesh
        const object = new Object(name, [0,0,0], [1,1,1], [0,0,0]);
        object.assignMesh(mesh);
        object.assignVao(renderer.addObjectVAO(mesh));
        objects.push(object);
        object.generateAABB();
        object.aabb.setAABBColor([0.4, 1.0, 0.2]);
        object.aabb.assignVao(renderer.addObjectVAO(object.aabb.mesh));
        
        const list_item = document.createElement("p");
        list_item.textContent = object.name;
        SCENE_OBJECT_LIST_UI.appendChild(list_item);
    }
    reader.onerror = () => {
        alert("Error reading the file.");
    }
    reader.readAsText(file);
});


// TODO: clean ALL of this up after done with mini project
let copied_object = null;

// keyboard shortcuts
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "c" && prev_selection) {
        copied_object = prev_selection;
    }
    if (e.ctrlKey && e.key === "v" && copied_object) {
        const object = new Object(
            copied_object.name, 
            copied_object.pos, 
            copied_object.scale, 
            copied_object.rotation_angles
        );
        object.assignMesh(copied_object.mesh);
        object.assignVao(copied_object.vao);
        objects.push(object);
        object.generateAABB();
        
        // TODO: add a boolean flag for whether or not the
        // AABB should be drawn. Most objects will NEED an
        // AABB in order to interact with them, but we might not
        // want the AABB to be rendered for some.
        
        // if (object.renderAABB) do the below 
        object.aabb.setAABBColor([0.4, 1.0, 0.2]);
        object.aabb.assignVao(copied_object.aabb.vao);
        
        const list_item = document.createElement("p");
        list_item.textContent = object.name;
        SCENE_OBJECT_LIST_UI.appendChild(list_item);
    }
});