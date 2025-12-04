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
        this.texture_map = new Map(); // (key: name, value: texture)
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
            modelRemoved: new Signal(),

            textureAdded: new Signal(),
            textureRemoved: new Signal()
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

    removeObject(object, mesh_removed) {
        this.object_map.delete(object.id);

        this.signals.objectRemoved.dispatch(object);
        this.signals.sceneGraphChanged.dispatch(object);

        if (!mesh_removed) {
            this.select(null);
        }
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

    assignTextureToObject(object, tex_name) {
        const texture = this.getTexturefromMap(tex_name);

        if (!texture) return;

        const texture_obj = {name: tex_name, data: texture};
        object.texture = texture_obj;

        this.signals.objectChanged.dispatch(object);
    }


    // models

// TODO: replace all instances of "model" to mesh. Since I want to be a game engine
// I will likely need to add a similar "prefab" / "asset" / "template" feature as outlined below.
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

        // remove all objects with the deleted mesh.
        for (const object of this.object_map.values()) {
            if (object.mesh.name === model_name) this.removeObject(object, true);
        }

        this.signals.modelRemoved.dispatch(model_name);
    }


    // textures

    // parameter texture is expected to be of type: ImageData
    addTexture(tex_name, texture) {

        if (!this.addTexturetoMap(tex_name, texture)) return;

        // TODO: also ripped from gippity
        function imageDataToURL(imageData) {
            const canvas = document.createElement("canvas");
            canvas.width = imageData.width;
            canvas.height = imageData.height;

            const ctx = canvas.getContext("2d");
            ctx.putImageData(imageData, 0, 0);

            return canvas.toDataURL("image/png");
        }

        const tex_url = imageDataToURL(texture);

        this.signals.textureAdded.dispatch( {name: tex_name, url: tex_url} );
    }

    removeTexture(tex_name) {

        if (!this.removeTexturefromMap(tex_name)) return;

        // remove texture from objects using the deleted texture
        for (const object of this.object_map.values()) {
            if (object.texture?.name === tex_name) {
                object.texture = null;
            }
        }

        this.signals.textureRemoved.dispatch(tex_name);
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

        return undefined;
    }

    addTexturetoMap(tex_name, texture) {
        if (this.texture_map.has(tex_name)) {
            alert(`A texture with the name ${tex_name} already exists. Rename or delete the texture`);
            return false;
        }

        this.texture_map.set(tex_name, texture);
        return true;   
    }

    removeTexturefromMap(tex_name) {
        return this.texture_map.delete(tex_name);
    }

    getTexturefromMap(tex_name) {
        if (this.texture_map.has(tex_name)) {
            return this.texture_map.get(tex_name);
        }

        return undefined;
    }






    // Load functions
    loadScene(scene) {

        this.loading_scene = true;
        this.signals.sceneGraphChanged.active = false;

        scene.forEach(obj => {

            const mesh_name = obj.mesh_name;
            const mesh_data = this.getModel(mesh_name);

            if (mesh_data === undefined) {
                console.error(`Cannot create SceneObject with name "${obj.name}", the mesh "${mesh_name}" does not exist.`);
                return;
            }

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
        this.signals.sceneGraphChanged.active = true;
        this.signals.sceneGraphChanged.dispatch();

    }

    clear() {
        this.signals.sceneGraphChanged.active = false;

        // TODO: not sure if this is proper but since removing a model removes all objects with the associated model i can just call removeModel2 for now
        for (const model_name of this.model_map.keys()) {
            this.removeModel2(model_name);
        }

        this.signals.sceneGraphChanged.active = true;
    }

    fromJSON(json) {

        // clear the current scene / models
        this.clear();

        // load models
        json.models.forEach(model => this.addModel2(model.name, model.model));

        // load textures
        // TODO: also ripped from gippity
        function jsonToImageData(json) {
            const {width, height, data} = json;

            const binary = atob(data);
            const length = binary.length;
            const array = new Uint8ClampedArray(length);

            for (let i = 0; i < length; i++) {
                array[i] = binary.charCodeAt(i);
            }

            return new ImageData(array, width, height);
        }
        json.textures.forEach(texture => this.addTexture(texture.name, jsonToImageData(texture.texture)));

        // create scene object from details
        this.loadScene(json.scene);

        // NOTE: despite clear() not dispatching a sceneGraphChanged or modelAdded signal, the Scene Hierarchy is updated
        // because of addModel2() and loadScene();
    }

    toJSON() {
        
        const output = {};

        const scene = this.object_map;
        const models = this.model_map;
        const textures = this.texture_map;

        // models
        const models_output = [];
        models.forEach((model, model_name) => {
            models_output.push({name: model_name, model: model});
        });

        output.models = models_output;

        // textures
        // TODO: Need to improve all of textures, this was ripped from gippity.
        function imageDataToJSON(img_data) {
            const {width, height, colorSpace, pixelFormat, data} = img_data;

            let binary = "";
            const chunk_size = 0x8000;    // 32K - safe chunk size

            for (let i = 0; i < data.length; i += chunk_size) {
                const chunk = data.subarray(i, i + chunk_size);
                binary += String.fromCharCode(...chunk);
            }

            const base_64 = btoa(binary);

            return {width, height, colorSpace, pixelFormat, data: base_64};
        }


        const textures_output = [];
        textures.forEach((texture, tex_name) => {
            textures_output.push({name: tex_name, texture: imageDataToJSON(texture)});
        });

        output.textures = textures_output;

        // scene objects
        const scene_output = [];
        scene.forEach((object, id) => {
            scene_output.push(object.toJSON());
        });

        output.scene = scene_output;

        console.log(output);

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