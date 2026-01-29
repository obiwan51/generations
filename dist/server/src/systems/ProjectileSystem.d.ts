import { System } from '../../../shared/ecs/System.js';
import { ProjectileComponent } from '../../../shared/components/ProjectileComponent.js';
import { Entity } from '../../../shared/ecs/Entity.js';
interface ProjectileHit {
    projectile: Entity;
    tileX: number;
    tileY: number;
    targetType: number;
}
interface ProjectileLanded {
    projectile: Entity;
    tileX: number;
    tileY: number;
    projectileType: number;
}
/**
 * ProjectileSystem - Manages projectile movement and collision.
 */
export declare class ProjectileSystem extends System<ProjectileComponent> {
    private projectileEntities;
    private speed;
    /** Callback when projectile hits a target */
    onHit?: (hit: ProjectileHit) => void;
    /** Callback when projectile lands (max distance) */
    onLand?: (landed: ProjectileLanded) => void;
    /** Function to check what's at a tile position */
    getObjectAt?: (x: number, y: number) => number | null;
    /** Function to check if tile is empty */
    isTileEmpty?: (x: number, y: number) => boolean;
    constructor();
    /**
     * Create a new projectile entity with all required components.
     */
    createProjectile(ownerId: string, startX: number, startY: number, angle: number, projectileType: number, maxDist: number, damage?: number): Entity;
    /**
     * Update all projectiles - move them and check collisions.
     * Called every 50ms.
     */
    update(_delta: number): void;
    /**
     * Remove a projectile by component ID.
     */
    private removeProjectile;
    /**
     * Get all active projectiles for network sync.
     */
    getProjectilesForSync(): Array<{
        id: string;
        type: number;
        x: number;
        y: number;
        angle: number;
    }>;
    /**
     * Get projectile count.
     */
    getProjectileCount(): number;
}
export default ProjectileSystem;
