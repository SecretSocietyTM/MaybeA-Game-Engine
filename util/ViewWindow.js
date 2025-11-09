const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Camera from "./Camera.js";

export default class ViewWindow {
    constructor(id, window, canvas, width = 800, height = 600) {
        this.id = id;
        this.window = window;
        this.canvas = canvas;
        
        // TODO: allow for customizable height...
        this.window.style.width = `${width}px`;
        this.window.style.height = `${height}px`;

        this.left = null;
        this.bottom = null;
        this.width = width;
        this.height = height;


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
        this.show_AABB = false;
    }

    setBoundingRect() {
        const rect = this.window.getBoundingClientRect();
        this.left = rect.left;
        this.bottom = this.canvas.clientHeight - rect.bottom;
    }
}