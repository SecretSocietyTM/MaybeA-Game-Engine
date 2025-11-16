const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Camera from "./util2/Camera.js";
import { CameraControls } from "./util2/CameraControls.js";
import TransformGizmos from "../../util/TransformGizmos.js";

import * as Interactions from "../../util/interactions.js";

export class ViewWindow {
    constructor(editor, dom_element, width = 800, height = 600) {
        this.editor = editor;
        this.dom_element = dom_element;
        this.renderer = editor.renderer;
        this.canvas = editor.canvas;
        
        this.dom_element.style.width = `${width}px`;
        this.dom_element.style.height = `${height}px`;

        const rect = this.dom_element.getBoundingClientRect();
        this.left = rect.left;
        this.bottom = this.canvas.clientHeight - rect.bottom;
        this.width = width;
        this.height = height;

        this.camera = new Camera([5,5,5], [0,0,0], [0,1,0]);
        this.editor.current_ray.origin = this.camera.pos;

        // TODO: ideally view_mat and proj_mat are combined, aka proj mat is applied within the camera object
        this.proj_matrix = mat4.create();
        mat4.perspective(
            this.proj_matrix, 
            glm.glMatrix.toRadian(45), 
            (this.width / this.height), 
            0.1, 1000
        );

        this.objects = editor.scene_objects;

        // TODO: remove
        this.show_gizmos = true;
        this.show_AABB = false;

        this.transform_gizmos = new TransformGizmos(editor.MeshesObj, 0.8, vec3.distance(this.camera.pos, this.camera.target));

        // ViewWindow controls
        this.connect();



        // transform gizmo controls


        // camera controls

        // TODO: might want to assign controls to the ViewWindow (this.viewWindow)
        const camera_controls = new CameraControls(this.camera);
        camera_controls.addEventListener("change", () => {
            // TODO: might want to improve the way this is handled. Ideally only update when needed (whenever a click occurs)
            this.editor.current_ray.origin = this.camera.pos;
            this.render();
        });

        camera_controls.connect(this.dom_element);
    }



    // want to do:
    // whenever the camera position or whatever changes, render

    mouseDown = (event) => {
        if (event.button !== 0) return; 

        this.dom_element.addEventListener("mouseup", this.mouseUp)
    }

    mouseUp = (event) => {
        const mouse_x = event.offsetX;
        const mouse_y = event.offsetY;

        const raycast = this.editor.current_ray

        raycast.dir = Interactions.generateRayDir(
            this.width, this.height, 
            mouse_x, mouse_y, 
            this.proj_matrix, this.camera.view_matrix
        );

        for (let object of this.objects) {
            if (object.aabb.isIntersecting(raycast)) {
                if (object === this.editor.current_selection) break;
                this.editor.current_selection = object;
                break;
            }
        }

        this.dom_element.removeEventListener("mouseup", this.mouseUp);
    }



    connect() {
        this.dom_element.addEventListener("mousedown", this.mouseDown);
    }

    disconnect() {
        this.dom_element.removeEventListener("mousedown", this.mouseDown);
    }


    render() {
        this.renderer.renderToView(this);
    }
}