const glm = glMatrix; // shorten math library name,
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import MeshesObj from "../../../mimp/models/meshes_index.js";
import SceneObject from "../../../util/SceneObject.js";
import * as Interactions from "../../../util/interactions.js";
import EventDispatcher from "./EventDispatcher.js";

const raycaster = {
    origin: null,
    dir: null
}

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
        this.WHITE =  [0.85, 0.85, 0.85];

        this.RED_HOVER = [1.0, 0.5, 0.5];
        this.GREEN_HOVER = [0.5, 1.0, 0.5];
        this.BLUE_HOVER = [0.7, 0.7, 1.0];
        this.WHITE_HOVER = [1.0, 1.0, 1.0];
    
        this.main_gizmo = {
            center: null,
            radius: null,
            color: this.WHITE
        };

        this.interacting_with = null;
        this.is_interacting = false;
        this.display_gizmos = false;

        this.active_rotation_axis = [0,1,0];

        this.reference_scale = ref_scale;
        this.reference_distance = ref_distance;

        // events
        this.change_event = {type: "change"};

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

        this.translate_gizmos.push(x_trans, y_trans, z_trans);
        this.rotate_gizmos.push(x_rotate, y_rotate, z_rotate);
        this.scale_gizmos.push(x_scale, y_scale, z_scale);

        this.gizmos.push(x_trans, y_trans, z_trans,
                          x_rotate, y_rotate, z_rotate,
                          x_scale, y_scale, z_scale);
    }

    // TODO: new function, not sure if it will stick
    updateGizmos(screen_center, obj_center, distance) {
        this.update2DGizmoCenter(screen_center);
        if (obj_center) this.updateGizmoPos2(obj_center); // change function to take just the pos
        if (distance) this.updateGizmosScale(distance);

    }

    update2DGizmoCenter(screen_center) {
        this.main_gizmo.center = screen_center;
    }

    updateGizmoPos2(position) {
        this.gizmos.forEach(object => object.updatePos(position));
    }

    updateGizmosPos(selected_object) {
       this.gizmos.forEach(object => object.updatePos(selected_object.pos)); 
    }

    // distance from camera to selected object
    updateGizmosScale(distance) {
        const scale = (distance / this.reference_distance) * this.reference_scale;
        this.gizmos.forEach(object => object.updateScale([scale, scale, scale]));
    }

    isIntersectingGizmo(mouse_pos) {
        const dist = vec2.length(vec2.subtract([], mouse_pos, this.main_gizmo.center));

        // the magic number 5 is the "extra area" around the 2d gizmo that still counts as 
        // interacting with the gizmo, this way you don't have to be extremely accurate when
        // trying to click on the small circle outline
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

            this.active_gizmos.forEach(object => {
                if (object.aabb.isIntersecting(ray)) {
                    if (object.name.includes("x")) object.color = this.RED_HOVER;
                   else if (object.name.includes("y")) object.color = this.GREEN_HOVER;
                    else if (object.name.includes("z")) object.color = this.BLUE_HOVER;
                } else {
                    if (object.name.includes("x")) object.color = this.RED;
                    else if (object.name.includes("y")) object.color = this.GREEN;
                    else if (object.name.includes("z")) object.color = this.BLUE;    
                }
            })
        }
    }


    mouseDown = (event) => {
        this.#dom_element.addEventListener("mouseup", this.mouseUp);
        this.#dom_element.addEventListener("mousemove", this.mouseMove);

        
    }

    mouseUp = (event) => {
        this.#dom_element.removeEventListener("mouseup", this.mouseUp);
    }

    mouseMove = (event) => {

    }

    mouseHover = (event) => {
        const mouse_x = event.offsetX;
        const mouse_y = event.offsetY;

        const camera = this.camera;
        const rect = this.#dom_element.getBoundingClientRect();

        raycaster.origin = this.camera.pos;
        raycaster.dir = Interactions.generateRayDir(
            rect.width, rect.height, 
            mouse_x, mouse_y, 
            camera.proj_matrix, camera.view_matrix
        );
        
        this.hoverColorChange([mouse_x, rect.height - mouse_y], raycaster);
        
        // TODO: not the best way to do this, remove after some consideration
        this.dispatchEvent(this.change_event);
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