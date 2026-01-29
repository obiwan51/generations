import { Component } from '../ecs/Component.js';

/**
 * VelocityComponent - Stores movement velocity data.
 * Used by projectiles and moving entities.
 */
export class VelocityComponent extends Component {
  constructor(
    public vx: number = 0,
    public vy: number = 0
  ) {
    super();
  }

  /**
   * Set velocity from angle and speed.
   */
  setFromAngle(angle: number, speed: number): void {
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  /**
   * Get the current speed (magnitude of velocity).
   */
  getSpeed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  /**
   * Get the current angle of movement.
   */
  getAngle(): number {
    return Math.atan2(this.vy, this.vx);
  }
}

export default VelocityComponent;
