const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;


export function generateRayDir(width, height, x, y, proj, view) {
    const x_ndc = (2 * x) / width - 1;
    const y_ndc = 1 - (2 * y) / height;

    const ray_clip = [x_ndc, y_ndc, -1.0, 1.0];

    const ray_eye = vec4.transformMat4([], ray_clip, mat4.invert([], proj));
    ray_eye[2] = -1,
    ray_eye[3] = 0;

    let ray_world = vec4.transformMat4([], ray_eye, mat4.invert([], view));
    ray_world = [ray_world[0], ray_world[1], ray_world[2]];

    vec3.normalize(ray_world, ray_world);

    return ray_world;
}

export function calculateObjectCenterScreenCoord(width, height, object, proj, view) {
    const cntr = vec4.fromValues(object.pos[0], object.pos[1], object.pos[2], 1);
    vec4.transformMat4(cntr, cntr, view); // world space --> view space
    vec4.transformMat4(cntr, cntr, proj); // view space  --> clip space
    vec4.scale(cntr, cntr, 1 / cntr[3]);   // clip space  --> NDC coords
    const cntr_ndc = [cntr[0], cntr[1]];

    const screen_x = (cntr_ndc[0] * 0.5 + 0.5) * width;
    const screen_y = (cntr_ndc[1] * 0.5 + 0.5) * height;
    return [screen_x, screen_y];
}

// TODO: this should probably replace the function above. For now it is not needed
export function coordsWorldToScreen(coords, width, height, proj, view) {
    const p = vec4.fromValues(coords[0], coords[1], coords[2], 1);
    vec4.transformMat4(p, p, view); // world space --> view space
    vec4.transformMat4(p, p, proj); // view space  --> clip space
    vec4.scale(p, p, 1 / p[3]);   // clip space  --> NDC coords
    const p_ndc = [p[0], p[1]];

    const screen_x = (p_ndc[0] * 0.5 + 0.5) * width;
    const screen_y = (p_ndc[1] * 0.5 + 0.5) * height;
    return [screen_x, screen_y]; 
}


export function calculateAngleBetweenVectors(v, w) {

    // equation: theta = acos((v dot w / len(v) * len(w)));
    const numerator = vec2.dot(v, w);
    const denominator = vec2.length(v) * vec2.length(w);
    const angle = Math.acos(numerator / denominator) * 180 / Math.PI;

    return angle;
}







// equation is t = - (dot(ray_origin, plane_normal) + d) / (dot(ray_dir, plane_normal)) 
export function calculatePlaneIntersectionPoint(ray, plane_normal, plane_p0) {
    let d = -vec3.dot(plane_normal, plane_p0);

    let numerator = vec3.dot(ray.origin, plane_normal) + d;
    let denominator = vec3.dot(ray.dir, plane_normal);
    if (denominator === 0) {
        console.log("ray missed plane with normal = ", plane_normal);
        return;
    }

    let t = -(numerator / denominator);

    let p = vec3.scaleAndAdd([], ray.origin, ray.dir, t);

    return p;
}