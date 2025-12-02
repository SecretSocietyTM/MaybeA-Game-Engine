// State manager
import { Editor } from "./js/Editor.js";

// UI
import { ViewWindow } from "./js/ViewWindow.js"
import { ObjectInspector } from "./js/ObjectInspector.js";
import { MenuBar } from "./js/MenuBar.js";
import { ModelsGrid } from "./js/ModelsGrid.js";
import { SceneHierarchy } from "./js/SceneHierarchy.js";

// Extra
import SceneObject from "./js/util/SceneObjects.js";
import MeshesObj from "../models/meshes_index.js";

const canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const editor = new Editor(canvas);

// components
const scene_view = new ViewWindow(editor, document.getElementById("view1"));
const object_inspector = new ObjectInspector(editor);
const menubar = new MenuBar(editor);
const models_grid = new ModelsGrid(editor);
const scene_hierarchy = new SceneHierarchy(editor);

// render manually
scene_view.render();