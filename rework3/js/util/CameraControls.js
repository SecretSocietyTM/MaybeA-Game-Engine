const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import EventDispatcher from "./EventDispatcher.js";

export class CameraControls extends EventDispatcher {

    // private fields
    #dom_element = null;
    #cur_x;
    #prev_x;
    #cur_y;
    #prev_y;

    #STATE = {NONE: -1, PAN: 0, ORBIT: 1, ZOOM: 2};
    #state = this.#STATE.NONE;

    // TODO - Issue #8
    #yaw = 0;
    #pitch = 0;
    #zoom_val;

    constructor(camera) {
        super(); // instantiate EventDispatcher
    
        this.camera = camera;

        // TODO - Issue #8
        // init yaw and pitch here
        this.#zoom_val = vec3.length(vec3.subtract([], camera.pos, camera.target));
    
        // events
        this.change_event = {type: "change"};
    }

    // TODO - Issue #7
    pan(dx, dy, sens = 0.05) {
        const camera = this.camera;

        // pan the camera
        camera.pos = vec3.subtract([], camera.pos, vec3.scale([], vec3.normalize([], camera.right), dx * sens));
        camera.pos = vec3.subtract([], camera.pos, vec3.scale([], vec3.normalize([], camera.up), dy * sens));
        camera.target = vec3.add([], camera.pos, vec3.scale([], camera.dir, -this.#zoom_val));

        // TODO: this should update on its own whenever any part of the object changes
        camera.updateViewMatrix();

        this.dispatchEvent(this.change_event)
    }

    // TODO - Issue #7
    orbit(dx, dy, sens = 1) {
        const camera = this.camera;

        this.#yaw   += dx * sens;
        this.#pitch += dy * sens;

        camera.pos[0] = camera.target[0] + Math.cos(glm.glMatrix.toRadian(this.#yaw)) * Math.cos(glm.glMatrix.toRadian(this.#pitch)) * this.#zoom_val;
        camera.pos[1] = camera.target[1] + Math.sin(glm.glMatrix.toRadian(this.#pitch)) * this.#zoom_val;
        camera.pos[2] = camera.target[2] + Math.sin(glm.glMatrix.toRadian(this.#yaw)) * Math.cos(glm.glMatrix.toRadian(this.#pitch)) * this.#zoom_val;

        camera.dir = vec3.normalize([], vec3.subtract([], camera.pos, camera.target));
        camera.right = vec3.normalize([], vec3.cross([], camera.up, camera.dir));
        if (Math.abs(this.#pitch) % 180 === 90) {
            vec3.negate(camera.up, camera.up);
        }

        // TODO: this should update on its own whenever any part of the object changes
        // For now its ok 
        camera.updateViewMatrix();

        this.dispatchEvent(this.change_event);
    }

    // TODO - Issue #7
    zoom(dy) {
        const camera = this.camera;

        if (dy > 0) {
            this.#zoom_val++;
            camera.pos = vec3.add([], camera.pos, vec3.normalize([], camera.dir));
        } else {
            this.#zoom_val--;
            camera.pos = vec3.subtract([], camera.pos, vec3.normalize([], camera.dir));
        }

        camera.updateViewMatrix();

        this.dispatchEvent(this.change_event);
    }

    // Have to bind functions using arrow functions to use proper "this"

    mouseDown = (event) => {
        this.#dom_element.addEventListener("mousemove", this.mouseMove);
        this.#dom_element.addEventListener("mouseup", this.mouseUp);

        this.#cur_x = event.offsetX;
        this.#cur_y = event.offsetY;

        if (event.button === 1 && event.shiftKey) {
            this.#state = this.#STATE.PAN;
            return;
        }
        if (event.button === 1) {
            this.#state = this.#STATE.ORBIT;
            return;
        }
    }

    mouseUp = (event) => {
        this.#dom_element.removeEventListener("mousemove", this.mouseMove);
        this.#dom_element.removeEventListener("mouseup", this.mouseUp);

        if (event.button === 1 || event.shiftKey) {
            this.#state = this.#STATE.NONE;
        }
    }

    mouseMove = (event) => {
        const mouse_x = event.offsetX;
        const mouse_y = event.offsetY;

        this.#prev_x = this.#cur_x;
        this.#prev_y = this.#cur_y;

        this.#cur_x = mouse_x;
        this.#cur_y = mouse_y;

        let x_sign = 1;
        let y_sign = 1;

        if (this.#prev_x < this.#cur_x) x_sign = 1;
        else if (this.#prev_x > this.#cur_x) x_sign = -1;
        else x_sign = 0;

        if (this.#prev_y < this.#cur_y) y_sign = 1;
        else if (this.#prev_y > this.#cur_y) y_sign = -1;
        else y_sign = 0;

        if (this.#state === this.#STATE.PAN) {
            this.pan(1 * x_sign, -1 * y_sign);
        } else if (this.#state === this.#STATE.ORBIT) {
            this.orbit(x_sign, y_sign);
        }
    }

    mouseWheel = (event) => {
        this.zoom(event.deltaY);
    }

    // connect and disconnect dom element to create event listeners

    connect(dom_element) {
        if (this.#dom_element !== null) this.disconnect();

        this.#dom_element = dom_element;

        this.#dom_element.addEventListener("mousedown", this.mouseDown);
        this.#dom_element.addEventListener("wheel", this.mouseWheel);
    }

    disconnect() {
        this.#dom_element.removeEventListener("mousedown", this.mouseDown);
        this.#dom_element.removeEventListener("wheel", this.mouseWheel);

        this.#dom_element = null
    }
}