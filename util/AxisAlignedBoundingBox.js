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
            max: {x: max_x, y: max_y, z: max_z},
            min: {x: min_x, y: min_y, z: min_z},
        }

        this.extrema = extrema;
    }

    /**
     * Computes the model matrix to be applied onto the unit AABB during rendiring.
     */
    getABBModelMatrix() {
        const min_vector = vec3.fromValues(this.extrema.min.x, this.extrema.min.y, this.extrema.min.z);
        const max_vector = vec3.fromValues(this.extrema.max.x, this.extrema.max.y, this.extrema.max.z);

        const center = (vec3.scale([], vec3.add([], min_vector, max_vector), 1/2));
        const scale_factor = vec3.subtract([], max_vector, min_vector);

        this.model_matrix = mat4.create();
        mat4.translate(this.model_matrix, this.model_matrix, center);
        mat4.scale(this.model_matrix, this.model_matrix, scale_factor);
    }

    // Credit: https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection.html
    isIntersecting(ray) {
        let tmin = (this.extrema.min.x - ray.origin[0]) / ray.dir[0];
        let tmax = (this.extrema.max.x - ray.origin[0]) / ray.dir[0];

        if (tmin > tmax) {
            let temp = tmax;
            tmax = tmin;
            tmin = temp;
        }

        let tymin = (this.extrema.min.y - ray.origin[1]) / ray.dir[1];
        let tymax = (this.extrema.max.y - ray.origin[1]) / ray.dir[1];

        if (tymin > tymax) {
            let temp = tymax;
            tymax = tymin;
            tymin = temp;
        }

        if ((tmin > tymax) || (tymin > tmax)) return false;

        if (tymin > tmin) tmin = tymin; 
        if (tymax < tmax) tmax = tymax;

        let tzmin = (this.extrema.min.z - ray.origin[2]) / ray.dir[2];
        let tzmax = (this.extrema.max.z - ray.origin[2]) / ray.dir[2];

        if (tzmin > tzmax) {
            let temp = tzmax;
            tzmax = tzmin;
            tzmin = temp;
        }

        if ((tmin > tzmax) || (tzmin > tmax)) return false;

        return true;
    }

    // This function is used to check whether two SceneObjects are colliding
    // Credit: https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection
    isColliding(object) {
        const a = this.extrema;
        const b = object.extrema;

        const is_colliding = a.min.x <= b.max.x &&
                             a.max.x >= b.min.x &&
                             a.min.y <= b.max.y &&
                             a.max.y >= b.min.y &&
                             a.min.z <= b.max.z &&
                             a.max.z >= b.min.z

        return is_colliding;
    }

    getPenetration(object) {
        const a = this.extrema;
        const b = object.extrema;

        const dx1 = a.max.x - b.min.x;
        const dx2 = b.max.x - a.min.x;
        const dy1 = a.max.y - b.min.y;
        const dy2 = b.max.y - a.min.y;
        const dz1 = a.max.z - b.min.z;
        const dz2 = b.max.z - a.min.z;

        const overlaps = [
            { axis: 'x', depth: Math.min(dx1, dx2), dir: dx1 < dx2 ? -1 : 1 },
            { axis: 'y', depth: Math.min(dy1, dy2), dir: dy1 < dy2 ? -1 : 1 },
            { axis: 'z', depth: Math.min(dz1, dz2), dir: dz1 < dz2 ? -1 : 1 },
        ];

        return overlaps.reduce((min, o) => o.depth < min.depth ? o : min);
    }
}