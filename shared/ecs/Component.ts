/**
 * Component - Pure data attached to entities.
 * Components have no behavior; they only store data.
 * Systems are responsible for the logic that operates on components.
 */
export class Component {
  public readonly id: string;
  public isDeleted: boolean = false;

  constructor() {
    this.id = crypto.randomUUID();
  }

  /**
   * Mark this component for deletion.
   * The owning system will remove it at the end of the frame.
   */
  delete(): void {
    this.isDeleted = true;
  }
}

export default Component;
