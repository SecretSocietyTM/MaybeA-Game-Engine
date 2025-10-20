import vs_src from "../shaders/3d_pass/vertexshader.js";
import fs_src from "../shaders/3d_pass/fragmentshader.js";
import ui_pass_vs_src from "../shaders/ui_pass/vertexshader.js";
import ui_pass_fs_src from "../shaders/ui_pass/fragmentshader.js";

const glm = glMatrix; // shorten math library name,
const mat4 = glm.mat4; // should not need this...

export default class Renderer2 {
    constructor(canvas) {
        this.gl = canvas.getContext("webgl2");

        this.createProgram();
        this.getShaderVariables();
        this.setupRenderer();

        this.createUIPassProgram();
        this.getUIPassShaderVariables();

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

    createProgram() {
        const vertex_shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        const fragment_shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.program = this.gl.createProgram();

        this.gl.shaderSource(vertex_shader, vs_src);
        this.gl.compileShader(vertex_shader);

        this.gl.shaderSource(fragment_shader, fs_src);
        this.gl.compileShader(fragment_shader);

        this.gl.attachShader(this.program, vertex_shader);
        this.gl.attachShader(this.program, fragment_shader);
        this.gl.linkProgram(this.program);

        return true;
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

    createUIPassProgram() {
        const vertex_shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        const fragment_shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.ui_program = this.gl.createProgram();

        this.gl.shaderSource(vertex_shader, ui_pass_vs_src);
        this.gl.compileShader(vertex_shader);

        this.gl.shaderSource(fragment_shader, ui_pass_fs_src);
        this.gl.compileShader(fragment_shader);

        this.gl.attachShader(this.ui_program, vertex_shader);
        this.gl.attachShader(this.ui_program, fragment_shader);
        this.gl.linkProgram(this.ui_program);

        return true;    
    }

    getUIPassShaderVariables() {
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
        
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    renderToViews(views, gizmos, line3d) {
        views.forEach(view => {
            this.gl.viewport(view.left, view.bottom, view.width, view.height);
            this.gl.scissor(view.left, view.bottom, view.width, view.height);
            this.gl.clearColor(0.3, 0.3, 0.3, 1.0);

            // constant uniforms
            this.gl.useProgram(this.program);
            this.gl.uniformMatrix4fv(this.u_proj_location, this.gl.FALSE, view.proj_matrix);
            this.gl.uniformMatrix4fv(this.u_view_location, this.gl.FALSE, view.camera.view_matrix);
        
            this.pass3D(view.objects, false, view.show_AABB, line3d); // render scene objects

            if (view.show_gizmos && gizmos.display_gizmos) {
                this.pass3D(gizmos.active_objects, true, view.show_AABB, line3d); // render gizmos

                // add another flag to view for displaying UIPass
                if (view.show_UI) {
                    this.gl.useProgram(this.ui_program);
                    this.gl.uniform2fv(this.ui_pass_windowBotLeft_uniform, [view.left, view.bottom]);
                    this.passUI(gizmos.main_gizmo);
                }
            }
        });
    }

    /* TODO: remove line parameter */
    pass3D(objects, is_gizmo, show_AABB) {
        if (is_gizmo) {
            this.gl.disable(this.gl.DEPTH_TEST);
        } else {
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        }

        objects.forEach(object => {
            this.gl.uniformMatrix4fv(this.u_model_location, this.gl.FALSE, object.model_matrix);
            this.gl.uniform1i(this.u_useClr_location, object.use_color);
            this.gl.uniform4fv(this.u_clr_location, [object.color[0], object.color[1], object.color[2], object.alpha]);

            this.gl.bindVertexArray(this.getVAO(object.mesh));
            this.gl.drawElements(this.gl.TRIANGLES, object.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
            this.gl.bindVertexArray(null);

            if (show_AABB) {
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

    passUI(main_gizmo) {
        // fullscreen quad vertices
        const vertices = new Float32Array([
            -1, -1, // bot-left
             1, -1, // bot-right
            -1,  1, // top-left
             1,  1  // top-right
        ]);

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










    drawLine2D(p0, p1, color) {
        const vertices = new Float32Array([...p0, ...p1]);

        const pos_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pos_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(this.ui_pass_pos_attrib);
        this.gl.vertexAttribPointer(this.ui_pass_pos_attrib, 2, this.gl.FLOAT, this.gl.FALSE, 0, 0);

        this.gl.uniform3fv(this.ui_pass_clr_uniform, color);
        
        this.gl.drawArrays(this.gl.LINES, 0, 2);
    }

    drawLine3D(p0, p1, color) {
        this.gl.disable(this.gl.DEPTH_TEST);
        const vertices = new Float32Array([...p0, ...p1]);

        const pos_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pos_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(this.a_pos_location);
        this.gl.vertexAttribPointer(this.a_pos_location, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0);

        this.gl.uniform1i(this.u_useClr_location, true);
        this.gl.uniform4fv(this.u_clr_location, [color[0], color[1], color[2], 1.0]);
        this.gl.uniformMatrix4fv(this.u_model_location, this.gl.FALSE, mat4.create());
        
        this.gl.drawArrays(this.gl.LINES, 0, 2);
    }
}