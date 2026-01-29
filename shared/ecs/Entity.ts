import { Component } from './Component.js';

/**
 * Entity - A unique identifier with a collection of components.
 * Entities have no behavior; they are just containers for components.
 */
export class Entity {
  public readonly id: string;
  public components: Component[] = [];

  constructor(id?: string) {
    this.id = id ?? crypto.randomUUID();
  }

  /**
   * Attach one or more components to this entity.
   */
  attachComponents(...components: Component[]): void {
    this.components.push(...components);
  }

  /**
   * Get a component by its constructor type.
   */
  getComponent<T extends Component>(type: new (...args: any[]) => T): T | undefined {
    return this.components.find((c): c is T => c instanceof type);
  }

  /**
   * Check if entity has a specific component type.
   */
  hasComponent<T extends Component>(type: new (...args: any[]) => T): boolean {
    return this.components.some(c => c instanceof type);
  }

  /**
   * Remove a specific component from this entity.
   */
  removeComponent(component: Component): void {
    component.delete();
    this.components = this.components.filter(c => c !== component);
  }

  /**
   * Mark all components for deletion.
   */
  deleteComponents(): void {
    for (const component of this.components) {
      component.delete();
    }
    this.components = [];
  }
}

export default Entity;
