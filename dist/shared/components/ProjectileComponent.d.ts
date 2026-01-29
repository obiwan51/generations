import { Component } from '../ecs/Component.js';
/**
 * ProjectileComponent - Stores projectile-specific data.
 * Used by arrows, spears, and other thrown/shot objects.
 */
export declare class ProjectileComponent extends Component {
    ownerId: string;
    type: number;
    maxDist: number;
    angle: number;
    damage: number;
    distance: number;
    constructor(ownerId: string, type: number, maxDist: number, angle: number, damage?: number);
    /**
     * Update distance traveled. Returns true if max distance reached.
     */
    updateDistance(amount: number): boolean;
    /**
     * Check if projectile has exceeded its range.
     */
    isExpired(): boolean;
}
export default ProjectileComponent;
