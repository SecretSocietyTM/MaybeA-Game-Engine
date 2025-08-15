import { showError } from "./gl_utils.js";

export function createCubeMultiColored(colors) {

    let vertices = 
    [
        -0.5, -0.5, 0.5, colors[0][0], colors[0][1], colors[0][2], // front-top-left
        -0.5,  0.5, 0.5, colors[1][0], colors[1][1], colors[1][2], // front-bot-left
         0.5, -0.5, 0.5, colors[2][0], colors[2][1], colors[2][2], // front-top-right
         0.5,  0.5, 0.5, colors[3][0], colors[3][1], colors[3][2], // front-bot-right

        -0.5, -0.5, -0.5, colors[4][0], colors[4][1], colors[4][2], // back-top-left
        -0.5,  0.5, -0.5, colors[5][0], colors[5][1], colors[5][2], // back-bot-left
         0.5, -0.5, -0.5, colors[6][0], colors[6][1], colors[6][2], // back-top-right
         0.5,  0.5, -0.5, colors[7][0], colors[7][1], colors[7][2], // back-bot-right
    ];

    let indices = 
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
    return {vertices, indices};
}

export function createPosClrInterleavedVao(gl, vertex_buffer, index_buffer, pos_attrib, clr_attrib) {
    const vao = gl.createVertexArray();
    if (!vao) {
        showError("Failed to create VAO");
        return null;
    }

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

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
}