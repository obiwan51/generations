import { System } from '../../../shared/ecs/System.js';
import { GrowthComponent } from '../../../shared/components/GrowthComponent.js';
import registry from '../registry.js';
/**
 * GrowthSystem - Manages growth progression for planted crops.
 * Handles planted crops → mature crops transitions.
 */
export class GrowthSystem extends System {
    tickCounter = 0;
    growthTickInterval = 60; // Every 60 ticks (same as decay)
    /** Callback when a crop matures */
    onGrowthComplete;
    constructor(growthTickInterval = 60) {
        super();
        this.growthTickInterval = growthTickInterval;
    }
    /**
     * Create and register a new GrowthComponent for a planted crop.
     */
    createComponent(x, y, objectType, growsInto, maxGrowthTicks = 3) {
        const component = new GrowthComponent(maxGrowthTicks, growsInto);
        component.x = x;
        component.y = y;
        component.objectType = objectType;
        this.addComponent(component);
        return component;
    }
    /**
     * Update all growth components.
     * Called every server tick (1000ms).
     */
    update(_delta) {
        this.tickCounter++;
        if (this.tickCounter % this.growthTickInterval !== 0) {
            return;
        }
        for (const component of this.components) {
            if (component.isDeleted)
                continue;
            const extComp = component;
            if (component.incrementGrowth()) {
                // Fully grown - transition to mature crop
                if (component.growsInto) {
                    const matureId = registry.getId(component.growsInto);
                    if (matureId && this.onGrowthComplete) {
                        this.onGrowthComplete({
                            componentId: component.id,
                            x: extComp.x,
                            y: extComp.y,
                            fromType: extComp.objectType,
                            toType: matureId
                        });
                    }
                }
                // Remove the growth component after maturing
                component.delete();
            }
        }
    }
    /**
     * Get a component by coordinates.
     */
    getComponentAt(x, y) {
        return this.components.find(c => {
            const ext = c;
            return !c.isDeleted && ext.x === x && ext.y === y;
        });
    }
}
export default GrowthSystem;
//# sourceMappingURL=GrowthSystem.js.map