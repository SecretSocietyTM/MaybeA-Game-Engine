export default `#version 300 es
precision mediump float;

out vec4 fragColor;

in vec3 v_fragPos;
in vec3 v_normal;

// TODO: replace to vec4
in vec3 v_interpolatedColor;

uniform vec3 u_lightColor;
uniform vec3 u_lightPos;

uniform bool u_useColor;
uniform vec4 u_objectColor;

void main() {
    
    fragColor = vec4(v_interpolatedColor, 1.0);
}

/*     // use vertex colors || set color
    vec4 objectColor = vec4(0.0);
    if (u_useColor) {
        objectColor = u_objectColor;
    } else {
        objectColor = v_interpolatedColor;
    }   
    
    // ambient
    float ambientStrength = 0.2;
    vec3 ambient = ambientStrength * u_lightColor;

    // diffuse
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_lightPos - v_fragPos);
    float diffuseStrength = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diffuseStrength * u_lightColor;

    vec3 result = (ambient + diffuse) * vec3(0.2, 0.4, 0.3); */
`