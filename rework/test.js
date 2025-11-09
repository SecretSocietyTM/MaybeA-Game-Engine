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
import * as ui from "../extra/ui.js";
import MeshesObj from "../mimp/models/meshes_index.js";
import { parsePLY } from "../mimp/parse_ply.js";

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
view1.show_gizmos = false;
const view2 = new ViewWindow("v2", document.getElementById("view2"), canvas);

// after both windows have had a size assigned, get the bounding rect
const views = [view1, view2];
views.forEach(view => view.setBoundingRect());

current_ray.origin = view2.camera.pos;
const transform_gizmos = new TransformGizmos(MeshesObj, 0.8, vec3.distance(view2.camera.pos, view2.camera.target));

const objects = [];
const game_objects = [];
const collision_objects = [];
const new_meshes = [];

const unit_cube = new SceneObject("unit_cube", MeshesObj.unit_cube);
const apple = new SceneObject("apple", MeshesObj.apple, [-10,0,-10], [9,9,9], [0,0,0]);
const weird_cube = new SceneObject("weird cube", MeshesObj.weird_cube);

const wall = new SceneObject("wall", MeshesObj.unit_cube, [0,0,-15], [10,10,1], [0,0,0], [1.0,0.5,0.0]);
const floor = new SceneObject("floor", MeshesObj.unit_cube, [0,-2.2,0], [15,1,15], [0,0,0], [0.2,0.2,0.2]);

// For game view
const camera = new SceneObject("camera", MeshesObj.camera_offcenter, [-30,30,-30], [0.3,0.3,0.3], [0,0,0]);
camera.transformTargetTo(camera.pos, view2.camera.target, view2.camera.up, camera.scale);
view1.camera.pos = camera.pos;
view1.camera.recalculateViewMatrix();

objects.push(camera, 
    unit_cube, apple, weird_cube, wall, floor);
game_objects.push(
    unit_cube, apple, weird_cube, wall, floor);
collision_objects.push(wall, floor);
view2.objects = objects;
view1.objects = game_objects;



//
//
// Render loop state / logic
let editor_req_id;
let game_req_id;
const player = unit_cube;

function editorLoop() {
    renderer.renderToViews(views, transform_gizmos);

    editor_req_id = requestAnimationFrame(editorLoop);
}

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

// initialize general render loop
editor_req_id = requestAnimationFrame(editorLoop);

// 
// 
// UI elements related to view state / game loop
const btn_w = document.getElementById("w_pressed");
const btn_a = document.getElementById("a_pressed");
const btn_s = document.getElementById("s_pressed");
const btn_d = document.getElementById("d_pressed");
const btn_toggle_AABB = document.getElementById("toggle_AABB");
const btn_toggle_GameLoop = document.getElementById("toggle_GameLoop");

// Toggles the game loop on and off
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

// Toggles visibility of SceneObject AABBs
btn_toggle_AABB.addEventListener("click", e => {
    btn_toggle_AABB.classList.toggle("toggle");
    view1.show_AABB = !view1.show_AABB;
    view2.show_AABB = !view2.show_AABB;
});

// Player movement
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

// Player movement
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
//
// event listeners for the editor window

// Ray picking
view2.window.addEventListener("click", e => {
    // This needs to be here because event "mouseup" occurs BEFORE "click" so this callback function
    // will execute after "mouseup". This means that if we are interacting with the gizmos and the 
    // mouse is no longer over the current active object, it will be deselected
    if (transform_gizmos.is_interacting) {
        transform_gizmos.is_interacting = false;
        cur_selection.setLastStaticTransform();
        return;
    }

    const mouse_x = e.offsetX;
    const mouse_y = e.offsetY;
    
    current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);

    for (let object of objects) {
        if (object.aabb.isIntersecting(current_ray)) {
            if (object === cur_selection) return;

            cur_selection = object;
            transform_gizmos.display_gizmos = true;

            if (true) {
                const object_aabb_center = cur_selection.aabb.center;
                const object_center_world_to_screen = Interactions.coordsWorldToScreen(object_aabb_center, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
                transform_gizmos.updateGizmos(object_center_world_to_screen, object_aabb_center, vec3.distance(view2.camera.pos, object_aabb_center));
            }
            
            /* // position 2D gizmo at object center
            transform_gizmos.main_gizmo.center = Interactions.coordsWorldToScreen(cur_selection.pos, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
            // poisition 3D gizmos at object center
            transform_gizmos.updateGizmosPos(cur_selection);
            // rescale 3D gizmos
            transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos)); */

            ui.setTransformUI(transform_ui, cur_selection);
            return
        }
        
    }
    // if no scene objects were hit
    cur_selection = null;
    transform_gizmos.display_gizmos = false;
});

// Camera movement state management + gizmo state management
view2.window.addEventListener("mousedown", (e) => {
    // might be better to just use offset coordinates
    cur_x = e.offsetX;
    cur_y = e.offsetY;

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

            // TODO - 2D GIZMO: implement this better. We NEED the start_pos_2 value in order to calculate the distance 
            // between the center of the object / 2d gizmo and the location on the 2d gizmo that is pressed.  (Calc the 2d gizmo radius in world space)
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

// Camera movement state management
view2.window.addEventListener("mouseup", e => {
    if (e.button === 1 || e.shiftKey) {
        pan_camera = false;
        orbit_camera = false;
        return;
    }
});

// Camera movement + gizmo interaction
view2.window.addEventListener("mousemove", e => {
    const mouse_x = e.offsetX;
    const mouse_y = e.offsetY;

    current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);

    // Handle hover color change
    transform_gizmos.hoverColorChange([mouse_x, view2.height - mouse_y], current_ray);
    
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
        if (orbit_camera) view2.camera.orbit(x_sign, y_sign);
        current_ray.origin = view2.camera.pos;
        view2.camera.recalculateViewMatrix();

        if (transform_gizmos.display_gizmos) {

            /* if (true) {
                const object_aabb_center = cur_selection.aabb.center;
                const object_center_world_to_screen = Interactions.coordsWorldToScreen(object_aabb_center, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
                transform_gizmos.updateGizmos(object_center_world_to_screen, undefined, vec3.distance(view2.camera.pos, object_aabb_center));
            } */

            // SAVE: unity allows for transformations about both the PIVOT POINT and CENTER POINT (CENTER OF AABB);
            // PIVOT POINT: the point around which the object was centered in the modeling phase (0,0,0);
            // CENTER POINT: the center point of the AABB assigned to the object AFTER importing
            // position 2d gizmo at object center
            transform_gizmos.main_gizmo.center = Interactions.coordsWorldToScreen(cur_selection.pos, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
            transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos));
        }
        return;
    } 
    if (transform_gizmos.is_interacting) {

        const interaction_with = transform_gizmos.interaction_with;
        const new_pos = Interactions.calculatePlaneIntersectionPoint(current_ray, view2.camera.dir, cur_selection.pos);
        
        if (transform_gizmos.mode === "translate") {
            let translate_vector = [...cur_selection.pos];

            if (interaction_with === "2d_gizmo") {
                const pos_offset = vec3.subtract([], new_pos, start_pos);
                translate_vector = vec3.add([], cur_selection.last_static_transform.pos, pos_offset);
            } else {
                const axis_map = {x_trans: 0, y_trans: 1, z_trans: 2};
                const axis = axis_map[interaction_with];
                translate_vector[axis] = cur_selection.last_static_transform.pos[axis] + new_pos[axis] - start_pos[axis];
            }

            cur_selection.updatePos(translate_vector);
            // update gizmos positions and rescale
            /* if (true) {
                const object_aabb_center = cur_selection.aabb.center;
                const object_center_world_to_screen = Interactions.coordsWorldToScreen(object_aabb_center, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
                transform_gizmos.updateGizmos(object_center_world_to_screen, object_aabb_center, vec3.distance(view2.camera.pos, object_aabb_center));
            } */
            
            transform_gizmos.updateGizmosPos(cur_selection);
            transform_gizmos.main_gizmo.center = Interactions.calculateObjectCenterScreenCoord(view2.width, view2.height, cur_selection, view2.proj_matrix, view2.camera.view_matrix);
            transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos));
        } else if (transform_gizmos.mode === "scale") {
            let scale_vector = [...cur_selection.scale];

            if (interaction_with === "2d_gizmo") {
                const circle_radius = vec3.distance(start_pos_2, start_pos); 
                const scaling_factor = vec3.distance(start_pos, new_pos) / circle_radius;
                scale_vector = vec3.scale([], cur_selection.last_static_transform.scale, scaling_factor);
            } else {
                const axis_map = {x_scale: 0, y_scale: 1, z_scale: 2};
                const axis = axis_map[interaction_with];
                scale_vector[axis] = cur_selection.last_static_transform.scale[axis] + (new_pos[axis] - start_pos[axis]) * cur_selection.last_static_transform.scale[axis];
            }
            
            cur_selection.updateScale(scale_vector);
        } else if (transform_gizmos.mode === "rotate") {
            let rotate_vector2 = [...cur_selection.rotation_angles];

            if (interaction_with === "2d_gizmo") {
                // TODO - Issue #4: the object will snap to a different angle if rotated after moving the camera after an initial rotation
                const angle = Math.atan2(vec3.dot(view2.camera.dir, 
                    vec3.cross([], start_pos, new_pos)), vec3.dot(start_pos, new_pos)) * 180 / Math.PI;  

                cur_selection.rotateOnAxis(angle, view2.camera.dir);
                return;
            } else {
                const axis_map = {x_rotate: 0, y_rotate: 1, z_rotate: 2};
                const axis = axis_map[interaction_with];
                rotate_vector2[axis] = cur_selection.last_static_transform.rotation[axis] + (new_pos[axis] - start_pos[axis]) * 180 / Math.PI
            }
            
            cur_selection.updateRot(rotate_vector2);
        }

        // update UI
        ui.setTransformUI(transform_ui, cur_selection);
    }
});

// Camera movement
view2.window.addEventListener("wheel", e => {
    view2.camera.zoom(e.deltaY);
    current_ray.origin = view2.camera.pos; // need to adjust origin whenever camera pos changes
    view2.camera.recalculateViewMatrix();

    if (transform_gizmos.display_gizmos) {

        /* if (true) {
            const object_aabb_center = cur_selection.aabb.center;
            const object_center_world_to_screen = Interactions.coordsWorldToScreen(object_aabb_center, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
            transform_gizmos.updateGizmos(object_center_world_to_screen, undefined, vec3.distance(view2.camera.pos, object_aabb_center));
        } */
        // keeps main gizmo in correct place
        transform_gizmos.main_gizmo.center = Interactions.coordsWorldToScreen(cur_selection.pos, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
        // rescales 3d gizmos
        transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos));
    }
});

// Gizmo state management
document.addEventListener("keydown", (e) => {
    if (e.key === "t") {
        transform_gizmos.setMode("translate");
    } else if (e.key === "r") {
        transform_gizmos.setMode("rotate");
    } else if (e.key === "s") {
        transform_gizmos.setMode("scale");
    }
});


//
//
// UI elements
const sceneobject_list = document.getElementById("sceneobjects_list");
const model_grid = document.getElementById("model_grid");
const transform_ui = {
    position: {
        x: document.getElementById("position").querySelector(".x"),
        y: document.getElementById("position").querySelector(".y"),
        z: document.getElementById("position").querySelector(".z")
    },

    rotation: {
        x: document.getElementById("rotation").querySelector(".x"),
        y: document.getElementById("rotation").querySelector(".y"),
        z: document.getElementById("rotation").querySelector(".z")
    }, 

    scale: {
        x: document.getElementById("scale").querySelector(".x"),
        y: document.getElementById("scale").querySelector(".y"),
        z: document.getElementById("scale").querySelector(".z")
    }
};
const file_input = document.getElementById("file_input");

ui.loadSceneObjectsToList(sceneobject_list, objects);

// 
// event listeners for UI elements

// Interacting with the Scene Hierarchy
sceneobject_list.addEventListener("click", e => {

    const list_object = e.target.closest("p");
    
    if (list_object) {
        objects.forEach(object => {
            if (object.name === list_object.textContent) {
                cur_selection = object;

                // this logic can be reused for importing objects
                const distance2 = cur_selection.aabb.sphere_radius / Math.tan(glm.glMatrix.toRadian(45) / 2) * 1.2;
                const new_distance = vec3.scale([], view2.camera.dir, distance2);
                view2.camera.pos = vec3.add([], cur_selection.aabb.center, new_distance);
                /* view2.camera.target = cur_selection.aabb.center; */ // TODO: implement better using CENTER 
                view2.camera.target = cur_selection.pos; // TODO: this also depends on where the Transform gizmos are (PIVOT OR CENTER);
                // since the camera snaps to the cur_selection's bounding sphere the zoom_val may have changed
                view2.camera.zoom_val = vec3.length(vec3.subtract([], view2.camera.pos, view2.camera.target));
                view2.camera.recalculateViewMatrix();

                transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos));

                transform_gizmos.display_gizmos = true;
                
                /* if (true) {
                    const object_aabb_center = cur_selection.aabb.center;
                    const object_center_world_to_screen = Interactions.coordsWorldToScreen(object_aabb_center, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
                    transform_gizmos.updateGizmos(object_center_world_to_screen, object_aabb_center, vec3.distance(view2.camera.pos, object_aabb_center));
                } */

                transform_gizmos.main_gizmo.center = Interactions.calculateObjectCenterScreenCoord(view2.width, view2.height, cur_selection, view2.proj_matrix, view2.camera.view_matrix);
                transform_gizmos.updateGizmosPos(cur_selection);
                
                ui.setTransformUI(transform_ui, cur_selection);
                return;
            }
        });
    }
});

// Interacting with the model previews
model_grid.addEventListener("click", e => {
    const model_card = e.target.closest("div");
    if (!model_card) return;

    new_meshes.forEach(mesh => {
        if (mesh.name === model_card.dataset.model_name) {
            const new_object = new SceneObject(mesh.name, mesh.mesh)
            objects.push(new_object);
            game_objects.push(new_object);
            ui.addSceneObjectToList(sceneobject_list, new_object);

            return;
        }
    })
})

// Adding new models to the editor
file_input.addEventListener("change", (e) => {
    const file = file_input.files[0];
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

        const mesh_item = {
            name: name,
            mesh: mesh
        };

        const new_object = new SceneObject(undefined, mesh);

        const distance2 = new_object.aabb.sphere_radius / Math.tan(glm.glMatrix.toRadian(45) / 2) * 1.2;
        const new_distance = vec3.scale([], vec3.normalize([], [1,0.5,1]), distance2);
        const view_matrix = mat4.create();
        mat4.lookAt(view_matrix, vec3.add([], new_object.aabb.center, new_distance), new_object.aabb.center, [0,1,0]);

        const model_preview_url = renderer.modelPreviewThing(new_object, view_matrix);

        ui.addModelCardToGrid(model_grid, name, model_preview_url);
        new_meshes.push(mesh_item);
    }
    reader.onerror = () => {
        alert("Error reading the file.");
    }
    reader.readAsText(file);
});