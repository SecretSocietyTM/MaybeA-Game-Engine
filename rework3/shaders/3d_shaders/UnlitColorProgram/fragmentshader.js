export default `#version 300 es
precision mediump float;

out vec4 fragColor;

in vec4 v_vertexColor;

uniform bool u_useColor;
uniform vec4 u_solidColor;

void main() {
    vec4 objectColor = vec4(1.0);

    if (u_useColor) {
        objectColor = u_solidColor;
    } else {
        objectColor = v_vertexColor;    
    }

    fragColor = objectColor;
}
`