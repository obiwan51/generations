import { Component } from '../ecs/Component.js';
/**
 * VelocityComponent - Stores movement velocity data.
 * Used by projectiles and moving entities.
 */
export declare class VelocityComponent extends Component {
    vx: number;
    vy: number;
    constructor(vx?: number, vy?: number);
    /**
     * Set velocity from angle and speed.
     */
    setFromAngle(angle: number, speed: number): void;
    /**
     * Get the current speed (magnitude of velocity).
     */
    getSpeed(): number;
    /**
     * Get the current angle of movement.
     */
    getAngle(): number;
}
export default VelocityComponent;
