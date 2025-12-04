export default `#version 300 es

out vec3 v_fragPos;
out vec3 v_normal;
out vec2 v_texCoord;

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texCoord;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;

// TODO: add uniform mat4 u_normal;

void main() {
    gl_Position = u_proj * u_view * u_model * a_position;
    v_fragPos = (u_model * a_position).xyz;
    v_normal = a_normal; // TODO: * u_normal;
    v_texCoord = a_texCoord;
}
`