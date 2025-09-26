export default class Entities {
    constructor() {
        this.entities = [];
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    checkRayIntersection(ray) {
        // TODO: because new entities are PUSHED, selecting an entity inside another entity, which should result in selecting the outermost entity, results in selecting the innermost one. To fix this, dont immediately return the first entity hit, instead return its distance t, and compare against other results.
        for (const entity of this.entities) {
            if (entity.isIntersecting(ray) && entity.is_selectable) return entity;
        }
        return null;
    }

    drawEntities(gl, model_uniform) {
        this.entities.forEach(entity => {
            entity.draw(gl, model_uniform);
        });
    }

    setupEntitiesAABB(gl, pos_attrib, clr_attrib, color) {
        this.entities.forEach(entity => {
            entity.convertVerticesLocalToWorld();
            entity.getWorldAABB();
            entity.getAABBVertices();
            entity.generateAABBVertexColors(color);
            entity.createAABBVao(gl, pos_attrib, clr_attrib);
        })
    }

    drawEntitiesAABB(gl, model_uniform) {
        this.entities.forEach(entity => {
            if (entity.show_aabb) {
                entity.drawAABB(gl, model_uniform);
            }
        });
    }
}