const glm = glMatrix; // shorten math library name,
import vsSrc from "./shaders/vertexshader.js";
import fsSrc from "./shaders/fragmentshader.js";



let width = 800;
let height = 600;

const canvas = document.getElementById("canvas");
canvas.setAttribute("width", width);
canvas.setAttribute("height", height);


const gl = canvas.getContext("webgl2");
if (!gl) {
    console.error("failed to get webgl2 context");
}

// 
// Specify view conditions
//
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0.75, 0.85, 0.8, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.enable(gl.DEPTH_TEST);


//
// Initialize program
//
const vertex_shader = createShader(gl, gl.VERTEX_SHADER, vsSrc);
const fragment_shader = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
const program = createProgram(gl, vertex_shader, fragment_shader);


//
// Create vertices and faces
//
const square = createSquare(0, 0, 0.5, 0.5, {r: 0.8, g:0.2, b:0.2});
const cube = createCube(0, 0, 0, 0.5, 0.5, 0.5, [1, 1, 1]);
const colors = 
[
    [0.2, 0.2, 0.2], [0.8, 0.2, 0.2],
    [0.2, 0.8, 0.2], [0.2, 0.2, 0.8],
    [0.2, 0.8, 0.8], [0.8, 0.2, 0.8],
    [0.8, 0.8, 0.2], [0.8, 0.8, 0.8]
]
const cube2 = createCubeMultiColored(0, 0, 0, 0.5, 0.5, 0.5, colors)

//
// Buffer vertex and face data
//
const VBO = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube2.vertices), gl.STATIC_DRAW);

const EBO = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube2.faces), gl.STATIC_DRAW);


//
// Get, set and enable attributes
// 
const pos_loc = gl.getAttribLocation(program, "a_pos");
const clr_loc = gl.getAttribLocation(program, "a_clr");

gl.vertexAttribPointer(
    pos_loc,
    3, 
    gl.FLOAT,
    gl.FALSE,
    6 * Float32Array.BYTES_PER_ELEMENT,
    0
);

gl.vertexAttribPointer(
    clr_loc,
    3,
    gl.FLOAT,
    gl.FALSE,
    6 * Float32Array.BYTES_PER_ELEMENT,
    3 * Float32Array.BYTES_PER_ELEMENT
);

gl.enableVertexAttribArray(pos_loc);
gl.enableVertexAttribArray(clr_loc);

//
// Use program
//
gl.useProgram(program);


//
// Get and set vertex shader uniforms
//
const model_loc = gl.getUniformLocation(program, "u_model");
const view_loc = gl.getUniformLocation(program, "u_view");
const proj_loc = gl.getUniformLocation(program, "u_proj");

let model = new Float32Array(16);
let view = new Float32Array(16);
let proj = new Float32Array(16);

glm.mat4.identity(model);
glm.mat4.lookAt(view, [2, 1, -2], [0, 0, 0], [0, 1, 0]);
glm.mat4.perspective(proj, glm.glMatrix.toRadian(45), width / height, 0.1, 1000);

gl.uniformMatrix4fv(model_loc, gl.FALSE, model);
gl.uniformMatrix4fv(view_loc, gl.FALSE, view);
gl.uniformMatrix4fv(proj_loc, gl.FALSE, proj);

//
// Main render loop
// 
function loop() {
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, cube2.faces.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);



function createSquare(center_x, center_y, width, height, color={r:0, g:0, b:0}) {
    const w = width/2;
    const h = height/2;

    let vertices = 
    [
        center_x-w, center_y-h, 0, color.r, color.g, color.b, // top-left
        center_x-w, center_y+h, 0, color.r, color.g, color.b, // bot-left
        center_x+w, center_y-h, 0, color.r, color.g, color.b, // top-right
        center_x+w, center_y+h, 0, color.r, color.g, color.b, // bot-right
    ];

    let faces = 
    [
        0, 1, 2,
        1, 2, 3
    ];
    return {vertices, faces};
}

function createCube(center_x, center_y, center_z, width, height, depth, color) {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    let vertices = 
    [
        center_x-w, center_y-h, center_z+d, color[0], color[1], color[2], // front-top-left
        center_x-w, center_y+h, center_z+d, color[0], color[1], color[2], // front-bot-left
        center_x+w, center_y-h, center_z+d, color[0], color[1], color[2], // front-top-right
        center_x+w, center_y+h, center_z+d, color[0], color[1], color[2], // front-bot-right
        
        center_x-w, center_y-h, center_z-d, color[0], color[1], color[2], // back-top-left
        center_x-w, center_y+h, center_z-d, color[0], color[1], color[2], // back-bot-left
        center_x+w, center_y-h, center_z-d, color[0], color[1], color[2], // back-top-right
        center_x+w, center_y+h, center_z-d, color[0], color[1], color[2], // back-bot-right
    ];

    let faces = 
    [
        0, 1, 2, // front
        1, 2, 3,

        4, 5, 6, // back
        5, 6, 7,

        0, 1, 4, // left
        1, 4, 5,

        2, 3, 6, // right
        3, 6, 7,

        0, 4, 6, // top
        0, 2, 6,

        1, 5, 7, // bottom
        1, 3, 7
    ];
    return {vertices, faces};
}

function createCubeMultiColored(center_x, center_y, center_z, width, height, depth, colors) {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    let vertices = 
    [
        center_x-w, center_y-h, center_z+d, colors[0][0], colors[0][1], colors[0][2], // front-top-left
        center_x-w, center_y+h, center_z+d, colors[1][0], colors[1][1], colors[1][2], // front-bot-left
        center_x+w, center_y-h, center_z+d, colors[2][0], colors[2][1], colors[2][2], // front-top-right
        center_x+w, center_y+h, center_z+d, colors[3][0], colors[3][1], colors[3][2], // front-bot-right

        center_x-w, center_y-h, center_z-d, colors[4][0], colors[4][1], colors[4][2], // back-top-left
        center_x-w, center_y+h, center_z-d, colors[5][0], colors[5][1], colors[5][2], // back-bot-left
        center_x+w, center_y-h, center_z-d, colors[6][0], colors[6][1], colors[6][2], // back-top-right
        center_x+w, center_y+h, center_z-d, colors[7][0], colors[7][1], colors[7][2], // back-bot-right
    ];

    let faces = 
    [
        0, 1, 2, // front
        1, 2, 3,

        4, 5, 6, // back
        5, 6, 7,

        0, 1, 4, // left
        1, 4, 5,

        2, 3, 6, // right
        3, 6, 7,

        0, 4, 6, // top
        0, 2, 6,

        1, 5, 7, // bottom
        1, 3, 7
    ];
    return {vertices, faces};
}









function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (success) return shader;

    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertex_shader, fragment_shader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);
    let success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (success) return program;

    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}