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
let start_pos;
let start_pos_2; // for scaling since we start from the center
let cur_selection = null;
let cur_x;
let prev_x;
let cur_y;
let prev_y;
let pan_camera = false;
let orbit_camera = false;
let current_ray = {
    origin: null,
    dir: null
}


// Variables for Game Loop
let enable_game_loop = false;
let w_pressed = false;
let a_pressed = false;
let s_pressed = false;
let d_pressed = false;



const renderer = new Renderer2(canvas);
renderer.addAABBMesh(MeshesObj.aabb_wireframe); // preload the AABB wireframe mesh and VAO

const view1 = new ViewWindow("v1", document.getElementById("view1"), canvas);
view1.show_UI = false;
view1.show_gizmos = false;
const view2 = new ViewWindow("v2", document.getElementById("view2"), canvas);
const views = [view1, view2];

current_ray.origin = view2.camera.pos;
const transform_gizmos = new TransformGizmos(MeshesObj, 0.8, vec3.distance(view2.camera.pos, view2.camera.target));

const objects = [];
const game_objects = [];
const collision_objects = [];

const unit_cube = new SceneObject("unit_cube", MeshesObj.unit_cube, [0,0,0], [1,1,1], [0,0,0]);
const player = unit_cube;
const apple = new SceneObject("apple", MeshesObj.apple, [-10,0,-10], [9,9,9], [0,0,0]);
const weird_cube = new SceneObject("weird cube", MeshesObj.weird_cube, [0,0,0], [1,1,1], [0,0,0]);

const wall = new SceneObject("wall", MeshesObj.unit_cube, [0,0,10], [10,10,1], [0,0,0]);
wall.assignColor([0.6,0.6,0.6]);
wall.useColor(true);
const floor = new SceneObject("floor", MeshesObj.unit_cube, [0,-2.2,0], [15,1,15], [0,0,0]);
floor.assignColor([0.2,0.2,0.2]);
floor.useColor(true);

// For game view
const camera = new SceneObject("camera", MeshesObj.camera_offcenter, [-30,30,-30], [0.3,0.3,0.3], [0,0,0]);
camera.transformTargetTo(camera.pos, view2.camera.target, view2.camera.up, camera.scale);
view1.moveCamera(camera.pos);

objects.push(unit_cube, apple, weird_cube, camera, wall, floor);
game_objects.push(unit_cube, apple, weird_cube, wall, floor);
collision_objects.push(wall, floor);
view2.objects = objects;
view1.objects = game_objects;

// render loop variables
let editor_req_id;
let game_req_id;

function editorLoop() {
    renderer.renderToViews(views, transform_gizmos);
    editor_req_id = requestAnimationFrame(editorLoop);
}

// THIS IS THE GAME LOOP
function gameLoop() {
    const speed = 0.15;
    if (d_pressed) {
        player.updatePos(vec3.add([], player.last_static_transform.pos, [0,0,-1 * speed]));
        player.setLastStaticTransform();
    } 
    if (w_pressed) {
        player.updatePos(vec3.add([], player.last_static_transform.pos, [0,1 * speed,0]));
        player.setLastStaticTransform();
    } 
    if (a_pressed) {
        player.updatePos(vec3.add([], player.last_static_transform.pos, [0,0,1 * speed]));
        player.setLastStaticTransform();
    } 
    if (s_pressed) {
        player.updatePos(vec3.add([], player.last_static_transform.pos, [0,-1 * speed,0]));
        player.setLastStaticTransform();
    }

    collision_objects.forEach(object => {
        player.repelFrom(object);
    });

    renderer.renderToViews(views, transform_gizmos);
    game_req_id = requestAnimationFrame(gameLoop);
}

editor_req_id = requestAnimationFrame(editorLoop);

// enables the "game loop"
const btn_toggle_GameLoop = document.getElementById("toggle_GameLoop");
btn_toggle_GameLoop.addEventListener("click", e => {
    btn_toggle_GameLoop.classList.toggle("toggle");
    enable_game_loop = !enable_game_loop;
    if (enable_game_loop) {
        cancelAnimationFrame(editor_req_id);
        game_req_id = requestAnimationFrame(gameLoop);
        return;
    }

    cancelAnimationFrame(game_req_id);
    editor_req_id = requestAnimationFrame(editorLoop);
});


// element stuff...
const btn_w = document.getElementById("w_pressed");
const btn_a = document.getElementById("a_pressed");
const btn_s = document.getElementById("s_pressed");
const btn_d = document.getElementById("d_pressed");
const btn_toggle_AABB = document.getElementById("toggle_AABB");
btn_toggle_AABB.addEventListener("click", e => {
    btn_toggle_AABB.classList.toggle("toggle");
    view1.show_AABB = !view1.show_AABB;
    view2.show_AABB = !view2.show_AABB;
});

document.addEventListener("keydown", e => {
    if (e.key === "w") {
        btn_w.classList.remove("toggle");
        w_pressed = true;
    } 
    if (e.key === "a") {
        btn_a.classList.remove("toggle");
        a_pressed = true;
    }
    if (e.key === "s") {
        btn_s.classList.remove("toggle");
        s_pressed = true;
    }
    if (e.key === "d") {
        btn_d.classList.remove("toggle");
        d_pressed = true;
    }
});

document.addEventListener("keyup" , e => {
    if (e.key === "w") {
        btn_w.classList.add("toggle");
        w_pressed = false;
    } 
    if (e.key === "a") {
        btn_a.classList.add("toggle");
        a_pressed = false;
    }
    if (e.key === "s") {
        btn_s.classList.add("toggle");
        s_pressed = false;
    }
    if (e.key === "d") {
        btn_d.classList.add("toggle");
        d_pressed = false;
    }
});




//
// event listeners for Editor View
// TODO: find a way to make event listeners universal and assignable to windows, might require an Events class XD
view2.window.addEventListener("click", e => {
    if (transform_gizmos.is_interacting) {
        transform_gizmos.is_interacting = false;
        cur_selection.setLastStaticTransform();
        return;
    };

    const mouse_x = e.clientX - view2.rect.left; // TODO NOT URGET: use offsets, values are the same as offsetX
    const mouse_y = e.clientY - view2.rect.top;  // TODO NOT URGET: use offsets, values are the same as offsetY
    current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);

    for (let i = 0; i < objects.length; i++) {
        if (objects[i].aabb === null) continue;
        if (objects[i].aabb.isIntersecting(current_ray)) {
            if (cur_selection === objects[i]) return;
            cur_selection = objects[i];

            transform_gizmos.display_gizmos = true;

            // position 2d gizmo at object center
            transform_gizmos.main_gizmo.center = Interactions.coordsWorldToScreen(cur_selection.pos, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix)

            // position 3d gizmos at object center
            transform_gizmos.objects.forEach(object => {
                object.updatePos(cur_selection.pos);
            });

            // rescales 3d gizmos
            const distance = vec3.distance(view2.camera.pos, cur_selection.pos);
            const scale = (distance / transform_gizmos.reference_distance) * transform_gizmos.reference_scale;
            transform_gizmos.objects.forEach(object => {
                    object.updateScale([scale, scale, scale]);
            });

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
    if (e.button === 0 && transform_gizmos.display_gizmos) {

        if (transform_gizmos.isIntersectingGizmo([cur_x, view2.height - cur_y], view2)) {
            transform_gizmos.is_interacting = true;
            start_pos = Interactions.calculatePlaneIntersectionPoint(
                current_ray, view2.camera.dir, cur_selection.pos);

            // TODO: implement this better. We NEED the start_pos_2 value in order to calculate the distance between the center of the object and the location on the 2d gizmo that the is pressed.
            if (transform_gizmos.mode === "scale") {
                start_pos_2 = start_pos;
                start_pos = cur_selection.pos;
            }

            transform_gizmos.interaction_with = "2d_gizmo";
            return;
        }

        current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, cur_x, cur_y, view2.proj_matrix, view2.camera.view_matrix);
        transform_gizmos.active_objects.forEach(object => {
            if (object.aabb.isIntersecting(current_ray)) {
                transform_gizmos.is_interacting = true;
                const target_name = object.name;
                
                start_pos = Interactions.calculatePlaneIntersectionPoint(
                    current_ray, view2.camera.dir, cur_selection.pos);
                transform_gizmos.interaction_with = target_name;
                return;
            }
        });
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


    // Handle hover color change
    // TODO: need to add some flag that keeps note of which thing im interacting with to keep it colored
    if (transform_gizmos.display_gizmos && !transform_gizmos.is_interacting) {
        if (transform_gizmos.isIntersectingGizmo([mouse_x, view2.height - mouse_y], view2)) {
            transform_gizmos.main_gizmo.color = [1.0, 1.0, 1.0];
        } else {
            transform_gizmos.main_gizmo.color = [0.9, 0.9, 0.9];
        }

        current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);
        transform_gizmos.active_objects.forEach(object => {
            if (object.aabb.isIntersecting(current_ray)) {
                if (object.name.includes("x")) object.assignColor(transform_gizmos.RED_HOVER);
                else if (object.name.includes("y")) object.assignColor(transform_gizmos.GREEN_HOVER);
                else if (object.name.includes("z")) object.assignColor(transform_gizmos.BLUE_HOVER);
            } else {
                if (object.name.includes("x")) object.assignColor(transform_gizmos.RED);
                else if (object.name.includes("y")) object.assignColor(transform_gizmos.GREEN);
                else if (object.name.includes("z")) object.assignColor(transform_gizmos.BLUE);
            }
        });
    }

    
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

        if (transform_gizmos.display_gizmos) {
            // position 2d gizmo at object center
            transform_gizmos.main_gizmo.center = Interactions.coordsWorldToScreen(cur_selection.pos, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);

            // rescales 3d gizmos
            const distance = vec3.distance(view2.camera.pos, cur_selection.pos);
            const scale = (distance / transform_gizmos.reference_distance) * transform_gizmos.reference_scale;
            transform_gizmos.objects.forEach(object => {
                object.updateScale([scale, scale, scale]);
            });
        }
        return;
    } else if (transform_gizmos.is_interacting && transform_gizmos.mode === "translate") {

        const interaction_with = transform_gizmos.interaction_with;
        current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);
        const new_pos = Interactions.calculatePlaneIntersectionPoint(
                        current_ray, view2.camera.dir, cur_selection.pos);

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
            const pos_offset = vec3.subtract([], new_pos, start_pos);
            translate_vector = vec3.add([], cur_selection.last_static_transform.pos, pos_offset);
        }

        cur_selection.updatePos(translate_vector);
        transform_gizmos.updateGizmosPos(cur_selection);
        transform_gizmos.main_gizmo.center = Interactions.calculateObjectCenterScreenCoord(view2.width, view2.height, cur_selection, view2.proj_matrix, view2.camera.view_matrix);
        // TODO: not too sure why i put this here.
        if (cur_selection) { 
            transform_gizmos.main_gizmo.center = Interactions.calculateObjectCenterScreenCoord(view2.width, view2.height, cur_selection, view2.proj_matrix, view2.camera.view_matrix);
            const distance = vec3.distance(view2.camera.pos, cur_selection.pos);
            const scale = (distance / transform_gizmos.reference_distance) * transform_gizmos.reference_scale;
            transform_gizmos.objects.forEach(object => {
                    object.updateScale([scale, scale, scale]);
            });
        }

    } else if (transform_gizmos.is_interacting && transform_gizmos.mode === "scale") {

        const interaction_with = transform_gizmos.interaction_with;
        current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);
        const new_pos = Interactions.calculatePlaneIntersectionPoint(
                        current_ray, view2.camera.dir, cur_selection.pos);

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
            const circle_radius = vec3.distance(start_pos_2, start_pos); // TODO: rename circle_radius, or store value within gizmos
            const scaling_factor = vec3.distance(start_pos, new_pos) / circle_radius;
            scale_vector = vec3.scale([], cur_selection.last_static_transform.scale, scaling_factor);
        }
        cur_selection.updateScale(scale_vector);

    } else if (transform_gizmos.is_interacting && 
                transform_gizmos.mode === "rotate") {

        const interaction_with = transform_gizmos.interaction_with;
        current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);
        const new_pos = Interactions.calculatePlaneIntersectionPoint(
                        current_ray, view2.camera.dir, cur_selection.pos);
        
        let rotate_vector = null;
        if (interaction_with === "x_rotate") {
            rotate_vector = [
                cur_selection.last_static_transform.rotation[0] + (new_pos[0] - start_pos[0]) * 180 / Math.PI,
                cur_selection.rotation_angles[1],
                cur_selection.rotation_angles[2]
            ];
        } else if (interaction_with === "y_rotate") {
            rotate_vector = [
                cur_selection.rotation_angles[0],
                cur_selection.last_static_transform.rotation[1] + (new_pos[1] - start_pos[1]) * 180 / Math.PI,
                cur_selection.rotation_angles[2]
            ];  
        } else if (interaction_with === "z_rotate") {
            rotate_vector = [
                cur_selection.rotation_angles[0],
                cur_selection.rotation_angles[1],
                cur_selection.last_static_transform.rotation[2] + (new_pos[2] - start_pos[2]) * 180 / Math.PI,    
            ]
        } else if (interaction_with === "2d_gizmo") {
            // TODO NOT URGET: not sure what is happening, the entire thing will snap to a different angle if rotated after moving the camera after a rotation
            // TODO NOT URGENT: when scaling after rotating with any gizmo, the axis of scaling is fucked
            const angle = Math.atan2(vec3.dot(view2.camera.dir, 
                vec3.cross([], start_pos, new_pos)), vec3.dot(start_pos, new_pos)) * 180 / Math.PI;  

            cur_selection.rotateOnAxis(angle, view2.camera.dir);
            return;
        }
        
        cur_selection.updateRot(rotate_vector);
    }
});

view2.window.addEventListener("wheel", e => {
    view2.camera.zoom(e.deltaY);
    current_ray.origin = view2.camera.pos;
    view2.camera.recalculateViewMatrix();

    if (transform_gizmos.display_gizmos) {
        // keeps main gizmo in correct place
        transform_gizmos.main_gizmo.center = Interactions.coordsWorldToScreen(cur_selection.pos, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);

        // rescales 3d gizmos
        const distance = vec3.distance(view2.camera.pos, cur_selection.pos);
        const scale = (distance / transform_gizmos.reference_distance) * transform_gizmos.reference_scale;
        transform_gizmos.objects.forEach(object => {
                object.updateScale([scale, scale, scale]);
        });
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "t") {
        transform_gizmos.setMode("translate");
    } else if (e.key === "r") {
        transform_gizmos.setMode("rotate");
    } else if (e.key === "s") {
        transform_gizmos.setMode("scale");
    }
});
