const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import AxisAlignedBoundingBox from "./axisalignedboundingbox.js";

export default class Object {
    constructor(name = "object",
              pos = [0, 0, 0],
              scale = [1, 1, 1],
              rotation_axis = [0, 1, 0],
              rotation_angle = 0) {

        this.name = name;
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

        this.model_matrix = mat4.create();
        mat4.translate(this.model_matrix, this.model_matrix, pos);
        mat4.rotate(this.model_matrix, this.model_matrix, 
            glm.glMatrix.toRadian(rotation_angle), rotation_axis);
        mat4.scale(this.model_matrix, this.model_matrix, scale);
    }

    updatePos(pos) {
        this.transform(pos, this.scale, 
            this.rotation_axis, this.rotation_angle);

        if ("aabb" in this) {
            this.aabb.updateAABBPos(this.pos);
            this.aabb.updateModelMatrix(this.model_matrix);
            this.aabb.convertVerticesLocalToWorld();
            this.aabb.getWorldAABB();
            this.aabb.getAABBVertices();
        }
    }

    updateRot(axis, angle) {
        this.transform(this.pos, this.scale, axis, angle);

        // TODO: wont work visually. Translation works since that is simply
        // moving the AABB around, but rotating requires that a new AABB 
        // be calculated
        if ("aabb" in this) {
            this.aabb.updateModelMatrix(this.model_matrix);
            this.aabb.convertVerticesLocalToWorld();
            this.aabb.getWorldAABB();
            this.aabb.getAABBVertices();
        }     
    }

    updateScale(scale) {
        this.transform(this.pos, scale, this.rotation_axis, this.rotation_angle);

        // TODO: wont work visually. Translation works since that is simply
        // moving the AABB around, but scaling, especially if done on an 
        // object that has been rotated, will not produce the correct AABB
        if ("aabb" in this) {
            this.aabb.updateModelMatrix(this.model_matrix);
            this.aabb.convertVerticesLocalToWorld();
            this.aabb.getWorldAABB();
            this.aabb.getAABBVertices();
        }          
        
    }

    generateAABB() {
        this.aabb = new AxisAlignedBoundingBox(
            this.mesh.vertices, this.model_matrix, this.pos);
    }
}