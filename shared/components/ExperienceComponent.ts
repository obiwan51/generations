import { Component } from '../ecs/Component.js';

/**
 * ExperienceComponent - Stores XP and skill data.
 * Used by players to affect throw distance and accuracy.
 */
export class ExperienceComponent extends Component {
  constructor(
    public experience: number = 0
  ) {
    super();
  }

  /**
   * Add experience points.
   */
  addExperience(amount: number): void {
    this.experience += amount;
  }

  /**
   * Calculate experience factor for skill calculations.
   * Higher XP = better performance.
   */
  getExpFactor(divisor: number = 500): number {
    return 1 + this.experience / divisor;
  }
}

export default ExperienceComponent;
