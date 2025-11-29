export default `#version 300 es
precision mediump float;

out vec4 fragColor;

in vec3 v_fragPos;
in vec3 v_normal;
in vec4 v_color;

uniform vec3 u_objectColor;
uniform vec3 u_lightColor;
uniform vec3 u_lightPos;

void main() {
    float ambientStrength = 0.2;
    vec3 ambient = ambientStrength * u_lightColor;

    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_lightPos - v_fragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * u_lightColor;

    vec3 result = (ambient + diffuse) * v_color.xyz;

    fragColor = vec4(result, 1.0);
}
`