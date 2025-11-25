import { PlyFile } from "../../rework3/mimp/parse_ply.js";

import vs_src from "./shaders/vertexshader.js";
import fs_src from "./shaders/fragmentshader.js";

const glm = glMatrix; // shorten math library name,
const mat4 = glm.mat4; // should not need this...

const canvas = document.getElementById("canvas");
const width = 800;
const height = 600;
canvas.width = width;
canvas.height = height;

const gl = canvas.getContext("webgl2");

const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertex_shader, vs_src);
gl.compileShader(vertex_shader);

const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragment_shader, fs_src);
gl.compileShader(fragment_shader);

const program = gl.createProgram();
gl.attachShader(program, vertex_shader);
gl.attachShader(program, fragment_shader);
gl.linkProgram(program);

// vertex shader properties
const a_position_location = gl.getAttribLocation(program, "a_pos");

const u_model_location = gl.getUniformLocation(program, "u_model");
const u_view_location = gl.getUniformLocation(program, "u_view");
const u_proj_location = gl.getUniformLocation(program, "u_proj");

// fragment shader properties
const u_objectColor_location = gl.getUniformLocation(program, "u_objectColor");
const u_lightColor_location = gl.getUniformLocation(program, "u_lightColor");

import cube_normals from "./cube_normals.js";
const ply_parser = new PlyFile();
const mesh = ply_parser.parsePLY(cube_normals, false, true);

console.log(mesh);