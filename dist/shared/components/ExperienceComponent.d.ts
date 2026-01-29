import { Component } from '../ecs/Component.js';
/**
 * ExperienceComponent - Stores XP and skill data.
 * Used by players to affect throw distance and accuracy.
 */
export declare class ExperienceComponent extends Component {
    experience: number;
    constructor(experience?: number);
    /**
     * Add experience points.
     */
    addExperience(amount: number): void;
    /**
     * Calculate experience factor for skill calculations.
     * Higher XP = better performance.
     */
    getExpFactor(divisor?: number): number;
}
export default ExperienceComponent;
