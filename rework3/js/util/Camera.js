const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

export default class Camera {
    constructor(
        fovy = 45, 
        aspect = 1, 
        near = 0.1, 
        far = 1000,
        pos = [30,0,0], 
        target = [0,0,0], 
        up = [0,1,0]
    ) {
        this.pos = pos;
        this.target = target;
        this.up = up;

        this.fovy = fovy,
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.dir = vec3.normalize([], vec3.subtract([], this.pos, this.target));
        this.right = vec3.normalize([], vec3.cross([], this.up, this.dir));

        this.view_matrix = mat4.create();
        this.updateViewMatrix();

        this.proj_matrix = mat4.create();
        mat4.perspective(this.proj_matrix, glm.glMatrix.toRadian(fovy), aspect, near, far);
    }

    focusOnTarget(target, direction, padding = 1) {

        direction = direction ? vec3.normalize([], direction) : this.dir;

        // TODO: figure out how below works / is calculated
        const distance = target.aabb.sphere_radius / Math.tan(glm.glMatrix.toRadian(this.fovy) / 2) * padding;
        const new_distance = vec3.scale([], direction, distance);

        this.pos = vec3.add([], target.aabb.center, new_distance);
        this.target = target.aabb.center;

        this.updateViewMatrix();
    }

    updateViewMatrix() {
        mat4.lookAt(this.view_matrix, this.pos, this.target, this.up);
    }
}