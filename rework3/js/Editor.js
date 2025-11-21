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
        this.model_map = new Map(); // (key = model name, value = model)

        // TODO: improve, temp solution to select from SceneHierarchy

        // TODO: because I use a map, objects with the same name are overwritten
        // need to find a way to change their names or use IDs
        this.name_to_object = new Map();

        this.object_map = new Map();

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
        
        this.object_map.set(object.id, object);

        // dispatch signal
        this.signals.objectAdded.dispatch(object);
    }

    select(object) {
        if (this.cur_selection === object) return;

        this.cur_selection = object;

        this.signals.objectSelected.dispatch(object);
    }

    selectObjectById(id) {
        const object = this.object_map.get(id);

        this.select(object);
    }

    addObjectFromModel(model_name) {
        const model = this.getModel(model_name); // model is actually just the mesh

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




    // Load functions

    // TODO: when loading need to unload previos things.

    fromJSON(json) {

        // load models
        json.models.forEach(model => this.addModel2(model.name, model.model));

        // create scene object from details
        json.scene.forEach(obj => {

            // TODO: once better SceneObject constructor is added this will need to be changed
            const mesh = this.model_map.get(obj.name);

            const object = new SceneObject(
                obj.name,
                mesh,
                obj.position,
                obj.scale,
                obj.rotation,
                obj.color,
                obj.depth_test,
            );

            // still need to set use_color, visible, show_AABBB
            object.use_color = obj.use_color;
            object.visible = obj.visible;
            object.show_AABB = obj.show_AABB;

            this.addObject(object);
        });
    }



    // JSON file functions
    toJSON() {
        
        const output = {};

        /* const scene = this.name_to_object; */
        const scene = this.object_map;
        const models = this.model_map;

        // models
        const models_output = [];
        models.forEach((model, model_name) => {
            models_output.push({name: model_name, model: model});
        });

        output.models = models_output;

        // scene objects
        const scene_output = [];
        scene.forEach((object, object_name) => {
            scene_output.push(object.toJSON());
        });

        output.scene = scene_output;

        return output;
    }
}



// Unity has it so that the name of the MODEL in the assets tab is the name of the file without the .extension
// and the name of the mesh is the name of the mesh provided aka the actual vertex data.


// Two options for naming objects:
/* 
- name as the id (blender and godot method) name of an object must be unique
** Note: godot lets objcets have the same name if they are nested. Parent: CubeName -> Child: CubeName
** but not if they are part of the same "level" / hierarchy

- separate id (unity, figma, three.js)
** Note: its odd because unity initially forces a name change upon copying and pasting an object, but
** renaming the object to match the name of another object is allowed
*/