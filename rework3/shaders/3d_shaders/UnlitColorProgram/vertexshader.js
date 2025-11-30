export default `#version 300 es

out vec4 v_vertexColor;

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;

void main() {
    gl_Position = u_proj * u_view * u_model * a_position;
    v_vertexColor = a_color;
}
`