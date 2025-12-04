export default `#version 300 es
precision mediump float;

out vec4 fragColor;

in vec3 v_fragPos;
in vec3 v_normal;
in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform bool u_useColor;
uniform vec4 u_solidColor;
uniform vec3 u_lightColor;

void main() {
    vec4 objectColor = vec4(1.0);

    if (u_useColor) {
        objectColor = u_solidColor;
    } else {
        objectColor = texture(u_texture, v_texCoord);    
    }

    float ambientStrength = 0.4;
    vec3 ambient = ambientStrength * u_lightColor;

    vec3 normal = normalize(v_normal);
    vec3 lightDirection = vec3(1.0, 1.0, 1.0);
    float diffuseStrength = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = diffuseStrength * u_lightColor;

    // TODO: add a clamp to prevent overexposure
    // could also add a clamp to diffuse to prevent really dark sides (diffuseStrength = 0);
    // would like to see these things in real time so add uniforms to the frag and sliders to the editor

    vec3 result = (ambient + diffuse) * objectColor.xyz;

    fragColor = vec4(result, 1.0);
}
`