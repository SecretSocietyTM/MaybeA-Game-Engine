export default `#version 300 es
precision mediump float;

in vec2 v_uv;

out vec4 frag_color;

uniform vec3 u_clr;

void main() {
    vec2 center = vec2(0.5, 0.5);
    float radius = 0.015625;

    // Compute distance from current pixel to circle center
    float dist = length(v_uv - center);

    // If outside radius, discard the fragment (transparent)
    if (dist > radius)
        discard;

    frag_color = vec4(u_clr, 1.0);
}
`