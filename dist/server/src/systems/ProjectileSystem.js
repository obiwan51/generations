import { System } from '../../../shared/ecs/System.js';
import { PositionComponent } from '../../../shared/components/PositionComponent.js';
import { VelocityComponent } from '../../../shared/components/VelocityComponent.js';
import { ProjectileComponent } from '../../../shared/components/ProjectileComponent.js';
import { Entity } from '../../../shared/ecs/Entity.js';
import { CONSTANTS } from '../../../shared/constants.js';
/**
 * ProjectileSystem - Manages projectile movement and collision.
 */
export class ProjectileSystem extends System {
    projectileEntities = new Map();
    speed = 15;
    /** Callback when projectile hits a target */
    onHit;
    /** Callback when projectile lands (max distance) */
    onLand;
    /** Function to check what's at a tile position */
    getObjectAt;
    /** Function to check if tile is empty */
    isTileEmpty;
    constructor() {
        super();
    }
    /**
     * Create a new projectile entity with all required components.
     */
    createProjectile(ownerId, startX, startY, angle, projectileType, maxDist, damage = 5) {
        const entity = new Entity();
        const position = new PositionComponent(startX, startY);
        const velocity = new VelocityComponent();
        velocity.setFromAngle(angle, this.speed);
        const projectile = new ProjectileComponent(ownerId, projectileType, maxDist, angle, damage);
        entity.attachComponents(position, velocity, projectile);
        this.addComponent(projectile);
        this.projectileEntities.set(projectile.id, entity);
        return entity;
    }
    /**
     * Update all projectiles - move them and check collisions.
     * Called every 50ms.
     */
    update(_delta) {
        for (const component of this.components) {
            if (component.isDeleted)
                continue;
            const entity = this.projectileEntities.get(component.id);
            if (!entity)
                continue;
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            if (!position || !velocity)
                continue;
            // Move projectile
            position.move(velocity.vx, velocity.vy);
            component.updateDistance(this.speed);
            // Check collision
            const tileX = Math.floor(position.x / CONSTANTS.TILE_SIZE);
            const tileY = Math.floor(position.y / CONSTANTS.TILE_SIZE);
            const targetType = this.getObjectAt?.(tileX, tileY) ?? null;
            if (targetType !== null && this.onHit) {
                // Hit something
                this.onHit({
                    projectile: entity,
                    tileX,
                    tileY,
                    targetType,
                });
                this.removeProjectile(component.id);
            }
            else if (component.isExpired()) {
                // Reached max distance - land on ground
                if (this.isTileEmpty?.(tileX, tileY) && this.onLand) {
                    this.onLand({
                        projectile: entity,
                        tileX,
                        tileY,
                        projectileType: component.type,
                    });
                }
                this.removeProjectile(component.id);
            }
        }
    }
    /**
     * Remove a projectile by component ID.
     */
    removeProjectile(componentId) {
        const entity = this.projectileEntities.get(componentId);
        if (entity) {
            entity.deleteComponents();
            this.projectileEntities.delete(componentId);
        }
    }
    /**
     * Get all active projectiles for network sync.
     */
    getProjectilesForSync() {
        const result = [];
        for (const component of this.components) {
            if (component.isDeleted)
                continue;
            const entity = this.projectileEntities.get(component.id);
            if (!entity)
                continue;
            const position = entity.getComponent(PositionComponent);
            if (!position)
                continue;
            result.push({
                id: component.id,
                type: component.type,
                x: position.x,
                y: position.y,
                angle: component.angle,
            });
        }
        return result;
    }
    /**
     * Get projectile count.
     */
    getProjectileCount() {
        return this.projectileEntities.size;
    }
}
export default ProjectileSystem;
//# sourceMappingURL=ProjectileSystem.js.map