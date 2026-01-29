import { Component } from '../ecs/Component.js';

/**
 * HungerComponent - Stores hunger/food data.
 * Used by players to track starvation.
 */
export class HungerComponent extends Component {
  public currentHunger: number;
  public baseMaxHunger: number;

  constructor(
    public maxHunger: number = 20
  ) {
    super();
    this.baseMaxHunger = maxHunger;
    this.currentHunger = maxHunger;
  }

  /**
   * Update max hunger based on age (babies store less food).
   * Scales from 50% at age 0 to 100% at age 3+.
   */
  updateMaxHungerForAge(age: number, babyMaxAge: number = 3): void {
    if (age >= babyMaxAge) {
      this.maxHunger = this.baseMaxHunger;
    } else {
      // Scale from 50% to 100% based on age
      const scale = 0.5 + (age / babyMaxAge) * 0.5;
      this.maxHunger = Math.floor(this.baseMaxHunger * scale);
    }
    // Cap current hunger to new max
    this.currentHunger = Math.min(this.currentHunger, this.maxHunger);
  }

  /**
   * Decrease hunger by amount. Returns true if starving.
   */
  decreaseHunger(amount: number = 1): boolean {
    this.currentHunger = Math.max(0, this.currentHunger - amount);
    return this.isStarving();
  }

  /**
   * Eat food, increasing hunger by food value.
   */
  eat(foodValue: number): void {
    this.currentHunger = Math.min(this.maxHunger, this.currentHunger + foodValue);
  }

  /**
   * Check if hunger is depleted.
   */
  isStarving(): boolean {
    return this.currentHunger <= 0;
  }

  /**
   * Check if hunger is low (for emote display).
   */
  isHungry(threshold: number = 5): boolean {
    return this.currentHunger <= threshold;
  }

  /**
   * Get hunger as a percentage (0-1).
   */
  getHungerPercent(): number {
    return this.currentHunger / this.maxHunger;
  }
}

export default HungerComponent;
