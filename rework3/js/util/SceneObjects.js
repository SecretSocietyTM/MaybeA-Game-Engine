const glm = glMatrix; // shorten math library name,
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import EventDispatcher from "./EventDispatcher.js";
import AxisAlignedBoundingBox from "./AxisAlignedBoundingBox.js";

const transformChange_event = {type: "transformChange"};

export default class SceneObject extends EventDispatcher {

    constructor(
        name = "object",
        mesh,
        pos = [0,0,0],
        scale = [1,1,1],
        rotation_angles = [0,0,0],
        
        color,
        depth_test = true
    ) {  
        super();

        if(!mesh) {
            throw new Error("Please provide the constructor with a mesh");
        }

        this.name = name;
        this.mesh = mesh;

        defineProperty(this, "pos", pos);
        defineProperty(this, "scale", scale);
        defineProperty(this, "rotation_angles", rotation_angles); 
        // TODO: change all instances of pos to position
        // TODO: change all instances of rotation_angles to rotation

        this.addEventListener("transformChange", () => {
            this.update_model_matrix = true;
        });

        this.update_model_matrix = true;
        this.updateModelMatrix();

        this.aabb = new AxisAlignedBoundingBox(this.mesh.vertices, this.model_matrix);

        this.last_static_transform = null;
        this.setLastStaticTransform();

        this.use_color = false;
        this.color = [0.4,0.4,0.4];
        if (color) {
            this.use_color = true;
            this.color = color;
        }

        this.visible = true;
        this.depth_test = depth_test;
        this.show_AABB = false;
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
        this.pos = pos;

    }

    updateRot(rotation_angles) {
        this.rotation_angles = rotation_angles;
    }

    updateScale(scale) {
        this.scale = scale;
    }

    // TODO: add way to determine if the object's transforms have changed
    // if not DO NOT execute this function as it is pretty calc heavy
    updateModelMatrix() {

        if (this.update_model_matrix === false) return;

        const m = mat4.create();
        
        mat4.translate(m, m, this.pos);
        mat4.rotateX(m, m, glm.glMatrix.toRadian(this.rotation_angles[0]));
        mat4.rotateY(m, m, glm.glMatrix.toRadian(this.rotation_angles[1]));
        mat4.rotateZ(m, m, glm.glMatrix.toRadian(this.rotation_angles[2]));
        mat4.scale(m, m, this.scale);

        if ("aabb" in this) this.aabb.updateAABB(m);

        this.model_matrix = m;
        this.update_model_matrix = false;
    }
}

function defineProperty(scope, prop_name, default_value) {

    let prop_value = default_value;

    Object.defineProperty(scope, prop_name, {

        get: function() { 
            return prop_value;
        },

        set: function(value) {
            if ( prop_value !== value) {
                prop_value = value;

                scope.dispatchEvent(transformChange_event);
            }
        }
    });
}