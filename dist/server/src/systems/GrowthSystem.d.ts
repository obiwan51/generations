import { System } from '../../../shared/ecs/System.js';
import { GrowthComponent } from '../../../shared/components/GrowthComponent.js';
interface GrowthTransition {
    componentId: string;
    x: number;
    y: number;
    fromType: number;
    toType: number;
}
/**
 * GrowthSystem - Manages growth progression for planted crops.
 * Handles planted crops → mature crops transitions.
 */
export declare class GrowthSystem extends System<GrowthComponent> {
    private tickCounter;
    private growthTickInterval;
    /** Callback when a crop matures */
    onGrowthComplete?: (transition: GrowthTransition) => void;
    constructor(growthTickInterval?: number);
    /**
     * Create and register a new GrowthComponent for a planted crop.
     */
    createComponent(x: number, y: number, objectType: number, growsInto: string, maxGrowthTicks?: number): GrowthComponent & {
        x: number;
        y: number;
        objectType: number;
    };
    /**
     * Update all growth components.
     * Called every server tick (1000ms).
     */
    update(_delta: number): void;
    /**
     * Get a component by coordinates.
     */
    getComponentAt(x: number, y: number): (GrowthComponent & {
        x: number;
        y: number;
        objectType: number;
    }) | undefined;
}
export default GrowthSystem;
