import vs_src from "../../shaders/3d_pass/vertexshader.js"
import fs_src from "../../shaders/3d_pass/fragmentshader.js";
import ui_pass_vs_src from "../../shaders/ui_pass/vertexshader.js";
import ui_pass_fs_src from "../../shaders/ui_pass/fragmentshader.js";
import lighting_vs_src from "../../shaders/3d_pass_light/vertexshader.js";
import lighting_fs_src from "../../shaders/3d_pass_light/fragmentshader.js";


export default class Renderer2 {
    constructor(canvas) {
        this.gl = canvas.getContext("webgl2");

        this.program = this.createProgram(vs_src, fs_src);
        this.ui_program = this.createProgram(ui_pass_vs_src, ui_pass_fs_src);
        this.program2 = this.createProgram(lighting_vs_src, lighting_fs_src);

        this.getShaderVariables();
        this.getShaderVariablesUIPass();
        this.getShaderVariablesLighting();

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

    // for lighting
    getVAO2(mesh) {
        if (this.vao_cache.has(mesh)) {
            return this.vao_cache.get(mesh);
        }

        const vao = this.addObjectVAO2(mesh);
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

    getShaderVariablesLighting() {
        //
        // vertex shader variables
        this.a_pos_location2 = this.gl.getAttribLocation(this.program2, "a_pos");
        this.a_normal_location2 = this.gl.getAttribLocation(this.program2, "a_normal");
        this.a_color_location2 = this.gl.getAttribLocation(this.program2, "a_color");

        this.u_proj_location2 = this.gl.getUniformLocation(this.program2, "u_proj");
        this.u_view_location2 = this.gl.getUniformLocation(this.program2, "u_view");
        this.u_model_location2 = this.gl.getUniformLocation(this.program2, "u_model");
        this.u_normal_location2 = this.gl.getUniformLocation(this.program2, "u_normal");
        
        //
        // fragment shader variables 
        this.u_lightColor_location2 = this.gl.getUniformLocation(this.program2, "u_lightColor");
        this.u_lightPos_location2 = this.gl.getUniformLocation(this.program2, "u_lightPos");
        this.u_useColor_location2 = this.gl.getUniformLocation(this.program2, "u_useColor");
        this.u_objectColor_location2 = this.gl.getUniformLocation(this.program2, "u_objectColor");

        return true;
    }

    // TODO: add a way to determine "options" for
    // vertex colors, normals, uvs,
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

    addObjectVAO2(mesh) {
        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        // create position VBO
        const position_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, position_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.a_pos_location2);
        this.gl.vertexAttribPointer(
            this.a_pos_location2, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0
        );

        // create color VBO
        const color_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.vertex_colors), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.a_color_location2);
        this.gl.vertexAttribPointer(
            this.a_color_location2, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0
        );
    
        // create normal VBO
        const normal_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normal_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.normals), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.a_normal_location2);
        this.gl.vertexAttribPointer(
            this.a_normal_location2, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0
        );

        // create face EBO
        const face_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, face_buffer);
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
        this.gl.viewport(left, bottom, width + 1, height + 1); // + 1 because it leaves a bit of empty space caused by width / height not being an integer
        this.gl.scissor(left, bottom, width + 1, height + 1);
        this.gl.clearColor(0.3, 0.3, 0.3, 1.0);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    // ( 2 ) not to be called for rendering 3d gizmos
    render3DLighting(objects, camera, show_all_AABB = false) {
        // set up
        this.gl.useProgram(this.program2);

        // set up constant lighting variables
        this.gl.uniform3fv(this.u_lightColor_location2, [1.0, 1.0, 1.0]);
        this.gl.uniform3fv(this.u_lightPos_location2, [3.0, 3.0, 3.0]);

        // set up transform matrices
        this.gl.uniformMatrix4fv(this.u_proj_location2, this.gl.FALSE, camera.proj_matrix);
        this.gl.uniformMatrix4fv(this.u_view_location2, this.gl.FALSE, camera.view_matrix);

        this.pass3DLighting(objects, show_all_AABB);
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

    pass3DLighting(objects, force_AABB) {
        objects.forEach(object => {
            if (!object.visible) return;

            object.depth_test ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST);

            object.updateModelMatrix();
            /* object.updateNormalMatrix(); */

            this.gl.uniformMatrix4fv(this.u_model_location2, this.gl.FALSE, object.model_matrix);
            this.gl.uniformMatrix4fv(this.u_normal_location2, this.gl.FALSE, object.normal_matrix);
            this.gl.uniform1i(this.u_useColor_location2, object.use_color);
            this.gl.uniform4fv(this.u_objectColor_location2, [object.color[0], object.color[1], object.color[2], 1]);

            this.gl.bindVertexArray(this.getVAO2(object.mesh.data));
            this.gl.drawElements(this.gl.TRIANGLES, object.mesh.data.indices.length, this.gl.UNSIGNED_SHORT, 0);
            this.gl.bindVertexArray(null);

/*             if (force_AABB || object.show_AABB) {
                this.gl.uniform1i(this.u_useColor_location2, false);
                if (object.aabb !== null) {
                    // swap to regular program...
                    if (!this.aabb_mesh) throw new Error("AABB mesh not set!");
                    const aabb = object.aabb;
                    this.gl.uniformMatrix4fv(this.u_model_location2, this.gl.FALSE, aabb.model_matrix);

                    this.gl.bindVertexArray(this.getVAO(this.aabb_mesh));
                    this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_SHORT, 0);
                    this.gl.bindVertexArray(null);
                }
            } */
        });
    }

    pass3D(objects, force_AABB) {
        objects.forEach(object => {
            if (!object.visible) return;

            object.depth_test ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST);

            object.updateModelMatrix();

            this.gl.uniformMatrix4fv(this.u_model_location, this.gl.FALSE, object.model_matrix);
            this.gl.uniform1i(this.u_useClr_location, object.use_color);
            this.gl.uniform4fv(this.u_clr_location, [object.color[0], object.color[1], object.color[2], 1]);

            this.gl.bindVertexArray(this.getVAO(object.mesh.data));
            this.gl.drawElements(this.gl.TRIANGLES, object.mesh.data.indices.length, this.gl.UNSIGNED_SHORT, 0);
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













    modelPreviewThing(object, camera, size) {

        // define the buffer dimensions
        const width = size;
        const height = size;

        // create a new framebuffer to render to and bind it
        const fb = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);

        // create a texture since it can be written to as if it was a color/depth buffer
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = this.gl.RGBA;
        const border = 0;
        const format = this.gl.RGBA;
        const type = this.gl.UNSIGNED_BYTE;
        const data = null;
        // The goal is to allocate memory to use as a buffer to do off-screen rendering
        this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data); 

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);


        // depth buffer
        const depthBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);

        // attach the texture buffer and depth buffer to the framebuffer
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, level);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, depthBuffer);

        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer incomplete:", status.toString(16));
        }


        // now you can supply data to it like you would the default framebuffer
        // need to redefine the viewport as thats how the viewport transform part of the rendering pipeline works
        this.gl.useProgram(this.program);
        this.gl.viewport(0, 0, width, height);
        this.gl.clearColor(0.18, 0.18, 0.18, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.SCISSOR_TEST);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.uniformMatrix4fv(this.u_view_location, this.gl.FALSE, camera.view_matrix);
        this.gl.uniformMatrix4fv(this.u_proj_location, this.gl.FALSE, camera.proj_matrix);

        // use object properties
        this.gl.uniformMatrix4fv(this.u_model_location, this.gl.FALSE, object.model_matrix);
        this.gl.uniform1i(this.u_useClr_location, object.use_color);
        this.gl.uniform4fv(this.u_clr_location, [object.color[0], object.color[1], object.color[2], 1]);

        this.gl.bindVertexArray(this.getVAO(object.mesh.data));
        this.gl.drawElements(this.gl.TRIANGLES, object.mesh.data.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);

        // read the pixel data
        const pixels = new Uint8Array(width * height * 4);
        this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        const image_data = ctx.createImageData(width, height);
        image_data.data.set(pixels);
        ctx.putImageData(image_data, 0, 0);
        const url = canvas.toDataURL("image/png");

        // set the framebuffer back to the default once done
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.enable(this.gl.SCISSOR_TEST);
        return url;
    }

}