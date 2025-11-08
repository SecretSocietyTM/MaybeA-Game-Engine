export default `#version 300 es

in vec4 a_pos;
in vec4 a_clr;

out vec4 v_clr;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;

void main() {
    gl_Position = u_proj * u_view * u_model * a_pos;
    v_clr = a_clr;
}
`