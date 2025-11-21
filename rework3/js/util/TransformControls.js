const glm = glMatrix; // shorten math library name,
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import { Raycaster } from "./Raycaster.js";
import MeshesObj from "../../../models/meshes_index.js";
import SceneObject from "./SceneObjects.js";
import EventDispatcher from "./EventDispatcher.js";

import * as Interactions from "./interactions.js";

const raycaster = new Raycaster();

export class TransformControls extends EventDispatcher {

    #dom_element = null;

    constructor(camera, ref_scale = 0.8, ref_distance = 10) {
        super();

        this.camera = camera;

        this.gizmos = [];
        this.translate_gizmos = [];
        this.rotate_gizmos = [];
        this.scale_gizmos = [];
        this.active_gizmos = [];

        this.RED =    [1.0, 0.3, 0.2];
        this.GREEN =  [0.35, 0.8, 0.46];
        this.BLUE =   [0.2, 0.56, 0.85];
        this.WHITE =  [0.8, 0.8, 0.8];

        this.RED_HOVER = [1.0, 0.5, 0.5];
        this.GREEN_HOVER = [0.5, 1.0, 0.5];
        this.BLUE_HOVER = [0.7, 0.7, 1.0];
        this.WHITE_HOVER = [1.0, 1.0, 1.0];
    
        // TODO - Issue #9
        this.main_gizmo = {
            center: null,
            radius: null,
            thickness: 2,
            click_area: 5,
            color: this.WHITE,

            // TODO: find better way, doing this as work around for updating
            // transform gizmos on render. Probably want to create a class for
            // 2D elements
            camera: null,
            object: null,
            rect: null,

            updateCenter() {
                const camera = this.camera;
                const object = this.object;
                const rect = this.rect;

                this.center = Interactions.calculateObjectCenterScreenCoord(
                    rect.width, rect.height, object, camera.proj_matrix, camera.view_matrix
                );
            }
        };

        this.interacting_with = null;
        this.is_interacting = false;
        this.display_gizmos = false;

        this.active_rotation_axis = [0,1,0];

        this.reference_scale = ref_scale;
        this.reference_distance = ref_distance;

        this.start_pos;
        this.start_pos2;

        this.axis = null;
        this.prev_axis = this.axis;

        // events
        this.objectChange_event = {type: "objectChange"};
        this.axisChange_event = {type: "axisChange"};

        this.initGizmoObjects(MeshesObj);
        this.setMode();
    }

    setMode(mode = "translate") {
        this.mode = mode;
        switch(mode) {
        case "translate":
            this.active_gizmos = this.translate_gizmos;
            this.main_gizmo.radius = 18;
            break;
        case "rotate":
            this.active_gizmos = this.rotate_gizmos;
            this.main_gizmo.radius = 90;
            break;
        case "scale":
            this.active_gizmos = this.scale_gizmos;
            this.main_gizmo.radius = 90;
            break;
        default:
            this.mode = "translate";
            console.error("No valid mode provided");
        }
    }

    initGizmoObjects(meshes) {
        // translate
        const x_trans = new TransformControlsObjects("x_trans", meshes.translate_gizmo, [0,0,0],
            Array(3).fill(this.reference_scale), [0,0,-90], this.RED, false);

        const y_trans = new TransformControlsObjects("y_trans", meshes.translate_gizmo, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0], this.GREEN, false);

        const z_trans = new TransformControlsObjects("z_trans", meshes.translate_gizmo, [0,0,0],
            Array(3).fill(this.reference_scale), [90,0,0], this.BLUE, false);

        // rotate
        const x_rotate = new TransformControlsObjects("x_rotate", meshes.rotate_gizmo3, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,-90], this.RED, false);

        const y_rotate = new TransformControlsObjects("y_rotate", meshes.rotate_gizmo3, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0], this.GREEN, false);
    
        const z_rotate = new TransformControlsObjects("z_rotate", meshes.rotate_gizmo3, [0,0,0], 
            Array(3).fill(this.reference_scale), [90,0,0], this.BLUE, false)

        // scale
        const x_scale = new TransformControlsObjects("x_scale", meshes.scale_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [0, 0, -90], this.RED, false)
    
        const y_scale = new TransformControlsObjects("y_scale", meshes.scale_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0], this.GREEN, false);

        const z_scale = new TransformControlsObjects("z_scale", meshes.scale_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [90,0,0], this.BLUE, false)

        this.translate_gizmos.push(x_trans, y_trans, z_trans);
        this.rotate_gizmos.push(x_rotate, y_rotate, z_rotate);
        this.scale_gizmos.push(x_scale, y_scale, z_scale);

        this.gizmos.push(x_trans, y_trans, z_trans,
                          x_rotate, y_rotate, z_rotate,
                          x_scale, y_scale, z_scale);
    }


    isIntersectingGizmo(mouse_pos) {
        const dist = vec2.length(vec2.subtract([], mouse_pos, this.main_gizmo.center));

        if (this.mode === "translate") {
            if (dist <= this.main_gizmo.radius + this.main_gizmo.click_area) return true;
            return false;
        } else {
            if (dist >= this.main_gizmo.radius - this.main_gizmo.click_area - this.main_gizmo.thickness && 
                dist <= this.main_gizmo.radius + this.main_gizmo.click_area ) return true;
            return false
        }
    }

    // TODO: requires more code than needed because of the way I name things.
    // Ideally just do this.axis = object.name.
    handleHover(raycaster, point) {

        if (this.isIntersectingGizmo(point)) {
            this.prev_axis = this.axis;
            this.axis = "xyz";
            this.main_gizmo.color = this.WHITE_HOVER;
            return;
        } else {
            this.main_gizmo.color = this.WHITE;
        }

        const intersections = raycaster.getIntersections(this.active_gizmos);

        // TODO - Issue #6: Should only highlight the closest handle
        if (intersections.length > 0) {
            const object = intersections[0];
            this.prev_axis = this.axis;

            if (object.name.includes("x")) {
                this.axis = "x";
                object.color = this.RED_HOVER;
            }
            else if (object.name.includes("y")) {
                this.axis = "y";
                object.color = this.GREEN_HOVER;
            }
            else if (object.name.includes("z")) {
                this.axis = "z";
                object.color = this.BLUE_HOVER;
            }
        } else {
            this.active_gizmos[0].color = this.RED;
            this.active_gizmos[1].color = this.GREEN;
            this.active_gizmos[2].color = this.BLUE;
            this.prev_axis = this.axis;
            this.axis = null;
        }
    }

    mouseDown = (event) => {

        if (!this.display_gizmos || event.button !== 0) return;

        const camera = this.camera;
        const object = this.object;
        const rect = this.#dom_element.getBoundingClientRect();

        const mouse_x = event.offsetX;
        const mouse_y = event.offsetY;

        const point_ndc = getMousePositionNDC(this.#dom_element, mouse_x, mouse_y);

        raycaster.setFromCamera(point_ndc, camera);

        if (this.isIntersectingGizmo([mouse_x, rect.height - mouse_y])) {
            this.start_pos = Interactions.calculatePlaneIntersectionPoint2(
                raycaster.ray, camera.dir, object.pos
            );

            if (this.mode === "scale") {
                this.start_pos2 = this.start_pos;
                this.start_pos = object.pos;
            }

            this.is_interacting = true;
            this.interacting_with = "2d_gizmo";
        } else {
            const intersections = raycaster.getIntersections(this.active_gizmos);

            if (intersections.length > 0) {
                this.start_pos = Interactions.calculatePlaneIntersectionPoint2(
                    raycaster.ray, camera.dir, object.pos
                );

                this.is_interacting = true;
                this.interacting_with = intersections[0].name;
            }
        }

        this.#dom_element.addEventListener("mouseup", this.mouseUp);
        this.#dom_element.addEventListener("mousemove", this.mouseMove);
    }

    mouseUp = (event) => {
        this.#dom_element.removeEventListener("mouseup", this.mouseUp);
        this.#dom_element.removeEventListener("mousemove", this.mouseMove);
    }

    mouseMove = (event) => {
        const camera = this.camera;
        const object = this.object;

        const point_ndc = getMousePositionNDC(this.#dom_element, event.offsetX, event.offsetY);

        raycaster.setFromCamera(point_ndc, camera);

        if (this.is_interacting) {
            const target = this.interacting_with;
            const new_pos = Interactions.calculatePlaneIntersectionPoint2(raycaster.ray, camera.dir, object.pos);

            if (this.mode === "translate") {
                let translate_vector = [...object.pos];

                if (target === "2d_gizmo") {
                    const pos_offset = vec3.subtract([], new_pos, this.start_pos);
                    translate_vector = vec3.add([], object.last_static_transform.pos, pos_offset);
                } else {
                    const axis_map = {x_trans: 0, y_trans: 1, z_trans: 2};
                    const axis = axis_map[target];
                    translate_vector[axis] = object.last_static_transform.pos[axis] + new_pos[axis] - this.start_pos[axis];
                }

                object.updatePos(translate_vector);
            } else if (this.mode === "scale") {
                let scale_vector = [...object.scale];

                if (target === "2d_gizmo") {
                    const circle_radius = vec3.distance(this.start_pos2, this.start_pos); 
                    const scaling_factor = vec3.distance(this.start_pos, new_pos) / circle_radius;
                    scale_vector = vec3.scale([], object.last_static_transform.scale, scaling_factor);
                } else {
                    // TODO - Issue #5: Scaling along an axis after a rotation does not scale in the "expected" direction
                    const axis_map = {x_scale: 0, y_scale: 1, z_scale: 2};
                    const axis = axis_map[target];
                    scale_vector[axis] = object.last_static_transform.scale[axis] + (new_pos[axis] - this.start_pos[axis]) * object.last_static_transform.scale[axis];
                }
                
                object.updateScale(scale_vector);
            } else if (this.mode === "rotate") {
                let rotate_vector2 = [...object.rotation_angles];

                if (target === "2d_gizmo") {
                    // TODO - Issue #4: the object will snap to a different angle if rotated after moving the camera after an initial rotation
                    const angle = Math.atan2(vec3.dot(camera.dir, 
                        vec3.cross([], this.start_pos, new_pos)), vec3.dot(this.start_pos, new_pos)) * 180 / Math.PI;  

                    object.rotateOnAxis(angle, camera.dir);
                    return;
                } else {
                    const axis_map = {x_rotate: 0, y_rotate: 1, z_rotate: 2};
                    const axis = axis_map[target];
                    rotate_vector2[axis] = object.last_static_transform.rotation[axis] + (new_pos[axis] - this.start_pos[axis]) * 180 / Math.PI
                }
                
                object.updateRot(rotate_vector2);
            }

            this.dispatchEvent(this.objectChange_event);
        }
    }

    mouseHover = (event) => {
        const camera = this.camera;
        const rect = this.#dom_element.getBoundingClientRect();

        const mouse_x = event.offsetX;
        const mouse_y = event.offsetY;

        const point_ndc = getMousePositionNDC(this.#dom_element, mouse_x, mouse_y);

        if (!this.display_gizmos || this.is_interacting) return;

        raycaster.setFromCamera(point_ndc, camera);
        this.handleHover(raycaster, [mouse_x, rect.height - mouse_y]);

        if (this.prev_axis !== this.axis) {
            this.dispatchEvent(this.axisChange_event);
        }
    }

    attachObject(object) {
        this.object = object;
        this.display_gizmos = true;


        // TODO: part of the jank for the gizmos, this is 
        // the best place to set all properties needed
        // until I find a better way to do it.
        if (true) {
            const camera = this.camera;
            const rect = this.#dom_element.getBoundingClientRect();

            this.main_gizmo.camera = camera;
            this.main_gizmo.object = object;
            this.main_gizmo.rect = rect;

            this.gizmos.forEach(gizmo => {
                gizmo.object = object;
                gizmo.camera = camera;
            });
        }
    }

    detachObject() {
        this.object = null;
        this.display_gizmos = false;
    }



    connect(dom_element) {
        if (this.#dom_element !== null) this.disconnect();

        this.#dom_element = dom_element;

        this.#dom_element.addEventListener("mousedown", this.mouseDown);
        this.#dom_element.addEventListener("mousemove", this.mouseHover);
    }

    disconnect() {
        this.#dom_element.removeEventListener("mousedown", this.mouseDown);
        this.#dom_element.addEventListener("mousemove", this.mouseHover);

        this.#dom_element = null;
    }
}


// helper functions

function getMousePositionNDC(dom_element, x, y) {
    const rect = dom_element.getBoundingClientRect();
    const x_ndc = (2 * x) / rect.width - 1;
    const y_ndc = 1 - (2 * y) / rect.height;

    return {x: x_ndc, y: y_ndc}; 
}


// TESTING SOMETHING OUT

// The way three.js does it is way different, im essentially creating
// a wrapper object where it seems like they create a 
// parent object
class TransformControlsObjects extends SceneObject {

    constructor(
        name = "object",
        mesh,
        pos = [0,0,0],
        scale = [1,1,1],
        rotation_angles = [0,0,0],
        
        color,
        depth_test = true
    ) {
        super(name, mesh, pos, scale, rotation_angles, color, depth_test);

        this.reference_distance = 10;
        this.reference_scale = 0.8;

        // references to the target object and camera, used to update the model matrix
        this.camera = null;
        this.object = null;
    }

    updateModelMatrix() {
        const camera = this.camera;
        const object = this.object;

        // For some reason camera and object are set to undefined
        if (camera  && object) {
            const distance_to_object = vec3.distance(camera.pos, object.pos);
            const scale = (distance_to_object / this.reference_distance) * this.reference_scale;

            this.updatePos(object.pos);
            this.updateScale([scale, scale, scale]);
        }

        super.updateModelMatrix();
    }

}