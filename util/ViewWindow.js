const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Camera from "./Camera.js";

export default class ViewWindow {
    constructor(id, window, canvas) {
        this.id = id;
        this.window = window;
        
        // TODO: allow for customizable height...
        this.window.style.width = "800px";
        this.window.style.height = "600px";

        this.canvas = canvas;

        this.rect = window.getBoundingClientRect();
        this.left = this.rect.left;
        this.bottom = this.canvas.clientHeight - this.rect.bottom;
        this.width = this.rect.width;
        this.height = this.rect.height;

        // [0,0,10]
        this.camera = new Camera([10,0,0], [0,0,0], [0,1,0]);

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
        this.show_AABB = false;
    }

    // TODO: don't create a new camera, just update the pos of the existing one
    moveCamera(pos) {
        this.camera = new Camera(pos, [0,0,0], [0,1,0]);
    }
}