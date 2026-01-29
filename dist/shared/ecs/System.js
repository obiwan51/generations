/**
 * System - Contains logic that operates on entities with specific components.
 * Each system manages its own set of components and updates them each frame.
 */
export class System {
    components = [];
    /**
     * Add a component to be managed by this system.
     */
    addComponent(component) {
        this.components.push(component);
    }
    /**
     * Remove components that have been marked for deletion.
     * Should be called at the end of each frame.
     */
    deleteStaleComponents() {
        this.components = this.components.filter(c => !c.isDeleted);
    }
    /**
     * Get all active (non-deleted) components.
     */
    getComponents() {
        return this.components.filter(c => !c.isDeleted);
    }
    /**
     * Get count of active components.
     */
    getComponentCount() {
        return this.components.filter(c => !c.isDeleted).length;
    }
    /**
     * Remove all components.
     */
    clear() {
        this.components = [];
    }
}
export default System;
//# sourceMappingURL=System.js.map