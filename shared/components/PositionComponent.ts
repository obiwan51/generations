import { Component } from '../ecs/Component.js';

/**
 * PositionComponent - Stores spatial position data.
 * Used by players, projectiles, animals, and world objects.
 */
export class PositionComponent extends Component {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {
    super();
  }

  /**
   * Set position to new coordinates.
   */
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Move by a delta amount.
   */
  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /**
   * Calculate distance to another position component.
   */
  distanceTo(other: PositionComponent): number {
    return Math.sqrt(
      Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
    );
  }
}

export default PositionComponent;
