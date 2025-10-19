export default `#version 300 es
precision mediump float;

in vec4 v_clr;

out vec4 frag_color;

uniform bool u_useClr;
uniform vec4 u_clr;

void main() {
    if (u_useClr) frag_color = u_clr;
    else frag_color = v_clr;
}
`