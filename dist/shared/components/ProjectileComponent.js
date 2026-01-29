import { Component } from '../ecs/Component.js';
/**
 * ProjectileComponent - Stores projectile-specific data.
 * Used by arrows, spears, and other thrown/shot objects.
 */
export class ProjectileComponent extends Component {
    ownerId;
    type;
    maxDist;
    angle;
    damage;
    distance = 0;
    constructor(ownerId, type, maxDist, angle, damage = 5) {
        super();
        this.ownerId = ownerId;
        this.type = type;
        this.maxDist = maxDist;
        this.angle = angle;
        this.damage = damage;
    }
    /**
     * Update distance traveled. Returns true if max distance reached.
     */
    updateDistance(amount) {
        this.distance += amount;
        return this.distance >= this.maxDist;
    }
    /**
     * Check if projectile has exceeded its range.
     */
    isExpired() {
        return this.distance >= this.maxDist;
    }
}
export default ProjectileComponent;
//# sourceMappingURL=ProjectileComponent.js.map