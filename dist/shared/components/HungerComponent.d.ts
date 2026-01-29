import { Component } from '../ecs/Component.js';
/**
 * HungerComponent - Stores hunger/food data.
 * Used by players to track starvation.
 */
export declare class HungerComponent extends Component {
    maxHunger: number;
    currentHunger: number;
    baseMaxHunger: number;
    constructor(maxHunger?: number);
    /**
     * Update max hunger based on age (babies store less food).
     * Scales from 50% at age 0 to 100% at age 3+.
     */
    updateMaxHungerForAge(age: number, babyMaxAge?: number): void;
    /**
     * Decrease hunger by amount. Returns true if starving.
     */
    decreaseHunger(amount?: number): boolean;
    /**
     * Eat food, increasing hunger by food value.
     */
    eat(foodValue: number): void;
    /**
     * Check if hunger is depleted.
     */
    isStarving(): boolean;
    /**
     * Check if hunger is low (for emote display).
     */
    isHungry(threshold?: number): boolean;
    /**
     * Get hunger as a percentage (0-1).
     */
    getHungerPercent(): number;
}
export default HungerComponent;
