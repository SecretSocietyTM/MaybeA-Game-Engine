import SceneObject from "./SceneObject.js";

export default class TransformGizmos {
    constructor() {
        this.objects = null;
        this.translate_objects = null;
        this.rotate_objects = null;
        this.scale_objects = null;

        this.reference_scale = null;
        this.reference_distance = null;

        // modes are:
        // t = translate
        // r = rotate
        // s = scale
        this.mode = "translate";
        this.active_objects = this.translate_objects;

        this.is_interacting = false;
    }

    setIsInteracting(bool) {
        this.is_interacting = bool;
    }

    setMode(mode = "translate") {
        this.mode = mode;
        switch(mode) {
            case "translate":
                this.active_objects = this.translate_objects;
                break;
            case "rotate":
                this.active_objects = this.rotate_objects;
                break;
            case "scale":
                this.active_objects = this.scale_objects;
                break;
            default:
                this.mode = null;
                console.error("No valid mode provided");
                return;
        }
    }

    setReferenceScale(reference_scale) {
        this.reference_scale = reference_scale;
    }

    setReferenceDistance(reference_distance) {
        this.reference_distance = reference_distance;
    }

    initGizmoObjects(meshes, vaos) {
        this.objects = [];
        this.translate_objects = [];
        this.rotate_objects = [];
        this.scale_objects = [];

        // translate
        const x_trans = new SceneObject("x_trans", [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,-90],
            meshes.translate_mesh, vaos.translate_vao, vaos.aabb_wireframe);

        const y_trans = new SceneObject("y_trans", [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0],
            meshes.translate_mesh, vaos.translate_vao, vaos.aabb_wireframe);

        const z_trans = new SceneObject("z_trans", [0,0,0],
            Array(3).fill(this.reference_scale), [90,0,0],
            meshes.translate_mesh, vaos.translate_vao, vaos.aabb_wireframe);

        // rotate
        const x_rotate = new SceneObject("x_rotate", [0,0,0], 
            [0.1, 0.1, 0.1], [90,0,90], 
            meshes.rotate_mesh, vaos.rotate_vao, vaos.aabb_wireframe);

        const y_rotate = new SceneObject("y_rotate", [0,0,0], 
            [0.1, 0.1, 0.1], [0,-45,0], 
            meshes.rotate_mesh, vaos.rotate_vao, vaos.aabb_wireframe);
    
        const z_rotate = new SceneObject("z_rotate", [0,0,0], 
            [0.1, 0.1, 0.1], [90,0,0], 
            meshes.rotate_mesh, vaos.rotate_vao, vaos.aabb_wireframe);

        // scale
        const x_scale = new SceneObject("x_scale", [0,0,0], 
            Array(3).fill(this.reference_scale), [0, 90, 0],
            meshes.scale_mesh, vaos.scale_vao, vaos.aabb_wireframe);
    
        const y_scale = new SceneObject("y_scale", [0,0,0], 
            Array(3).fill(this.reference_scale), [-90,0,0],
            meshes.scale_mesh, vaos.scale_vao, vaos.aabb_wireframe);

    
        const z_scale = new SceneObject("z_scale", [0,0,0], 
            Array(3).fill(this.reference_scale), [0,0,0],
            meshes.scale_mesh, vaos.scale_vao, vaos.aabb_wireframe);


        this.translate_objects.push(x_trans, y_trans, z_trans);
        this.rotate_objects.push(x_rotate, y_rotate, z_rotate);
        this.scale_objects.push(x_scale, y_scale, z_scale);

        this.objects.push(x_trans, y_trans, z_trans,
                          x_rotate, y_rotate, z_rotate,
                          x_scale, y_scale, z_scale);
    }
}