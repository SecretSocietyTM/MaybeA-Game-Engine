const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Camera from "./Camera.js";

// TODO: window class should also store its own projection matrix
export default class ViewWindow {
    constructor(id, window, canvas) {
        this.id = id;
        this.window = window;
        this.canvas = canvas;

        this.rect = window.getBoundingClientRect();
        this.left = this.rect.left;
        this.bottom = this.canvas.clientHeight - this.rect.bottom;
        this.width = this.rect.width;
        this.height = this.rect.height;

        // the view matrix should be within the camera i think...
        this.camera = new Camera([0,0,10], [0,0,0], [0,1,0]);

        this.proj_matrix = mat4.create();
        mat4.perspective(
            this.proj_matrix, 
            glm.glMatrix.toRadian(45), 
            (this.width / this.height), 
            0.1, 1000
        );

        this.objects = [];
        this.show_gizmos = true;
        this.show_UI = true;
    }

    // TODO: don't create a new camera, just update the pos of the existing one
    moveCamera(pos) {
        this.camera = new Camera(pos, [0,0,0], [0,1,0]);
    }
}