const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;
import glUtil from "./gl_utils.js";


const AABB_INDICES = [
    0,1,  0,2,  3,2,  3,1, // front
    2,6,  3,7,  0,4,  1,5, // left | right
    4,5,  4,6,  7,6,  7,5  // back
]

// TODO: replace for entities.
// This is a stand in class for figuring out how to get AABB on imported models
export default class Object2 {
    constructor() {
        // TODO: REMOVE
        this.model_matrix = mat4.create();

        // TODO: would probably want to define more things here, or perhaps
        // introduce a function that enables the mesh
        // so if aabb_mesh == null, do nothing else show AABB
        this.aabb_mesh = {};
    }

    // Draw related functions
    assignMesh(mesh) {
        this.mesh = mesh;
        this.mesh.vertices = mesh.vertices;
        this.mesh.vertex_colors = mesh.vertex_colors;
        this.mesh.indices = mesh.indices;

        this.num_vertices = mesh.vertices.length;
        this.num_indices = mesh.indices.length;
    }

    createVao(gl, pos_attrib, clr_attrib) {
        this.p_vbo = glUtil.createStaticVertexBuffer(gl, this.mesh.vertices);
        this.c_vbo = glUtil.createStaticVertexBuffer(gl, this.mesh.vertex_colors);
        this.ebo = glUtil.createStaticIndexBuffer(gl, this.mesh.indices);
        this.vao = glUtil.createNonInterleavedVao(gl, this.p_vbo, this.c_vbo, this.ebo, pos_attrib, clr_attrib);        
    }

    createAABBVao(gl, pos_attrib, clr_attrib) {
        this.aabb_p_vbo = glUtil.createStaticVertexBuffer(gl, this.aabb_mesh.vertices);
        this.aabb_c_vbo = glUtil.createStaticVertexBuffer(gl, this.aabb_mesh.vertex_colors);
        this.aabb_ebo = glUtil.createStaticIndexBuffer(gl, AABB_INDICES);
        this.aabb_vao = glUtil.createNonInterleavedVao(
            gl, this.aabb_p_vbo, this.aabb_c_vbo, this.aabb_ebo, pos_attrib, clr_attrib);
    }

    draw(gl, u_model_matrix_loc) {
        gl.uniformMatrix4fv(u_model_matrix_loc, gl.FALSE, this.model_matrix);
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    drawAABB(gl, u_model_loc) {
        let translate = mat4.translate([], mat4.create(), this.pos);
        gl.uniformMatrix4fv(u_model_loc, gl.FALSE, translate);
        gl.bindVertexArray(this.aabb_vao);
        gl.drawElements(gl.LINES, AABB_INDICES.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }


    // Other functions
    transform(pos = [0,0,0], 
              scale = [1, 1, 1], 
              rotation_axis = [0, 1, 0], 
              rotation_angle = 0) {
        this.pos = pos;
        this.scale = scale;
        this.rotation_axis = rotation_axis;
        this.rotation_angle = rotation_angle;

        mat4.translate(this.model_matrix, this.model_matrix, pos);
        mat4.rotate(this.model_matrix, this.model_matrix, 
            glm.glMatrix.toRadian(rotation_angle), rotation_axis);
        mat4.scale(this.model_matrix, this.model_matrix, scale);
    }

    transform2() {
        let model_matrix = mat4.create();
        mat4.translate(model_matrix, model_matrix, this.pos);
        mat4.rotate(model_matrix, model_matrix, 
            glm.glMatrix.toRadian(this.rotation_angle), this.rotation_axis);
        mat4.scale(model_matrix, model_matrix, this.scale);
        this.model_matrix = model_matrix;
    }

    // TODO: rename convertVerticesLocalToWorld as this takes ALL the vertices and 
    // transforms them.
    getLocaltoWorldAABBVertices() {
        if (mat4.exactEquals(this.model_matrix, mat4.create())) {
            console.log("model matrix is identity, early return");
            return;
        }
        
        const world_vertices = [];
        for (let i = 0; i < this.num_vertices; i+=3) {
            let world_vertex = vec3.transformMat4(
                [], 
                [this.mesh.vertices[i], 
                this.mesh.vertices[i+1], 
                this.mesh.vertices[i+2]], 
                this.model_matrix);
            world_vertices.push(...world_vertex);
        }
        console.log("Local to World vertices", world_vertices);
        this.world_vertices = world_vertices;
    }

    getWorldAABB() {
        // find the min and max of the new corners
        let x = [];
        let y = [];
        let z = [];
        for (let i = 0;  i < this.num_vertices; i+=3) {
            x.push(this.world_vertices[i]);
            y.push(this.world_vertices[i+1]);
            z.push(this.world_vertices[i+2]);
        }

        const max_x = Math.max(...x);
        const min_x = Math.min(...x);
        const max_y = Math.max(...y);
        const min_y = Math.min(...y);
        const max_z = Math.max(...z);
        const min_z = Math.min(...z);

        let aabb = {
            max: [max_x, max_y, max_z],
            min: [min_x, min_y, min_z]
        };

        console.log("AABB", aabb);
        this.aabb = aabb;
    }

    isIntersecting(ray) {
        let tmin = (this.aabb.min[0] - ray.origin[0]) / ray.dir[0];
        let tmax = (this.aabb.max[0] - ray.origin[0]) / ray.dir[0];

        if (tmin > tmax) {
            let temp = tmax;
            tmax = tmin;
            tmin = temp;
        }

        let tymin = (this.aabb.min[1] - ray.origin[1]) / ray.dir[1];
        let tymax = (this.aabb.max[1] - ray.origin[1]) / ray.dir[1];

        if (tymin > tymax) {
            let temp = tymax;
            tymax = tymin;
            tymin = temp;
        }

        if ((tmin > tymax) || (tymin > tmax)) return false;

        if (tymin > tmin) tmin = tymin; 
        if (tymax < tmax) tmax = tymax;

        let tzmin = (this.aabb.min[2] - ray.origin[2]) / ray.dir[2];
        let tzmax = (this.aabb.max[2] - ray.origin[2]) / ray.dir[2];

        if (tzmin > tzmax) {
            let temp = tzmax;
            tzmax = tzmin;
            tzmin = temp;
        }

        if ((tmin > tzmax) || (tzmin > tmax)) return false;

        return true;
    }

    // TODO: rename getAABBVertices (this quite literally returns the vertices of the AA BOX!)
    getAABBCorners() {
        let translation = mat4.translate([], mat4.create(), this.pos);
        let inverse_translation = mat4.invert([], translation);

        let  aabb_vertices = [
            this.aabb.max[0], this.aabb.max[1], this.aabb.max[2],  // front-top-right
            this.aabb.max[0], this.aabb.min[1], this.aabb.max[2],  // front-bot-right
            this.aabb.min[0], this.aabb.max[1], this.aabb.max[2],  // front-top-left
            this.aabb.min[0], this.aabb.min[1], this.aabb.max[2],  // front-bot-left
            this.aabb.max[0], this.aabb.max[1], this.aabb.min[2],  // back-top-right
            this.aabb.max[0], this.aabb.min[1], this.aabb.min[2],  // back-bot-right
            this.aabb.min[0], this.aabb.max[1], this.aabb.min[2],  // back-top-left
            this.aabb.min[0], this.aabb.min[1], this.aabb.min[2],  // back-bot-left
        ];

        // center the vertices as if at 0,0,0 to translate them..
        for (let i = 0; i < aabb_vertices.length; i+=6) {
            let aabb_vertex = vec3.transformMat4([], 
                [aabb_vertices[i],
                aabb_vertices[i+1],
                aabb_vertices[i+2]], 
                inverse_translation);
            aabb_vertices[i] = aabb_vertex[0];
            aabb_vertices[i+1] = aabb_vertex[1];
            aabb_vertices[i+2] = aabb_vertex[2];
        }
        
        console.log("AABB vertices", aabb_vertices);
        this.aabb_mesh.vertices = aabb_vertices;
    }

    generateAABBVertexColors(color) {
        const aabb_vertex_colors = [];

        for (let i = 0; i < 8; i++) {
            aabb_vertex_colors.push(...color);
        }

        console.log("AABB vertex colors", aabb_vertex_colors);
        this.aabb_mesh.vertex_colors = aabb_vertex_colors;
    }

    updatePos(pos) {
        this.pos = pos;
        this.transform2();
        this.getLocaltoWorldAABBVertices();
        this.getWorldAABB();
        this.getAABBCorners();
    }
}