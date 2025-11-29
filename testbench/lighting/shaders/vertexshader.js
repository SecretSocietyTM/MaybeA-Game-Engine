export default `#version 300 es

out vec3 v_fragPos;
out vec3 v_normal;
out vec4 v_color;

in vec4 a_pos;
in vec3 a_normal;
in vec4 a_color;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;

void main() {
    gl_Position = u_proj * u_view * u_model * a_pos;
    v_fragPos = (u_model * a_pos).xyz;
    v_normal = a_normal;
    v_color = a_color;
}
`