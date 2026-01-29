import { Component } from '../ecs/Component.js';

/**
 * DecayComponent - Stores decay state for objects.
 * Used by dead animals and other decaying world objects.
 */
export class DecayComponent extends Component {
  public decayTicks: number = 0;

  constructor(
    public maxDecayTicks: number = 3
  ) {
    super();
  }

  /**
   * Increment decay. Returns true if fully decayed.
   */
  incrementDecay(): boolean {
    this.decayTicks += 1;
    return this.isFullyDecayed();
  }

  /**
   * Check if object has fully decayed.
   */
  isFullyDecayed(): boolean {
    return this.decayTicks >= this.maxDecayTicks;
  }
}

export default DecayComponent;
