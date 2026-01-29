import { Component } from './Component.js';

/**
 * System - Contains logic that operates on entities with specific components.
 * Each system manages its own set of components and updates them each frame.
 */
export abstract class System<T extends Component = Component> {
  protected components: T[] = [];

  /**
   * Update all components managed by this system.
   * Called every frame by the game loop.
   * @param delta - Time since last update in seconds
   */
  abstract update(delta: number): void;

  /**
   * Add a component to be managed by this system.
   */
  protected addComponent(component: T): void {
    this.components.push(component);
  }

  /**
   * Remove components that have been marked for deletion.
   * Should be called at the end of each frame.
   */
  deleteStaleComponents(): void {
    this.components = this.components.filter(c => !c.isDeleted);
  }

  /**
   * Get all active (non-deleted) components.
   */
  getComponents(): T[] {
    return this.components.filter(c => !c.isDeleted);
  }

  /**
   * Get count of active components.
   */
  getComponentCount(): number {
    return this.components.filter(c => !c.isDeleted).length;
  }

  /**
   * Remove all components.
   */
  clear(): void {
    this.components = [];
  }
}

export default System;
