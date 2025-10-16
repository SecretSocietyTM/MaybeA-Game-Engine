const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import * as interactions from "../util/interactions.js";

import Renderer from "../util/Renderer.js";
import SceneObject from "../util/SceneObject.js";
import Camera from "../util/Camera.js";
import TransformGizmos from "../util/TransformGizmos.js";
import ViewWindow from "../util/ViewWindow.js";

import vs_src from "../shaders/3d_pass/vertexshader.js";
import fs_src from "../shaders/3d_pass/fragmentshader.js";
import ui_pass_vs_src from "../shaders/ui_pass/vertexshader.js";
import ui_pass_fs_src from "../shaders/ui_pass/fragmentshader.js";

import { parsePLY } from "../mimp/parse_ply.js";
import meshes from "../mimp/models/meshes_index.js";


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


const canvas = document.getElementById("scene_canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

const debug_canvas = document.getElementById("debug_canvas");
debug_canvas.width = WIDTH;
debug_canvas.height = HEIGHT;

const rect = canvas.getBoundingClientRect();
const debug_rect = canvas.getBoundingClientRect();


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
const axis_translate_VAO = renderer.addObjectVAO(meshes.translate_gizmo);
const axis_rotate_VAO = renderer.addObjectVAO(meshes.rotate_gizmo);
const axis_scale_VAO = renderer.addObjectVAO(meshes.scale_gizmo);
const aabb_wireframe_VAO = renderer.addObjectVAO(meshes.aabb_wireframe);

const gizmo_meshes = {
    translate_mesh: meshes.translate_gizmo,
    rotate_mesh: meshes.rotate_gizmo,
    scale_mesh: meshes.scale_gizmo
}
const gizmo_vaos = {
    translate_vao: axis_translate_VAO,
    rotate_vao: axis_rotate_VAO,
    scale_vao: axis_scale_VAO,
    aabb_wireframe: aabb_wireframe_VAO
}

const transform_gizmos = new TransformGizmos();
transform_gizmos.reference_scale = 0.4;
transform_gizmos.reference_distance = vec3.distance(camera.pos, [0,0,0]);
transform_gizmos.initGizmoObjects(gizmo_meshes, gizmo_vaos);
transform_gizmos.setMode();
cur_mode_ui.textContent = transform_gizmos.mode;

function main() {

    //
    // scene objects
    const unit_cube = new SceneObject("unit_cube", [0,0,0], [1,1,1], [0,0,0], 
        meshes.unit_cube, renderer.addObjectVAO(meshes.unit_cube), aabb_wireframe_VAO);
    objects.push(unit_cube);

    const apple = new SceneObject("apple", [-10,0,-10], [9,9,9], [0,0,0], 
        meshes.apple, renderer.addObjectVAO(meshes.apple), aabb_wireframe_VAO);

    const weird_cube = new SceneObject("weird cube", [0,0,0], [1,1,1], [0,0,0],
        meshes.weird_cube, renderer.addObjectVAO(meshes.weird_cube), aabb_wireframe_VAO);

    objects.push(unit_cube, apple, weird_cube);

    objects.forEach(object => {
        const list_item = document.createElement("p");
        list_item.textContent = object.name;
        SCENE_OBJECT_LIST_UI.appendChild(list_item);
    });

    function frame() {
        renderer.renderFrame(view, proj, objects, transform_gizmos);
        requestAnimationFrame(frame);
    }

    frame();
}


main();

/**
 * Handles initial collisions, mainly trying to find which, if any, of the objects
 * was selected. If no objects
 */
canvas.addEventListener("click", (e) => {
    if (transform_gizmos.is_interacting) {
        transform_gizmos.is_interacting = false;
        cur_selection.setLastStaticTransform();
        return;
    };

    const mouse_x = e.clientX - rect.left;
    const mouse_y = e.clientY - rect.top;
    current_ray.dir = interactions.generateRayDir(WIDTH, HEIGHT, mouse_x, mouse_y, proj, view);

    for (let i = 0; i < objects.length; i++) {
        if (objects[i].aabb.isIntersecting(current_ray)) {
            if (cur_selection === objects[i]) return;
            cur_selection = objects[i];

            transform_gizmos.display_gizmos = true;
            transform_gizmos.main_gizmo.center = interactions.calculateObjectCenterScreenCoord(WIDTH, HEIGHT, cur_selection, proj, view);
            transform_gizmos.objects.forEach(object => {
                object.updatePos(cur_selection.pos);
            });

            setAllUI(cur_selection, transform_gizmos.main_gizmo);
            return;
        }
    }

    // if no scene objects were hit
    cur_selection = null;
    transform_gizmos.display_gizmos = false;
});

canvas.addEventListener("mousedown", (e) => {
    cur_x = e.clientX - rect.left;
    cur_y = e.clientY - rect.top;

    if (e.button === 1 && e.shiftKey) {
        pan_camera = true;
        return;
    } 
    if (e.button === 1) {
        orbit_camera = true;
        return;
    }
    if (e.button === 0 && 
        transform_gizmos.display_gizmos) {

        if (transform_gizmos.isIntersectingGizmo([cur_x, HEIGHT - cur_y])) {
            transform_gizmos.is_interacting = true;
            start_pos = interactions.calculatePlaneIntersectionPoint(
                current_ray, camera.dir, cur_selection.pos);
            transform_gizmos.interaction_with = "2d_gizmo";
            return;
        }

        current_ray.dir = interactions.generateRayDir(WIDTH, HEIGHT, cur_x, cur_y, proj, view);
        transform_gizmos.active_objects.forEach(object => {
            if (object.aabb.isIntersecting(current_ray)) {
                transform_gizmos.is_interacting = true;
                const target_name = object.name;
                let plane_normal;

                if (transform_gizmos.mode === "rotate") {
                    if (target_name === "x_rotate") plane_normal = [1,0,0];
                    else if (target_name === "y_rotate") plane_normal = [0,1,0];
                    else if (target_name === "z_rotate") plane_normal = [0,0,1];
                    else if (target_name === "2d_gizmo") plane_normal = camera.dir;
                    transform_gizmos.active_rotation_axis = plane_normal;
                } else {
                    plane_normal = camera.dir;
                }

                start_pos = interactions.calculatePlaneIntersectionPoint(
                    current_ray, plane_normal, cur_selection.pos);
                transform_gizmos.interaction_with = target_name;
                return;
            }
        });
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

        if (transform_gizmos.display_gizmos) {
            transform_gizmos.main_gizmo.center = interactions.calculateObjectCenterScreenCoord(WIDTH, HEIGHT, cur_selection, proj, view);
            //update ui
            setMainGizmoUI(transform_gizmos.main_gizmo);
        }
        return;
    } else if (transform_gizmos.is_interacting && 
               transform_gizmos.mode === "translate") {

        const interaction_with = transform_gizmos.interaction_with;
        
        current_ray.dir = interactions.generateRayDir(WIDTH, HEIGHT, mouse_x, mouse_y, proj, view);
        const new_pos = interactions.calculatePlaneIntersectionPoint(
                        current_ray, camera.dir, cur_selection.pos);
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
        } else if (interaction_with === "2d_gizmo") {
            translate_vector = new_pos;
        }

        cur_selection.updatePos(translate_vector);
        transform_gizmos.updateGizmosPos(cur_selection);
        transform_gizmos.main_gizmo.center = interactions.calculateObjectCenterScreenCoord(WIDTH, HEIGHT, cur_selection, proj, view);
       
       // TODO: not too sure why i put this here.
        if (cur_selection) { 
            transform_gizmos.main_gizmo.center = interactions.calculateObjectCenterScreenCoord(WIDTH, HEIGHT, cur_selection, proj, view);
            const distance = vec3.distance(camera.pos, cur_selection.pos);
            const scale = (distance / transform_gizmos.reference_distance) * transform_gizmos.reference_scale;
            transform_gizmos.objects.forEach(object => {
                    object.updateScale([scale, scale, scale]);
            });
        }
        // update UI
        setPositionUI(cur_selection);
        setMainGizmoUI(transform_gizmos.main_gizmo);
    } else if (transform_gizmos.is_interacting && 
               transform_gizmos.mode === "scale") {

        const interaction_with = transform_gizmos.interaction_with;

        current_ray.dir = interactions.generateRayDir(WIDTH, HEIGHT, mouse_x, mouse_y, proj, view);
        const new_pos = interactions.calculatePlaneIntersectionPoint(
                        current_ray, camera.dir, cur_selection.pos);
        let scale_vector = null;

        if (interaction_with === "x_scale") {
            scale_vector = [
                cur_selection.last_static_transform.scale[0] + (new_pos[0] - start_pos[0]) * cur_selection.last_static_transform.scale[0],
                cur_selection.scale[1],
                cur_selection.scale[2]
            ];
        } else if (interaction_with === "y_scale") {
            scale_vector = [
                cur_selection.scale[0],
                cur_selection.last_static_transform.scale[1] + (new_pos[1] - start_pos[1]) * cur_selection.last_static_transform.scale[1],
                cur_selection.scale[2]
            ];
        } else if (interaction_with === "z_scale") {
            scale_vector = [
                cur_selection.scale[0],
                cur_selection.scale[1],
                cur_selection.last_static_transform.scale[2] + (new_pos[2] - start_pos[2]) * cur_selection.last_static_transform.scale[2]
            ];
        } else if (interaction_with === "2d_gizmo") {
            // TODO: fix
            const scaling_factor = vec3.distance(start_pos, new_pos);
            scale_vector = Array(3).fill(scaling_factor);
            scale_vector = vec3.add([], cur_selection.last_static_transform.scale, scale_vector);
        }

        cur_selection.updateScale(scale_vector);
        // update UI
        setScaleUi(cur_selection);

    } else if (transform_gizmos.is_interacting && 
               transform_gizmos.mode === "rotate") {

        const interaction_with = transform_gizmos.interaction_with;

        current_ray.dir = interactions.generateRayDir(WIDTH, HEIGHT, mouse_x, mouse_y, proj, view);
        const cur_pos = interactions.calculatePlaneIntersectionPoint(
                        current_ray, transform_gizmos.active_rotation_axis, cur_selection.pos);

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
        } else if (interaction_with === "2d_gizmo") {
            // TODO: fix
            return;
        }

        cur_selection.updateRot(rotate_vector);
        // update UI
        setRotationUI(cur_selection);
    }

});

canvas.addEventListener("wheel", (e) => {
    camera.zoom(e.deltaY);
    current_ray.origin = camera.pos;
    mat4.lookAt(view, camera.pos, vec3.subtract([], camera.pos, camera.dir), camera.up);
    if (cur_selection) { 
        transform_gizmos.main_gizmo.center = interactions.calculateObjectCenterScreenCoord(WIDTH, HEIGHT, cur_selection, proj, view);
        const distance = vec3.distance(camera.pos, cur_selection.pos);
        const scale = (distance / transform_gizmos.reference_distance) * transform_gizmos.reference_scale;
        transform_gizmos.objects.forEach(object => {
                object.updateScale([scale, scale, scale]);
        });
    }
});



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

    setMainGizmoUI(transform_gizmos.main_gizmo);
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

function setMainGizmoUI(main_gizmo) {
    gizmo_ui.textContent = `(${Math.round(main_gizmo.center[0] * 100) / 100}, 
                        ${Math.round(main_gizmo.center[1] * 100) / 100})`;
}

function setAllUI(selected_object, main_gizmo) {
    setPositionUI(selected_object);
    setRotationUI(selected_object);
    setScaleUi(selected_object);
    setMainGizmoUI(main_gizmo);
}