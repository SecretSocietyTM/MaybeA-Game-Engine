#version 300 es
precision mediump float;

out vec4 fragColor;

in vec3 v_fragPos;
in vec3 v_normal;
in vec4 v_vertexColor;

uniform bool u_useColor;
uniform vec4 u_solidColor;
uniform vec3 u_lightColor;
uniform vec3 u_lightPosition;

void main() {
    vec4 objectColor = vec4(1.0);

    if (u_useColor) {
        objectColor = u_solidColor;
    } else {
        objectColor = v_vertexColor;    
    }

    float ambientStrength = 0.2;
    vec3 ambient = ambientStrength * u_lightColor;

    vec3 normal = normalize(v_normal);
    vec3 lightDirection = normalize(u_lightPosition - v_fragPos);
    float diffuseStrength = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = diffuseStrength * u_lightColor;

    vec3 result = (ambient + diffuse) * objectColor.xyz;

    fragColor = vec4(result, 1.0);
}