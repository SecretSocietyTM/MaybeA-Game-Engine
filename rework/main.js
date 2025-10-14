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

import Renderer from "../util/Renderer.js";
import SceneObject from "../util/SceneObject.js";
import Camera from "../util/Camera.js";
import TransformGizmos from "../util/TransformGizmos.js";


import vs_src from "../shaders/3d_pass/vertexshader.js";
import fs_src from "../shaders/3d_pass/fragmentshader.js";

import ui_pass_vs_src from "../shaders/ui_pass/vertexshader.js";
import ui_pass_fs_src from "../shaders/ui_pass/fragmentshader.js";

// mesh
import { parsePLY } from "../mimp/parse_ply.js";
import unit_cube_ply from "../mimp/models/js_ply_files/unit_cube.js";
import apple_ply from "../mimp/models/js_ply_files/apple_ply.js";
import cube_ply from "../mimp/models/js_ply_files/cube_ply.js";
import arrow_ply from "../mimp/models/js_ply_files/arrow_ply.js";
import half_torus_ply from "../mimp/models/js_ply_files/half_torus_ply.js";
import scale_gizmo_ply from "../mimp/models/js_ply_files/scale_gizmo_ply.js";

import aabb_wireframe_mesh from "../util/aabb_wireframe_mesh.js";


// meshes
const unit_cube_mesh = parsePLY(unit_cube_ply);
const apple_mesh = parsePLY(apple_ply);
const cube_mesh = parsePLY(cube_ply);
const arrow_mesh = parsePLY(arrow_ply);
const half_torus_mesh = parsePLY(half_torus_ply);
const scale_gizmo_mesh = parsePLY(scale_gizmo_ply);


//
// ui elements
const gizmo_ui = document.getElementById("gizmo_pos");
const cur_mode_ui = document.getElementById("cur_mode");
const pos_ui = document.getElementById("position");
const rot_ui = document.getElementById("rotation");
const scl_ui = document.getElementById("scale");
const OBJECT_INFO_UI = Object.freeze({
    name:  document.getElementById("name"),
    pos: [pos_ui.querySelector(".x"), pos_ui.querySelector(".y"), pos_ui.querySelector(".z")],
    rot: [rot_ui.querySelector(".x"), rot_ui.querySelector(".y"), rot_ui.querySelector(".z")],
    scl: [scl_ui.querySelector(".x"), scl_ui.querySelector(".y"), scl_ui.querySelector(".z")]
});
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

// variables for mouse controlled gizmos
let start_pos;

let cur_selection = null;
let copied_object = null;

// variables for mouse controlled camera movement
let cur_x;
let prev_x;
let cur_y;
let prev_y;
let pan_camera = false;
let orbit_camera = false;


const camera = new Camera([0, 0, 10], [0,0,0], [0,1,0]);
const reference_distance = vec3.distance(camera.pos, [0,0,0]);
const reference_scale = 0.3;

let current_ray = {
    origin: camera.pos,
    dir: null
}

let objects = [];

let view = mat4.create();
let proj = mat4.create();
mat4.lookAt(view, camera.pos, vec3.subtract([], camera.pos, camera.dir), camera.up);
mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);

const renderer = new Renderer(canvas);
renderer.createProgram(vs_src, fs_src);
renderer.createUIPassProgram(ui_pass_vs_src, ui_pass_fs_src);
renderer.getShaderVariables();
renderer.getUIPassShaderVariables();
renderer.setupRender(WIDTH, HEIGHT, [0.3, 0.3, 0.3, 1.0]/* [0.45, 0.55, 0.5, 1.0] */);

// reusable VAOs
// need a variable to model mesh VAOs and aabb mesh VAO
const axis_translate_VAO = renderer.addObjectVAO(arrow_mesh);
const axis_rotate_VAO = renderer.addObjectVAO(half_torus_mesh);
const axis_scale_VAO = renderer.addObjectVAO(scale_gizmo_mesh);
const aabb_wireframe_VAO = renderer.addObjectVAO(aabb_wireframe_mesh);

const gizmo_meshes = {
    translate_mesh: arrow_mesh,
    rotate_mesh: half_torus_mesh,
    scale_mesh: scale_gizmo_mesh
}
const gizmo_vaos = {
    translate_vao: axis_translate_VAO,
    rotate_vao: axis_rotate_VAO,
    scale_vao: axis_scale_VAO,
    aabb_wireframe: aabb_wireframe_VAO
}

const transform_gizmos = new TransformGizmos();
transform_gizmos.setReferenceScale(reference_scale);
transform_gizmos.initGizmoObjects(gizmo_meshes, gizmo_vaos);
transform_gizmos.setMode();
cur_mode_ui.textContent = transform_gizmos.mode;

function main() {

    //
    // scene objects

    const unit_cube = new SceneObject("unit_cube", [0,0,0], [1,1,1], [0,0,0], 
        unit_cube_mesh, renderer.addObjectVAO(unit_cube_mesh), aabb_wireframe_VAO);
    objects.push(unit_cube);

    const apple = new SceneObject("apple", [0,0,-5], [9,9,9], [0,0,0], 
        apple_mesh, renderer.addObjectVAO(apple_mesh), aabb_wireframe_VAO);

    console.log(apple);

    const weird_cube = new SceneObject("weird cube", [0,0,0], [1,1,1], [0,0,0],
        cube_mesh, renderer.addObjectVAO(cube_mesh), aabb_wireframe_VAO);

    objects.push(unit_cube, apple, weird_cube);

    objects.forEach(object => {
        const list_item = document.createElement("p");
        list_item.textContent = object.name;
        SCENE_OBJECT_LIST_UI.appendChild(list_item);
    });

    function frame() {
        renderer.renderFrame(view, proj, objects, transform_gizmos.active_objects, gizmo_center);
        requestAnimationFrame(frame);
    }

    frame();
}


main();

canvas.addEventListener("click", (e) => {
    const mouse_x = e.clientX - rect.left;
    const mouse_y = e.clientY - rect.top;

    if (gizmo_interact || transform_gizmos.is_interacting) {
        gizmo_interact = false;
        transform_gizmos.setIsInteracting(false);
        cur_selection.setLastStaticTransform();

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
            transform_gizmos.objects.forEach(object => {
                object.updatePos(cur_selection.pos);
            });

            setPositionUI(cur_selection);
            setRotationUI(cur_selection);
            setScaleUi(cur_selection);

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

        transform_gizmos.active_objects.forEach(object => {
            if (object.aabb.isIntersecting(current_ray)) {
                const target_name = object.name;
                transform_gizmos.setIsInteracting(true);
                current_ray.dir = generateRayDir(cur_x, cur_y);

                if(transform_gizmos.mode === "translate" ||
                   transform_gizmos.mode === "scale") {
                    start_pos = calculatePlaneIntersectionPoint(current_ray.dir);
                } 
                else if (transform_gizmos.mode === "rotate") {
                    let rotation_axis = null;

                    if (target_name === "x_rotate") rotation_axis = [1,0,0];
                    else if (target_name === "y_rotate") rotation_axis = [0,1,0];
                    else if (target_name === "z_rotate") rotation_axis = [0,0,1];
                    transform_gizmos.setActiveRotationAxis(rotation_axis);

                    start_pos = calculatePlaneIntersectionPoint2(
                        transform_gizmos.active_rotation_axis, cur_selection.pos, current_ray.dir);
                }
                transform_gizmos.setInteractionWith(target_name);
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
        if (cur_selection) {
            gizmo_center = calculateObjectCenterScreenCoord(cur_selection);

            //update ui
            gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                 ${Math.round(gizmo_center[1] * 100) / 100})`;
        }

    } else if (gizmo_interact) {
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);
        cur_selection.updatePos(new_pos);
        gizmo_center = calculateObjectCenterScreenCoord(cur_selection);
        transform_gizmos.objects.forEach(object => {
            object.updatePos(cur_selection.pos);
        })

        // update the ui
        OBJECT_INFO_UI.pos[0].value = Math.round(cur_selection.pos[0] * 100) / 100;
        OBJECT_INFO_UI.pos[1].value = Math.round(cur_selection.pos[1] * 100) / 100;
        OBJECT_INFO_UI.pos[2].value = Math.round(cur_selection.pos[2] * 100) / 100;

        gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                 ${Math.round(gizmo_center[1] * 100) / 100})`;


    } else if (transform_gizmos.is_interacting && 
               transform_gizmos.mode === "translate") {

        const interaction_with = transform_gizmos.interaction_with;
        
        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);
        let translate_vector = null;

        if (interaction_with === "x_trans") {
            translate_vector = [
                cur_selection.last_static_transform.pos[0] + new_pos[0] - start_pos[0],
                cur_selection.pos[1],
                cur_selection.pos[2]
            ];
        } else if (interaction_with === "y_trans") {
            translate_vector = [
                cur_selection.pos[0],
                cur_selection.last_static_transform.pos[1] + new_pos[1] - start_pos[1],
                cur_selection.pos[2]
            ];
        } else if (interaction_with === "z_trans") {
            translate_vector = [
                cur_selection.pos[0],
                cur_selection.pos[1],
                cur_selection.last_static_transform.pos[2] + new_pos[2] - start_pos[2]
            ];
        }

        transform_gizmos.translateSelectedObject(translate_vector, cur_selection);
        gizmo_center = calculateObjectCenterScreenCoord(cur_selection);
        // update UI
        setPositionUI(cur_selection);
    } else if (transform_gizmos.is_interacting && 
               transform_gizmos.mode === "scale") {

        const interaction_with = transform_gizmos.interaction_with;

        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);
        let scale_vector = null;

        if (interaction_with === "x_scale") {
            scale_vector = [
                cur_selection.last_static_transform.scale[0] + new_pos[0] - start_pos[0],
                cur_selection.scale[1],
                cur_selection.scale[2]
            ];
        } else if (interaction_with === "y_scale") {
            scale_vector = [
                cur_selection.scale[0],
                cur_selection.last_static_transform.scale[1] + new_pos[1] - start_pos[1],
                cur_selection.scale[2]
            ];
        } else if (interaction_with === "z_scale") {
            scale_vector = [
                cur_selection.scale[0],
                cur_selection.scale[1],
                cur_selection.last_static_transform.scale[2] + new_pos[2] - start_pos[2]
            ];
        }

        transform_gizmos.scaleSelectedObject(scale_vector, cur_selection);
        // update UI
        setScaleUi(cur_selection);

    } else if (transform_gizmos.is_interacting && 
               transform_gizmos.mode === "rotate") {

        const interaction_with = transform_gizmos.interaction_with;

        current_ray.dir = generateRayDir(mouse_x, mouse_y);
        const cur_pos = calculatePlaneIntersectionPoint2(
            transform_gizmos.active_rotation_axis, cur_selection.pos, current_ray.dir);

        const v = vec3.normalize([], vec3.subtract([], start_pos, cur_selection.pos));
        const w = vec3.normalize([], vec3.subtract([], cur_pos, cur_selection.pos));
        const angle = Math.atan2(vec3.dot(transform_gizmos.active_rotation_axis, 
            vec3.cross([], v, w)), vec3.dot(v, w)) * 180 / Math.PI;    
    
        let rotate_vector = null;

        if (interaction_with === "x_rotate") {
            rotate_vector = [
                cur_selection.last_static_transform.rotation[0] + angle,
                cur_selection.rotation_angles[1],
                cur_selection.rotation_angles[2]
            ];
        } else if (interaction_with === "y_rotate") {
            rotate_vector = [
                cur_selection.rotation_angles[0],
                cur_selection.last_static_transform.rotation[1] + angle,
                cur_selection.rotation_angles[2]
            ];
        } else if (interaction_with === "z_rotate") {
            rotate_vector = [
                cur_selection.rotation_angles[0],
                cur_selection.rotation_angles[1],
                cur_selection.last_static_transform.rotation[2] + angle
            ];
        }

        transform_gizmos.rotateselectedObject(rotate_vector, cur_selection);
        // update UI
        setRotationUI(cur_selection);
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
    transform_gizmos.objects.forEach(object => {
            object.updateScale([scale, scale, scale]);
    });
});


//
// Functions
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


function isIntersectingGizmo(mouse_x, mouse_y) {
    const mouse_pos = [mouse_x, HEIGHT - mouse_y];

    const dist = vec2.length(vec2.subtract([], mouse_pos, gizmo_center));

    if (dist <= gizmo_radius) {
        return true;
    }
    return false;
}


//
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
        const object = new SceneObject(name, [0,0,0], [1,1,1], [0,0,0],
            mesh, renderer.addObjectVAO(mesh), aabb_wireframe_VAO);

        objects.push(object);
        
        const list_item = document.createElement("p");
        list_item.textContent = object.name;
        SCENE_OBJECT_LIST_UI.appendChild(list_item);
    }
    reader.onerror = () => {
        alert("Error reading the file.");
    }
    reader.readAsText(file);
});


// keyboard shortcuts
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "c" && cur_selection) {
        copied_object = cur_selection;
        return;
    }
    if (e.ctrlKey && e.key === "v" && copied_object) {
        const object = new SceneObject(
            copied_object.name, 
            copied_object.pos, 
            copied_object.scale, 
            copied_object.rotation_angles,
            copied_object.mesh,
            copied_object.vao,
            copied_object.aabb.vao
        );

        objects.push(object);
        
        const list_item = document.createElement("p");
        list_item.textContent = object.name;
        SCENE_OBJECT_LIST_UI.appendChild(list_item);
        return;
    }
    if (e.key === "t") {
        transform_gizmos.setMode("translate");
        cur_mode_ui.textContent = transform_gizmos.mode;
    } else if (e.key === "r") {
        transform_gizmos.setMode("rotate");
        cur_mode_ui.textContent = transform_gizmos.mode;
    } else if (e.key === "s") {
        transform_gizmos.setMode("scale");
        cur_mode_ui.textContent = transform_gizmos.mode;
    }
});



function setPositionUI(selected_object) {
    // update the ui
    OBJECT_INFO_UI.pos[0].value = Math.round(selected_object.pos[0] * 100) / 100;
    OBJECT_INFO_UI.pos[1].value = Math.round(selected_object.pos[1] * 100) / 100;
    OBJECT_INFO_UI.pos[2].value = Math.round(selected_object.pos[2] * 100) / 100;

    gizmo_ui.textContent = `(${Math.round(gizmo_center[0] * 100) / 100}, 
                                ${Math.round(gizmo_center[1] * 100) / 100})`;
}

function setScaleUi(selected_object) {
    OBJECT_INFO_UI.scl[0].value = Math.round(selected_object.scale[0] * 100) / 100;
    OBJECT_INFO_UI.scl[1].value = Math.round(selected_object.scale[1] * 100) / 100;
    OBJECT_INFO_UI.scl[2].value = Math.round(selected_object.scale[2] * 100) / 100;
}

function setRotationUI(selected_object) {
    OBJECT_INFO_UI.rot[0].value = selected_object.rotation_angles[0];
    OBJECT_INFO_UI.rot[1].value = selected_object.rotation_angles[1];
    OBJECT_INFO_UI.rot[2].value = selected_object.rotation_angles[2];
}