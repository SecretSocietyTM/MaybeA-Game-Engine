const glm = glMatrix; // shorten math library name,
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import AxisAlignedBoundingBox from "./AxisAlignedBoundingBox.js";

export default class SceneObject {

    constructor(
        name = "object",
        mesh,
        pos = [0,0,0],
        scale = [1,1,1],
        rotation_angles = [0,0,0],
    ) {         
        if(!mesh) {
            throw new Error("Please provide the constructor with a mesh");
        }

        this.name = name;
        this.mesh = mesh;

        this.transform(pos, scale, rotation_angles);

        this.aabb = new AxisAlignedBoundingBox(this.mesh.vertices, this.model_matrix);

        this.last_static_transform = null;
        this.setLastStaticTransform();

        this.use_color = false;
        this.color = [0.8, 0.8, 0.8];
        this.alpha = 1.0;
    }

    useColor(bool) {
        this.use_color = bool;
    }

    assignColor(color) {
        this.color = color;
    }

    assignAlpha(alpha) {
        this.alpha = alpha;
    }

    // TODO: need to NORMALIZE the position of the object at (0,0,0) so that imported models that are offcenter, like weird_cube have their actual model positioned at (0,0,0);
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

        if ("aabb" in this) this.aabb.updateAABB(this.model_matrix);
    }

    transformTargetTo(pos, target, up, scale = [1,1,1]) {
        this.pos = pos;
        this.scale = scale;

        // Create the base orientation matrix that makes the object look at 'target'
        this.model_matrix = mat4.create();
        mat4.targetTo(this.model_matrix, pos, target, up);

        // --- Apply a 180° rotation around Y to flip the model ---
        const flip = mat4.create();
        mat4.rotateY(flip, flip, Math.PI); // 180° in radians
        mat4.multiply(this.model_matrix, this.model_matrix, flip);

        // --- Apply scaling ---
        mat4.scale(this.model_matrix, this.model_matrix, scale);

        if (this.aabb !== null) this.aabb.updateAABB(this.model_matrix);
    }

    rotateOnAxis(angle, axis) {
        this.model_matrix = mat4.create();
        mat4.translate(this.model_matrix, this.model_matrix, this.pos);
        mat4.rotate(this.model_matrix, this.model_matrix, glm.glMatrix.toRadian(angle), axis);
        mat4.scale(this.model_matrix, this.model_matrix, this.scale);

        if ("aabb" in this) this.aabb.updateAABB(this.model_matrix);
    }

    setLastStaticTransform() {
        this.last_static_transform = {
            pos: this.pos, 
            scale: this.scale,
            rotation: this.rotation_angles};
    }

    updatePos(pos) {
        this.transform(pos, this.scale, this.rotation_angles);
    }

    updateRot(rotation_angles) {
        this.transform(this.pos, this.scale, rotation_angles);
    }

    updateScale(scale) {
        this.transform(this.pos, scale, this.rotation_angles);
    }

    repelFrom(object) {
        if (!this.aabb.isColliding(object.aabb)) return;

        const penetration = this.aabb.getPenetration(object.aabb);
        const move = [0,0,0];

        if (penetration.axis === 'x') move[0] = penetration.dir * penetration.depth;
        if (penetration.axis === 'y') move[1] = penetration.dir * penetration.depth;
        if (penetration.axis === 'z') move[2] = penetration.dir * penetration.depth;

        this.updatePos(vec3.add([], this.last_static_transform.pos, move));
        this.setLastStaticTransform();
    }
}