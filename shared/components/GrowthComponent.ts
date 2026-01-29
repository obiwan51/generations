import { Component } from '../ecs/Component.js';

/**
 * GrowthComponent - Stores growth state for planted crops.
 */
export class GrowthComponent extends Component {
  public growthTicks: number = 0;

  constructor(
    public maxGrowthTicks: number = 3,
    public growsInto: string | null = null
  ) {
    super();
  }

  /**
   * Increment growth. Returns true if fully grown.
   */
  incrementGrowth(): boolean {
    this.growthTicks += 1;
    return this.isFullyGrown();
  }

  /**
   * Check if crop has fully grown.
   */
  isFullyGrown(): boolean {
    return this.growthTicks >= this.maxGrowthTicks;
  }

  /**
   * Get growth progress as a percentage (0-1).
   */
  getGrowthProgress(): number {
    return Math.min(1, this.growthTicks / this.maxGrowthTicks);
  }
}

export default GrowthComponent;
