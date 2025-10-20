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
// TODO: improve

const line3d = {
    p0: [0,0,10],
    p1: [0,0,0]
};

let start_pos;
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



const renderer = new Renderer2(canvas);
renderer.addAABBMesh(MeshesObj.aabb_wireframe); // preload the AABB wireframe mesh and VAO

const view1 = new ViewWindow("v1", document.getElementById("view1"), canvas);
view1.show_UI = false;
view1.moveCamera([-30,0,0]);
const view2 = new ViewWindow("v2", document.getElementById("view2"), canvas);
const views = [view1, view2];

current_ray.origin = view2.camera.pos;
// TODO: find a better way to handle transform gizmos
const transform_gizmos = new TransformGizmos(MeshesObj, 1, vec3.distance(view2.camera.pos, view2.camera.target));

const objects = [];
const debug_objects = [];

const unit_cube = new SceneObject("unit_cube", MeshesObj.unit_cube, [0,0,0], [1,1,1], [0,0,0]);
const apple = new SceneObject("apple", MeshesObj.apple, [-20,0,-10], [9,9,9], [0,0,0]);
const weird_cube = new SceneObject("weird cube", MeshesObj.weird_cube, [0,0,0], [1,1,1], [0,0,0]);

const plane = new SceneObject("unit_cube", MeshesObj.unit_cube, [0,0,0], [20,20,0.02], [0,0,0]);
plane.transformTargetTo(plane.pos, view2.camera.pos, view2.camera.up, plane.scale);
plane.aabb = null;
plane.assignColor([0.7, 0.7, 0.7]);
plane.assignAlpha(0.3);
plane.useColor(true);

const camera = new SceneObject("camera", MeshesObj.camera_offcenter, [0,0,0], [0.5,0.5,0.5], [0,0,0]);
// TODO: this is so JANK!
camera.transformTargetTo(view2.camera.pos, view2.camera.target, view2.camera.up, [0.5,0.5,0.5]);
camera.aabb = null; // TODO: should find a way to make a "Debugger" "Editor" "Game" class that Extends or Inherits from ViewWindow. Each window will have its own config, like dispaying aabbs.




objects.push(unit_cube, apple, weird_cube);
debug_objects.push(unit_cube, apple, weird_cube, camera, plane);

view1.objects = debug_objects;
view2.objects = objects;

function renderFrame(loop = false) {
    renderer.renderToViews(views, transform_gizmos, line3d);
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

    const mouse_x = e.clientX - view2.rect.left; // TODO NOT URGET: likely use offsets, values are the same as offsetX
    const mouse_y = e.clientY - view2.rect.top;  // TODO NOT URGET: likely use offsets, values are the same as offsetY
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
            if (transform_gizmos.mode === "scale") {
                start_pos = cur_selection.pos;
                line3d.p1 = Interactions.calculatePlaneIntersectionPoint(
                current_ray, view2.camera.dir, cur_selection.pos);
            }
            transform_gizmos.interaction_with = "2d_gizmo";
            return;
        }

        current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, cur_x, cur_y, view2.proj_matrix, view2.camera.view_matrix);
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
                    plane_normal = view2.camera.dir;
                }
                start_pos = Interactions.calculatePlaneIntersectionPoint(
                    current_ray, plane_normal, cur_selection.pos);
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

        // TODO: really jank
        camera.transformTargetTo(view2.camera.pos, view2.camera.target, view2.camera.up, [0.5,0.5,0.5]);
        plane.pos = view2.camera.target;
        plane.transformTargetTo(plane.pos, view2.camera.pos, view2.camera.up, plane.scale); // TODO: supremely jank

        // TODO: remove
        line3d.p0 = view2.camera.pos;

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
            // TODO: object center should not SNAP to location of mouse when interacting with 2D gizmo, instead it should maintain its offset from wherever you grabbed the gizmo
            translate_vector = new_pos;
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
            // TODO: fix - when zooming out or in, scaling_factor is increased/decreased drastically.
            const scaling_factor = vec3.distance(start_pos, new_pos);
            console.log(scaling_factor);
            scale_vector = vec3.scale([], cur_selection.last_static_transform.scale, scaling_factor);
        }
        cur_selection.updateScale(scale_vector);

    } else if (transform_gizmos.is_interacting && 
                transform_gizmos.mode === "rotate") {

        const interaction_with = transform_gizmos.interaction_with;

        current_ray.dir = Interactions.generateRayDir(view2.width, view2.height, mouse_x, mouse_y, view2.proj_matrix, view2.camera.view_matrix);
        const cur_pos = Interactions.calculatePlaneIntersectionPoint(
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
    }
});

view2.window.addEventListener("wheel", e => {
    view2.camera.zoom(e.deltaY);
    current_ray.origin = view2.camera.pos;
    view2.camera.recalculateViewMatrix();

    // TODO: really jank
    camera.transformTargetTo(view2.camera.pos, view2.camera.target, view2.camera.up, [0.5,0.5,0.5]);
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

    // TODO: remove
    line3d.p0 = view2.camera.pos;
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





// element stuff...
const btn_toggle_AABB = document.getElementById("toggle_AABB");
btn_toggle_AABB.addEventListener("click", e => {
    views.forEach(view => {
        view.show_AABB = !view.show_AABB;
    })
});