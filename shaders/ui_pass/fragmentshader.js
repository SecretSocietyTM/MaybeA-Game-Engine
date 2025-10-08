export default `#version 300 es
precision mediump float;

in vec2 v_uv;

out vec4 frag_color;

uniform vec2 u_cntr;
uniform vec3 u_clr;

void main() {
    float radius = 0.0078125;

    // Compute distance from current pixel to circle center
    float dist = length(v_uv - u_cntr);

    // If outside radius, discard the fragment (transparent)
    if (dist > radius)
        discard;

    frag_color = vec4(u_clr, 1.0);
}
`