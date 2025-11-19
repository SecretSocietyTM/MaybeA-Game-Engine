const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;


export class Raycaster {
    constructor(origin = [0,0,0], direction = [0,0,-1]) {

        this.ray = {
            origin,
            direction
        };
    }

    // maybe have a separate function for a single intersection
    getIntersections(objects) {
        const intersections = [];

        objects.forEach(object => {
            if (object.aabb.isIntersecting2(this.ray)) intersections.push(object);
        });

        return intersections;
    }

    // TODO: add function for plane intersections given an object and the direction (camera's dir)

    // point must be in NDC space
    // sets both the direction and origin
    setFromCamera(point, camera) {
        const point_clip = [point.x, point.y, -1.0, 1.0];

        const point_eye = vec4.transformMat4([], point_clip, mat4.invert([], camera.proj_matrix));
        point_eye[2] = -1;
        point_eye[3] = 0;

        let point_world = vec4.transformMat4([], point_eye, mat4.invert([], camera.view_matrix));
        point_world = [point_world[0], point_world[1], point_world[2]];

        vec3.normalize(point_world, point_world);

        this.ray.origin = camera.pos;
        this.ray.direction = point_world;
    }
}