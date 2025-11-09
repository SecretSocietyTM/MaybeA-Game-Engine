const glm = glMatrix; // shorten math library name,
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import SceneObject from "./SceneObject.js";


export default class TransformGizmos {
    constructor(meshes, ref_scale, ref_distance) {
        this.objects = [];
        this.translate_objects = [];
        this.rotate_objects = [];
        this.scale_objects = [];
        this.active_objects = [];

        this.RED =    [1.0, 0.3, 0.2];
        this.GREEN =  [0.35, 0.8, 0.46];
        this.BLUE =   [0.2, 0.56, 0.85];
        this.WHITE =  [0.85, 0.85, 0.85];

        this.RED_HOVER = [1.0, 0.5, 0.5];
        this.GREEN_HOVER = [0.5, 1.0, 0.5];
        this.BLUE_HOVER = [0.7, 0.7, 1.0];
        this.WHITE_HOVER = [1.0, 1.0, 1.0];

        this.main_gizmo = {
            center: null,
            radius: null,
            color: this.WHITE
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
            this.main_gizmo.radius = 18;
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
            Array(3).fill(this.reference_scale), [0,0,-90], this.RED);

        const y_trans = new SceneObject("y_trans", meshes.translate_gizmo, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0], this.GREEN);

        const z_trans = new SceneObject("z_trans", meshes.translate_gizmo, [0,0,0],
            Array(3).fill(this.reference_scale), [90,0,0], this.BLUE);

        // rotate
        const x_rotate = new SceneObject("x_rotate", meshes.rotate_gizmo3, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,-90], this.RED);

        const y_rotate = new SceneObject("y_rotate", meshes.rotate_gizmo3, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0], this.GREEN);
    
        const z_rotate = new SceneObject("z_rotate", meshes.rotate_gizmo3, [0,0,0], 
            Array(3).fill(this.reference_scale), [90,0,0], this.BLUE)

        // scale
        const x_scale = new SceneObject("x_scale", meshes.scale_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [0, 0, -90], this.RED)
    
        const y_scale = new SceneObject("y_scale", meshes.scale_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0], this.GREEN);

        const z_scale = new SceneObject("z_scale", meshes.scale_gizmo2, [0,0,0], 
            Array(3).fill(this.reference_scale), [90,0,0], this.BLUE)

        this.translate_objects.push(x_trans, y_trans, z_trans);
        this.rotate_objects.push(x_rotate, y_rotate, z_rotate);
        this.scale_objects.push(x_scale, y_scale, z_scale);

        this.objects.push(x_trans, y_trans, z_trans,
                          x_rotate, y_rotate, z_rotate,
                          x_scale, y_scale, z_scale);
    }

    updateGizmosPos(selected_object) {
       this.objects.forEach(object => object.updatePos(selected_object.pos)); 
    }

    // distance from camera to selected object
    updateGizmosScale(distance) {
        const scale = (distance / this.reference_distance) * this.reference_scale;
        this.objects.forEach(object => object.updateScale([scale, scale, scale]));
    }

    isIntersectingGizmo(mouse_pos) {
        const dist = vec2.length(vec2.subtract([], mouse_pos, this.main_gizmo.center));

        if (this.mode === "translate") {
            if (dist <= this.main_gizmo.radius + 5) return true;
            return false;
        } else {
            if (dist >= this.main_gizmo.radius - 5 - 2 && 
                dist <= this.main_gizmo.radius + 5 ) return true;
            return false
        }
    }

    hoverColorChange(mouse_pos, ray) {
        if (this.display_gizmos && !this.is_interacting) {

            this.main_gizmo.color = this.isIntersectingGizmo(mouse_pos) ? this.WHITE_HOVER : this.WHITE;

            this.active_objects.forEach(object => {
                if (object.aabb.isIntersecting(ray)) {
                    if (object.name.includes("x")) object.assignColor(this.RED_HOVER);
                    else if (object.name.includes("y")) object.assignColor(this.GREEN_HOVER);
                    else if (object.name.includes("z")) object.assignColor(this.BLUE_HOVER);                    
                } else {
                    if (object.name.includes("x")) object.assignColor(this.RED);
                    else if (object.name.includes("y")) object.assignColor(this.GREEN);
                    else if (object.name.includes("z")) object.assignColor(this.BLUE);    
                }
            })
        }
    }
}