const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;
import { Entity, colors, createCubeMultiColored, createPosClrInterleavedVao } from "./util/entity.js";
import { graph, createPosPosClrGraphVao } from "./util/axis.js";
import { createProgram, createStaticIndexBuffer, createStaticVertexBuffer, setupRender, getContext, showError } from "./util/gl_utils.js";
import vsSrc from "../shaders/vertexshader.js";
import fsSrc from "../shaders/fragmentshader.js";

function main() {
    const canvas = document.getElementById("canvas");


    const gl = getContext(canvas);

    const program = createProgram(gl, vsSrc, fsSrc);

    const cube = createCubeMultiColored(colors);
    const cube_vertices = createStaticVertexBuffer(gl, cube.vertices);
    const cube_indices = createStaticIndexBuffer(gl, cube.indices);


    const pos_attrib = gl.getAttribLocation(program, "a_pos");
    const clr_attrib = gl.getAttribLocation(program, "a_clr");

    const model_uniform = gl.getUniformLocation(program, "u_model");
    const view_uniform = gl.getUniformLocation(program, "u_view");
    const proj_uniform = gl.getUniformLocation(program, "u_proj");

    if (pos_attrib < 0 || clr_attrib < 0 || 
        !model_uniform || !view_uniform || !proj_uniform) {
        showError(`Failed to get attribs/uniforms:\n`  +
            `pos=${pos_attrib}\ncolor=${clr_attrib}\n` +
            `u_model=${!!model_uniform}\nu_view=${!!view_uniform}\nu_proj=${!!proj_uniform}`);
        return;
    }

    const cube_vao = createPosClrInterleavedVao(
        gl, cube_vertices, cube_indices, pos_attrib, clr_attrib);

    if (!cube_vao) {
        showError(`Failed to create VAOs: cube=${!!cube_vao}`);
    }

    //
    // Create matrices
    const UP_VECTOR = [0, 1, 0];
    const CAM_POS = [0, 0, 0];
    const view = mat4.create();
    const proj = mat4.create();

    /* mat4.lookAt(view, CAM_POS, [0, 0, 0], [0, 1, 0]); */
    mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);

    setupRender(gl, canvas, WIDTH, HEIGHT, [0.75, 0.85, 0.8, 1.0]);

    gl.useProgram(program);
    gl.uniformMatrix4fv(view_uniform, gl.FALSE, view);
    gl.uniformMatrix4fv(proj_uniform, gl.FALSE, proj);

    //
    // Create entities
    const entities = [
        // init cube
        new Entity([0, 0, -3], 1, UP_VECTOR, 0, cube.local_aabb, cube_vao, cube.indices.length),

        /* // cubes along z axis
        new Entity([0, 0, -2], 1, UP_VECTOR, 0, cube.local_aabb, cube_vao, cube.indices.length),
        new Entity([0, 0, 2], 1, UP_VECTOR, 0,  cube.local_aabb, cube_vao, cube.indices.length),
        new Entity([0, 0, 4], 1, UP_VECTOR, 0,  cube.local_aabb, cube_vao, cube.indices.length),

        // cubes along x axis
        new Entity([-4, 0, 0], 1, UP_VECTOR, 0, cube.local_aabb, cube_vao, cube.indices.length),
        new Entity([-2, 0, 0], 1, UP_VECTOR, 0, cube.local_aabb, cube_vao, cube.indices.length),
        new Entity([2, 0, 0], 1, UP_VECTOR, 0,  cube.local_aabb, cube_vao, cube.indices.length),

        // cubes along y axis
        new Entity([0, -2, 0], 1, UP_VECTOR, 0, cube.local_aabb, cube_vao, cube.indices.length),
        new Entity([0, -4, 0], 1, UP_VECTOR, 0, cube.local_aabb, cube_vao, cube.indices.length),
        new Entity([0, 2, 0], 1, UP_VECTOR, 0,  cube.local_aabb, cube_vao, cube.indices.length), */
    ]

    const frame = function (should_loop) {

        // Render
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        entities.forEach(entity => entity.draw(gl, model_uniform));

        if (should_loop) requestAnimationFrame(frame);
    }

    const ray = {
        origin: CAM_POS,
    };

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouse_x = e.clientX - rect.left;
        const mouse_y = e.clientY - rect.top;

        // transform in reverse!
        
        const x_ndc = (2 * mouse_x) / WIDTH - 1;
        const y_ndc = 1 - (2 * mouse_y) / HEIGHT;

        
        const ray_clip = [x_ndc, y_ndc, -1.0, 1.0];


        const ray_eye = vec4.transformMat4([], ray_clip, mat4.invert([], proj));
        ray_eye[2] = -1,
        ray_eye[3] = 0;

        let ray_world = vec4.transformMat4([], ray_clip, mat4.invert([], view));
        ray_world = [ray_world[0], ray_world[1], ray_world[2]];
        vec3.normalize(ray_world, ray_world);

        console.log(ray_world);
        ray.dir = ray_world;

        entities.forEach(entity => {
            if (entity.isIntersecting(ray)) {
                console.log(entity);
            }
        });
    });


    frame(false);
}


const WIDTH = 800;
const HEIGHT = 600;
/* main(); */



function renderLine() {
    const canvas = document.getElementById("canvas");


    const gl = getContext(canvas);

    const program = createProgram(gl, vsSrc, fsSrc);

    let line = 
    [
// z axis
        0, 0,  0,  0.3, 0.8, 0.3, 
        0, 0, 20,  0.3, 0.8, 0.3,

        // z axis marks
           0, 0, 1,  0.3, 0.8, 0.3, 
        0.25, 0, 1,  0.3, 0.8, 0.3,
           0, 0, 2,  0.3, 0.8, 0.3,
        0.25, 0, 2,  0.3, 0.8, 0.3,
           0, 0, 3,  0.3, 0.8, 0.3, 
        0.25, 0, 3,  0.3, 0.8, 0.3,
           0, 0, 4,  0.3, 0.8, 0.3,
        0.25, 0, 4,  0.3, 0.8, 0.3,

// y axis
        0,  0, 0,  1, 0, 0, 
        0, 20, 0,  1, 0, 0,

        // y axis marks
           0, 1, 0,  1, 0, 0, 
        0.25, 1, 0,  1, 0, 0,
           0, 2, 0,  1, 0, 0,
        0.25, 2, 0,  1, 0, 0,
           0, 3, 0,  1, 0, 0, 
        0.25, 3, 0,  1, 0, 0,
           0, 4, 0,  1, 0, 0,
        0.25, 4, 0,  1, 0, 0,

// x axis
         0, 0, 0,  0, 0, 1, 
        20, 0, 0,  0, 0, 1,

        // y axis marks
        1, 0,    0,  0, 0, 1, 
        1, 0, 0.25,  0, 0, 1,
        2, 0,    0,  0, 0, 1,
        2, 0, 0.25,  0, 0, 1,
        3, 0,    0,  0, 0, 1, 
        3, 0, 0.25,  0, 0, 1,
        4, 0,    0,  0, 0, 1,
        4, 0, 0.25,  0, 0, 1,
    ];
    const line_vertices = createStaticVertexBuffer(gl, line);

    const pos_attrib = gl.getAttribLocation(program, "a_pos");
    const clr_attrib = gl.getAttribLocation(program, "a_clr");

    const model_uniform = gl.getUniformLocation(program, "u_model");
    const view_uniform = gl.getUniformLocation(program, "u_view");
    const proj_uniform = gl.getUniformLocation(program, "u_proj");

    if (pos_attrib < 0 || clr_attrib < 0 || 
        !model_uniform || !view_uniform || !proj_uniform) {
        showError(`Failed to get attribs/uniforms:\n`  +
            `pos=${pos_attrib}\ncolor=${clr_attrib}\n` +
            `u_model=${!!model_uniform}\nu_view=${!!view_uniform}\nu_proj=${!!proj_uniform}`);
        return;
    }

    const line_vao = gl.createVertexArray();
    gl.bindVertexArray(line_vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, line_vertices);

    gl.enableVertexAttribArray(pos_attrib);
    gl.vertexAttribPointer(
        pos_attrib, 3, gl.FLOAT, gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.enableVertexAttribArray(clr_attrib);
    gl.vertexAttribPointer(
        clr_attrib, 3, gl.FLOAT, gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT);

    //
    // Create matrices
    let model = mat4.create();
    let view = mat4.create();
    let proj = mat4.create();

    view = mat4.lookAt(view, [5, 3, 5], [0, 0, 0], [0, 1, 0]);
    proj = mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 100);

    setupRender(gl, canvas, WIDTH, HEIGHT, [0.75, 0.85, 0.8, 1.0]);

    gl.useProgram(program);
    gl.uniformMatrix4fv(model_uniform, gl.FALSE, model);
    gl.uniformMatrix4fv(view_uniform, gl.FALSE, view);
    gl.uniformMatrix4fv(proj_uniform, gl.FALSE, proj);

    const frame = function (should_loop) {
        // Render
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.LINES, 0, line.length / 6);


        if (should_loop) requestAnimationFrame(frame);
    }

    frame(false);
}

/* renderLine(); */

function renderCubesWithGraph() {
    const canvas = document.getElementById("canvas");

    const gl = getContext(canvas);

    const program = createProgram(gl, vsSrc, fsSrc);

    const pos_attrib = gl.getAttribLocation(program, "a_pos");
    const clr_attrib = gl.getAttribLocation(program, "a_clr");

    const model_uniform = gl.getUniformLocation(program, "u_model");
    const view_uniform = gl.getUniformLocation(program, "u_view");
    const proj_uniform = gl.getUniformLocation(program, "u_proj");

    if (pos_attrib < 0 || clr_attrib < 0 || 
        !model_uniform || !view_uniform || !proj_uniform) {
        showError(`Failed to get attribs/uniforms:\n`  +
            `pos=${pos_attrib}\ncolor=${clr_attrib}\n` +
            `u_model=${!!model_uniform}\nu_view=${!!view_uniform}\nu_proj=${!!proj_uniform}`);
        return;
    }

    const cube = createCubeMultiColored(colors);
    const cube_vertices = createStaticVertexBuffer(gl, cube.vertices);
    const cube_indices = createStaticIndexBuffer(gl, cube.indices);
    /* const graph_vertices = createStaticVertexBuffer(gl, graph); */
    
    const cube_vao = createPosClrInterleavedVao(
        gl, cube_vertices, cube_indices, pos_attrib, clr_attrib);
    /* const graph_vao = createPosPosClrGraphVao(
        gl, graph_vertices, pos_attrib, clr_attrib); */

    //
    // Create matrices
    const UP_VECTOR = [0, 1, 0];
    const CAM_POS = [0, 3, 4.9];
    let model = mat4.create();
    let view = mat4.create();
    let proj = mat4.create();

    mat4.lookAt(view, CAM_POS, [0, 0, 0], [0, 1, 0]);
    mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);

    setupRender(gl, canvas, WIDTH, HEIGHT, [0.75, 0.85, 0.8, 1.0]);

    gl.useProgram(program);
    /* gl.uniformMatrix4fv(view_uniform, gl.FALSE, view); */
    gl.uniformMatrix4fv(proj_uniform, gl.FALSE, proj);

    //
    // Create entities
    const entities = [
        // init cube
        new Entity([0, 0, 0], 1, UP_VECTOR, 0, cube.local_aabb, cube_vao, cube.indices.length),

    ]

    let angle = 0;
    let new_cam_pos;
    let last_frame_time = performance.now();
    const frame = function (should_loop) {
/*         const this_frame_time = performance.now();
        const dt = (this_frame_time - last_frame_time) / 1000;
        last_frame_time = this_frame_time;
        angle += glm.glMatrix.toRadian(20) * dt;

        const camx = 4 * Math.sin(angle);
        const camz = 4 * Math.cos(angle);
        new_cam_pos = [camx, 3, camz];
        mat4.lookAt(view, new_cam_pos, [0, 0, 0], [0, 1, 0]); */

        gl.uniformMatrix4fv(view_uniform, gl.FALSE, view);


        const graph_vertices = createStaticVertexBuffer(gl, graph);
        const graph_vao = createPosPosClrGraphVao(
            gl, graph_vertices, pos_attrib, clr_attrib);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // draw the graph
        gl.uniformMatrix4fv(model_uniform, false, model);
        gl.bindVertexArray(graph_vao);
        gl.drawArrays(gl.LINES, 0, graph.length / 6);
        gl.bindVertexArray(null);

        // draw the cubes
        entities.forEach(entity => entity.draw(gl, model_uniform));

        if (should_loop) requestAnimationFrame(frame);
    }

    const ray = {
        origin: CAM_POS,
    };

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouse_x = e.clientX - rect.left;
        const mouse_y = e.clientY - rect.top;
        
        const x_ndc = (2 * mouse_x) / WIDTH - 1;
        const y_ndc = 1 - (2 * mouse_y) / HEIGHT;

        const ray_clip = [x_ndc, y_ndc, -1.0, 1.0];

        const ray_eye = vec4.transformMat4([], ray_clip, mat4.invert([], proj));
        ray_eye[2] = -1,
        ray_eye[3] = 0;

        let ray_world = vec4.transformMat4([], ray_eye, mat4.invert([], view));
        ray_world = [ray_world[0], ray_world[1], ray_world[2]];
        vec3.normalize(ray_world, ray_world);

        ray.dir = ray_world;

        entities.forEach(entity => {
            if (entity.isIntersecting(ray)) {
                console.log(entity);
            }
        });

        let ray_origin = CAM_POS;
        /* ray_origin[1] -= 0.0000001; */
        graph.push(...ray_origin);
        graph.push(...[0, 0, 0]);
        let ray_endpoint = vec3.scale([], ray.dir, 1000);
        graph.push(...ray_endpoint);
        graph.push(...[0, 0, 0]);
    

        frame(false);
    });

    frame(false);
}

renderCubesWithGraph();