import { Component } from '../ecs/Component.js';

export type Gender = 'male' | 'female';

/**
 * IdentityComponent - Stores identity and lineage data.
 * Used by players to track names and family relationships.
 */
export class IdentityComponent extends Component {
  constructor(
    public name: string = 'Unknown',
    public motherId: string | null = null,
    public motherName: string = 'The Great Mother (EVE)',
    public gender: Gender = 'female',
    public generation: number = 1
  ) {
    super();
  }

  /**
   * Check if this entity is an Eve (no mother).
   */
  isEve(): boolean {
    return this.motherId === null;
  }

  /**
   * Set the full name in format "Name of MotherName"
   */
  setFullName(firstName: string, motherFirstName: string): void {
    this.name = `${firstName} of ${motherFirstName}`;
  }

  /**
   * Get just the first name (before " of ")
   */
  getFirstName(): string {
    const parts = this.name.split(' of ');
    return parts[0];
  }
}

export default IdentityComponent;
