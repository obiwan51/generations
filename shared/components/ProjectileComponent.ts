import { Component } from '../ecs/Component.js';

/**
 * ProjectileComponent - Stores projectile-specific data.
 * Used by arrows, spears, and other thrown/shot objects.
 */
export class ProjectileComponent extends Component {
  public distance: number = 0;
  public startTileX: number = 0;
  public startTileY: number = 0;

  constructor(
    public ownerId: string,
    public type: number,
    public maxDist: number,
    public angle: number,
    public damage: number = 5,
    public remainingUses: number | undefined = undefined
  ) {
    super();
  }

  /**
   * Update distance traveled. Returns true if max distance reached.
   */
  updateDistance(amount: number): boolean {
    this.distance += amount;
    return this.distance >= this.maxDist;
  }

  /**
   * Check if projectile has exceeded its range.
   */
  isExpired(): boolean {
    return this.distance >= this.maxDist;
  }
}

export default ProjectileComponent;
