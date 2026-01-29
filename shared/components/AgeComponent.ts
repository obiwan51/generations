import { Component } from '../ecs/Component.js';

/**
 * AgeComponent - Stores age and lifecycle data.
 * Used by players and animals.
 */
export class AgeComponent extends Component {
  constructor(
    public age: number = 0,
    public maxAge: number = 60
  ) {
    super();
  }

  /**
   * Increment age by 1. Returns true if died of old age.
   */
  incrementAge(): boolean {
    this.age += 1;
    return this.isDead();
  }

  /**
   * Check if max age reached.
   */
  isDead(): boolean {
    return this.age >= this.maxAge;
  }

  /**
   * Check if entity is an adult (for reproduction).
   */
  isAdult(minAge: number = 14): boolean {
    return this.age >= minAge;
  }

  /**
   * Check if entity can reproduce (age range).
   */
  canReproduce(minAge: number = 14, maxAge: number = 40): boolean {
    return this.age >= minAge && this.age <= maxAge;
  }

  /**
   * Get age as a percentage of max life (0-1).
   */
  getAgePercent(): number {
    return this.age / this.maxAge;
  }
}

export default AgeComponent;
