import { Component } from '../ecs/Component.js';
/**
 * DecayComponent - Stores decay state for objects.
 * Used by dead animals and other decaying world objects.
 */
export class DecayComponent extends Component {
    maxDecayTicks;
    decayTicks = 0;
    constructor(maxDecayTicks = 3) {
        super();
        this.maxDecayTicks = maxDecayTicks;
    }
    /**
     * Increment decay. Returns true if fully decayed.
     */
    incrementDecay() {
        this.decayTicks += 1;
        return this.isFullyDecayed();
    }
    /**
     * Check if object has fully decayed.
     */
    isFullyDecayed() {
        return this.decayTicks >= this.maxDecayTicks;
    }
}
export default DecayComponent;
//# sourceMappingURL=DecayComponent.js.map