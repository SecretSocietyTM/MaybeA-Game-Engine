export default class AABB {
    constructor() {
        
    }

    /**
     * if there aren't then the mesh's local vertices are also
     * the world vertices
     * otherwise, each vertex needs to be transformed to world space
     * checks if there are any transformations
     */
    convertVerticesLocalToWorld() {
        if (mat4.exactEquals(this.model_matrix, mat4.create())) {
            this.world_vertices = this.mesh.vertices;
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
        this.world_vertices = world_vertices;
    }

    // computes the axis aligned bounding box values (min and max values
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

        this.aabb = aabb;
    }

    /**
     * Uses the provided min and max vertices to interpolate 
     * the vertices needed to complete the cube.
     * Then the vertices have the inverse of the translation applied.
     * I forgot exactly why I had to do that. Likely some bug occured where
     * moving the object wouldn't properly move the AABB
     */
    getAABBVertices() {
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
        for (let i = 0; i < aabb_vertices.length; i+=3) {
            let aabb_vertex = vec3.transformMat4([], 
                [aabb_vertices[i],
                aabb_vertices[i+1],
                aabb_vertices[i+2]], 
                inverse_translation);
            aabb_vertices[i] = aabb_vertex[0];
            aabb_vertices[i+1] = aabb_vertex[1];
            aabb_vertices[i+2] = aabb_vertex[2];
        }
        
        this.aabb_mesh.vertices = aabb_vertices;
    }

    // Interleaves an rgb value into the list of vertices for the AABB.
    generateAABBVertexColors(color) {
        const aabb_vertex_colors = [];

        for (let i = 0; i < 8; i++) {
            aabb_vertex_colors.push(...color);
        }

        this.aabb_mesh.vertex_colors = aabb_vertex_colors;
    }

    // last step to AABB.
    createAABBVao(gl, pos_attrib, clr_attrib) {
        this.aabb_p_vbo = glUtil.createStaticVertexBuffer(gl, this.aabb_mesh.vertices);
        this.aabb_c_vbo = glUtil.createStaticVertexBuffer(gl, this.aabb_mesh.vertex_colors);
        this.aabb_ebo = glUtil.createStaticIndexBuffer(gl, AABB_INDICES);
        this.aabb_vao = glUtil.createNonInterleavedVao(
            gl, this.aabb_p_vbo, this.aabb_c_vbo, this.aabb_ebo, pos_attrib, clr_attrib);
    }
}