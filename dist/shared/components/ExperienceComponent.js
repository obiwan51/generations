import { Component } from '../ecs/Component.js';
/**
 * ExperienceComponent - Stores XP and skill data.
 * Used by players to affect throw distance and accuracy.
 */
export class ExperienceComponent extends Component {
    experience;
    constructor(experience = 0) {
        super();
        this.experience = experience;
    }
    /**
     * Add experience points.
     */
    addExperience(amount) {
        this.experience += amount;
    }
    /**
     * Calculate experience factor for skill calculations.
     * Higher XP = better performance.
     */
    getExpFactor(divisor = 500) {
        return 1 + this.experience / divisor;
    }
}
export default ExperienceComponent;
//# sourceMappingURL=ExperienceComponent.js.map