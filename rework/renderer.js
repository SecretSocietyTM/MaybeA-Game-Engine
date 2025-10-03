export default class Renderer {
    constructor(canvas) {
        this.gl = canvas.getContext("webgl2");
        this.object_vaos = [];
    }

    createProgram(vertex_src, fragment_src) {
        const vertex_shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        const fragment_shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.program = this.gl.createProgram();

        this.gl.shaderSource(vertex_shader, vertex_src);
        this.gl.compileShader(vertex_shader);

        this.gl.shaderSource(fragment_shader, fragment_src);
        this.gl.compileShader(fragment_shader);

        this.gl.attachShader(this.program, vertex_shader);
        this.gl.attachShader(this.program, fragment_shader);
        this.gl.linkProgram(this.program);

        return true;
    }


    // TODO: non-fixed function | in the future, this will likely change as the shader changes. If  I want to implement a way to change the shader, I will need to find a way to dynammically obtain shader variables dynamically.
    getShaderVariables() {
        this.pos_attrib = this.gl.getAttribLocation(this.program, "a_pos");
        this.clr_attrib = this.gl.getAttribLocation(this.program, "a_clr");

        this.model_uniform = this.gl.getUniformLocation(this.program, "u_model");
        this.view_uniform = this.gl.getUniformLocation(this.program, "u_view");
        this.proj_uniform = this.gl.getUniformLocation(this.program, "u_proj");

        return true;
    }

    // TODO: should probably store vaos in an object with assigned "names"
    addObjectVAO(mesh) {
        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        // create position vbo
        const position_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, position_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.pos_attrib);
        this.gl.vertexAttribPointer(
            this.pos_attrib, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0);

        // create color vbo
        const color_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.vertex_colors), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.clr_attrib);
        this.gl.vertexAttribPointer(
            this.clr_attrib, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0);

        // create index ebo
        const index_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), this.gl.STATIC_DRAW);

        this.gl.bindVertexArray(null);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        this.object_vaos.push(vao);

        return vao;
    }

    setupRender(width, height, color) {
        this.gl.viewport(0, 0, width, height)

        this.gl.clearColor(color[0], color[1], color[2], color[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.useProgram(this.program);
    }

    renderFrame(view, proj, objects) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.uniformMatrix4fv(this.view_uniform, this.gl.FALSE, view);
        this.gl.uniformMatrix4fv(this.proj_uniform, this.gl.FALSE, proj);

        objects.forEach(object => {
            this.gl.uniformMatrix4fv(this.model_uniform, this.gl.FALSE, object.model_matrix);
            this.gl.bindVertexArray(object.vao);
            this.gl.drawElements(this.gl.TRIANGLES, object.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
            this.gl.bindVertexArray(null);

            if ("aabb" in object) {
                const aabb = object.aabb;
                this.gl.uniformMatrix4fv(this.model_uniform, 
                    this.gl.FALSE, aabb.aabb_model_matrix);
                this.gl.bindVertexArray(aabb.vao);
                this.gl.drawElements(this.gl.LINES, aabb.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
                this.gl.bindVertexArray(null);
            }
        });
    }
}