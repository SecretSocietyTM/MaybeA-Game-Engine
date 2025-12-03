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


//
// vertex shader properties
const a_position_location = gl.getAttribLocation(program, "a_pos");
const a_normal_location = gl.getAttribLocation(program, "a_normal");
const a_texCoord_location = gl.getAttribLocation(program, "a_texCoord");

const u_model_location = gl.getUniformLocation(program, "u_model");
const u_view_location = gl.getUniformLocation(program, "u_view");
const u_proj_location = gl.getUniformLocation(program, "u_proj");

// fragment shader properties
const u_texture1_location = gl.getUniformLocation(program, "u_texture1");
const u_objectColor_location = gl.getUniformLocation(program, "u_objectColor");
const u_lightColor_location = gl.getUniformLocation(program, "u_lightColor");
const u_lightPos_location = gl.getUniformLocation(program, "u_lightPos");


//
// Object creation + camera
import cube_ply from "./model/cube_uv.js"

const ply_parser = new PlyFile();
const mesh_data = ply_parser.parsePLY(cube_ply);
const mesh = {name: "example", data: mesh_data};

console.log(mesh);

import SceneObject from "../../rework3/js/util/SceneObjects.js";
const object = new SceneObject(undefined, mesh);
object.color = [0.6, 0.3, 0.1];

import Camera from "../../rework3/js/util/Camera.js";
const camera = new Camera(45, width / height, 0.1, 1000);

const light = {
    color: [1.0, 1.0, 1.0,]
};

//
// object data
const position_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.mesh.data.vertices), gl.STATIC_DRAW);
gl.enableVertexAttribArray(a_position_location);
gl.vertexAttribPointer(a_position_location, 3, gl.FLOAT, gl.FALSE, 0, 0);

const normal_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.mesh.data.normals), gl.STATIC_DRAW);
gl.enableVertexAttribArray(a_normal_location);
gl.vertexAttribPointer(a_normal_location, 3, gl.FLOAT, gl.FALSE, 0, 0);

const uv_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uv_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.mesh.data.uv_coords), gl.STATIC_DRAW);
gl.enableVertexAttribArray(a_texCoord_location);
gl.vertexAttribPointer(a_texCoord_location, 2, gl.FLOAT, gl.FALSE, 0, 0);

const face_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, face_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.mesh.data.indices), gl.STATIC_DRAW);

//
// read image pixel data
async function loadImageData(img) {
    const response = await fetch(img);
    const blob = await response.blob();

    const bitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);

    return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

const cube_texture = "./model/cube_texture.png";
const test_texture = "./model/llamaonthebeat.jpeg";

const img_data = await loadImageData(test_texture);
console.log(img_data);

//
// load image pixel data
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
const level = 0;
const internal_format = gl.RGBA;
const tex_width = img_data.width;
const tex_height = img_data.height;
const border = 0;
const format = gl.RGBA;
const type = gl.UNSIGNED_BYTE;
const data = img_data.data;
gl.texImage2D(gl.TEXTURE_2D, level, internal_format, tex_width, tex_height, border, format, type, data);

// set texture wrapping params (this is optional)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// set textre filtering params (these seem required)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.bindTexture(gl.TEXTURE_2D, null);


//
// render code
gl.useProgram(program);

gl.viewport(0, 0, width, height);
gl.clearColor(0.2, 0.5, 0.5, 1.0);
gl.enable(gl.DEPTH_TEST);

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.uniform1i(u_texture1_location, 0);

gl.uniformMatrix4fv(u_model_location, gl.FALSE, object.model_matrix);

gl.uniform3fv(u_objectColor_location, object.color);
gl.uniform3fv(u_lightColor_location, light.color);
gl.uniform3fv(u_lightPos_location, [1,2,5]);

import { CameraControls } from "../../rework3/js/util/CameraControls.js";
const camera_controls = new CameraControls(camera);
camera_controls.connect(canvas);

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(u_view_location, gl.FALSE, camera.view_matrix);
    gl.uniformMatrix4fv(u_proj_location, gl.FALSE, camera.proj_matrix);

    gl.drawElements(gl.TRIANGLES, object.mesh.data.indices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(draw);
}

draw();