import glUtil from "./gl_utils.js";

// TODO: rename to Entities?
export default class Entity {
    constructor() {
        this.entities = [];
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    checkRayIntersection(ray) {
        // TODO: because new entities are PUSHED, selecting an entity inside another entity, which should result in selecting the outermost entity, results in selecting the innermost one. To fix this, dont immediately return the first entity hit, instead return its distance t, and compare against other results.
        for (const entity of this.entities) {
            if (entity.isIntersecting(ray)) return entity;
        }
        return null;
    }

    drawEntities(gl, model_uniform) {
        this.entities.forEach(entity => {
            entity.draw(gl, model_uniform);
        });
    }

    drawEntitiesAABB(gl, model_uniform) {
        this.entities.forEach(entity => {
            entity.drawAABB(gl, model_uniform);
        });
    }

    createEntitiesAABBVao(gl, pos_attrib, clr_attrib) {
        this.entities.forEach(entity => {
            const aabb_vbo = glUtil.createStaticVertexBuffer(gl, entity.world_aabb_vertices_real);
            const aabb_ebo = glUtil.createStaticIndexBuffer(gl, entity.aabb_indices);
            const aabb_vao = glUtil.createVertexElementVAO(
                gl, aabb_vbo, aabb_ebo, pos_attrib, clr_attrib);
            entity.aabb_vao = aabb_vao;
        })
    }

    getEntity(idx) {
        return this.entities[idx];
    }
}