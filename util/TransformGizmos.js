const glm = glMatrix; // shorten math library name,
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import SceneObject from "./SceneObject.js";

const RED_COLOR = [1.0, 0.3, 0.2];
const GREEN_COLOR = [0.35, 0.8, 0.46];
const BLUE_COLOR = [0.2, 0.56, 0.85];


export default class TransformGizmos {
    constructor() {
        this.objects = null;
        this.translate_objects = null;
        this.rotate_objects = null;
        this.scale_objects = null;

        this.reference_scale = null;
        this.reference_distance = null;

        // modes are:
        // t = translate
        // r = rotate
        // s = scale
        this.mode = "translate";
        this.active_objects = this.translate_objects;
        this.main_gizmo = {
            center: null,
            radius: 12,
        }

        this.interaction_with = null;
        this.is_interacting = false;
        this.display_gizmos = false;

        this.active_rotation_axis = [0,1,0];

    }

    setIsInteracting(bool) {
        this.is_interacting = bool;
    }

    setDisplayGizmos(bool) {
        this.display_gizmos = bool;
    }

    setInteractionWith(gizmo_name) {
        this.interaction_with = gizmo_name;
    }

    setActiveRotationAxis(rotation_axis) {
        this.active_rotation_axis = rotation_axis;
    }

    setMode(mode = "translate") {
        this.mode = mode;
        switch(mode) {
            case "translate":
                this.active_objects = this.translate_objects;
                this.main_gizmo.radius = 12;
                break;
            case "rotate":
                this.active_objects = this.rotate_objects;
                this.main_gizmo.radius = 90;
                break;
            case "scale":
                this.active_objects = this.scale_objects;
                this.main_gizmo.radius = 90;
                break;
            default:
                this.mode = "translate";
                console.error("No valid mode provided");
                return;
        }
    }

    setReferenceScale(reference_scale) {
        this.reference_scale = reference_scale;
    }

    setReferenceDistance(reference_distance) {
        this.reference_distance = reference_distance;
    }

    initGizmoObjects(meshes, vaos) {
        this.objects = [];
        this.translate_objects = [];
        this.rotate_objects = [];
        this.scale_objects = [];

        // translate
        const x_trans = new SceneObject("x_trans", [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,-90],
            meshes.translate_mesh, vaos.translate_vao, vaos.aabb_wireframe);

        const y_trans = new SceneObject("y_trans", [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0],
            meshes.translate_mesh, vaos.translate_vao, vaos.aabb_wireframe);

        const z_trans = new SceneObject("z_trans", [0,0,0],
            Array(3).fill(this.reference_scale), [90,0,0],
            meshes.translate_mesh, vaos.translate_vao, vaos.aabb_wireframe);

        // rotate
        const x_rotate = new SceneObject("x_rotate", [0,0,0], 
            [0.1, 0.1, 0.1], [90,0,90], 
            meshes.rotate_mesh, vaos.rotate_vao, vaos.aabb_wireframe);

        const y_rotate = new SceneObject("y_rotate", [0,0,0], 
            [0.1, 0.1, 0.1], [0,-45,0], 
            meshes.rotate_mesh, vaos.rotate_vao, vaos.aabb_wireframe);
    
        const z_rotate = new SceneObject("z_rotate", [0,0,0], 
            [0.1, 0.1, 0.1], [90,0,0], 
            meshes.rotate_mesh, vaos.rotate_vao, vaos.aabb_wireframe);

        // scale
        const x_scale = new SceneObject("x_scale", [0,0,0], 
            Array(3).fill(this.reference_scale), [0, 90, 0],
            meshes.scale_mesh, vaos.scale_vao, vaos.aabb_wireframe);
    
        const y_scale = new SceneObject("y_scale", [0,0,0], 
            Array(3).fill(this.reference_scale), [-90,0,0],
            meshes.scale_mesh, vaos.scale_vao, vaos.aabb_wireframe);

    
        const z_scale = new SceneObject("z_scale", [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0],
            meshes.scale_mesh, vaos.scale_vao, vaos.aabb_wireframe);

        this.translate_objects.push(x_trans, y_trans, z_trans);
        this.rotate_objects.push(x_rotate, y_rotate, z_rotate);
        this.scale_objects.push(x_scale, y_scale, z_scale);

        this.objects.push(x_trans, y_trans, z_trans,
                          x_rotate, y_rotate, z_rotate,
                          x_scale, y_scale, z_scale);

        x_trans.assignColor(RED_COLOR);
        x_rotate.assignColor(RED_COLOR);
        x_scale.assignColor(RED_COLOR);

        y_trans.assignColor(GREEN_COLOR);
        y_rotate.assignColor(GREEN_COLOR);
        y_scale.assignColor(GREEN_COLOR);

        z_trans.assignColor(BLUE_COLOR);
        z_rotate.assignColor(BLUE_COLOR);
        z_scale.assignColor(BLUE_COLOR);

        this.objects.forEach(object => {
            object.useColor(true);
        });

        console.log(this.objects);
    }

    translateSelectedObject(translate_vector, selected_object) {
        selected_object.updatePos(translate_vector);

        this.objects.forEach(object => {
            object.updatePos(selected_object.pos);
        });
    }

    scaleSelectedObject(scale_vector, selected_object) {
        selected_object.updateScale(scale_vector);
    }

    rotateSelectedObject(rotate_vector, selected_object) {
        selected_object.updateRot(rotate_vector);
    }

    isIntersectingGizmo(mouse_pos) {
        const dist = vec2.length(vec2.subtract([], mouse_pos, this.main_gizmo.center));

        if (this.mode === "translate") {
            if (dist <= this.main_gizmo.radius) return true;
            return false;
        } else {
            if (dist >= this.main_gizmo.radius - 4 - 2 && 
                dist <= this.main_gizmo.radius + 4 ) return true;
            return false
        }
    }
}