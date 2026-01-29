import { Component } from '../ecs/Component.js';
/**
 * GrowthComponent - Stores growth state for planted crops.
 */
export class GrowthComponent extends Component {
    maxGrowthTicks;
    growsInto;
    growthTicks = 0;
    constructor(maxGrowthTicks = 3, growsInto = null) {
        super();
        this.maxGrowthTicks = maxGrowthTicks;
        this.growsInto = growsInto;
    }
    /**
     * Increment growth. Returns true if fully grown.
     */
    incrementGrowth() {
        this.growthTicks += 1;
        return this.isFullyGrown();
    }
    /**
     * Check if crop has fully grown.
     */
    isFullyGrown() {
        return this.growthTicks >= this.maxGrowthTicks;
    }
    /**
     * Get growth progress as a percentage (0-1).
     */
    getGrowthProgress() {
        return Math.min(1, this.growthTicks / this.maxGrowthTicks);
    }
}
export default GrowthComponent;
//# sourceMappingURL=GrowthComponent.js.map