const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const mat4 = glm.mat4;

import Camera from "./util/Camera.js";
import Renderer from "./util/Renderer.js";
import SceneObject from "./util/SceneObjects.js";
import { Signal } from "./util/ui_signals/Signals.js"

import MeshesObj from "../../models/meshes_index.js";

export class Editor {
    constructor(canvas) {

        this.canvas = canvas;
        this.renderer = new Renderer(this.canvas);
        this.renderer.addAABBMesh(MeshesObj.aabb_wireframe);

        //
        // state
        this.views = [];
        
        this.model_map = new Map();   // (key: name, value: model)
        this.object_map = new Map();  // (key: id, value: object)

        this.cur_selection = null;
        this.prev_selection = null;
        this.copied_object = null;

        this.loading_scene = false;

        //
        // signals
        this.signals = {
            sceneGraphChanged: new Signal(),

            objectSelected: new Signal(),
            objectFocused: new Signal(),

            objectChanged: new Signal(),
            objectAdded: new Signal(),   // useless signal for now
            objectRemoved: new Signal(), // useless signal for now

            modelAdded: new Signal(),
            modelRemoved: new Signal()
        };
    }

    addView(view) {
        this.views.push(view);
    }



    // scene objects

    addObject(object) {
        this.object_map.set(object.id, object);

        this.signals.objectAdded.dispatch(object);
        this.signals.sceneGraphChanged.dispatch(object);

        if (!this.loading_scene) {
            this.select(object);
        }
    }

    removeObject(object) {
        this.object_map.delete(object.id);

        this.signals.objectRemoved.dispatch(object);
        this.signals.sceneGraphChanged.dispatch(object);

        this.select(null);
    }

    addObjectFromModel(model_name) {
        const model = this.getModel(model_name); // model is actually just the mesh

        if (!model) return;

        const mesh_name = model_name;
        const mesh_data = model;
        const mesh = {name: mesh_name, data: mesh_data};

        const object = new SceneObject(model_name, mesh);
        this.addObject(object);
    }

    copyObject(object) {

        const copy = new SceneObject(
            object.name,
            object.mesh,
            object.position,
            object.scale,
            object.rotation,
            object.color,
            object.depth_test
        );

        copy.use_color = object.use_color;
        copy.visible = object.visible;

        this.addObject(copy);
    }


    select(object) {
        if (this.cur_selection === object) return;

        if (this.cur_selection) {
            this.prev_selection = this.cur_selection;
        }

        this.cur_selection = object;

        this.signals.objectSelected.dispatch(object);
    }

    selectById(id) {
        const object = this.object_map.get(id);

        this.select(object);
    }

    focus(object) {
        this.signals.objectFocused.dispatch(object);
    }

    focusById(id) {
        const object = this.object_map.get(id);

        this.focus(object);
    }


    // models


    addModel2(model_name, model) {

        if (!this.addModel(model_name, model)) return;

        const mesh_name = model_name;
        const mesh_data = model;
        const mesh = {name: mesh_name, data: mesh_data};

        const object = new SceneObject(undefined, mesh);

        const preview_camera = new Camera();
        preview_camera.focusOnTarget(object, [1,0.5,1], 1.2);

        const model_url = this.renderer.modelPreviewThing(object, preview_camera, 100);

        this.signals.modelAdded.dispatch( {name: model_name, url: model_url} );
    }

    removeModel2(model_name) {

        if (!this.removeModel(model_name)) return;

        // TODO: need to find way to remove all objects that have this model applied to them, maybe use a hashmap?
        // alternatively could just iterate over the objects_map looking for meshes with the same name.

        // TODO: replace all instances of "model" to mesh. Since I want to be a game engine
        // I will likely need to add a similar "prefab" / "asset" / "template" feature as outlined below.

        this.signals.modelRemoved.dispatch(model_name)
    }
















    // Map functions

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

    // TODO: implement - when loading need to unload previos things.
    clear() {

    }

    fromJSON(json) {

        this.loading_scene = true;

        // load models
        json.models.forEach(model => this.addModel2(model.name, model.model));

        // create scene object from details
        json.scene.forEach(obj => {

            const mesh_name = obj.mesh_name;
            const mesh_data = this.model_map.get(mesh_name);
            const mesh = {name: mesh_name, data: mesh_data};

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

        this.loading_scene = false;
    }



    // JSON file functions
    toJSON() {
        
        const output = {};

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




/* More Juice:
So it seems that Unity (and PlayCanvas) do the following when you import a model (.fbx, .glb, etc)

They create a "prefab" / "asset" / "template". This thing then gets the mesh from the model file assigned to it.

I'm a dunce so I havn't quite figured out how to import models with textures and all that to unity but im sure that 
it will create an "asset" and in the drop down it will show the mesh, texture, and whatever else.

This is kind of what PlayCanvas does (it creates a new folder for each "template" which includes the template
itself, the mesh, and the original file) but somehow the template knows which texture png to use despite no mention of it
in the inspector tab.
*/