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


// add objects manually.

const unit_cube = new SceneObject("unit_cube", MeshesObj.unit_cube);
const apple = new SceneObject("apple", MeshesObj.apple, [-10,0,-10], [9,9,9], [0,0,0]);
const weird_cube = new SceneObject("weird cube", MeshesObj.weird_cube);

const wall = new SceneObject("wall", MeshesObj.unit_cube, [0,0,-15], [10,10,1], [0,0,0], [1.0,0.5,0.0]);
const floor = new SceneObject("floor", MeshesObj.unit_cube, [0,-2.2,0], [15,1,15], [0,0,0], [0.2,0.2,0.2]);

editor.addObject(unit_cube);
editor.addObject(apple);
editor.addObject(weird_cube);
editor.addObject(wall);
editor.addObject(floor);