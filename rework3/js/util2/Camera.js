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

        this.view_matrix = mat4.create();
        mat4.lookAt(this.view_matrix, this.pos, this.dir, this.up);
    }

    recalculateViewMatrix() {
        mat4.lookAt(this.view_matrix, this.pos, this.target, this.up);
    }
}