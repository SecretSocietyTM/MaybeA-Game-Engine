const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const mat4 = glm.mat4;

const VERTEX_COUNT = 8;
const INDEX_COUNT = 36;

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

export const local_aabb_vertices_w_color = [
     0.5,  0.5,  0.5,  0.4, 1.0, 0.2,
     0.5, -0.5,  0.5,  0.4, 1.0, 0.2,
    -0.5,  0.5,  0.5,  0.4, 1.0, 0.2,
    -0.5, -0.5,  0.5,  0.4, 1.0, 0.2,

     0.5,  0.5, -0.5,  0.4, 1.0, 0.2,
     0.5, -0.5, -0.5,  0.4, 1.0, 0.2,
    -0.5,  0.5, -0.5,  0.4, 1.0, 0.2,
    -0.5, -0.5, -0.5,  0.4, 1.0, 0.2
];

export const local_aabb_indices = [
    0,1,  0,2,  3,2,  3,1, // front
    2,6,  3,7, // left
    0,4,  1,5, // right
    4,5,  4,6,  7,6,  7,5 // bacl
]

const local_aabb_vertices = [
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,

     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5
];

export class Cube {
    constructor(pos, scale, rotation_axis, rotation_angle, vao, aabb_vao=null) {
        this.vao = vao;
        this.aabb_vao = aabb_vao;
        this.num_indices = INDEX_COUNT;

        this.pos = pos;
        this.scale = scale;
        this.rotation_axis = rotation_axis;
        this.rotation_angle = rotation_angle;
        this.model = setModelMatrix(this);

        this.world_aabb_vertices = getlocalToWorldAABBVertices(this);
        this.world_aabb = getWorldAABB(this);

        this.world_aabb_vertices_real = getWorldAABBCorners(this);
        this.aabb_indices = local_aabb_indices;
    }

    /* setAABBVAO(aabb_vao) {
        this.aabb_vao = aabb_vao;
    } */

    draw(gl, u_model_loc) {
        gl.uniformMatrix4fv(u_model_loc, gl.FALSE, this.model);
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    drawAABB(gl, u_model_loc) {
        if (!this.aabb_vao) {
            console.log("No AABB VAO assigned");
            return;
        }

        // UNCOMMENT THIS FOR AABB TO MOVE BUT BE OFFSET
        /* let translate = mat4.translate([], mat4.create(), this.pos);
        gl.uniformMatrix4fv(u_model_loc, gl.FALSE, translate); */

        // UNCOMMENT THIS FOR AABB TO BE IN CORRECT SPOT BUT NOT MOVE
        gl.uniformMatrix4fv(u_model_loc, gl.FALSE, mat4.create());
        gl.bindVertexArray(this.aabb_vao);
        gl.drawElements(gl.LINES, local_aabb_indices.length, gl.UNSIGNED_SHORT, 0);
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
        this.model = setModelMatrix(this);
        this.world_aabb_vertices = getlocalToWorldAABBVertices(this);
        this.world_aabb_vertices_real = getWorldAABBCorners(this);
        this.world_aabb = getWorldAABB(this);
    }
}

function setModelMatrix(entity) {
    let model_matrix = mat4.create();
    mat4.translate(model_matrix, model_matrix, entity.pos);
    mat4.rotate(model_matrix, model_matrix, 
        glm.glMatrix.toRadian(entity.rotation_angle), entity.rotation_axis);
    mat4.scale(model_matrix, 
        model_matrix, [entity.scale, entity.scale, entity.scale]); // TODO: find better way to do this?
    return model_matrix;
}

function getlocalToWorldAABBVertices(entity) {
    if (mat4.exactEquals(entity.model, mat4.create())) {
        console.log("model matrix is identity, early return");
        return;
    }
    const world_aabb_vertices = [];
    for (let i = 0; i < VERTEX_COUNT * 3; i+=3) {
        let world_aabb_vertex = vec3.transformMat4([], 
            [local_aabb_vertices[i], local_aabb_vertices[i+1], local_aabb_vertices[i+2]], entity.model);
        world_aabb_vertices.push(...world_aabb_vertex);
    }
    /* console.log(world_aabb_vertices); */
    return world_aabb_vertices;
}

function getWorldAABB(entity) {
    // find the min and max of the new corners
    let x = [];
    let y = [];
    let z = [];
    for (let i = 0;  i < VERTEX_COUNT * 3; i+=3) {
        x.push(entity.world_aabb_vertices[i]);
        y.push(entity.world_aabb_vertices[i+1]);
        z.push(entity.world_aabb_vertices[i+2]);
    }

    const max_x = Math.max(...x);
    const min_x = Math.min(...x);
    const max_y = Math.max(...y);
    const min_y = Math.min(...y);
    const max_z = Math.max(...z);
    const min_z = Math.min(...z);

    let world_aabb = {
        max: [max_x, max_y, max_z],
        min: [min_x, min_y, min_z]
    };

    return world_aabb;
}

function getWorldAABBCorners(entity) {

    // first interpolate all 8 corners of local AABB
    let  world_aabb_vertices_w_color = [
        entity.world_aabb.max[0], entity.world_aabb.max[1], entity.world_aabb.max[2], 0.4, 1.0, 0.2, // front-top-right
        entity.world_aabb.max[0], entity.world_aabb.min[1], entity.world_aabb.max[2], 0.4, 1.0, 0.2, // front-bot-right
        entity.world_aabb.min[0], entity.world_aabb.max[1], entity.world_aabb.max[2], 0.4, 1.0, 0.2, // front-top-left
        entity.world_aabb.min[0], entity.world_aabb.min[1], entity.world_aabb.max[2], 0.4, 1.0, 0.2, // front-bot-left
        entity.world_aabb.max[0], entity.world_aabb.max[1], entity.world_aabb.min[2], 0.4, 1.0, 0.2, // back-top-right
        entity.world_aabb.max[0], entity.world_aabb.min[1], entity.world_aabb.min[2], 0.4, 1.0, 0.2, // back-bot-right
        entity.world_aabb.min[0], entity.world_aabb.max[1], entity.world_aabb.min[2], 0.4, 1.0, 0.2, // back-top-left
        entity.world_aabb.min[0], entity.world_aabb.min[1], entity.world_aabb.min[2], 0.4, 1.0, 0.2  // back-bot-left
    ];
    
    return world_aabb_vertices_w_color;
}