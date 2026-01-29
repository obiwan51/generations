import { Component } from '../ecs/Component.js';
/**
 * PositionComponent - Stores spatial position data.
 * Used by players, projectiles, animals, and world objects.
 */
export declare class PositionComponent extends Component {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    /**
     * Set position to new coordinates.
     */
    setPosition(x: number, y: number): void;
    /**
     * Move by a delta amount.
     */
    move(dx: number, dy: number): void;
    /**
     * Calculate distance to another position component.
     */
    distanceTo(other: PositionComponent): number;
}
export default PositionComponent;
