export default `#version 300 es
precision mediump float;

in vec2 v_uv;

out vec4 frag_color;

uniform vec2 u_cntr;
uniform vec3 u_clr;
uniform float u_aspect_ratio;

void main() {
    vec2 uv = v_uv - u_cntr;
    uv.x *= u_aspect_ratio;

    float radius = 0.02;

    // Compute distance from current pixel to circle center
    float dist = length(uv);

    // If outside radius, discard the fragment (transparent)
    if (dist > radius)
        discard;

    frag_color = vec4(u_clr, 1.0);
}
`