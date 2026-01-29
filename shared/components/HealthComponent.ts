import { Component } from '../ecs/Component.js';

/**
 * HealthComponent - Stores health/HP data.
 * Used by players, animals, and destructible objects.
 */
export class HealthComponent extends Component {
  public currentHp: number;

  constructor(
    public maxHp: number = 100
  ) {
    super();
    this.currentHp = maxHp;
  }

  /**
   * Take damage, returns true if entity died.
   */
  takeDamage(amount: number): boolean {
    this.currentHp = Math.max(0, this.currentHp - amount);
    return this.isDead();
  }

  /**
   * Heal by an amount, capped at maxHp.
   */
  heal(amount: number): void {
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
  }

  /**
   * Check if health is depleted.
   */
  isDead(): boolean {
    return this.currentHp <= 0;
  }

  /**
   * Get health as a percentage (0-1).
   */
  getHealthPercent(): number {
    return this.currentHp / this.maxHp;
  }
}

export default HealthComponent;
