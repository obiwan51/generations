import { Component } from '../ecs/Component.js';
/**
 * HealthComponent - Stores health/HP data.
 * Used by players, animals, and destructible objects.
 */
export declare class HealthComponent extends Component {
    maxHp: number;
    currentHp: number;
    constructor(maxHp?: number);
    /**
     * Take damage, returns true if entity died.
     */
    takeDamage(amount: number): boolean;
    /**
     * Heal by an amount, capped at maxHp.
     */
    heal(amount: number): void;
    /**
     * Check if health is depleted.
     */
    isDead(): boolean;
    /**
     * Get health as a percentage (0-1).
     */
    getHealthPercent(): number;
}
export default HealthComponent;
