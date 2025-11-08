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
const views = [view1, view2];

current_ray.origin = view2.camera.pos;
const transform_gizmos = new TransformGizmos(MeshesObj, 0.8, vec3.distance(view2.camera.pos, view2.camera.target));

const objects = [];
const game_objects = [];
const collision_objects = [];
const new_meshes = [];

const unit_cube = new SceneObject("unit_cube", MeshesObj.unit_cube, [0,0,0], [1,1,1], [0,0,0]);
const player = unit_cube;
const apple = new SceneObject("apple", MeshesObj.apple, [-10,0,-10], [9,9,9], [0,0,0]);
const weird_cube = new SceneObject("weird cube", MeshesObj.weird_cube, [0,0,0], [1,1,1], [0,0,0]);

const wall = new SceneObject("wall", MeshesObj.unit_cube, [0,0,10], [10,10,1], [0,0,0]);
wall.assignColor([1.0, 0.5, 0.0]);
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

// This event triggeres after letting go of the mouse button
view2.window.addEventListener("click", rayPickingInEditor);
function rayPickingInEditor(e) {
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
            
            // position 2D gizmo at object center
            transform_gizmos.main_gizmo.center = Interactions.coordsWorldToScreen(cur_selection.pos, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
            // poisition 3D gizmos at object center
            transform_gizmos.updateGizmosPos(cur_selection);
            // rescale 3D gizmos
            transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos));

            setTransformUI(transform_ui, cur_selection);
            return
        }
        
    }
    // if no scene objects were hit
    cur_selection = null;
    transform_gizmos.display_gizmos = false;
}

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

            // TODO - 2D GIZMO: implement this better. We NEED the start_pos_2 value in order to calculate the distance 
            // between the center of the object / 2d gizmo and the location on the 2d gizmo that is pressed.

            // NOTE: this works for now, an alternative would be to calculate the radius of 2d gizmo in world space
            // and using that. Since the radius is calculated as the distance between two points on the same plane
            // the radius should always be the same no matter how zoomed in or how the camera is moved.
            // However this will require that outer circle be projected into world space and flattened onto a plane
            // centered at (0,0,0) and i dont know how to go about this.
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
        return;
    }
});

view2.window.addEventListener("mousemove", e => {
    const mouse_x = e.clientX - view2.rect.left;
    const mouse_y = e.clientY - view2.rect.top;


    // Handle hover color change
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
            transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos));
        }
        return;
    } 
    if (transform_gizmos.is_interacting) {
        if (transform_gizmos.mode === "translate") {
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
            setTransformUI(transform_ui, cur_selection);
            transform_gizmos.updateGizmosPos(cur_selection);
            transform_gizmos.main_gizmo.center = Interactions.calculateObjectCenterScreenCoord(view2.width, view2.height, cur_selection, view2.proj_matrix, view2.camera.view_matrix);

            if (cur_selection) { 
                transform_gizmos.main_gizmo.center = Interactions.calculateObjectCenterScreenCoord(view2.width, view2.height, cur_selection, view2.proj_matrix, view2.camera.view_matrix);
                transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos));
            }
        } else if (transform_gizmos.mode === "scale") {
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
                // TODO - 2D GIZMO: rename circle_radius, or store value within gizmos - the circle radius is calculted in world space coordinates i believe
                const circle_radius = vec3.distance(start_pos_2, start_pos); 
                const scaling_factor = vec3.distance(start_pos, new_pos) / circle_radius;
                scale_vector = vec3.scale([], cur_selection.last_static_transform.scale, scaling_factor);
            }
            cur_selection.updateScale(scale_vector);
            setTransformUI(transform_ui, cur_selection);
        } else if (transform_gizmos.mode === "rotate") {
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
                // TODO - Issue #4: the object will snap to a different angle if rotated after moving the camera after an initial rotation
                const angle = Math.atan2(vec3.dot(view2.camera.dir, 
                    vec3.cross([], start_pos, new_pos)), vec3.dot(start_pos, new_pos)) * 180 / Math.PI;  

                cur_selection.rotateOnAxis(angle, view2.camera.dir);
                return;
            }
            cur_selection.updateRot(rotate_vector);
            setTransformUI(transform_ui, cur_selection);
        }
    }
});

view2.window.addEventListener("wheel", e => {
    view2.camera.zoom(e.deltaY);
    current_ray.origin = view2.camera.pos; // need to adjust origin whenever camera pos changes
    view2.camera.recalculateViewMatrix();

    if (transform_gizmos.display_gizmos) {
        // keeps main gizmo in correct place
        transform_gizmos.main_gizmo.center = Interactions.coordsWorldToScreen(cur_selection.pos, view2.width, view2.height, view2.proj_matrix, view2.camera.view_matrix);
        // rescales 3d gizmos
        transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos));
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



loadSceneObjectsToList(sceneobject_list, objects);

// UI event listeners
sceneobject_list.addEventListener("click", e => {

    const list_object = e.target.closest("p");
    
    if (list_object) {
        objects.forEach(object => {
            if (object.name === list_object.textContent) {
                cur_selection = object;

                // this logic can be reused for importing objects
                const distance2 = cur_selection.aabb.sphere_radius / Math.tan(glm.glMatrix.toRadian(45) / 2) * 1.2;
                const new_distance = vec3.scale([], view2.camera.dir, distance2);
                view2.moveCamera(vec3.add([], cur_selection.aabb.center, new_distance));
                view2.camera.target = cur_selection.pos;
                // since the camera snaps to the cur_selection's bounding sphere the zoom_val may have changed
                view2.camera.zoom_val = vec3.length(vec3.subtract([], view2.camera.pos, view2.camera.target));
                view2.camera.recalculateViewMatrix();

                transform_gizmos.updateGizmosScale(vec3.distance(view2.camera.pos, cur_selection.pos));

                transform_gizmos.display_gizmos = true;
                transform_gizmos.updateGizmosPos(cur_selection);
                transform_gizmos.main_gizmo.center = Interactions.calculateObjectCenterScreenCoord(view2.width, view2.height, cur_selection, view2.proj_matrix, view2.camera.view_matrix);
                
                setTransformUI(transform_ui, cur_selection);
                return;
            }
        });
    }
});

model_grid.addEventListener("click", e => {
    const model_card = e.target.closest("div");
    if (!model_card) return;

    new_meshes.forEach(mesh => {
        if (mesh.name === model_card.dataset.model_name) {
            const new_object = new SceneObject(mesh.name, mesh.mesh)
            objects.push(new_object);
            game_objects.push(new_object);
            addSceneObjectToList(sceneobject_list, new_object);

            return;
        }
    })
})

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

        // add the mesh to a list // TODO: for previews, will need to assign the mesh to a SceneObject for rendering
        const mesh_item = {
            name: name,
            mesh: mesh
        };

        const new_object = new SceneObject(undefined, mesh)

        const distance2 = new_object.aabb.sphere_radius / Math.tan(glm.glMatrix.toRadian(45) / 2) * 1.2;
        const new_distance = vec3.scale([], vec3.normalize([], [1,0.5,1]), distance2); //  TODO: for model previews, a fixed direction is ok
        const view_matrix = mat4.create();
        mat4.lookAt(view_matrix, vec3.add([], new_object.aabb.center, new_distance), [0,0,0], [0,-1,0]);

        const model_preview_url = renderer.modelPreviewThing(new_object, view_matrix);

        addModelCardToGrid(model_grid, name, model_preview_url);
        new_meshes.push(mesh_item);
    }
    reader.onerror = () => {
        alert("Error reading the file.");
    }
    reader.readAsText(file);
});

// UI functions
function loadSceneObjectsToList(list, objects) {
    objects.forEach(object => {
        addSceneObjectToList(list, object);
    });
}

function addSceneObjectToList(list, object) {
    const p = document.createElement("p");
    p.textContent = object.name;
    list.appendChild(p);
}

function setTransformUI(transform_ui, object) {
    setPositionUI(transform_ui.position, object);
    setScaleUI(transform_ui.scale, object);
    setRotationUI(transform_ui.rotation, object);
}

function setPositionUI(position_ui, object) {
    position_ui.x.value = object.pos[0];
    position_ui.y.value = object.pos[1];
    position_ui.z.value = object.pos[2];
}

function setScaleUI(scale_ui, object) {
    scale_ui.x.value = object.scale[0];
    scale_ui.y.value = object.scale[1];
    scale_ui.z.value = object.scale[2];    
}

function setRotationUI(rotation_ui, object) {
    rotation_ui.x.value = object.rotation_angles[0];
    rotation_ui.y.value = object.rotation_angles[1];
    rotation_ui.z.value = object.rotation_angles[2];
}

function addModelCardToGrid(grid, name, model_preview_url) {
    const div = document.createElement("div");
    const img = document.createElement("img");
    const p = document.createElement("p");

    div.dataset.model_name = name;
    p.textContent = name;
    img.className = "model_preview";
    img.src = model_preview_url;

    div.appendChild(img);
    div.appendChild(p);

    grid.appendChild(div);
}