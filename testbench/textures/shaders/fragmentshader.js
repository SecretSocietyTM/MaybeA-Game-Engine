export default `#version 300 es
precision mediump float;

out vec4 fragColor;

in vec3 v_fragPos;
in vec3 v_normal;
in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform vec3 u_lightColor;
uniform vec3 u_lightPos;

void main() {
    float ambientStrength = 0.3;
    vec3 ambient = ambientStrength * u_lightColor;

    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_lightPos - v_fragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * u_lightColor;

    vec3 result = (ambient + diffuse) * texture(u_texture, v_texCoord).xyz;

    fragColor = vec4(result, 1.0);
}
`