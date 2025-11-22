const glm = glMatrix; // shorten math library name,
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import EventDispatcher from "./EventDispatcher.js";
import AxisAlignedBoundingBox from "./AxisAlignedBoundingBox.js";

const transformChange_event = {type: "transformChange"};

let id = 0;

function createId() {
    const result = id;
    id++;

    return result;
}

export default class SceneObject extends EventDispatcher {

    constructor(
        name = "object",
        mesh,
        position = [0,0,0],
        scale = [1,1,1],
        rotation = [0,0,0],
        
        color,
        depth_test = true,
    ) {  
        super();

        // TODO: for now the object's actual display name and its mesh name are the same, but in the future we will want
        // meshes to have separate names from the model.
        // This will break if i call editor.toJSON() and an object's name has been changed from the name of the 
        // model that it was created from
        this.name = name;
        this.mesh = mesh;

        this.id = createId();


        defineProperty(this, "position", position);
        defineProperty(this, "rotation", rotation);
        defineProperty(this, "scale", scale);

        this.addEventListener("transformChange", () => {
            this.update_model_matrix = true;
        });

        this.update_model_matrix = true;
        this.updateModelMatrix();

        this.aabb = new AxisAlignedBoundingBox(this.mesh.vertices, this.model_matrix);

        this.last_static_transform = null;
        this.setLastStaticTransform();

        this.color = [0.4,0.4,0.4];
        this.use_color = false;
        this.visible = true;
        this.depth_test = depth_test;
        this.show_AABB = false;

        if (color) {
            this.use_color = true;
            this.color = color;
        }
    }

    rotateOnAxis(angle, axis) {
        this.model_matrix = mat4.create();
        mat4.translate(this.model_matrix, this.model_matrix, this.position);
        mat4.rotate(this.model_matrix, this.model_matrix, glm.glMatrix.toRadian(angle), axis);
        mat4.scale(this.model_matrix, this.model_matrix, this.scale);

        if ("aabb" in this) this.aabb.updateAABB(this.model_matrix);
    }

    setLastStaticTransform() {
        this.last_static_transform = {
            position: this.position, 
            scale: this.scale,
            rotation: this.rotation};
    }

    updatePosition(position) {
        this.position = position;

    }

    updateRotation(rotation) {
        this.rotation = rotation;
    }

    updateScale(scale) {
        this.scale = scale;
    }

    updateModelMatrix() {

        if (this.update_model_matrix === false) return;

        const m = mat4.create();
        
        mat4.translate(m, m, this.position);
        mat4.rotateX(m, m, glm.glMatrix.toRadian(this.rotation[0]));
        mat4.rotateY(m, m, glm.glMatrix.toRadian(this.rotation[1]));
        mat4.rotateZ(m, m, glm.glMatrix.toRadian(this.rotation[2]));
        mat4.scale(m, m, this.scale);

        if ("aabb" in this) this.aabb.updateAABB(m);

        this.model_matrix = m;
        this.update_model_matrix = false;
    }

    toJSON() {

        return {
            name: this.name,
            model_name: this.name,
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
            use_color: this.use_color,
            color: this.color,
            visible: this.visible,
            depth_test: this.depth_test,
            show_AABB: this.show_AABB,
        }
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