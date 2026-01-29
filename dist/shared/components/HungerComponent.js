import { Component } from '../ecs/Component.js';
/**
 * HungerComponent - Stores hunger/food data.
 * Used by players to track starvation.
 */
export class HungerComponent extends Component {
    maxHunger;
    currentHunger;
    baseMaxHunger;
    constructor(maxHunger = 20) {
        super();
        this.maxHunger = maxHunger;
        this.baseMaxHunger = maxHunger;
        this.currentHunger = maxHunger;
    }
    /**
     * Update max hunger based on age (babies store less food).
     * Scales from 50% at age 0 to 100% at age 3+.
     */
    updateMaxHungerForAge(age, babyMaxAge = 3) {
        if (age >= babyMaxAge) {
            this.maxHunger = this.baseMaxHunger;
        }
        else {
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
    decreaseHunger(amount = 1) {
        this.currentHunger = Math.max(0, this.currentHunger - amount);
        return this.isStarving();
    }
    /**
     * Eat food, increasing hunger by food value.
     */
    eat(foodValue) {
        this.currentHunger = Math.min(this.maxHunger, this.currentHunger + foodValue);
    }
    /**
     * Check if hunger is depleted.
     */
    isStarving() {
        return this.currentHunger <= 0;
    }
    /**
     * Check if hunger is low (for emote display).
     */
    isHungry(threshold = 5) {
        return this.currentHunger <= threshold;
    }
    /**
     * Get hunger as a percentage (0-1).
     */
    getHungerPercent() {
        return this.currentHunger / this.maxHunger;
    }
}
export default HungerComponent;
//# sourceMappingURL=HungerComponent.js.map