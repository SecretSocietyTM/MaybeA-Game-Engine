const glm = glMatrix; // shorten math library name,
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;
import SceneObject from "./util/SceneObjects.js";
// TODO: not a huge fan of the above... perhaps find a better
// place to do this...

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

        this.model_to_name = new Map();
        this.name_to_model = new Map();

        // TODO: improve, temp solution to select from SceneHierarchy
        this.name_to_object = new Map();

        this.model_map = new Map();

        this.cur_selection = null;

        // signals
        this.signals = {
            objectSelected: new Signal(),

            objectChanged: new Signal(),
            objectAdded: new Signal(),
            /* objectRemoved: new Signal(), */

            modelAdded: new Signal(),
        };
    }

    addView(view) {
        this.views.push(view);
    }

    addObject(object) {
        this.scene_objects.push(object);

        // TODO: improve, temp solution to select from SceneHierarchy
        this.name_to_object.set(object.name, object); 

        // dispatch signal
        this.signals.objectAdded.dispatch(object);
    }

    selectObjectByName(object_name) {
        const object = this.name_to_object.get(object_name);

        this.signals.objectSelected.dispatch(object);
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

    // Perhaps use a class for this
    // testing new approach using name lookup (model_to_name (Map), name_to_model (Map))
    addModel(model_name, model) {
        
        if (this.model_to_name.has(model)) {
            const name = this.model_to_name.get(model);
            alert("Model data already exists under the name ", name);
            return false;
        }

        this.name_to_model.set(model_name, model);
        this.model_to_name.set(model, model_name);
        return true;
    }

    getModel(model_name) {
        if (this.name_to_model.has(model_name)) {
            return this.name_to_model.get(model_name);
        }
    }
}


// Note distinction between model and mesh
// Mesh: the structural framework of a 3D object. This includes vertices, faces, indices, vertex_colors, normals. Things that make up the wireframe.
// Model is a more comprehensive representation of a 3D object including the mesh, but also textures, animations and more.

// Mesh is a subset of a Model


// all models with same mesh / data should only exist once regardless of name
// the name matters though