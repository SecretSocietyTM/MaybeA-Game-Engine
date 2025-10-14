const glm = glMatrix; // shorten math library name,
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import AxisAlignedBoundingBox from "./AxisAlignedBoundingBox.js";

// TODO: make all properties that can be on a SceneObject null in the constructor
export default class SceneObject {
    constructor(name = "object",
              pos = [0, 0, 0],
              scale = [1, 1, 1],
              rotation_angles = [0,0,0],
              mesh, vao, aabb_vao) {

        this.name = name;
        this.is_interactable = true;
        this.transform(pos, scale, rotation_angles);

        if(!mesh || !vao || !aabb_vao) {
            console.error("Please provide the constructor with a mesh, vao, and an aabb vao");
        }

        this.assignMesh(mesh);
        this.assignVao(vao);
        this.generateAABB();
        this.aabb.assignVao(aabb_vao);

        this.last_static_transform = null;
        this.setLastStaticTransform();
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
        mat4.rotateX(this.model_matrix, this.model_matrix, glm.glMatrix.toRadian(rotation_angles[0]));
        mat4.rotateY(this.model_matrix, this.model_matrix, glm.glMatrix.toRadian(rotation_angles[1]));
        mat4.rotateZ(this.model_matrix, this.model_matrix, glm.glMatrix.toRadian(rotation_angles[2]));
        mat4.scale(this.model_matrix, this.model_matrix, scale);
    }

    setLastStaticTransform() {
        this.last_static_transform = {
            pos: this.pos, 
            scale: this.scale,
            rotation: this.rotation_angles};
    }

    updatePos(pos) {
        this.transform(pos, this.scale, this.rotation_angles);

        if ("aabb" in this) {
            this.aabb.updateModelMatrix(this.model_matrix);
            this.aabb.convertVerticesLocalToWorld();
            this.aabb.getWorldAABB();
            this.aabb.getAABBModelMatrixForRendering();
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
            this.aabb.getAABBModelMatrixForRendering();
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
            this.aabb.getAABBModelMatrixForRendering();
        }          
        
    }

    // if no argument provided, toggle
    isInteractable(is_interactable = null) {
        if (!is_interactable) {
            this.is_interactable = !this.is_interactable;
            return;
        }
        this.is_interactable = is_interactable;
    }

    generateAABB() {
        this.aabb = new AxisAlignedBoundingBox(
            this.mesh.vertices, this.model_matrix, this.pos);
    }
}