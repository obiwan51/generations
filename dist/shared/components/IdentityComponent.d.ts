import { Component } from '../ecs/Component.js';
export type Gender = 'male' | 'female';
/**
 * IdentityComponent - Stores identity and lineage data.
 * Used by players to track names and family relationships.
 */
export declare class IdentityComponent extends Component {
    name: string;
    motherId: string | null;
    motherName: string;
    gender: Gender;
    generation: number;
    constructor(name?: string, motherId?: string | null, motherName?: string, gender?: Gender, generation?: number);
    /**
     * Check if this entity is an Eve (no mother).
     */
    isEve(): boolean;
    /**
     * Set the full name in format "Name of MotherName"
     */
    setFullName(firstName: string, motherFirstName: string): void;
    /**
     * Get just the first name (before " of ")
     */
    getFirstName(): string;
}
export default IdentityComponent;
