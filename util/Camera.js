const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

// TODO: camera class should probably have the view matrix as a property
// which is passed to things that need it.

export default class Camera {
    constructor(pos, target, up) {
        this.pos = pos;
        this.target = target;
        this.up = up;
        this.dir = vec3.normalize([], vec3.subtract([], this.pos, this.target));
        this.right = vec3.normalize([], vec3.cross([], this.up, this.dir));

        this.yaw = 90;
        this.pitch = 0;
        this.zoom_val = 10;
    }

    // TODO: because the CAM_UP vector is not modified in orbitCamera, panning "up" 
    // will just move the camera up or down depending on the current CAM_UP vector
    // instead of based on what is up or down relative to the screen.
    pan(dx, dy, sens = 0.05) {
        this.pos = vec3.subtract([], this.pos, vec3.scale([], vec3.normalize([], this.right), dx * sens));
        this.pos = vec3.subtract([], this.pos, vec3.scale([], vec3.normalize([], this.up), dy * sens));
        this.target = vec3.add([], this.pos, vec3.scale([], this.dir, -this.zoom_val));
    }

    // TODO: fix. Very buggy, sometimes it will flip correctly, other times it doesnt.
    // Also when hitting 90 degrees there is a single frame in which the objects are flipped
    orbit(dx, dy, sens = 1) {
        this.yaw   += dx * sens;
        this.pitch += dy * sens;

        this.pos[0] = this.target[0] + Math.cos(glm.glMatrix.toRadian(this.yaw)) * Math.cos(glm.glMatrix.toRadian(this.pitch)) * this.zoom_val;
        this.pos[1] = this.target[1] + Math.sin(glm.glMatrix.toRadian(this.pitch)) * this.zoom_val;
        this.pos[2] = this.target[2] + Math.sin(glm.glMatrix.toRadian(this.yaw)) * Math.cos(glm.glMatrix.toRadian(this.pitch)) * this.zoom_val;

        this.dir = vec3.normalize([], vec3.subtract([], this.pos, this.target));
        this.right = vec3.normalize([], vec3.cross([], this.up, this.dir));
        if (Math.abs(this.pitch) % 180 === 90) {
            vec3.negate(this.up, this.up);
        }
    }

    zoom(dy) {
        if (dy > 0) {
            this.zoom_val++;
            this.pos = vec3.add([], this.pos, vec3.normalize([], this.dir));
        } else {
            this.zoom_val--;
            this.pos = vec3.subtract([], this.pos, vec3.normalize([], this.dir));
        }
    }
}