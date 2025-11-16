import { Editor } from "./js/Editor.js";
import { ViewWindow } from "./js/ViewWindow.js"
import SceneObject from "../util/SceneObject.js";
import MeshesObj from "../mimp/models/meshes_index.js";

const canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const editor = new Editor(canvas);

// add objects directly.
const unit_cube = new SceneObject("unit_cube", MeshesObj.unit_cube);
editor.addObject(unit_cube);

const scene_view = new ViewWindow(
    editor, 
    document.getElementById("view"),
    canvas.width, canvas.height
);

scene_view.render();