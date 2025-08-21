const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const mat4 = glm.mat4;

export const cube_vertices = [
    -0.5, -0.5,  0.5,  0.2, 0.2, 0.2, // front-top-left
    -0.5,  0.5,  0.5,  0.8, 0.2, 0.2, // front-bot-left
     0.5, -0.5,  0.5,  0.2, 0.8, 0.2, // front-top-right
     0.5,  0.5,  0.5,  0.2, 0.2, 0.8, // front-bot-right

    -0.5, -0.5, -0.5,  0.2, 0.8, 0.8, // back-top-left
    -0.5,  0.5, -0.5,  0.8, 0.2, 0.8, // back-bot-left
     0.5, -0.5, -0.5,  0.8, 0.8, 0.2, // back-top-right
     0.5,  0.5, -0.5,  0.8, 0.8, 0.8, // back-bot-right    
];

export const cube_indices = [
    0, 1, 2,  1, 2, 3, // front
    4, 5, 6,  5, 6, 7, // back
    0, 1, 4,  1, 4, 5, // left
    2, 3, 6,  3, 6, 7, // right
    0, 4, 6,  0, 2, 6, // top
    1, 5, 7,  1, 3, 7  // bottom
];

export class Cube {
    constructor(pos, scale, rotation_axis, rotation_angle, vao) {
        this.pos = pos;
        this.scale = [scale, scale, scale];
        this.rotation_axis = rotation_axis;
        this.rotation_angle = rotation_angle;

        this.vao = vao;
        this.num_indices = cube_indices.length;

        setModelMatrix(this);
        setWorldAABB(this);
    }

    draw(gl, u_model_loc) {
        gl.uniformMatrix4fv(u_model_loc, false, this.model);
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    isIntersecting(ray) {
        let tmin = (this.world_aabb.min[0] - ray.origin[0]) / ray.dir[0];
        let tmax = (this.world_aabb.max[0] - ray.origin[0]) / ray.dir[0];

        if (tmin > tmax) {
            let temp = tmax;
            tmax = tmin;
            tmin = temp;
        }

        let tymin = (this.world_aabb.min[1] - ray.origin[1]) / ray.dir[1];
        let tymax = (this.world_aabb.max[1] - ray.origin[1]) / ray.dir[1];

        if (tymin > tymax) {
            let temp = tymax;
            tymax = tymin;
            tymin = temp;
        }

        if ((tmin > tymax) || (tymin > tmax)) return false;

        if (tymin > tmin) tmin = tymin; 
        if (tymax < tmax) tmax = tymax;

        let tzmin = (this.world_aabb.min[2] - ray.origin[2]) / ray.dir[2];
        let tzmax = (this.world_aabb.max[2] - ray.origin[2]) / ray.dir[2];

        if (tzmin > tzmax) {
            let temp = tzmax;
            tzmax = tzmin;
            tzmin = temp;
        }

        if ((tmin > tzmax) || (tzmin > tmax)) return false;

        return true;
    }

    updatePos(pos) {
        this.pos = pos;
        setModelMatrix(this);
        setWorldAABB(this);
    }
}

const local_aabb_corners = [
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,

     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5
];

function setModelMatrix(entity) {
    entity.model = mat4.create();
    mat4.translate(entity.model, entity.model, entity.pos);
    mat4.rotate(entity.model, entity.model, 
        glm.glMatrix.toRadian(entity.rotation_angle), entity.rotation_axis);
    mat4.scale(entity.model, entity.model, entity.scale);
}

function setWorldAABB(entity) {
    let world_x = [];
    let world_y = [];
    let world_z = [];

    // transform 8 corners to world space
    for (let i = 0; i < local_aabb_corners.length; i+=3) {
        let world_point = vec3.transformMat4([], 
            [local_aabb_corners[i], local_aabb_corners[i+1], local_aabb_corners[i+2]], entity.model);
        world_x.push(world_point[0]);
        world_y.push(world_point[1]);
        world_z.push(world_point[2]);
    }

    // find the min and max of the new corners
    const max_x = Math.max(...world_x);
    const min_x = Math.min(...world_x);
    const max_y = Math.max(...world_y);
    const min_y = Math.min(...world_y);
    const max_z = Math.max(...world_z);
    const min_z = Math.min(...world_z);

    entity.world_aabb = {
        max: [max_x, max_y, max_z],
        min: [min_x, min_y, min_z]
    };
}