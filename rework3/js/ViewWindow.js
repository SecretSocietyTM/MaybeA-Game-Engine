const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Camera from "./util2/Camera.js";
import { CameraControls } from "./util2/CameraControls.js";
import TransformGizmos from "../../util/TransformGizmos.js";

export class ViewWindow {
    constructor(editor, dom_element, width = 800, height = 600) {
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

        // TODO: ideally view_mat and proj_mat are combined, aka proj mat is applied within the camera object
        this.proj_matrix = mat4.create();
        mat4.perspective(
            this.proj_matrix, 
            glm.glMatrix.toRadian(45), 
            (this.width / this.height), 
            0.1, 1000
        );

        this.transform_gizmos = new TransformGizmos(editor.MeshesObj, 0.8, vec3.distance(this.camera.pos, this.camera.target));

        this.objects = editor.scene_objects;

        // TODO: remove
        this.show_gizmos = true;
        this.show_AABB = false;

        // TODO: might want to assign controls to the ViewWindow
        const camera_controls = new CameraControls(this.camera);
        camera_controls.addEventListener("change", () => {
            this.render();
        });


        camera_controls.connect(this.dom_element);
    }



    // want to do:
    // whenever the camera position or whatever changes, render

    render() {
        this.renderer.renderToView(this);
    }
}