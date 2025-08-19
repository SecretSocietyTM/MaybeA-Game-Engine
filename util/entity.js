const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const mat4 = glm.mat4;
import { showError } from "./gl_utils.js";

export const colors = 
[
[0.2, 0.2, 0.2], [0.8, 0.2, 0.2],
[0.2, 0.8, 0.2], [0.2, 0.2, 0.8],
[0.2, 0.8, 0.8], [0.8, 0.2, 0.8],
[0.8, 0.8, 0.2], [0.8, 0.8, 0.8]
]

export class Entity {
    constructor(pos, scale, r_axis, r_angle, local_aabb, vao, num_indices) {
        this.vao = vao;
        this.num_indices = num_indices;

        this.local_aabb = local_aabb;

        // build model matrix
        this.mat_model = mat4.create();
        mat4.translate(this.mat_model, this.mat_model, pos);
        mat4.rotate(this.mat_model, this.mat_model, glm.glMatrix.toRadian(r_angle), r_axis);
        mat4.scale(this.mat_model, this.mat_model, [scale, scale, scale]);

        this.computeWorldAABB();
    }

    computeWorldAABB() {
        let world_x = [];
        let world_y = [];
        let world_z = [];

        // first interpolate all 8 corners of local AABB
        let  local_corners = [
            this.local_aabb.max[0], this.local_aabb.max[1], this.local_aabb.max[2], // front-top-right
            this.local_aabb.max[0], this.local_aabb.min[1], this.local_aabb.max[2], // front-bot-right
            this.local_aabb.min[0], this.local_aabb.max[1], this.local_aabb.max[2], // front-top-left
            this.local_aabb.min[0], this.local_aabb.min[1], this.local_aabb.max[2], // front-bot-left

            this.local_aabb.max[0], this.local_aabb.max[1], this.local_aabb.min[2], // back-top-right
            this.local_aabb.max[0], this.local_aabb.min[1], this.local_aabb.min[2], // back-bot-right
            this.local_aabb.min[0], this.local_aabb.max[1], this.local_aabb.min[2], // back-top-left
            this.local_aabb.min[0], this.local_aabb.min[1], this.local_aabb.min[2], // back-bot-left
        ];

        // transform 8 corners to world space
        for (let i = 0; i < local_corners.length; i+=3) {
            let world_point = vec3.transformMat4([], 
                [local_corners[i], local_corners[i+1], local_corners[i+2]], this.mat_model);
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

        this.world_aabb = {
            max: [max_x, max_y, max_z],
            min: [min_x, min_y, min_z]
        };
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

    draw(gl, model_uniform) {
        gl.uniformMatrix4fv(model_uniform, false, this.mat_model);
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}

export function createCubeMultiColored(colors) {

    let vertices = 
    [
        -0.5, -0.5, 0.5, colors[0][0], colors[0][1], colors[0][2], // front-top-left
        -0.5,  0.5, 0.5, colors[1][0], colors[1][1], colors[1][2], // front-bot-left
         0.5, -0.5, 0.5, colors[2][0], colors[2][1], colors[2][2], // front-top-right
         0.5,  0.5, 0.5, colors[3][0], colors[3][1], colors[3][2], // front-bot-right

        -0.5, -0.5, -0.5, colors[4][0], colors[4][1], colors[4][2], // back-top-left
        -0.5,  0.5, -0.5, colors[5][0], colors[5][1], colors[5][2], // back-bot-left
         0.5, -0.5, -0.5, colors[6][0], colors[6][1], colors[6][2], // back-top-right
         0.5,  0.5, -0.5, colors[7][0], colors[7][1], colors[7][2], // back-bot-right
    ];

    let indices = 
    [
        0, 1, 2, // front
        1, 2, 3,

        4, 5, 6, // back
        5, 6, 7,

        0, 1, 4, // left
        1, 4, 5,

        2, 3, 6, // right
        3, 6, 7,

        0, 4, 6, // top
        0, 2, 6,

        1, 5, 7, // bottom
        1, 3, 7
    ];

    // know that the bounding box coordinates are: top

    const local_aabb = {
        max: [ 0.5,  0.5,  0.5],
        min: [-0.5, -0.5, -0.5]
    };

    return {vertices, indices, local_aabb};
}

export function createPosClrInterleavedVao(gl, vertex_buffer, index_buffer, pos_attrib, clr_attrib) {
    const vao = gl.createVertexArray();
    if (!vao) {
        showError("Failed to create VAO");
        return null;
    }

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

    gl.enableVertexAttribArray(pos_attrib);
    gl.vertexAttribPointer(
        pos_attrib, 3, gl.FLOAT, gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.enableVertexAttribArray(clr_attrib);
    gl.vertexAttribPointer(
        clr_attrib, 3, gl.FLOAT, gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return vao;
}