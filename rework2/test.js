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

import * as Interactions from "../util/interactions.js";
import MeshesObj from "../mimp/models/meshes_index.js";

//
// global variables from rework/main.js
//
let cur_x;
let prev_x;
let cur_y;
let prev_y;
let pan_camera = false;
let orbit_camera = false;

// TODO: probably want this as a class at some point, something like RayPicker
let current_ray = {
    origin: null,
    dir: null
}



const renderer = new Renderer2(canvas);

const view1 = new ViewWindow("v1", document.getElementById("view1"), canvas);
view1.moveCamera([-20,20,-20]);
const view2 = new ViewWindow("v2", document.getElementById("view2"), canvas);
const views = [view1, view2];


const aabb_wireframe_VAO = renderer.addObjectVAO(MeshesObj.aabb_wireframe);

const objects = [];
const unit_cube = new SceneObject("unit_cube", [0,0,0], [1,1,1], [0,0,0], 
    MeshesObj.unit_cube, renderer.addObjectVAO(MeshesObj.unit_cube), aabb_wireframe_VAO);
const apple = new SceneObject("apple", [-10,0,-10], [9,9,9], [0,0,0], 
    MeshesObj.apple, renderer.addObjectVAO(MeshesObj.apple), aabb_wireframe_VAO);
const weird_cube = new SceneObject("weird cube", [0,0,0], [1,1,1], [0,0,0],
    MeshesObj.weird_cube, renderer.addObjectVAO(MeshesObj.weird_cube), aabb_wireframe_VAO);
objects.push(unit_cube, apple, weird_cube);


function renderFrame(loop = false) {
    renderer.renderToViews(views, objects);
    if (loop) requestAnimationFrame(renderFrame);
}

renderFrame(true);


//
// event listeners
view2.window.addEventListener("click", e => {
    console.log(`clientCoords: (${e.clientX}, ${e.clientY}) | offsetCoords: (${e.offsetX}, ${e.offsetY})`);
    
    const mouse_x = e.clientX - view2.rect.left; // TODO: likely use offsets, values are the same as offsetX
    const mouse_y = e.clientY - view2.rect.top;  // TODO: likely use offsets, values are the same as offsetY
    
    // TODO: REMOVE
    console.log(mouse_x, mouse_y);
    current_ray.origin = view2.camera.pos;
    current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);

    for (let i = 0; i < objects.length; i++) {
        if (objects[i].aabb.isIntersecting(current_ray)) {
            console.log(objects[i]);
            return;
            /* if (cur_selection === objects[i]) return;
            cur_selection = objects[i]; */
        }
    }
    console.log("Ray hit nothing");
});

view2.window.addEventListener("wheel", e => {
    view2.camera.zoom(e.deltaY);
    current_ray.origin = view2.camera.pos;
    view2.camera.recalculateViewMatrix();
});