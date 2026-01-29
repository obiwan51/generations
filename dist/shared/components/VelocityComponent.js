import { Component } from '../ecs/Component.js';
/**
 * VelocityComponent - Stores movement velocity data.
 * Used by projectiles and moving entities.
 */
export class VelocityComponent extends Component {
    vx;
    vy;
    constructor(vx = 0, vy = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }
    /**
     * Set velocity from angle and speed.
     */
    setFromAngle(angle, speed) {
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }
    /**
     * Get the current speed (magnitude of velocity).
     */
    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }
    /**
     * Get the current angle of movement.
     */
    getAngle() {
        return Math.atan2(this.vy, this.vx);
    }
}
export default VelocityComponent;
//# sourceMappingURL=VelocityComponent.js.map