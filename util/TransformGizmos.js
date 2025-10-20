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
    constructor(meshes, ref_scale, ref_distance) {
        this.objects = [];
        this.translate_objects = [];
        this.rotate_objects = [];
        this.scale_objects = [];
        this.active_objects = [];

        this.main_gizmo = {
            center: null,
            radius: null,
        }

        this.interaction_with = null;
        this.is_interacting = false;
        this.display_gizmos = false;

        this.active_rotation_axis = [0,1,0];

        this.reference_scale = ref_scale;
        this.reference_distance = ref_distance;

        this.initGizmoObjects(meshes);
        this.setMode();
    }

    setMode(mode = "translate") {
        this.mode = mode;
        switch(mode) {
            case "translate":
                this.active_objects = this.translate_objects;
                this.main_gizmo.radius = 15;
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

    initGizmoObjects(meshes) {
        // translate
        const x_trans = new SceneObject("x_trans", meshes.translate_gizmo, [0,0,0],
            Array(3).fill(this.reference_scale), [0,0,-90]);

        const y_trans = new SceneObject("y_trans", meshes.translate_gizmo, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0]);

        const z_trans = new SceneObject("z_trans", meshes.translate_gizmo, [0,0,0],
            Array(3).fill(this.reference_scale), [90,0,0]);

        // rotate
        /* const x_rotate = new SceneObject("x_rotate", meshes.rotate_gizmo, [0,0,0], 
            Array(3).fill(this.reference_scale), [90,0,90]);

        const y_rotate = new SceneObject("y_rotate", meshes.rotate_gizmo, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,-45,0]);
    
        const z_rotate = new SceneObject("z_rotate", meshes.rotate_gizmo, [0,0,0], 
            Array(3).fill(this.reference_scale), [90,0,0]) */

        // Better UI but needs improvement:
        // scale AABB, dynamic rotation to face camera
        /* const x_rotate = new SceneObject("x_rotate", meshes.rotate_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0]);

        const y_rotate = new SceneObject("y_rotate", meshes.rotate_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,90]);
    
        const z_rotate = new SceneObject("z_rotate", meshes.rotate_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,90,0]) */

        // Simpler rotation gizmos
        const x_rotate = new SceneObject("x_rotate", meshes.rotate_gizmo3, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,-90]);

        const y_rotate = new SceneObject("y_rotate", meshes.rotate_gizmo3, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0]);
    
        const z_rotate = new SceneObject("z_rotate", meshes.rotate_gizmo3, [0,0,0], 
            Array(3).fill(this.reference_scale), [90,0,0])

        // scale
        const x_scale = new SceneObject("x_scale", meshes.scale_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [0, 0, -90])
    
        const y_scale = new SceneObject("y_scale", meshes.scale_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0]);

        const z_scale = new SceneObject("z_scale", meshes.scale_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [90,0,0])

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
    }

    updateGizmosPos(selected_object) {
       this.objects.forEach(object => {
            object.updatePos(selected_object.pos);
        }); 
    }

    isIntersectingGizmo(mouse_pos, view) {
        const dist = vec2.length(vec2.subtract([], mouse_pos, this.main_gizmo.center));

        if (this.mode === "translate") {
            if (dist <= this.main_gizmo.radius) return true;
            return false;
        } else {
            if (dist >= this.main_gizmo.radius - 10 - 2 && 
                dist <= this.main_gizmo.radius + 10 ) return true;
            return false
        }
    }
}