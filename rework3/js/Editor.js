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
        this.cur_selection = null;
    }

    addView(view) {
        this.views.push(view);
    }

    addObject(object) {
        this.scene_objects.push(object);
    }
}