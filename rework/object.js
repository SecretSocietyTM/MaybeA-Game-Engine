const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import AxisAlignedBoundingBox from "./axisalignedboundingbox.js";
import AxisAlignedBoundingBox2 from "./axisalignedboundingbox2.js";

export default class Object {
    constructor(name = "object",
              pos = [0, 0, 0],
              scale = [1, 1, 1],
              rotation_angles = [0,0,0]) {

        this.name = name;
        this.transform(pos, scale, rotation_angles);
    }

    assignMesh(mesh) {
        this.mesh = mesh;
    }

    assignVao(vao) {
        this.vao = vao;
    }

    transform(pos = [0, 0, 0], 
              scale = [1, 1, 1], 
              rotation_angles = [0,0,0]) {
        this.pos = pos;
        this.scale = scale;
        this.rotation_angles = rotation_angles;

        this.model_matrix = mat4.create();
        mat4.translate(this.model_matrix, this.model_matrix, pos);
        mat4.rotateX(this.model_matrix, this.model_matrix, rotation_angles[0]);
        mat4.rotateY(this.model_matrix, this.model_matrix, rotation_angles[1]);
        mat4.rotateZ(this.model_matrix, this.model_matrix, rotation_angles[2]);
        mat4.scale(this.model_matrix, this.model_matrix, scale);
    }

    updatePos(pos) {
        this.transform(pos, this.scale, this.rotation_angles);

        if ("aabb" in this) {
            this.aabb.updateAABBPos(this.pos);
            this.aabb.updateModelMatrix(this.model_matrix);
            this.aabb.convertVerticesLocalToWorld();
            this.aabb.getWorldAABB();
            this.aabb.getAABBVertices();
        }
    }

    updateRot(rotation_angles) {
        this.transform(this.pos, this.scale, rotation_angles);

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
        this.transform(this.pos, scale, this.rotation_angles);

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

    generateAABB2() {
        this.aabb = new AxisAlignedBoundingBox2(
            this.mesh.vertices, this.model_matrix, this.pos);
    }
}