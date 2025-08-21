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
            if (isIntersecting(entity, ray)) return entity;
        }
        return null;
    }

    drawEntities(gl, model_uniform) {
        this.entities.forEach(entity => {
            entity.draw(gl, model_uniform);
        });
    }
}

function isIntersecting(entity, ray) {
    let tmin = (entity.world_aabb.min[0] - ray.origin[0]) / ray.dir[0];
    let tmax = (entity.world_aabb.max[0] - ray.origin[0]) / ray.dir[0];

    if (tmin > tmax) {
        let temp = tmax;
        tmax = tmin;
        tmin = temp;
    }

    let tymin = (entity.world_aabb.min[1] - ray.origin[1]) / ray.dir[1];
    let tymax = (entity.world_aabb.max[1] - ray.origin[1]) / ray.dir[1];

    if (tymin > tymax) {
        let temp = tymax;
        tymax = tymin;
        tymin = temp;
    }

    if ((tmin > tymax) || (tymin > tmax)) return false;

    if (tymin > tmin) tmin = tymin; 
    if (tymax < tmax) tmax = tymax;

    let tzmin = (entity.world_aabb.min[2] - ray.origin[2]) / ray.dir[2];
    let tzmax = (entity.world_aabb.max[2] - ray.origin[2]) / ray.dir[2];

    if (tzmin > tzmax) {
        let temp = tzmax;
        tzmax = tzmin;
        tzmin = temp;
    }

    if ((tmin > tzmax) || (tzmin > tmax)) return false;

    return true;
}