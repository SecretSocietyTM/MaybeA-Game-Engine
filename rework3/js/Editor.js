const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const mat4 = glm.mat4;
import SceneObject from "./util/SceneObjects.js";
// TODO: not a huge fan of having to import the above... perhaps find a better place to create the modelPreviewThing()

import { Signal } from "./util/ui_signals/Signals.js"

import Renderer3 from "./util/Renderer.js";
import MeshesObj from "../../models/meshes_index.js";

export class Editor {
    constructor(canvas) {

        this.canvas = canvas;
        this.renderer = new Renderer3(this.canvas);
        this.renderer.addAABBMesh(MeshesObj.aabb_wireframe);

        // essentially just state 
        this.views = [];
        this.scene_objects = [];
        this.model_map = new Map();

        // TODO: improve, temp solution to select from SceneHierarchy
        this.name_to_object = new Map();

        this.cur_selection = null;

        // signals
        this.signals = {
            objectSelected: new Signal(),

            objectChanged: new Signal(),
            objectAdded: new Signal(),
            /* objectRemoved: new Signal(), */

            modelAdded: new Signal(),
            modelRemoved: new Signal()
        };
    }

    addView(view) {
        this.views.push(view);
    }

    // TODO: when adding an object to the scene I want the transform gizmos to show up on it
    addObject(object) {
        this.scene_objects.push(object);

        // TODO: improve, temp solution to select from SceneHierarchy
        this.name_to_object.set(object.name, object); 

        // dispatch signal
        this.signals.objectAdded.dispatch(object);
    }

    select(object) {
        if (this.cur_selection === object) return;

        this.cur_selection = object;

        this.signals.objectSelected.dispatch(object);
    }

    selectObjectByName(object_name) {
        const object = this.name_to_object.get(object_name);

        this.select(object);
    }

    addObjectFromModel(model_name) {
        const model = this.getModel(model_name);

        if (!model) return;

        const object = new SceneObject(model_name, model);
        this.addObject(object);
    }

    addModel2(model_name, model) {

        if (!this.addModel(model_name, model)) return;

        const object = new SceneObject(undefined, model);

        // TODO: this needs A LOT of work to look good but probably fine for now.
        const distance = object.aabb.sphere_radius / Math.tan(glm.glMatrix.toRadian(45) / 2) * 1.2;
        const new_distance = vec3.scale([], vec3.normalize([], [1,0.5,1]), distance);
        const view_matrix = mat4.create();
        mat4.lookAt(view_matrix, vec3.add([], object.aabb.center, new_distance), object.aabb.center, [0,1,0]);

        const model_url = this.renderer.modelPreviewThing(object, view_matrix, 100);

        this.signals.modelAdded.dispatch( {name: model_name, url: model_url} );
    }

    removeModel2(model_name) {

        if (!this.removeModel(model_name)) return;

        // TODO: need to find way to remove all objects that have this model applied to them

        this.signals.modelRemoved.dispatch(model_name)
    }
















    // Map functions
    
    // TODO: maybe make a class for this
    addModel(model_name, model) {
        if (this.model_map.has(model_name)) {
            alert(`A model with the name ${model_name} already exists. Rename or delete the model`);
            return false;
        }

        this.model_map.set(model_name, model);
        return true;
    }

    removeModel(model_name) {
        return this.model_map.delete(model_name);
    }

    getModel(model_name) {
        if (this.model_map.has(model_name)) {
            return this.model_map.get(model_name);
        }
    }
}