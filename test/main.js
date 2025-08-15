const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const mat4 = glm.mat4;
import { createCubeMultiColored, createPosClrInterleavedVao } from "./entity.js";
import { createProgram, createStaticIndexBuffer, createStaticVertexBuffer, setupRender, getContext, showError } from "./gl_utils.js";
import vsSrc from "../shaders/vertexshader.js";
import fsSrc from "../shaders/fragmentshader.js";

class Entity {
  constructor(pos, scale, r_axis, r_angle, vao, num_indices) {
/*     this.pos = pos;
    this.scale = scale;
    this.r_axis = r_axis,
    this.r_angle = r_angle; */

    this.vao = vao;
    this.num_indices = num_indices;

    // build model matrix
    this.mat_model = mat4.create();
    mat4.translate(this.mat_model, this.mat_model, pos);
    mat4.rotate(this.mat_model, this.mat_model, glm.glMatrix.toRadian(r_angle), r_axis);
    mat4.scale(this.mat_model, this.mat_model, [scale, scale, scale]);
  }

  draw(gl, model_uniform) {
    gl.uniformMatrix4fv(model_uniform, false, this.mat_model);
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
}

function main() {
    const canvas = document.getElementById("canvas");
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        showError('Could not get Canvas reference');
        return;
    }

    const gl = getContext(canvas);

    const colors = [
        [0.2, 0.2, 0.2], [0.8, 0.2, 0.2],
        [0.2, 0.8, 0.2], [0.2, 0.2, 0.8],
        [0.2, 0.8, 0.8], [0.8, 0.2, 0.8],
        [0.8, 0.8, 0.2], [0.8, 0.8, 0.8]]
    const cube = createCubeMultiColored(colors);

    const cube_vertices = createStaticVertexBuffer(gl, cube.vertices);
    const cube_indices = createStaticIndexBuffer(gl, cube.indices);

    if (!cube_vertices || !cube_indices) {
        showError(`Failed to create entity: cube: (v=${!!cube_vertices} i=${!!cube_indices})`);
    }

    const program = createProgram(gl, vsSrc, fsSrc);
    if (!program) {
        showError("Failed to compile WebGL program");
        return;
    }

    const pos_attrib = gl.getAttribLocation(program, "a_pos");
    const clr_attrib = gl.getAttribLocation(program, "a_clr");

    const model_uniform = gl.getUniformLocation(program, "u_model");
    const view_uniform = gl.getUniformLocation(program, "u_view");
    const proj_uniform = gl.getUniformLocation(program, "u_proj");

    if (pos_attrib < 0 || clr_attrib < 0 || 
        !model_uniform || !view_uniform || !proj_uniform) {
        showError(`Failed to get attribs/uniforms: ` +
            `pos=${pos_attrib}, color=${clr_attrib} ` +
            `u_model=${!!model_uniform} u_view=${!!view_uniform} u_proj=${!!proj_uniform}`);
        return;
    }

    const cube_vao = createPosClrInterleavedVao(
        gl, cube_vertices, cube_indices, pos_attrib, clr_attrib);

    if (!cube_vao) {
        showError(`Failed to create VAOs: cube=${!!cube_vao}`);
    }

    //
    // Create matrices
    const UP_VECTOR = [0, 1, 0]
    const model = mat4.create();
    const view = mat4.create();
    const proj = mat4.create();

    mat4.lookAt(view, [4, 4, -4], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);

    setupRender(gl, canvas, WIDTH, HEIGHT, [0.75, 0.85, 0.8, 1.0]);

    gl.useProgram(program);
    gl.uniformMatrix4fv(view_uniform, gl.FALSE, view);
    gl.uniformMatrix4fv(proj_uniform, gl.FALSE, proj);

    //
    // Create entities
    const entities = [
        // init cube
        new Entity([0, 0, 0], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),

        // cubes along z axis
        new Entity([0, 0, -2], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),
        new Entity([0, 0, 2], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),
        new Entity([0, 0, 4], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),

        // cubes along x axis
        new Entity([-4, 0, 0], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),
        new Entity([-2, 0, 0], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),
        new Entity([2, 0, 0], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),

        // cubes along y axis
        new Entity([0, -2, 0], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),
        new Entity([0, -4, 0], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),
        new Entity([0, 2, 0], 1, UP_VECTOR, 0, cube_vao, cube.indices.length),
    ]

    const frame = function (should_loop) {

        // Render
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        entities.forEach(entity => entity.draw(gl, model_uniform));
        /* entity.draw(gl, model_uniform) */
        /* gl.bindVertexArray(cube_vao);
        gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0); */

        if (should_loop) requestAnimationFrame(frame);
    }

    frame(false)
}

const WIDTH = 800;
const HEIGHT = 600;
main();