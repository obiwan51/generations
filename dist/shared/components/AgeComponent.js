import { Component } from '../ecs/Component.js';
/**
 * AgeComponent - Stores age and lifecycle data.
 * Used by players and animals.
 */
export class AgeComponent extends Component {
    age;
    maxAge;
    constructor(age = 0, maxAge = 60) {
        super();
        this.age = age;
        this.maxAge = maxAge;
    }
    /**
     * Increment age by 1. Returns true if died of old age.
     */
    incrementAge() {
        this.age += 1;
        return this.isDead();
    }
    /**
     * Check if max age reached.
     */
    isDead() {
        return this.age >= this.maxAge;
    }
    /**
     * Check if entity is an adult (for reproduction).
     */
    isAdult(minAge = 14) {
        return this.age >= minAge;
    }
    /**
     * Check if entity can reproduce (age range).
     */
    canReproduce(minAge = 14, maxAge = 40) {
        return this.age >= minAge && this.age <= maxAge;
    }
    /**
     * Get age as a percentage of max life (0-1).
     */
    getAgePercent() {
        return this.age / this.maxAge;
    }
}
export default AgeComponent;
//# sourceMappingURL=AgeComponent.js.map