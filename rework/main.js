// TODO: WHY DID THIS HAPPEN:
// index.html:1  WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost
/* 
    Was importing various ply files
    Imported teapot and was scaling it down to fit in my viewport when the screen went blank. 
*/



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
import arrow_ply from "../mimp/models/arrow_ply.js";
import half_torus_ply from "../mimp/models/half_torus_ply.js";
import scale_gizmo_ply from "../mimp/models/scale_gizmo_ply.js";
import cube from "../util/buffer_data/cube.js";


// meshes
const apple_mesh = parsePLY(apple_ply);
const cube_mesh2 = parsePLY(cube_ply);
const arrow_mesh = parsePLY(arrow_ply);
const half_torus_mesh = parsePLY(half_torus_ply);
const scale_gizmo_mesh = parsePLY(scale_gizmo_ply);
const cube_mesh = cube;


//
// ui elements
// TODO: Object.freeze({}) normally goes here but Object conflicts with Object
// need to change my class Name.
const gizmo_ui = document.getElementById("gizmo_pos");
const cur_mode_ui = document.getElementById("cur_mode");
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
let gizmo_exists = false;
let gizmo_interact = false;

let gizmo_interact_x = false;
let gizmo_interact_y = false;
let gizmo_interact_z = false;

let gizmo_interact_x_rotate = false;
let gizmo_interact_y_rotate = false;
let gizmo_interact_z_rotate = false;

let gizmo_interact_x_scale = false;
let gizmo_interact_y_scale = false;
let gizmo_interact_z_scale = false;

let cur_mode = "translate";
cur_mode_ui.textContent = cur_mode;
let gizmo_indices = [0,1,2];

// variables for mouse controlled gizmos
let start_pos;
let cur_selection_prev_pos;
let cur_selection_prev_rot;
let cur_selection_prev_scale;
let cur_rotation_axis;


let cur_x;
let prev_x;
let cur_y;
let prev_y;
let pan_camera = false;
let orbit_camera = false;

// TODO: put the cam back at 0,0,10
const camera = new Camera([5,4,5], [0,0,0], [0,1,0]);
const reference_distance = vec3.distance(camera.pos, [0,0,0]);
const reference_scale = 0.3;


let cur_selection = null;
let current_ray = {
    origin: camera.pos,
    dir: null
}

let objects = [];
let gizmo_objects = [];

let view = mat4.create();
let proj = mat4.create();
mat4.lookAt(view, camera.pos, vec3.subtract([], camera.pos, camera.dir), camera.up);
mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);

const renderer = new Renderer(canvas);

function main() {
    // programs MUST BE "3D" and "UI"
    renderer.createProgram(vs_src, fs_src);
    renderer.createUIPassProgram(ui_pass_vs_src, ui_pass_fs_src);
    renderer.getShaderVariables();
    renderer.getUIPassShaderVariables();
    renderer.setupRender(WIDTH, HEIGHT, [0.3, 0.3, 0.3, 1.0]/* [0.45, 0.55, 0.5, 1.0] */);

    // need a variable to store arrow vao;
    const arrow_VAO = renderer.addObjectVAO(arrow_mesh);
    const half_torus_VAO = renderer.addObjectVAO(half_torus_mesh);
    const scale_gizmo_VAO = renderer.addObjectVAO(scale_gizmo_mesh);

    //
    // gizmo objects
    const dir_arrow_x = new Object("arrow_x", [0,0,0], [reference_scale, reference_scale, reference_scale], [0,0,-90]);
    dir_arrow_x.assignMesh(arrow_mesh);
    dir_arrow_x.assignVao(arrow_VAO);
    gizmo_objects.push(dir_arrow_x);
    dir_arrow_x.generateAABB();
    dir_arrow_x.aabb.setAABBColor([1.0, 0.65, 0.0]);
    dir_arrow_x.aabb.assignVao(renderer.addObjectVAO(dir_arrow_x.aabb.mesh));

    const dir_arrow_y = new Object("arrow_y", [0,0,0], [reference_scale, reference_scale, reference_scale], [0,0,0]);
    dir_arrow_y.assignMesh(arrow_mesh);
    dir_arrow_y.assignVao(arrow_VAO);
    gizmo_objects.push(dir_arrow_y);
    dir_arrow_y.generateAABB();
    dir_arrow_y.aabb.setAABBColor([1.0, 0.65, 0.0]);
    dir_arrow_y.aabb.assignVao(renderer.addObjectVAO(dir_arrow_y.aabb.mesh));

    const dir_arrow_z = new Object("arrow_z", [0,0,0], [reference_scale, reference_scale, reference_scale], [90,0,0]);
    dir_arrow_z.assignMesh(arrow_mesh);
    dir_arrow_z.assignVao(arrow_VAO);
    gizmo_objects.push(dir_arrow_z);
    dir_arrow_z.generateAABB();
    dir_arrow_z.aabb.setAABBColor([1.0, 0.65, 0.0]);
    dir_arrow_z.aabb.assignVao(renderer.addObjectVAO(dir_arrow_z.aabb.mesh));

    const half_torus_x = new Object("half_torus_x", [0,0,0], [0.1, 0.1, 0.1], [90,0,90]);
    half_torus_x.assignMesh(half_torus_mesh);
    half_torus_x.assignVao(half_torus_VAO);
    gizmo_objects.push(half_torus_x);
    half_torus_x.generateAABB();
    half_torus_x.aabb.setAABBColor([0.50, 0.65, 0.8]);
    half_torus_x.aabb.assignVao(renderer.addObjectVAO(half_torus_x.aabb.mesh));

    const half_torus_y = new Object("half_torus_y", [0,0,0], [0.1, 0.1, 0.1], [0,-45,0]);
    half_torus_y.assignMesh(half_torus_mesh);
    half_torus_y.assignVao(half_torus_VAO);
    gizmo_objects.push(half_torus_y);
    half_torus_y.generateAABB();
    half_torus_y.aabb.setAABBColor([0.50, 0.65, 0.8]);
    half_torus_y.aabb.assignVao(renderer.addObjectVAO(half_torus_y.aabb.mesh));

    const half_torus_z = new Object("half_torus_z", [0,0,0], [0.1, 0.1, 0.1], [90,0,0]);
    half_torus_z.assignMesh(half_torus_mesh);
    half_torus_z.assignVao(half_torus_VAO);
    gizmo_objects.push(half_torus_z);
    half_torus_z.generateAABB();
    half_torus_z.aabb.setAABBColor([0.50, 0.65, 0.8]);
    half_torus_z.aabb.assignVao(renderer.addObjectVAO(half_torus_z.aabb.mesh));

    const scale_gizmo_x = new Object("scale_x", [0,0,0], [reference_scale, reference_scale, reference_scale], [0, 90, 0]);
    scale_gizmo_x.assignMesh(scale_gizmo_mesh);
    scale_gizmo_x.assignVao(scale_gizmo_VAO);
    gizmo_objects.push(scale_gizmo_x);
    scale_gizmo_x.generateAABB();
    scale_gizmo_x.aabb.setAABBColor([1.0, 0.5, 0.25]);
    scale_gizmo_x.aabb.assignVao(renderer.addObjectVAO(scale_gizmo_x.aabb.mesh));

    const scale_gizmo_y = new Object("scale_y", [0,0,0], [reference_scale, reference_scale, reference_scale], [-90,0,0]);
    scale_gizmo_y.assignMesh(scale_gizmo_mesh);
    scale_gizmo_y.assignVao(scale_gizmo_VAO);
    gizmo_objects.push(scale_gizmo_y);
    scale_gizmo_y.generateAABB();
    scale_gizmo_y.aabb.setAABBColor([1.0, 0.5, 0.25]);
    scale_gizmo_y.aabb.assignVao(renderer.addObjectVAO(scale_gizmo_y.aabb.mesh));

    const scale_gizmo_z = new Object("scale_z", [0,0,0], [reference_scale, reference_scale, reference_scale], [0,0,0]);
    scale_gizmo_z.assignMesh(scale_gizmo_mesh);
    scale_gizmo_z.assignVao(scale_gizmo_VAO);
    gizmo_objects.push(scale_gizmo_z);
    scale_gizmo_z.generateAABB();
    scale_gizmo_z.aabb.setAABBColor([1.0, 0.5, 0.25]);
    scale_gizmo_z.aabb.assignVao(renderer.addObjectVAO(scale_gizmo_z.aabb.mesh));

    //
    // scene objects
    const cube1 = new Object("cube", [0,0,0], [1,1,1], [0,0,0]);
    cube1.assignMesh(cube_mesh);
    cube1.assignVao(renderer.addObjectVAO(cube_mesh));
    objects.push(cube1);
    cube1.generateAABB();
    cube1.aabb.setAABBColor([0.4, 1.0, 0.2]);
    cube1.aabb.assignVao(renderer.addObjectVAO(cube1.aabb.mesh));


    const apple1 = new Object("apple", [0,0,-5], [9,9,9], [0,0,0]);
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
        renderer.renderFrame(view, proj, objects, gizmo_objects, gizmo_center, gizmo_indices);
        requestAnimationFrame(frame);
    }

    frame();
}


main();

canvas.addEventListener("click", (e) => {
    const mouse_x = e.clientX - rect.left;
    const mouse_y = e.clientY - rect.top;

    if (gizmo_interact || gizmo_interact_x || 
        gizmo_interact_y || gizmo_interact_z ||
        gizmo_interact_x_rotate ||
        gizmo_interact_y_rotate ||
        gizmo_interact_z_rotate || 
        gizmo_interact_x_scale || 
        gizmo_interact_y_scale ||
        gizmo_interact_z_scale) {
        gizmo_interact = false;

        gizmo_interact_x = false;
        gizmo_interact_y = false;
        gizmo_interact_z = false;

        gizmo_interact_x_rotate = false;
        gizmo_interact_y_rotate = false;
        gizmo_interact_z_rotate = false;

        gizmo_interact_x_scale = false;
        gizmo_interact_y_scale = false;
        gizmo_interact_z_scale = false;

        return;
    };

    current_ray.dir = generateRayDir(mouse_x, mouse_y);

    let ray_hit = false;

    for (let i = 0; i < objects.length; i++) {
        if (objects[i].aabb.isIntersecting(current_ray)) {
            ray_hit = true;
            if (cur_selection === objects[i]) return;
            cur_selection = objects[i];

            gizmo_exists = true;
            gizmo_center = calculateObjectCenterScreenCoord(cur_selection);
            gizmo_objects.forEach(object => {
                object.updatePos(cur_selection.pos);
            });

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
            return;
        }
    }

    if (!ray_hit) {
        cur_selection = null;

        gizmo_exists = false;
        gizmo_center = null;
        return;
    }
});

canvas.addEventListener("mousedown", (e) => {
    cur_x = e.clientX - rect.left;
    cur_y = e.clientY - rect.top;

    if (e.button === 0 && gizmo_exists &&
        isIntersectingGizmo(cur_x, cur_y)) {
        gizmo_interact = true;
        return;
    }
    if (e.button === 0 && gizmo_exists) {
        current_ray.dir = generateRayDir(cur_x, cur_y);

        gizmo_objects.forEach(object => {
            if (object.aabb.isIntersecting(current_ray)) {
                current_ray.dir = generateRayDir(cur_x, cur_y);

                if (cur_mode === "translate") {
                    if (object.name === "arrow_x") {
                        gizmo_interact_x = true;
                        start_pos = calculatePlaneIntersectionPoint(current_ray.dir);
                    }
                    else if (object.name === "arrow_y") {
                        gizmo_interact_y = true;
                        start_pos = calculatePlaneIntersectionPoint(current_ray.dir);
                    }
                    else if (object.name === "arrow_z") {
                        gizmo_interact_z = true;
                        start_pos = calculatePlaneIntersectionPoint(current_ray.dir);
                    }
                } else if (cur_mode === "scale") {
                    if (object.name === "scale_x") {
                    gizmo_interact_x_scale = true;
                    start_pos = calculatePlaneIntersectionPoint(current_ray.dir);
                    }
                    else if (object.name === "scale_y") {
                        gizmo_interact_y_scale = true;
                        start_pos = calculatePlaneIntersectionPoint(current_ray.dir);
                    }
                    else if (object.name === "scale_z") {
                        gizmo_interact_z_scale = true;
                        start_pos = calculatePlaneIntersectionPoint(current_ray.dir);
                    }
                } else if (cur_mode === "rotate") {
                    if (object.name === "half_torus_x") {
                    gizmo_interact_x_rotate = true;
                    cur_rotation_axis = [1,0,0];
                    start_pos = calculatePlaneIntersectionPoint2(cur_rotation_axis, cur_selection.pos, current_ray.dir);
                    }
                    else if (object.name === "half_torus_y") {
                        gizmo_interact_y_rotate = true;
                        cur_rotation_axis = [0,1,0];
                        start_pos = calculatePlaneIntersectionPoint2(cur_rotation_axis, cur_selection.pos, current_ray.dir);
                    }
                    else if (object.name === "half_torus_z") {
                        gizmo_interact_z_rotate = true;
                        cur_rotation_axis = [0,0,1];
                        start_pos = calculatePlaneIntersectionPoint2(cur_rotation_axis, cur_selection.pos, current_ray.dir);
                    }
                }

                cur_selection_prev_pos = cur_selection.pos;
                cur_selection_prev_rot = cur_selection.rotation_angles;
                cur_selection_prev_scale = cur_selection.scale;
                return;
            }
        });
    }
    if (e.button === 1 && e.shiftKey) {
        pan_camera = true;
        return;
    } 
    if (e.button === 1) {
        orbit_camera = true;
    }
});

canvas.addEventListener("mouseup", (e) => {
    if (e.button === 1 || e.shiftKey) {
        pan_camera = false;
        orbit_camera = false;
    }
});

canvas.addEventListener("mousemove", (e) => {
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
        mat4.lookAt(view, camera.pos, vec3.subtract([], camera.pos, camera.dir), camera.up);
        gizmo_center = calculateObjectCenterScreenCoord(cur_selection);

        //update ui
        gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                 ${Math.round(gizmo_center[1] * 100) / 100})`;
    } else if (gizmo_interact) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);
        cur_selection.updatePos(new_pos);
        gizmo_center = calculateObjectCenterScreenCoord(cur_selection);
        gizmo_objects.forEach(object => {
                object.updatePos(cur_selection.pos);
            });

        // update the ui
        OBJECT_INFO_UI.pos[0].value = Math.round(cur_selection.pos[0] * 100) / 100;
        OBJECT_INFO_UI.pos[1].value = Math.round(cur_selection.pos[1] * 100) / 100;
        OBJECT_INFO_UI.pos[2].value = Math.round(cur_selection.pos[2] * 100) / 100;

        gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                 ${Math.round(gizmo_center[1] * 100) / 100})`;
    } else if (gizmo_interact_x) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);

        cur_selection.updatePos([
            cur_selection_prev_pos[0] + new_pos[0] - start_pos[0],
            cur_selection.pos[1],
            cur_selection.pos[2]]);
        gizmo_center = calculateObjectCenterScreenCoord(cur_selection);
        gizmo_objects.forEach(object => {
                object.updatePos(cur_selection.pos);
            });

        // update the ui
        OBJECT_INFO_UI.pos[0].value = Math.round(cur_selection.pos[0] * 100) / 100;
        OBJECT_INFO_UI.pos[1].value = Math.round(cur_selection.pos[1] * 100) / 100;
        OBJECT_INFO_UI.pos[2].value = Math.round(cur_selection.pos[2] * 100) / 100;

        gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                 ${Math.round(gizmo_center[1] * 100) / 100})`;
    } else if (gizmo_interact_y) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);

        cur_selection.updatePos([
            cur_selection.pos[0], 
            cur_selection_prev_pos[1] + new_pos[1] - start_pos[1], 
            cur_selection.pos[2]]);
        gizmo_center = calculateObjectCenterScreenCoord(cur_selection);
        gizmo_objects.forEach(object => {
                object.updatePos(cur_selection.pos);
            });

        // update the ui
        OBJECT_INFO_UI.pos[0].value = Math.round(cur_selection.pos[0] * 100) / 100;
        OBJECT_INFO_UI.pos[1].value = Math.round(cur_selection.pos[1] * 100) / 100;
        OBJECT_INFO_UI.pos[2].value = Math.round(cur_selection.pos[2] * 100) / 100;

        gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                 ${Math.round(gizmo_center[1] * 100) / 100})`;

    } else if (gizmo_interact_z) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);

        cur_selection.updatePos([
            cur_selection.pos[0], 
            cur_selection.pos[1],
            cur_selection_prev_pos[2] + new_pos[2] - start_pos[2]]);
        gizmo_center = calculateObjectCenterScreenCoord(cur_selection);
        gizmo_objects.forEach(object => {
                object.updatePos(cur_selection.pos);
            });

        // update the ui
        OBJECT_INFO_UI.pos[0].value = Math.round(cur_selection.pos[0] * 100) / 100;
        OBJECT_INFO_UI.pos[1].value = Math.round(cur_selection.pos[1] * 100) / 100;
        OBJECT_INFO_UI.pos[2].value = Math.round(cur_selection.pos[2] * 100) / 100;

        gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                 ${Math.round(gizmo_center[1] * 100) / 100})`;

    } else if (gizmo_interact_x_scale) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);

        cur_selection.updateScale([
            cur_selection_prev_scale[0] + new_pos[0] - start_pos[0],
            cur_selection.scale[1],
            cur_selection.scale[2]]);

        // update the ui
        OBJECT_INFO_UI.scl[0].value = Math.round(cur_selection.scale[0] * 100) / 100;
        OBJECT_INFO_UI.scl[1].value = Math.round(cur_selection.scale[1] * 100) / 100;
        OBJECT_INFO_UI.scl[2].value = Math.round(cur_selection.scale[2] * 100) / 100;
    } else if (gizmo_interact_y_scale) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);

        cur_selection.updateScale([
            cur_selection.scale[0],
            cur_selection_prev_scale[1] + new_pos[1] - start_pos[1],
            cur_selection.scale[2]]);

        // update the ui
        OBJECT_INFO_UI.scl[0].value = Math.round(cur_selection.scale[0] * 100) / 100;
        OBJECT_INFO_UI.scl[1].value = Math.round(cur_selection.scale[1] * 100) / 100;
        OBJECT_INFO_UI.scl[2].value = Math.round(cur_selection.scale[2] * 100) / 100;
    } else if (gizmo_interact_z_scale) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);

        cur_selection.updateScale([
            cur_selection.scale[0],
            cur_selection.scale[1],
            cur_selection_prev_scale[2] + new_pos[2] - start_pos[2]]);

        // update the ui
        OBJECT_INFO_UI.scl[0].value = Math.round(cur_selection.scale[0] * 100) / 100;
        OBJECT_INFO_UI.scl[1].value = Math.round(cur_selection.scale[1] * 100) / 100;
        OBJECT_INFO_UI.scl[2].value = Math.round(cur_selection.scale[2] * 100) / 100;
    } else if (gizmo_interact_x_rotate) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const cur_pos = calculatePlaneIntersectionPoint2(cur_rotation_axis, cur_selection.pos, current_ray.dir);

        const v = vec3.normalize([], vec3.subtract([], start_pos, cur_selection.pos));
        const w = vec3.normalize([], vec3.subtract([], cur_pos, cur_selection.pos));

        const angle = Math.atan2(vec3.dot(cur_rotation_axis, vec3.cross([], v, w)), vec3.dot(v, w)) * 180 / Math.PI;
        console.log(angle);

        cur_selection.updateRot([
            cur_selection_prev_rot[0] + angle,
            cur_selection.rotation_angles[1],
            cur_selection.rotation_angles[2]]);

        // update the ui
        OBJECT_INFO_UI.rot[0].value = cur_selection.rotation_angles[0];
        OBJECT_INFO_UI.rot[1].value = cur_selection.rotation_angles[1];
        OBJECT_INFO_UI.rot[2].value = cur_selection.rotation_angles[2];
    } else if (gizmo_interact_y_rotate) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const cur_pos = calculatePlaneIntersectionPoint2(cur_rotation_axis, cur_selection.pos, current_ray.dir);

        const v = vec3.normalize([], vec3.subtract([], start_pos, cur_selection.pos));
        const w = vec3.normalize([], vec3.subtract([], cur_pos, cur_selection.pos));

        const angle = Math.atan2(vec3.dot(cur_rotation_axis, vec3.cross([], v, w)), vec3.dot(v, w)) * 180 / Math.PI;
        console.log(angle);

        cur_selection.updateRot([
            cur_selection.rotation_angles[0],
            cur_selection_prev_rot[1] + angle,
            cur_selection.rotation_angles[2]]);

        // update the ui
        OBJECT_INFO_UI.rot[0].value = cur_selection.rotation_angles[0];
        OBJECT_INFO_UI.rot[1].value = cur_selection.rotation_angles[1];
        OBJECT_INFO_UI.rot[2].value = cur_selection.rotation_angles[2];
    } else if (gizmo_interact_z_rotate) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const cur_pos = calculatePlaneIntersectionPoint2(cur_rotation_axis, cur_selection.pos, current_ray.dir);

        const v = vec3.normalize([], vec3.subtract([], start_pos, cur_selection.pos));
        const w = vec3.normalize([], vec3.subtract([], cur_pos, cur_selection.pos));

        const angle = Math.atan2(vec3.dot(cur_rotation_axis, vec3.cross([], v, w)), vec3.dot(v, w)) * 180 / Math.PI;
        console.log(angle);

        cur_selection.updateRot([
            cur_selection.rotation_angles[0],
            cur_selection.rotation_angles[1],
            cur_selection_prev_rot[2] + angle]);

        // update the ui
        OBJECT_INFO_UI.rot[0].value = cur_selection.rotation_angles[0];
        OBJECT_INFO_UI.rot[1].value = cur_selection.rotation_angles[1];
        OBJECT_INFO_UI.rot[2].value = cur_selection.rotation_angles[2];
    }
});

canvas.addEventListener("wheel", (e) => {
    camera.zoom(e.deltaY);
    current_ray.origin = camera.pos;
    mat4.lookAt(view, camera.pos, vec3.subtract([], camera.pos, camera.dir), camera.up);
    gizmo_center = calculateObjectCenterScreenCoord(cur_selection);

    // update arrows scale factor when zooming 
    const distance = vec3.distance(camera.pos, cur_selection.pos);
    const scale = (distance / reference_distance) * reference_scale;
    gizmo_objects.forEach(object => {
        object.updateScale([scale, scale, scale]);
    });
});

function calculateAngleBetweenVectors(v, w) {

    // equation: theta = acos((v dot w / len(v) * len(w)));
    const numerator = vec2.dot(v, w);
    const denominator = vec2.length(v) * vec2.length(w);
    const angle = Math.acos(numerator / denominator) * 180 / Math.PI;

    return angle;
}


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

// equation is t = - (dot(ray_origin, plane_normal) + d) / (dot(ray_dir, plane_normal)) 
function calculatePlaneIntersectionPoint2(plane_normal, plane_p0, dir) {
    let d = -vec3.dot(plane_normal, plane_p0);

    let numerator = vec3.dot(camera.pos, plane_normal) + d;
    let denominator = vec3.dot(dir, plane_normal);
    if (denominator === 0) {
        console.log("ray missed plane with normal = ", plane_normal);
        return;
    }

    let t = -(numerator / denominator);

    let p = vec3.scaleAndAdd([], camera.pos, dir, t);

    return p;
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

// v and b are connected, a is part of w
function calculateLineIntersectionPoint(v, a, b) {
    let numerator = vec2.dot((vec2.subtract([], a, b)), v);
    let denominator = vec2.length(v)**2;
    let t = numerator / denominator;

    /* console.log(numerator);
    console.log(denominator);
    console.log(t); */

    let p = vec2.scaleAndAdd([], b, v, t);
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

function calculateWorldToScreenCoords(coords) {
    const p = vec4.fromValues(coords[0], coords[1], coords[2], 1);
    vec4.transformMat4(p, p, view); // world space --> view space
    vec4.transformMat4(p, p, proj); // view space  --> clip space
    vec4.scale(p, p, 1 / p[3]);   // clip space  --> NDC coords
    const p_ndc = [p[0], p[1]];

    const screen_x = (p_ndc[0] * 0.5 + 0.5) * WIDTH;
    const screen_y = (p_ndc[1] * 0.5 + 0.5) * HEIGHT;
    return [screen_x, screen_y]; 
}

// TODO: remove
/* const coord1 = calculateWorldToScreenCoords([2, 0, 0]);
const coord2 = calculateWorldToScreenCoords([3, 0, 0]);
console.log(coord1);
console.log(coord2);

const axis1_dir = vec2.normalize([], vec2.subtract([], coord2, coord1));
console.log(axis1_dir);
const axis2_dir = [-axis1_dir[1], axis1_dir[0]];
console.log(axis2_dir); */


function isIntersectingGizmo(mouse_x, mouse_y) {
    const mouse_pos = [mouse_x, HEIGHT - mouse_y];

    const dist = vec2.length(vec2.subtract([], mouse_pos, gizmo_center));

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
        cur_selection.updatePos([+OBJECT_INFO_UI.pos[0].value, cur_selection.pos[1], cur_selection.pos[2]]);
    }
});

OBJECT_INFO_UI.pos[1].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        cur_selection.updatePos([cur_selection.pos[0], +OBJECT_INFO_UI.pos[1].value, cur_selection.pos[2]]);
    }
});

OBJECT_INFO_UI.pos[2].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        cur_selection.updatePos([cur_selection.pos[0], cur_selection.pos[1], +OBJECT_INFO_UI.pos[2].value]);
    }
});

// rotation inputs
OBJECT_INFO_UI.rot[0].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        cur_selection.updateRot([+OBJECT_INFO_UI.rot[0].value, cur_selection.rotation_angles[1], cur_selection.rotation_angles[2]]);
    }
});

OBJECT_INFO_UI.rot[1].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        cur_selection.updateRot([cur_selection.rotation_angles[0], +OBJECT_INFO_UI.rot[1].value, cur_selection.rotation_angles[2]]);
    }
});

OBJECT_INFO_UI.rot[2].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        cur_selection.updateRot([cur_selection.rotation_angles[0], cur_selection.rotation_angles[1], +OBJECT_INFO_UI.rot[2].value]);
    }
});

// scale inputs
OBJECT_INFO_UI.scl[0].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        cur_selection.updateScale([+OBJECT_INFO_UI.scl[0].value, cur_selection.scale[1], cur_selection.scale[2]]);
    }
});

OBJECT_INFO_UI.scl[1].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        cur_selection.updateScale([cur_selection.scale[0], +OBJECT_INFO_UI.scl[1].value, cur_selection.scale[2]]);
    }
});

OBJECT_INFO_UI.scl[2].addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        cur_selection.updateScale([cur_selection.scale[0], cur_selection.scale[1], +OBJECT_INFO_UI.scl[2].value]);
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
    if (e.ctrlKey && e.key === "c" && cur_selection) {
        copied_object = cur_selection;
        return;
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
        return;
    }
    if (e.key === "t") {
        cur_mode = "translate";
        gizmo_indices = [0,1,2];
        cur_mode_ui.textContent = cur_mode;
    } else if (e.key === "r") {
        cur_mode = "rotate";
        gizmo_indices = [3,4,5];
        cur_mode_ui.textContent = cur_mode;
    } else if (e.key === "s") {
        cur_mode = "scale";
        gizmo_indices = [6,7,8];
        cur_mode_ui.textContent = cur_mode;
    }
});