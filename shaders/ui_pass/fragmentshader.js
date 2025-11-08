export default `#version 300 es
precision mediump float;

out vec4 frag_color;

uniform vec2 u_cntr;
uniform float u_radius;
uniform vec3 u_clr;
uniform vec2 u_windowBotLeft;
uniform bool u_draw2DGizmo;

void main() {
    vec2 uv = gl_FragCoord.xy - u_windowBotLeft;
    float dist = length(uv - u_cntr);

    float radius = u_radius;
    float radius2 = radius - 2.0;
    float alpha = 1.0;
    
    if (u_draw2DGizmo) {
        if (dist > radius || dist < radius2) discard;
        else frag_color = vec4(u_clr, alpha);
    } else {
        frag_color = vec4(u_clr, alpha);
    }
} 
`