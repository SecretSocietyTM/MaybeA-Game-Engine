const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;


const canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

import Renderer2 from "../util/Renderer2.js";
import ViewWindow from "../util/ViewWindow.js";
import SceneObject from "../util/SceneObject.js";
import TransformGizmos from "../util/TransformGizmos.js";

import * as Interactions from "../util/interactions.js";
import MeshesObj from "../mimp/models/meshes_index.js";

//
// global variables from rework/main.js
//
let start_pos;
let cur_selection = null;
let cur_x;
let prev_x;
let cur_y;
let prev_y;
let pan_camera = false;
let orbit_camera = false;
let current_ray = { // TODO: probably want this as a class at some point, something like RayPicker
    origin: null,
    dir: null
}



const renderer = new Renderer2(canvas);
const view1 = new ViewWindow("v1", document.getElementById("view1"), canvas);
view1.moveCamera([-20,20,-20]);
const view2 = new ViewWindow("v2", document.getElementById("view2"), canvas);
view2.show_gizmos = true;
const views = [view1, view2];
console.log(views);

/////////////////////////////////////////////////////////////////////////////////////
////////////////////   MORE UGLY CODE FROM REWORK/MAIN.JS   /////////////////////////
current_ray.origin = view2.camera.pos;
// TODO: find a better way to do this
const axis_translate_VAO = renderer.addObjectVAO(MeshesObj.translate_gizmo);
const axis_rotate_VAO = renderer.addObjectVAO(MeshesObj.rotate_gizmo);
const axis_scale_VAO = renderer.addObjectVAO(MeshesObj.scale_gizmo);
const aabb_wireframe_VAO = renderer.addObjectVAO(MeshesObj.aabb_wireframe);
const gizmo_meshes = {
    translate_mesh: MeshesObj.translate_gizmo,
    rotate_mesh: MeshesObj.rotate_gizmo,
    scale_mesh: MeshesObj.scale_gizmo
}
const gizmo_vaos = {
    translate_vao: axis_translate_VAO,
    rotate_vao: axis_rotate_VAO,
    scale_vao: axis_scale_VAO,
    aabb_wireframe: aabb_wireframe_VAO
}
const transform_gizmos = new TransformGizmos();
transform_gizmos.reference_scale = 0.4;
transform_gizmos.reference_distance = vec3.distance(view2.camera.pos, [0,0,0]);
transform_gizmos.initGizmoObjects(gizmo_meshes, gizmo_vaos);
transform_gizmos.setMode();
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

const objects = [];
const unit_cube = new SceneObject("unit_cube", [0,0,0], [1,1,1], [0,0,0], 
    MeshesObj.unit_cube, renderer.addObjectVAO(MeshesObj.unit_cube), aabb_wireframe_VAO);
const apple = new SceneObject("apple", [-10,0,-10], [9,9,9], [0,0,0], 
    MeshesObj.apple, renderer.addObjectVAO(MeshesObj.apple), aabb_wireframe_VAO);
const weird_cube = new SceneObject("weird cube", [0,0,0], [1,1,1], [0,0,0],
    MeshesObj.weird_cube, renderer.addObjectVAO(MeshesObj.weird_cube), aabb_wireframe_VAO);
objects.push(unit_cube, apple, weird_cube);


function renderFrame(loop = false) {
    renderer.renderToViews(views, objects, transform_gizmos);
    if (loop) requestAnimationFrame(renderFrame);
}

renderFrame(true);










//
// event listeners


// TODO: find a way to make event listeners universal and assignable to windows, might require an Events class XD
view2.window.addEventListener("click", e => {
    if (transform_gizmos.is_interacting) {
        transform_gizmos.is_interacting = false;
        cur_selection.setLastStaticTransform();
        return;
    };

    const mouse_x = e.clientX - view2.rect.left; // TODO: likely use offsets, values are the same as offsetX
    const mouse_y = e.clientY - view2.rect.top;  // TODO: likely use offsets, values are the same as offsetY
    current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);

    for (let i = 0; i < objects.length; i++) {
        if (objects[i].aabb.isIntersecting(current_ray)) {
            if (cur_selection === objects[i]) return;
            cur_selection = objects[i];

            transform_gizmos.display_gizmos = true;
            transform_gizmos.main_gizmo.center = Interactions.calculateObjectCenterScreenCoord(view2.width, view2.height, cur_selection, view2.proj_matrix, view2.camera.view_matrix);
            transform_gizmos.main_gizmo.center = vec2.add([], transform_gizmos.main_gizmo.center, [view2.left, view2.bottom])
            console.log(transform_gizmos.main_gizmo);
            transform_gizmos.objects.forEach(object => {
                object.updatePos(cur_selection.pos);
            });
            console.log(cur_selection)
            return;
        }
    }

    // if no scene objects were hit
    cur_selection = null;
    transform_gizmos.display_gizmos = false;
});

view2.window.addEventListener("mousedown", (e) => {
    // might be better to just use offset coordinates
    cur_x = e.clientX - view2.rect.left;
    cur_y = e.clientY - view2.rect.top;

    if (e.button === 1 && e.shiftKey) {
        pan_camera = true;
        return;
    } 
    if (e.button === 1) {
        orbit_camera = true;
        return;
    }
});

view2.window.addEventListener("mouseup", e => {
    if (e.button === 1 || e.shiftKey) {
        pan_camera = false;
        orbit_camera = false;
    }
});

view2.window.addEventListener("mousemove", e => {
    const mouse_x = e.clientX - view2.rect.left;
    const mouse_y = e.clientY - view2.rect.top;
    
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
        
        if (pan_camera) view2.camera.pan(1 * x_sign, -1 * y_sign);
        if (orbit_camera) view2.camera.orbit(1 * x_sign, 1 * y_sign);
        current_ray.origin = view2.camera.pos;
        view2.camera.recalculateViewMatrix();
        return;
    }
});

view2.window.addEventListener("wheel", e => {
    view2.camera.zoom(e.deltaY);
    current_ray.origin = view2.camera.pos;
    view2.camera.recalculateViewMatrix();
});