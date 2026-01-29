import { Component } from '../ecs/Component.js';
/**
 * DecayComponent - Stores decay state for objects.
 * Used by dead animals and other decaying world objects.
 */
export declare class DecayComponent extends Component {
    maxDecayTicks: number;
    decayTicks: number;
    constructor(maxDecayTicks?: number);
    /**
     * Increment decay. Returns true if fully decayed.
     */
    incrementDecay(): boolean;
    /**
     * Check if object has fully decayed.
     */
    isFullyDecayed(): boolean;
}
export default DecayComponent;
