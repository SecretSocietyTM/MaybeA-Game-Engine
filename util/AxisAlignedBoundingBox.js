const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;


export default class AxisAlignedBoundingBox {
    constructor(parent_vertices, parent_model_matrix) {
        this.parent_vertices = parent_vertices;
        this.parent_model_matrix = parent_model_matrix;

        this.extrema = null;
        this.model_matrix = null;

        this.getAABBExtrema(); // assigns extrema
        this.getABBModelMatrix(); // assigns model_matrix
    }

    updateAABB(parent_model_matrix) {
        this.parent_model_matrix = parent_model_matrix;
        this.getAABBExtrema();
        this.getABBModelMatrix();
    }


    /**
     * Converts the parent's vertices to world space.
     */
    convertVerticesLocalToWorld() {
        let world_vertices = [];
        if (mat4.exactEquals(this.parent_model_matrix, mat4.create())) {
            world_vertices = this.parent_vertices;
        } else {
            for (let i = 0; i < this.parent_vertices.length; i+=3) {
                let world_vertex = vec3.transformMat4(
                    [], 
                    [this.parent_vertices[i], 
                    this.parent_vertices[i+1], 
                    this.parent_vertices[i+2]], 
                    this.parent_model_matrix);
                world_vertices.push(...world_vertex);
            }
        }
        return world_vertices
    }

    /**
     * Computes the extrema from the world space vertices
     */
    getAABBExtrema() {
        const world_vertices = this.convertVerticesLocalToWorld();

        let x = []; // alterante syntax is const [x, y, z] = [[], [], []];
        let y = [];
        let z = [];
        for (let i = 0;  i < world_vertices.length; i+=3) {
            x.push(world_vertices[i]);
            y.push(world_vertices[i+1]);
            z.push(world_vertices[i+2]);
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

    /**
     * Computes the model matrix to be applied onto the unit AABB during rendiring.
     */
    getABBModelMatrix() {
        const center = (vec3.scale([], vec3.add([], this.extrema.min, this.extrema.max), 1/2));
        const scale_factor = vec3.subtract([], this.extrema.max, this.extrema.min);

        this.model_matrix = mat4.create();
        mat4.translate(this.model_matrix, this.model_matrix, center);
        mat4.scale(this.model_matrix, this.model_matrix, scale_factor);
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