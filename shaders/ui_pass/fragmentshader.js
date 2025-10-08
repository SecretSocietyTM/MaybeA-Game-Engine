export default `#version 300 es
precision mediump float;

in vec2 v_uv;

out vec4 frag_color;

uniform vec2 u_cntr;
uniform vec3 u_clr;
uniform float u_aspect_ratio;

void main() {
    vec2 uv2 = vec2(v_uv.x * u_aspect_ratio, v_uv.y);
    vec2 cntr2 = vec2(u_cntr.x * u_aspect_ratio, u_cntr.y);

    float radius = 0.02;
    float dist = length(uv2 - cntr2);
    if (dist > radius) discard;
    frag_color = vec4(u_clr, 1.0);
}
`