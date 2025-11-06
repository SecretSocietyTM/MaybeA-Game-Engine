const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

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

        this.view_matrix = mat4.create();
        mat4.lookAt(this.view_matrix, this.pos, this.dir, this.up);
    }

    // TODO - Issue #7
    pan(dx, dy, sens = 0.05) {
        this.pos = vec3.subtract([], this.pos, vec3.scale([], vec3.normalize([], this.right), dx * sens));
        this.pos = vec3.subtract([], this.pos, vec3.scale([], vec3.normalize([], this.up), dy * sens));
        this.target = vec3.add([], this.pos, vec3.scale([], this.dir, -this.zoom_val));
    }

    // TODO - Issue #7
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

    recalculateViewMatrix() {
        mat4.lookAt(this.view_matrix, this.pos, vec3.subtract([], this.pos, this.dir), this.up);
    }
}