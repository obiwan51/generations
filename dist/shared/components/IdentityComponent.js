import { Component } from '../ecs/Component.js';
/**
 * IdentityComponent - Stores identity and lineage data.
 * Used by players to track names and family relationships.
 */
export class IdentityComponent extends Component {
    name;
    motherId;
    motherName;
    gender;
    generation;
    constructor(name = 'Unknown', motherId = null, motherName = 'The Great Mother (EVE)', gender = 'female', generation = 1) {
        super();
        this.name = name;
        this.motherId = motherId;
        this.motherName = motherName;
        this.gender = gender;
        this.generation = generation;
    }
    /**
     * Check if this entity is an Eve (no mother).
     */
    isEve() {
        return this.motherId === null;
    }
    /**
     * Set the full name in format "Name of MotherName"
     */
    setFullName(firstName, motherFirstName) {
        this.name = `${firstName} of ${motherFirstName}`;
    }
    /**
     * Get just the first name (before " of ")
     */
    getFirstName() {
        const parts = this.name.split(' of ');
        return parts[0];
    }
}
export default IdentityComponent;
//# sourceMappingURL=IdentityComponent.js.map