const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

const vs = `#version 300 es

in vec4 a_pos;
in vec4 a_clr;

out vec4 v_clr;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

void main() {
    gl_Position = u_proj * u_view * u_model * a_pos;
    v_clr = a_clr;
}
`

const fs = `#version 300 es
precision mediump float;

in vec4 v_clr;

out vec4 frag_color;

void main() {
    frag_color = v_clr;
}
`

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const view_1 = document.getElementById("view_1");
const view_2 = document.getElementById("view_2");

const view_1_rect = view_1.getBoundingClientRect();
const view_1_vals = {
    left: view_1_rect.left,
    bottom: canvas.clientHeight - view_1_rect.bottom,
    width: view_1_rect.width,
    height: view_1_rect.height
};

const view_2_rect = view_2.getBoundingClientRect();
const view_2_vals = {
    left: view_2_rect.left,
    bottom: canvas.clientHeight - view_2_rect.bottom,
    width: view_2_rect.width,
    height: view_2_rect.height
};

const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertex_shader, vs);
gl.compileShader(vertex_shader);

const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragment_shader, fs);
gl.compileShader(fragment_shader);

const program = gl.createProgram();
gl.attachShader(program, vertex_shader);
gl.attachShader(program, fragment_shader);
gl.linkProgram(program);

const a_pos_location = gl.getAttribLocation(program, "a_pos");
const a_clr_location = gl.getAttribLocation(program, "a_clr");
const u_proj_location = gl.getUniformLocation(program, "u_proj");
const u_view_location = gl.getUniformLocation(program, "u_view");
const u_model_location = gl.getUniformLocation(program, "u_model");

const cube = {
    vertices: new Float32Array([
        -0.5, -0.5,  0.5, 
        -0.5,  0.5,  0.5,
        0.5, -0.5,  0.5,
        0.5,  0.5,  0.5,

        -0.5, -0.5, -0.5,
        -0.5,  0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5,  0.5, -0.5,
    ]),
    vertex_colors: new Float32Array([
        0.2, 0.2, 0.2,
        0.8, 0.2, 0.2,
        0.2, 0.8, 0.2,
        0.2, 0.2, 0.8,
        0.2, 0.8, 0.8,
        0.8, 0.2, 0.8,
        0.8, 0.8, 0.2,
        0.8, 0.8, 0.8 
    ]),
    indices: new Uint16Array([
        0, 1, 2,  1, 2, 3,
        4, 5, 6,  5, 6, 7,
        0, 1, 4,  1, 4, 5,
        2, 3, 6,  3, 6, 7,
        0, 4, 6,  0, 2, 6,
        1, 5, 7,  1, 3, 7
    ])
};

const cube_vao = gl.createVertexArray();
gl.bindVertexArray(cube_vao);

const position_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(a_pos_location);
gl.vertexAttribPointer(a_pos_location, 3, gl.FLOAT, gl.FALSE, 0, 0);

const color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, cube.vertex_colors, gl.STATIC_DRAW);
gl.enableVertexAttribArray(a_clr_location);
gl.vertexAttribPointer(a_clr_location, 3, gl.FLOAT, gl.FALSE, 0, 0);

const index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);


// shared by both views
let model_m4 = mat4.create();
const target = [0,0,0];
const up = [0,1,0];

// different between views

// view_1
const pos_1 = [10,10,10];
let proj_1_m4 = mat4.create();
let view_1_m4 = mat4.create();
mat4.perspective(proj_1_m4, glm.glMatrix.toRadian(45), view_1_vals.width / view_1_vals.height, 0.1, 1000);
mat4.lookAt(view_1_m4, pos_1, target, up);

// view_2
const pos_2 = [5,5,5];
let proj_2_m4 = mat4.create();
let view_2_m4 = mat4.create();
mat4.perspective(proj_2_m4, glm.glMatrix.toRadian(45), view_2_vals.width / view_2_vals.height, 0.1, 1000);
mat4.lookAt(view_2_m4, pos_2, target, up);

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.SCISSOR_TEST);

// begin drawing on view_1
gl.viewport(view_1_vals.left, view_1_vals.bottom, view_1_vals.width, view_1_vals.height);
gl.scissor(view_1_vals.left, view_1_vals.bottom, view_1_vals.width, view_1_vals.height);
gl.clearColor(0.3, 0.3, 0.3, 1);

gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

gl.uniformMatrix4fv(u_proj_location, gl.FALSE, proj_1_m4);
gl.uniformMatrix4fv(u_view_location, gl.FALSE, view_1_m4);
gl.uniformMatrix4fv(u_model_location, gl.FALSE, model_m4);

gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);


// begin drawing on view_2
gl.viewport(view_2_vals.left, view_2_vals.bottom, view_2_vals.width, view_2_vals.height);
gl.scissor(view_2_vals.left, view_2_vals.bottom, view_2_vals.width, view_2_vals.height);
gl.clearColor(0.5, 0.5, 0.5, 1);

gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

gl.uniformMatrix4fv(u_proj_location, gl.FALSE, proj_2_m4);
gl.uniformMatrix4fv(u_view_location, gl.FALSE, view_2_m4);
gl.uniformMatrix4fv(u_model_location, gl.FALSE, model_m4);

gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
