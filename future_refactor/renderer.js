import glUtil from "../util/gl_utils.js";

import vsSrc from "../shaders/vertexshader.js";
import fsSrc from "../shaders/fragmentshader.js";

let u_loc_model;
let u_loc_view;
let u_loc_proj;

let a_loc_pos;
let a_loc_clr;

export function initRenderer(canvas) {
    gl = glUtil.getContext(canvas);

    const program = glUtil.createProgram(gl, vsSrc, fsSrc);
    gl.useProgram(program);

    // uniform locations
    u_loc_model = gl.getUniformLocation(program, "u_model");
    u_loc_view = gl.getUniformLocation(program, "u_view");
    u_loc_proj = gl.getUniformLocation(program, "u_proj");

    // attribute locations
    a_loc_pos = gl.getAttribLocation(program, "a_pos");
    a_loc_clr = gl.getAttribLocation(program, "a_clr");

    gl.viewport(0, 0, canvas.width, canvas.height);
    return gl;
}

// renderer should ONLY render, provide it the VAOs, and let it do rest

export function renderFrame(graph_vao, floor_vao, should_loop=false) {


    if (should_loop) {
        requestAnimationFrame(renderFrame(graph_vao, floor_vao, should_loop));
    }
}