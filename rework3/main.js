// State manager
import { Editor } from "./js/Editor.js";

// UI
import { MenuBar } from "./js/MenuBar.js";
import { ViewWindow } from "./js/ViewWindow.js"
import { SceneHierarchy } from "./js/SceneHierarchy.js";
import { ObjectInspector } from "./js/ObjectInspector.js";
import { AssetsBar } from "./js/AssetsBar.js";

// Extra
import SceneObject from "./js/util/SceneObjects.js";
import MeshesObj from "../models/meshes_index.js";

const canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const editor = new Editor(canvas);

// components
const menubar = new MenuBar(editor);
const scene_view = new ViewWindow(editor, document.getElementById("view1"));
const scene_hierarchy = new SceneHierarchy(editor);
const object_inspector = new ObjectInspector(editor);
const assets_bar = new AssetsBar(editor);

const player = new SceneObject("player", {name: "unit_cube", data: MeshesObj.unit_cube}, [0,5,0]);
editor.addObject(player);

const cube = new SceneObject("cube", {name: "unit_cube", data: MeshesObj.unit_cube}, [0,0,0], undefined, [0,45,0]);
editor.addObject(cube);
scene_view.show_AABB = true;

scene_view.render();