export default {

    showError(error_text) {
        console.error(error_text);
    },

    createStaticVertexBuffer(gl, data) {
        const buffer = gl.createBuffer();
        if (!buffer) {
            showError("Failed to allocate buffer");
            return null;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return buffer;
    },

    createStaticIndexBuffer(gl, data) {
        const buffer = gl.createBuffer();
        if (!buffer) {
            showError("Failed to allocate buffer");
            return null;
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return buffer;
    },

    createProgram(gl, vs_source, fs_source) {
        const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
        const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
        const program = gl.createProgram();

        if (!vertex_shader || !fragment_shader || !program) {
            showError(`Failed to allocate GL objects (`
            + `vs=${!!vertex_shader}, `
            + `fs=${!!fragment_shader}, `
            + `program=${!!program})`);
            return null;
        }

        gl.shaderSource(vertex_shader, vs_source);
        gl.compileShader(vertex_shader);
        if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
            const error_message = gl.getShaderInfoLog(vertex_shader);
            showError(`Failed to compile vertex shader: ${error_message}`);
            return null;
        }

        gl.shaderSource(fragment_shader, fs_source);
        gl.compileShader(fragment_shader);
        if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
            const error_message = gl.getShaderInfoLog(fragment_shader);
            showError(`Failed to compile fragment shader: ${error_message}`);
            return null;
        }

        gl.attachShader(program, vertex_shader);
        gl.attachShader(program, fragment_shader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error_message = gl.getProgramInfoLog(program);
            showError(`Failed to link GPU program: ${error_message}`);
            return null;
        }

        return program;
    },

    createVertexElementVAO(gl, vbo, ebo, pos_attrib, clr_attrib) {
        const vao = gl.createVertexArray();
        if (!vao) {
            showError("Failed to create VAO");
            return null;
        }

        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

        gl.enableVertexAttribArray(pos_attrib);
        gl.vertexAttribPointer(
            pos_attrib, 3, gl.FLOAT, gl.FALSE,
            6 * Float32Array.BYTES_PER_ELEMENT, 0);

        gl.enableVertexAttribArray(clr_attrib);
        gl.vertexAttribPointer(
            clr_attrib, 3, gl.FLOAT, gl.FALSE,
            6 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vao;
    },

    createNonInterleavedVao(gl, p_vbo, c_vbo, ebo, pos_attrib, clr_attrib) {
        const vao = gl.createVertexArray();
        if (!vao) {
            showError("Failed to create VAO");
            return null;
        }

        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, p_vbo);
        gl.enableVertexAttribArray(pos_attrib);
        gl.vertexAttribPointer(
            pos_attrib, 3, gl.FLOAT, gl.FALSE,
            3 * Float32Array.BYTES_PER_ELEMENT, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, c_vbo);
        gl.enableVertexAttribArray(clr_attrib);
        gl.vertexAttribPointer(
            clr_attrib, 3, gl.FLOAT, gl.FALSE,
            3 * Float32Array.BYTES_PER_ELEMENT, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vao;        
    },

    createVertexVao(gl, vertex_buffer, pos_attrib, clr_attrib) {
        const vao = gl.createVertexArray();
        if (!vao) {
            showError("Failed to create VAO");
            return null;
        }

        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

        gl.enableVertexAttribArray(pos_attrib);
        gl.vertexAttribPointer(
            pos_attrib, 3, gl.FLOAT, gl.FALSE,
            6 * Float32Array.BYTES_PER_ELEMENT, 0);

        gl.enableVertexAttribArray(clr_attrib);
        gl.vertexAttribPointer(
            clr_attrib, 3, gl.FLOAT, gl.FALSE,
            6 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vao;
    },

    setupRender(gl, canvas, width, height, color) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        gl.clearColor(color[0], color[1], color[2], color[3]);
        gl.enable(gl.DEPTH_TEST);
    },

    getContext(canvas) {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            const support_webgl1 = !!(document.createElement('canvas')).getContext('webgl');
            if (support_webgl1) {
                throw new Error('WebGL 1 is supported, but not v2 - try using a different device or browser');
            } else {
                throw new Error('WebGL is not supported on this device - try using a different device or browser');
            }
        }

        return gl;
    }
};
