import vs_src from "../shaders/3d_pass/vertexshader.js";
import fs_src from "../shaders/3d_pass/fragmentshader.js";
import ui_pass_vs_src from "../shaders/ui_pass/vertexshader.js";
import ui_pass_fs_src from "../shaders/ui_pass/fragmentshader.js";

const glm = glMatrix; // shorten math library name,
const mat4 = glm.mat4; // should not need this...

export default class Renderer2 {
    constructor(canvas) {
        this.gl = canvas.getContext("webgl2");

        this.program = this.createProgram(vs_src, fs_src);
        this.ui_program = this.createProgram(ui_pass_vs_src, ui_pass_fs_src);

        this.getShaderVariables();
        this.getShaderVariablesUIPass();

        this.setupRenderer();

        this.vao_cache = new Map();
        this.aabb_mesh = null;
    }

    addAABBMesh(aabb_mesh) {
        this.aabb_mesh = aabb_mesh;
        this.getVAO(aabb_mesh);
    }

    getVAO(mesh) {
        if (this.vao_cache.has(mesh)) {
            return this.vao_cache.get(mesh);
        }

        const vao = this.addObjectVAO(mesh);
        this.vao_cache.set(mesh, vao);
        return vao;
    }

    createProgram(vs_src, fs_src) {
        const vertex_shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        const fragment_shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        const program = this.gl.createProgram();

        this.gl.shaderSource(vertex_shader, vs_src);
        this.gl.compileShader(vertex_shader);

        this.gl.shaderSource(fragment_shader, fs_src);
        this.gl.compileShader(fragment_shader);

        this.gl.attachShader(program, vertex_shader);
        this.gl.attachShader(program, fragment_shader);
        this.gl.linkProgram(program);

        return program;
    }

    getShaderVariables() {
        // vertex shader variables
        this.a_pos_location = this.gl.getAttribLocation(this.program, "a_pos");
        this.a_clr_location = this.gl.getAttribLocation(this.program, "a_clr");
        this.u_model_location = this.gl.getUniformLocation(this.program, "u_model");
        this.u_view_location = this.gl.getUniformLocation(this.program, "u_view");
        this.u_proj_location = this.gl.getUniformLocation(this.program, "u_proj");

        // fragment shader variables
        this.u_useClr_location = this.gl.getUniformLocation(this.program, "u_useClr");
        this.u_clr_location = this.gl.getUniformLocation(this.program, "u_clr");

        return true;
    }

    getShaderVariablesUIPass() {
        this.ui_pass_pos_attrib = this.gl.getAttribLocation(this.ui_program, "a_pos");
        this.ui_pass_circle_center_uniform = this.gl.getUniformLocation(this.ui_program, "u_cntr");
        this.ui_pass_circle_radius = this.gl.getUniformLocation(this.ui_program, "u_radius");
        this.ui_pass_clr_uniform = this.gl.getUniformLocation(this.ui_program, "u_clr");

        this.ui_pass_windowBotLeft_uniform = this.gl.getUniformLocation(this.ui_program, "u_windowBotLeft");
        this.ui_pass_draw2DGizmo = this.gl.getUniformLocation(this.ui_program, "u_draw2DGizmo");

        return true;
    }

    addObjectVAO(mesh) {
        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        // create position vbo
        const position_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, position_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.a_pos_location);
        this.gl.vertexAttribPointer(
            this.a_pos_location, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0);

        // create color vbo
        const color_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.vertex_colors), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.a_clr_location);
        this.gl.vertexAttribPointer(
            this.a_clr_location, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0);

        // create index ebo
        const index_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), this.gl.STATIC_DRAW);

        this.gl.bindVertexArray(null);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        return vao;
    }

    setupRenderer() {
        this.gl.enable(this.gl.SCISSOR_TEST);
        
        // Needed to render UI pass
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }


    // new functions for Rework3

    // ( 1 ) 
    setViewport(left, bottom, width, height) { // call before!
        this.gl.viewport(left, bottom, width, height);
        this.gl.scissor(left, bottom, width, height);
        this.gl.clearColor(0.3, 0.3, 0.3, 1.0);
        // TODO: not a huge fan of this but can't call 
        // this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        // for each call to _renderToView3D
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }


    // ( 2 ) call x many times for all instances of separate objects (scene_objets, gizmo_objects)
    render3D(objects, camera, show_all_AABB = false) {
        // set up
        this.gl.useProgram(this.program);
        this.gl.uniformMatrix4fv(this.u_proj_location, this.gl.FALSE, camera.proj_matrix);
        this.gl.uniformMatrix4fv(this.u_view_location, this.gl.FALSE, camera.view_matrix);

        this.pass3D(objects, show_all_AABB);
    }

    // ( 3 ) call to render the UI overlay pass for 2D elements
    // currently just the single circle, so parameter is object not objectS
    renderUI(object, bottom_left) {
        // set up
        this.gl.useProgram(this.ui_program);
        this.gl.uniform2fv(this.ui_pass_windowBotLeft_uniform, bottom_left);

        this.passUI(object);
    }

    pass3D(objects, force_AABB) {
        objects.forEach(object => {
            // set depth test for each object
            object.depth_test ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST);

            // TODO: need to flag changes so that 
            // model matrix isnt recomputed EVERY SINGLE TIME RENDER IS CALLEd
            object.updateModelMatrix();

            this.gl.uniformMatrix4fv(this.u_model_location, this.gl.FALSE, object.model_matrix);
            this.gl.uniform1i(this.u_useClr_location, object.use_color);
            this.gl.uniform4fv(this.u_clr_location, [object.color[0], object.color[1], object.color[2], 1]);

            this.gl.bindVertexArray(this.getVAO(object.mesh));
            this.gl.drawElements(this.gl.TRIANGLES, object.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
            this.gl.bindVertexArray(null);

            // if force_AABB, the ViewWindow wants to show all AABBs, render all
            // if object.show_AABB, render regardless of force_AABB
            if (force_AABB || object.show_AABB) {
                this.gl.uniform1i(this.u_useClr_location, false);
                if (object.aabb !== null) {
                    if (!this.aabb_mesh) throw new Error("AABB mesh not set!");
                    const aabb = object.aabb;
                    this.gl.uniformMatrix4fv(this.u_model_location, this.gl.FALSE, aabb.model_matrix);

                    this.gl.bindVertexArray(this.getVAO(this.aabb_mesh));
                    this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_SHORT, 0);
                    this.gl.bindVertexArray(null);
                }
            }
        });
    }

    // TODO - Issue #9
    passUI(main_gizmo) {
        // fullscreen quad vertices
        const vertices = new Float32Array([
            -1, -1, // bot-left
             1, -1, // bot-right
            -1,  1, // top-left
             1,  1  // top-right
        ]);

        // update similar to pass3D() object.updateModelMatrix
        main_gizmo.updateCenter();

        const pos_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pos_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.ui_pass_pos_attrib);
        this.gl.vertexAttribPointer(this.ui_pass_pos_attrib, 2, this.gl.FLOAT, this.gl.FALSE, 0, 0);

        this.gl.uniform2fv(this.ui_pass_circle_center_uniform, main_gizmo.center);
        this.gl.uniform1f(this.ui_pass_circle_radius, main_gizmo.radius);
        this.gl.uniform3fv(this.ui_pass_clr_uniform, main_gizmo.color);
        this.gl.uniform1i(this.ui_pass_draw2DGizmo, true);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}