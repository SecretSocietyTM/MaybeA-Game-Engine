import SceneObject from "./SceneObject.js";

export default class TransformGizmos {
    constructor() {
        this.objects = null;
        this.translate_objects = null;
        this.rotate_objects = null;
        this.scale_objects = null;

        this.reference_scale = null;
    }

    setReferenceScale(reference_scale) {
        this.reference_scale = reference_scale;
    }

    initGizmoObjects(meshes, vaos) {
        this.objects = [];
        this.translate_objects = [];
        this.rotate_objects = [];
        this.scale_objects = [];

        const x_trans = new SceneObject("x_trans", [0,0,0], [this.reference_scale, this.reference_scale, this.reference_scale], [0,0,-90]);
        x_trans.assignMesh(meshes.translate_mesh);
        x_trans.assignVao(vaos.translate_vao);
        x_trans.generateAABB();
        x_trans.aabb.assignVao(vaos.aabb_wireframe);

        const y_trans = new SceneObject("y_trans", [0,0,0], [this.reference_scale, this.reference_scale, this.reference_scale], [0,0,0]);
        y_trans.assignMesh(meshes.translate_mesh);
        y_trans.assignVao(vaos.translate_vao);
        y_trans.generateAABB();
        y_trans.aabb.assignVao(vaos.aabb_wireframe);

        const z_trans = new SceneObject("z_trans", [0,0,0], [this.reference_scale, this.reference_scale, this.reference_scale], [90,0,0]);
        z_trans.assignMesh(meshes.translate_mesh);
        z_trans.assignVao(vaos.translate_vao);
        z_trans.generateAABB();
        z_trans.aabb.assignVao(vaos.aabb_wireframe);

        const x_rotate = new SceneObject("x_rotate", [0,0,0], [0.1, 0.1, 0.1], [90,0,90]);
        x_rotate.assignMesh(meshes.rotate_mesh);
        x_rotate.assignVao(vaos.rotate_vao);
        x_rotate.generateAABB();
        x_rotate.aabb.assignVao(vaos.aabb_wireframe);

        const y_rotate = new SceneObject("y_rotate", [0,0,0], [0.1, 0.1, 0.1], [0,-45,0]);
        y_rotate.assignMesh(meshes.rotate_mesh);
        y_rotate.assignVao(vaos.rotate_vao);
        y_rotate.generateAABB();
        y_rotate.aabb.assignVao(vaos.aabb_wireframe);

        const z_rotate = new SceneObject("z_rotate", [0,0,0], [0.1, 0.1, 0.1], [90,0,0]);
        z_rotate.assignMesh(meshes.rotate_mesh);
        z_rotate.assignVao(vaos.rotate_vao);
        z_rotate.generateAABB();
        z_rotate.aabb.assignVao(vaos.aabb_wireframe);

        const x_scale = new SceneObject("x_scale", [0,0,0], [this.reference_scale, this.reference_scale, this.reference_scale], [0, 90, 0]);
        x_scale.assignMesh(meshes.scale_mesh);
        x_scale.assignVao(vaos.scale_vao);
        x_scale.generateAABB();
        x_scale.aabb.assignVao(vaos.aabb_wireframe);
    
        const y_scale = new SceneObject("y_scale", [0,0,0], [this.reference_scale, this.reference_scale, this.reference_scale], [-90,0,0]);
        y_scale.assignMesh(meshes.scale_mesh);
        y_scale.assignVao(vaos.scale_vao);
        y_scale.generateAABB();
        y_scale.aabb.assignVao(vaos.aabb_wireframe);
    
        const z_scale = new SceneObject("z_scale", [0,0,0], [this.reference_scale, this.reference_scale, this.reference_scale], [0,0,0]);
        z_scale.assignMesh(meshes.scale_mesh);
        z_scale.assignVao(vaos.scale_vao);
        z_scale.generateAABB();
        z_scale.aabb.assignVao(vaos.aabb_wireframe);

        this.translate_objects.push(x_trans, y_trans, z_trans);
        this.rotate_objects.push(x_rotate, y_rotate, z_rotate);
        this.scale_objects.push(x_scale, y_scale, z_scale);

    
        this.objects.push(x_trans, y_trans, z_trans,
                          x_rotate, y_rotate, z_rotate,
                          x_scale, y_scale, z_scale);
    }
}