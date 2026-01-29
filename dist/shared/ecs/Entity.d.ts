import { Component } from './Component.js';
/**
 * Entity - A unique identifier with a collection of components.
 * Entities have no behavior; they are just containers for components.
 */
export declare class Entity {
    readonly id: string;
    components: Component[];
    constructor(id?: string);
    /**
     * Attach one or more components to this entity.
     */
    attachComponents(...components: Component[]): void;
    /**
     * Get a component by its constructor type.
     */
    getComponent<T extends Component>(type: new (...args: any[]) => T): T | undefined;
    /**
     * Check if entity has a specific component type.
     */
    hasComponent<T extends Component>(type: new (...args: any[]) => T): boolean;
    /**
     * Remove a specific component from this entity.
     */
    removeComponent(component: Component): void;
    /**
     * Mark all components for deletion.
     */
    deleteComponents(): void;
}
export default Entity;
