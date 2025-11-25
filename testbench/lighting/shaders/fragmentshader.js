export default `#version 300 es
precision mediump float;

out vec4 fragColor;

uniform vec3 u_objectColor;
uniform vec3 u_lightColor;

void main() {
    float ambientStrength = 0.1;
    vec3 ambient = ambientStrength * u_lightColor;

    vec3 result = ambient * u_objectColor;

    fragColor = vec4(result, 1.0);
}
`