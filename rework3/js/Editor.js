import Renderer2 from "../../util/Renderer2.js";
import SceneObject from "../../util/SceneObject.js";

import MeshesObj from "../../mimp/models/meshes_index.js";

export class Editor {
    constructor(canvas) {

        this.canvas = canvas;
        this.renderer = new Renderer2(this.canvas);
        this.renderer.addAABBMesh(MeshesObj.aabb_wireframe);
        this.views = [];

        // temp
        this.MeshesObj = MeshesObj;

        this.scene_objects = [];

        this.cur_selection = null;
        this.current_ray = {
            origin: null,
            dir: null
        };
    }

    addView(view) {
        this.views.push(view);
    }

    addObject(object) {
        this.scene_objects.push(object);
    }
}