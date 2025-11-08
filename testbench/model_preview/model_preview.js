import vs_src from "./shaders/vertexshader.js";
import fs_src from "./shaders/fragmentshader.js";

const glm = glMatrix; // shorten math library name,
const mat4 = glm.mat4; // should not need this...

const canvas = document.getElementById("canvas");
const width = 400;
const height = 400;
canvas.width = width;
canvas.height = height;

const gl = canvas.getContext("webgl2");

const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertex_shader, vs_src);
gl.compileShader(vertex_shader);

const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragment_shader, fs_src);
gl.compileShader(fragment_shader);

const program = gl.createProgram();
gl.attachShader(program, vertex_shader);
gl.attachShader(program, fragment_shader);
gl.linkProgram(program);

const position_location = gl.getAttribLocation(program, "a_pos");
const color_location = gl.getAttribLocation(program, "a_clr");

const model_location = gl.getUniformLocation(program, "u_model");
const view_location = gl.getUniformLocation(program, "u_view");
const proj_location = gl.getUniformLocation(program, "u_proj");

/* const vertices = [
    -0.5, -0.5, 0.0, // left  
     0.5, -0.5, 0.0, // right 
     0.0,  0.5, 0.0  // top  
];

const vertex_colors = [
    1.0, 0.2, 0.4,
    0.2, 0.4, 1.0,
    0.4, 1.0, 0.2
]; */

const vertices = [
        -0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5,  0.5, -0.5,
         0.5,  0.5, -0.5,
        -0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,

        -0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
         0.5,  0.5,  0.5,
         0.5,  0.5,  0.5,
        -0.5,  0.5,  0.5,
        -0.5, -0.5,  0.5,

        -0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5,  0.5,
        -0.5,  0.5,  0.5,

         0.5,  0.5,  0.5,
         0.5,  0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5, -0.5,  0.5,
         0.5,  0.5,  0.5,

        -0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
        -0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,

        -0.5,  0.5, -0.5,
         0.5,  0.5, -0.5,
         0.5,  0.5,  0.5,
         0.5,  0.5,  0.5,
        -0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5
];

const vertex_colors =  [
    0.4, 1.0, 0.2,
    0.4, 1.0, 0.2,
    0.5, 0.2, 0.7,
    0.4, 1.0, 0.2,

    0.4, 1.0, 0.2,
    0.5, 0.2, 0.7,
    0.4, 1.0, 0.2,
    0.4, 1.0, 0.2,

    0.4, 1.0, 0.2,
    0.4, 1.0, 0.2,
    0.4, 1.0, 0.2,
    0.5, 0.2, 0.7,
    
    0.5, 0.2, 0.7,
    0.4, 1.0, 0.2,
    0.4, 1.0, 0.2,
    0.4, 1.0, 0.2,

    0.4, 1.0, 0.2,
    0.5, 0.2, 0.7,
    0.4, 1.0, 0.2,
    0.4, 1.0, 0.2,
    
    0.4, 1.0, 0.2,
    0.4, 1.0, 0.2,
    0.5, 0.2, 0.7,
    0.4, 1.0, 0.2
]

const model_matrix = mat4.create();
let view_matrix = mat4.create();
mat4.lookAt(view_matrix, [3,1,3], [0,0,0], [0,1,0]);
const proj_matrix = mat4.create();
mat4.perspective(proj_matrix, glm.glMatrix.toRadian(45), (width / height), 0.1, 1000);

const position_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.enableVertexAttribArray(position_location);
gl.vertexAttribPointer(position_location, 3, gl.FLOAT, gl.FALSE, 0, 0);

const color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_colors), gl.STATIC_DRAW);
gl.enableVertexAttribArray(color_location);
gl.vertexAttribPointer(color_location, 3, gl.FLOAT, gl.FALSE, 0, 0);

gl.viewport(0, 0, width, height);
gl.useProgram(program);
gl.clearColor(0.3, 0.3, 0.3, 1.0);
gl.enable(gl.DEPTH_TEST);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// set uniforms for FRAMEBUFFER0
gl.uniformMatrix4fv(proj_location, gl.FALSE, proj_matrix);
gl.uniformMatrix4fv(view_location, gl.FALSE, view_matrix);
gl.uniformMatrix4fv(model_location, gl.FALSE, model_matrix);

gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);


// create an image
// console.log(canvas.toDataURL("image/png"));
canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;

    document.getElementById("img1").appendChild(img);
});


// Now do the same thing but with a framebuffer using a texture buffer
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

const level = 0;
const internalFormat = gl.RGBA;
const border = 0;
const format = gl.RGBA;
const type = gl.UNSIGNED_BYTE;
const data = null;
gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// depth buffer
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, level);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer incomplete:", status.toString(16));
}

gl.viewport(0, 0, width, height);
gl.useProgram(program);
gl.clearColor(0.3, 0.3, 0.3, 1.0);
gl.enable(gl.DEPTH_TEST); // without a depth renderbuffer, enabling a depth test does nothing
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// set uniforms for FRAMEBUFFER1
view_matrix = mat4.create();
mat4.lookAt(view_matrix, [3,1,3], [0,0,0], [0,-1,0]);
gl.uniformMatrix4fv(proj_location, gl.FALSE, proj_matrix);
gl.uniformMatrix4fv(view_location, gl.FALSE, view_matrix);
gl.uniformMatrix4fv(model_location, gl.FALSE, model_matrix);

gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

// convert to image
const pixels = new Uint8Array(width * height * 4);
gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

const canvas2 = document.createElement("canvas");
canvas2.width = width;
canvas2.height = height;
const ctx = canvas2.getContext("2d");

const image_data = ctx.createImageData(width, height);
image_data.data.set(pixels);
ctx.putImageData(image_data, 0, 0);

canvas2.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    
    document.getElementById("img2").appendChild(img);
});

