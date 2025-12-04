import unlit_color_vs from "../../shaders/3d_shaders/UnlitColorProgram/vertexshader.js";
import unlit_color_fs from "../../shaders/3d_shaders/UnlitColorProgram/fragmentshader.js";

import unlit_texture_vs from "../../shaders/3d_shaders/UnlitTextureProgram/vertexshader.js";
import unlit_texture_fs from "../../shaders/3d_shaders/UnlitTextureProgram/fragmentshader.js";

import lit_color_vs from "../../shaders/3d_shaders/LitColorProgram/vertexshader.js";
import lit_color_fs from "../../shaders/3d_shaders/LitColorProgram/fragmentshader.js";

import ui_pass_vs_src from "../../shaders/ui_pass/vertexshader.js";
import ui_pass_fs_src from "../../shaders/ui_pass/fragmentshader.js";

// shader types:
// position, color (pc) (unlit color)
// position, color, normal (pcn) (lit color)

// position, uv (pu) (unlit texture)
// position, uv, normal (pun) (lit texture)

// in the case where we get 
// position, uv, color, ... disable one of the two attributes and use
// one of the two shaders from above


export default class Renderer2 {
    constructor(canvas) {
        this.gl = canvas.getContext("webgl2");

        this.programs3D = {};
        this.init3DPrograms();

        this.ui_program = this.createProgram(ui_pass_vs_src, ui_pass_fs_src);
        this.getShaderVariablesUIPass();

        this.setupRenderer();

        this.vao_cache = new Map();
        this.aabb_mesh = null;

        this.texture_cache = new Map(); // (key: name, value: texture)
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

        // TODO: improve program / shader log
        /* console.log(this.gl.getShaderInfoLog(vertex_shader));
        console.log(this.gl.getShaderInfoLog(fragment_shader));
        console.log(this.gl.getProgramInfoLog(program)); */

        return program;
    }

    init3DPrograms() {

        const scope = this;

        //
        // unlit color
        const unlit_color = {};
        unlit_color.program = this.createProgram(unlit_color_vs, unlit_color_fs);

        unlit_color.variables = {
            "a_position":   this.gl.getAttribLocation(unlit_color.program, "a_position"),
            "a_color":      this.gl.getAttribLocation(unlit_color.program, "a_color"),

            "u_proj":       this.gl.getUniformLocation(unlit_color.program, "u_proj"),
            "u_view":       this.gl.getUniformLocation(unlit_color.program, "u_view"),
            "u_model":      this.gl.getUniformLocation(unlit_color.program, "u_model"),
            "u_useColor":   this.gl.getUniformLocation(unlit_color.program, "u_useColor"),
            "u_solidColor": this.gl.getUniformLocation(unlit_color.program, "u_solidColor"),
        };

        unlit_color.useProgram = function (gl, object, camera) {

            const vars = this.variables;
        
            gl.useProgram(this.program);

            // set all uniforms
            gl.uniformMatrix4fv(vars.u_proj, gl.FALSE, camera.proj_matrix);
            gl.uniformMatrix4fv(vars.u_view, gl.FALSE, camera.view_matrix);
            gl.uniformMatrix4fv(vars.u_model, gl.FALSE, object.model_matrix);

            gl.uniform1i(vars.u_useColor, object.use_color);
            gl.uniform4fv(vars.u_solidColor, [...object.color, 1.0]);
        };

        //
        // unlit texture
        const unlit_texture = {};
        unlit_texture.program = this.createProgram(unlit_texture_vs, unlit_texture_fs);

        unlit_texture.variables = {
            "a_position":   this.gl.getAttribLocation(unlit_texture.program, "a_position"),
            "a_texCoord":      this.gl.getAttribLocation(unlit_texture.program, "a_texCoord"),

            "u_proj":       this.gl.getUniformLocation(unlit_texture.program, "u_proj"),
            "u_view":       this.gl.getUniformLocation(unlit_texture.program, "u_view"),
            "u_model":      this.gl.getUniformLocation(unlit_texture.program, "u_model"),
            "u_texture":    this.gl.getUniformLocation(unlit_texture.program, "u_texture"),
            "u_useColor":   this.gl.getUniformLocation(unlit_texture.program, "u_useColor"),
            "u_solidColor": this.gl.getUniformLocation(unlit_texture.program, "u_solidColor"),
        };

        unlit_texture.useProgram = function (gl, object, camera) {
            
            const vars = this.variables;

            gl.useProgram(this.program);

            // set all uniforms
            gl.uniformMatrix4fv(vars.u_proj, gl.FALSE, camera.proj_matrix);
            gl.uniformMatrix4fv(vars.u_view, gl.FALSE, camera.view_matrix);
            gl.uniformMatrix4fv(vars.u_model, gl.FALSE, object.model_matrix);

            // get, activate, and bind the texture
            if (object.texture !== null) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, scope.getTexture(object.texture));
                gl.uniform1i(vars.u_texture, 0); // texture location set to 0
                gl.uniform1i(vars.u_useColor, object.use_color);
            } else {
                gl.uniform1i(vars.u_useColor, true);
            }
            /* gl.uniform1i(vars.u_texture, 0); // texture location set to 0 */
            gl.uniform4fv(vars.u_solidColor, [...object.color, 1.0]);
        }

        //
        // lit color
        const lit_color = {};
        lit_color.program = this.createProgram(lit_color_vs, lit_color_fs);

        lit_color.variables = {
            "a_position":      this.gl.getAttribLocation(lit_color.program, "a_position"),
            "a_color":         this.gl.getAttribLocation(lit_color.program, "a_color"),
            "a_normal":        this.gl.getAttribLocation(lit_color.program, "a_normal"),

            "u_proj":          this.gl.getUniformLocation(lit_color.program, "u_proj"),
            "u_view":          this.gl.getUniformLocation(lit_color.program, "u_view"),
            "u_model":         this.gl.getUniformLocation(lit_color.program, "u_model"),
            "u_useColor":      this.gl.getUniformLocation(lit_color.program, "u_useColor"),
            "u_solidColor":    this.gl.getUniformLocation(lit_color.program, "u_solidColor"),
            "u_lightColor":    this.gl.getUniformLocation(lit_color.program, "u_lightColor"),
        };

        lit_color.useProgram = function (gl, object, camera) {

            const vars = this.variables;

            gl.useProgram(this.program);

            // set all uniforms
            gl.uniformMatrix4fv(vars.u_proj, gl.FALSE, camera.proj_matrix);
            gl.uniformMatrix4fv(vars.u_view, gl.FALSE, camera.view_matrix);
            gl.uniformMatrix4fv(vars.u_model, gl.FALSE, object.model_matrix);

            gl.uniform1i(vars.u_useColor, object.use_color);
            gl.uniform4fv(vars.u_solidColor, [...object.color, 1.0]);
            gl.uniform3fv(vars.u_lightColor, [1.0, 1.0, 1.0]);
        }

        this.programs3D.unlit_color = unlit_color;
        this.programs3D.unlit_texture = unlit_texture;
        this.programs3D.lit_color = lit_color;

        console.log("programs", this.programs3D);
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

    addAABBMesh(aabb_mesh) {
        this.aabb_mesh = aabb_mesh;
        this.getVAO(aabb_mesh, this.programs3D.unlit_color.variables);
    }

    getVAO(mesh, program_variables) {
        if (this.vao_cache.has(mesh)) {
            return this.vao_cache.get(mesh);
        }

        const vao = this.addObjectVAODynamic(mesh, program_variables);
        this.vao_cache.set(mesh, vao);
        return vao;
    }

    // vars = program variables
    addObjectVAODynamic(mesh, vars) {
        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        this.createVBO(mesh.vertices, vars.a_position, 3);
        
        // TODO: instead of having certain mesh properties = null,
        // just dont add them and check for existance
        if (mesh.vertex_colors !== null) {
            this.createVBO(mesh.vertex_colors, vars.a_color, 3);   
        }

        if (mesh.normals !== null) {
            this.createVBO(mesh.normals, vars.a_normal, 3);
        }

        // TODO: this is NOT going to work LOL
        if (mesh.uv_coords !== null) {
            this.createVBO(mesh.uv_coords, vars.a_texCoord, 2);
        }

        this.createEBO(mesh.indices);

        // TODO: figure out where this should go, or if it even matters
        this.gl.bindVertexArray(null);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        return vao;
    }

    createVBO(data, location, size) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, this.gl.FALSE, 0, 0);
    }

    createEBO(data) {
        if (data === null) return;

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), this.gl.STATIC_DRAW)
    }

    // TODO: using "texture" can get confusing as I use to represent both the texture object {name: , data: }
    // and the actual texture data itself...
    getTexture(texture) {
        if (this.texture_cache.has(texture.name)) {
            return this.texture_cache.get(texture.name);
        }

        const gl_texture = this.addTexture(texture.data);
        this.texture_cache.set(texture.name, gl_texture);
    }

    addTexture(tex_data) {
        const gl_texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, gl_texture);

        // TODO: hard coding these right now...
        const level = 0;
        const internal_format = this.gl.RGBA;
        const tex_width = tex_data.width;
        const tex_height = tex_data.height;
        const border = 0;
        const format = this.gl.RGBA;
        const type = this.gl.UNSIGNED_BYTE;
        const data = tex_data.data;

        this.gl.texImage2D(
            this.gl.TEXTURE_2D, level, internal_format, 
            tex_width, tex_height, border, format, type, data
        );

        // set texture wrapping params (this is optional)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        // set textre filtering params (these seem required)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

        return gl_texture;
    }
    
    setupRenderer() {
        // for multiple views
        this.gl.enable(this.gl.SCISSOR_TEST);
        
        // for UI pass
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

    // ( 2 ) call x many times for all instances of separate objects (scene_objets, gizmo_objects)
    render3D(objects, camera, force_AABB) {
        objects.forEach(object => {
            this.render3DObject(object, camera, force_AABB)
        });
    }

    render3DObject(object, camera, force_AABB) {

        if (!object.visible) return;

        object.depth_test ? this.gl.enable(this.gl.DEPTH_TEST) : this.gl.disable(this.gl.DEPTH_TEST);

        object.updateModelMatrix();

        const p = this.determineProgram(object);
        p.useProgram(this.gl, object, camera);

        const mesh = object.mesh.data;

        this.gl.bindVertexArray(this.getVAO(mesh, p.variables));
        this.gl.drawElements(this.gl.TRIANGLES, mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);

        // AABBs are drawn with the same program no matter what
        if (force_AABB || object.show_AABB) {
            const program = this.programs3D.unlit_color;
            this.gl.useProgram(program.program);
            
            const aabb = object.aabb;

            this.gl.uniformMatrix4fv(program.variables.u_proj, this.gl.FALSE, camera.proj_matrix);
            this.gl.uniformMatrix4fv(program.variables.u_view, this.gl.FALSE, camera.view_matrix);
            this.gl.uniformMatrix4fv(program.variables.u_model, this.gl.FALSE, aabb.model_matrix);

            this.gl.uniform1f(program.variables.u_useColor, false);

            this.gl.bindVertexArray(this.getVAO(this.aabb_mesh, program.variables));
            this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_SHORT, 0);
            this.gl.bindVertexArray(null);
        }
    }

    // ( 3 ) call to render the UI overlay pass for 2D elements
    // currently just the single circle, so parameter is object not objects
    renderUI(object, bottom_left) {
        // set up
        this.gl.useProgram(this.ui_program);
        this.gl.uniform2fv(this.ui_pass_windowBotLeft_uniform, bottom_left);

        this.passUI(object);
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
        this.gl.viewport(0, 0, width, height);
        this.gl.clearColor(0.18, 0.18, 0.18, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.SCISSOR_TEST);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        const p = this.determineProgram(object);
        p.useProgram(this.gl, object, camera);

        const mesh = object.mesh.data;

        this.gl.bindVertexArray(this.getVAO(mesh, p.variables));
        this.gl.drawElements(this.gl.TRIANGLES, mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
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

    // need something more complex since there are
    // many combinations that a mesh can have
    // curious to see how three.js handles this.
    determineProgram(object) {

        let program;
        
        const mesh = object.mesh.data;

        // mesh has no uv coords, or it does but use texture === false
        if (mesh.uv_coords === null/*  || !object.use_texture */) {
            if (mesh.normals === null) {
                // use unlit color program
                program = this.programs3D.unlit_color;
            } else {
               // use lit color program
                program = this.programs3D.lit_color; 
            }
        } else {
            if (mesh.normals === null) {
                // use unlit texture program
            program = this.programs3D.unlit_texture;
            } else {
                // use lit texture program
                program = this.programs3D.lit_texture;
            }
        }

/*         if (mesh.normals === null) {
            // use unlit program
           program = this.programs3D.unlit_color;
        } else {
            // use lit program
            program = this.programs3D.lit_color;
        } */

        return program;
    }
}