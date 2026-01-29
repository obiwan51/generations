import { Component } from '../ecs/Component.js';
/**
 * AgeComponent - Stores age and lifecycle data.
 * Used by players and animals.
 */
export declare class AgeComponent extends Component {
    age: number;
    maxAge: number;
    constructor(age?: number, maxAge?: number);
    /**
     * Increment age by 1. Returns true if died of old age.
     */
    incrementAge(): boolean;
    /**
     * Check if max age reached.
     */
    isDead(): boolean;
    /**
     * Check if entity is an adult (for reproduction).
     */
    isAdult(minAge?: number): boolean;
    /**
     * Check if entity can reproduce (age range).
     */
    canReproduce(minAge?: number, maxAge?: number): boolean;
    /**
     * Get age as a percentage of max life (0-1).
     */
    getAgePercent(): number;
}
export default AgeComponent;
