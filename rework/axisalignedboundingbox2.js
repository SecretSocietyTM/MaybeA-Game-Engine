const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;


const UNIT_CUBE_VERTICES = [
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,

     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,
];

const AABB_INDICES = [
    0,1,  0,2,  3,2,  3,1, // front
    2,6,  3,7,  0,4,  1,5, // left | right
    4,5,  4,6,  7,6,  7,5  // back
];

export default class AxisAlignedBoundingBox2 {
    constructor(mesh_vertices, model_matrix, object_pos) {
        this.mesh = {};
        this.mesh.vertices = UNIT_CUBE_VERTICES;
        this.mesh.indices = AABB_INDICES;
        this.local_vertices = mesh_vertices;
        this.model_matrix = model_matrix;
        this.object_pos = object_pos;

        this.aabb_model_matrix = mat4.translate([], mat4.create(), this.object_pos);

        this.convertVerticesLocalToWorld();
        this.getWorldAABB();
        this.getAABBModelMatrixForRendering();
    }

    assignVao(vao) {
        this.vao = vao;
    }

    updateAABBPos(object_pos) {
        this.aabb_model_matrix = mat4.translate([], mat4.create(), object_pos);
    }

    updateModelMatrix(model_matrix) {
        this.model_matrix = model_matrix;
    }

    /**
     * if there aren't then the mesh's local vertices are also
     * the world vertices
     * otherwise, each vertex needs to be transformed to world space
     * checks if there are any transformations
     */
    convertVerticesLocalToWorld() {
        if (mat4.exactEquals(this.model_matrix, mat4.create())) {
            this.world_vertices = this.local_vertices;
        }
        
        const world_vertices = [];
        for (let i = 0; i < this.local_vertices.length; i+=3) {
            let world_vertex = vec3.transformMat4(
                [], 
                [this.local_vertices[i], 
                 this.local_vertices[i+1], 
                 this.local_vertices[i+2]], 
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
        for (let i = 0;  i < this.local_vertices.length; i+=3) {
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

        let extrema = {
            max: [max_x, max_y, max_z],
            min: [min_x, min_y, min_z]
        };

        this.extrema = extrema;
    }

    getAABBModelMatrixForRendering() {
        const center = (vec3.scale([], vec3.add([], this.extrema.min, this.extrema.max), 0.5));
        const scale_factor = vec3.subtract([], this.extrema.max, this.extrema.min);

        mat4.fromTranslation(this.aabb_model_matrix, center);
        mat4.scale(this.aabb_model_matrix, this.aabb_model_matrix, scale_factor);
    }

    // Interleaves an rgb value into the list of vertices for the AABB.
    setAABBColor(color) {
        let vertex_colors = new Float32Array(this.mesh.vertices.length * 3);
        for (let i = 0; i < this.mesh.vertices.length; i++) {
            vertex_colors.set(color, i * 3);
        }
        this.mesh.vertex_colors = vertex_colors;
    }

    isIntersecting(ray) {
        let tmin = (this.extrema.min[0] - ray.origin[0]) / ray.dir[0];
        let tmax = (this.extrema.max[0] - ray.origin[0]) / ray.dir[0];

        if (tmin > tmax) {
            let temp = tmax;
            tmax = tmin;
            tmin = temp;
        }

        let tymin = (this.extrema.min[1] - ray.origin[1]) / ray.dir[1];
        let tymax = (this.extrema.max[1] - ray.origin[1]) / ray.dir[1];

        if (tymin > tymax) {
            let temp = tymax;
            tymax = tymin;
            tymin = temp;
        }

        if ((tmin > tymax) || (tymin > tmax)) return false;

        if (tymin > tmin) tmin = tymin; 
        if (tymax < tmax) tmax = tymax;

        let tzmin = (this.extrema.min[2] - ray.origin[2]) / ray.dir[2];
        let tzmax = (this.extrema.max[2] - ray.origin[2]) / ray.dir[2];

        if (tzmin > tzmax) {
            let temp = tzmax;
            tzmax = tzmin;
            tzmin = temp;
        }

        if ((tmin > tzmax) || (tzmin > tmax)) return false;

        return true;
    }
}