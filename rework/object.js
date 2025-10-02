const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

export default class Object {
    constructor(pos = [0, 0, 0],
              scale = [1, 1, 1],
              rotation_axis = [0, 1, 0],
              rotation_angle = 0) {

        this.model_matrix = mat4.create();
        this.transform(pos, scale, rotation_axis, rotation_angle);
    }

    assignMesh(mesh) {
        this.mesh = mesh;
    }

    assignVao(vao) {
        this.vao = vao;
    }

    transform(pos = [0, 0, 0], 
              scale = [1, 1, 1], 
              rotation_axis = [0, 1, 0], 
              rotation_angle = 0) {
        this.pos = pos;
        this.scale = scale;
        this.rotation_axis = rotation_axis;
        this.rotation_angle = rotation_angle;

        mat4.translate(this.model_matrix, this.model_matrix, pos);
        mat4.rotate(this.model_matrix, this.model_matrix, 
            glm.glMatrix.toRadian(rotation_angle), rotation_axis);
        mat4.scale(this.model_matrix, this.model_matrix, scale);
    }
}