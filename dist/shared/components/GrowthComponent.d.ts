import { Component } from '../ecs/Component.js';
/**
 * GrowthComponent - Stores growth state for planted crops.
 */
export declare class GrowthComponent extends Component {
    maxGrowthTicks: number;
    growsInto: string | null;
    growthTicks: number;
    constructor(maxGrowthTicks?: number, growsInto?: string | null);
    /**
     * Increment growth. Returns true if fully grown.
     */
    incrementGrowth(): boolean;
    /**
     * Check if crop has fully grown.
     */
    isFullyGrown(): boolean;
    /**
     * Get growth progress as a percentage (0-1).
     */
    getGrowthProgress(): number;
}
export default GrowthComponent;
