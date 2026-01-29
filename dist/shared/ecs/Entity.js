/**
 * Entity - A unique identifier with a collection of components.
 * Entities have no behavior; they are just containers for components.
 */
export class Entity {
    id;
    components = [];
    constructor(id) {
        this.id = id ?? crypto.randomUUID();
    }
    /**
     * Attach one or more components to this entity.
     */
    attachComponents(...components) {
        this.components.push(...components);
    }
    /**
     * Get a component by its constructor type.
     */
    getComponent(type) {
        return this.components.find((c) => c instanceof type);
    }
    /**
     * Check if entity has a specific component type.
     */
    hasComponent(type) {
        return this.components.some(c => c instanceof type);
    }
    /**
     * Remove a specific component from this entity.
     */
    removeComponent(component) {
        component.delete();
        this.components = this.components.filter(c => c !== component);
    }
    /**
     * Mark all components for deletion.
     */
    deleteComponents() {
        for (const component of this.components) {
            component.delete();
        }
        this.components = [];
    }
}
export default Entity;
//# sourceMappingURL=Entity.js.map