const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;


const canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

import Renderer2 from "../util/Renderer2.js";
import ViewWindow from "../util/ViewWindow.js";
import SceneObject from "../util/SceneObject.js";

import MeshesObj from "../mimp/models/meshes_index.js";


const renderer = new Renderer2(canvas);

const view1 = new ViewWindow("v1", document.getElementById("view1"), canvas);
view1.moveCamera([-20,20,-20]);
const view2 = new ViewWindow("v2", document.getElementById("view2"), canvas);
const views = [view1, view2];


const aabb_wireframe_VAO = renderer.addObjectVAO(MeshesObj.aabb_wireframe);

const objects = [];

const unit_cube = new SceneObject("unit_cube", [0,0,0], [1,1,1], [0,0,0], 
    MeshesObj.unit_cube, renderer.addObjectVAO(MeshesObj.unit_cube), aabb_wireframe_VAO);

const apple = new SceneObject("apple", [-10,0,-10], [9,9,9], [0,0,0], 
    MeshesObj.apple, renderer.addObjectVAO(MeshesObj.apple), aabb_wireframe_VAO);

const weird_cube = new SceneObject("weird cube", [0,0,0], [1,1,1], [0,0,0],
    MeshesObj.weird_cube, renderer.addObjectVAO(MeshesObj.weird_cube), aabb_wireframe_VAO);

objects.push(unit_cube, apple, weird_cube);

renderer.renderToViews(views, objects);