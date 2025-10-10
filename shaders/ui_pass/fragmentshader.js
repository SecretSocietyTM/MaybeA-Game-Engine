export default `#version 300 es
precision mediump float;

out vec4 frag_color;

uniform vec2 u_cntr;
// uniform float u_radius;
uniform vec3 u_clr;

void main() {
    float radius = 10.0;
    float radius2 = 8.0;
    float dist = length(gl_FragCoord.xy - u_cntr);
    float alpha = 1.0;
    if (dist > radius || dist < radius2) discard;

    frag_color = vec4(u_clr, alpha);


    /* float radius = 10.0;
    float dist = length(gl_FragCoord.xy - u_cntr);
    float alpha = 1.0;
    if (dist > radius) discard;

    frag_color = vec4(u_clr, alpha); */
} 
`