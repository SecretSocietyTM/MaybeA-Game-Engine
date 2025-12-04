export default `#version 300 es

out vec2 v_texCoord;

in vec4 a_position;
in vec2 a_texCoord;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;

void main() {
    gl_Position = u_proj * u_view * u_model * a_position;
    v_texCoord = a_texCoord;
}
`