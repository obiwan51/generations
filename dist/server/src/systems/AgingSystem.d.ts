import { System } from '../../../shared/ecs/System.js';
import { AgeComponent } from '../../../shared/components/AgeComponent.js';
/**
 * AgingSystem - Manages age progression for all entities.
 * Emits events when entities die of old age.
 */
export declare class AgingSystem extends System<AgeComponent> {
    private tickCounter;
    private agingTickInterval;
    /** Callback when an entity dies of old age */
    onOldAge?: (entityId: string) => void;
    /** Callback to emit age updates */
    onAgeUpdate?: (entityId: string, age: number) => void;
    constructor(agingSpeed?: number);
    /**
     * Create and register a new AgeComponent.
     */
    createComponent(startAge?: number, maxAge?: number): AgeComponent;
    /**
     * Register an existing AgeComponent with this system.
     */
    registerComponent(component: AgeComponent): void;
    /**
     * Update aging speed from config.
     */
    setAgingSpeed(agingSpeed: number): void;
    /**
     * Check if this tick should process aging.
     */
    isAgingTick(): boolean;
    /**
     * Update all age components.
     * Called every server tick (1000ms).
     */
    update(_delta: number): void;
    /**
     * Get tick counter for world time calculations.
     */
    getTickCounter(): number;
    /**
     * Get a component by its ID.
     */
    getComponentById(id: string): AgeComponent | undefined;
}
export default AgingSystem;
