import { System } from '../../../shared/ecs/System.js';
import { HungerComponent } from '../../../shared/components/HungerComponent.js';
/**
 * HungerSystem - Manages hunger depletion for all entities.
 * Babies (age < 3) lose hunger 2x faster.
 */
export declare class HungerSystem extends System<HungerComponent> {
    private tickCounter;
    private hungerTickInterval;
    /** Callback when an entity starves */
    onStarve?: (entityId: string) => void;
    /** Callback to emit stat updates */
    onHungerUpdate?: (entityId: string, hunger: number) => void;
    /** Function to get a player's age (for baby hunger rate) */
    getPlayerAge?: (componentId: string) => number | null;
    constructor(hungerSpeed?: number);
    /**
     * Create and register a new HungerComponent.
     */
    createComponent(maxHunger?: number): HungerComponent;
    /**
     * Register an existing HungerComponent with this system.
     */
    registerComponent(component: HungerComponent): void;
    /**
     * Update hunger speed from config.
     */
    setHungerSpeed(hungerSpeed: number): void;
    /**
     * Update all hunger components.
     * Called every server tick (1000ms).
     * Babies lose hunger at 2x rate.
     */
    update(_delta: number): void;
    /**
     * Get a component by its ID.
     */
    getComponentById(id: string): HungerComponent | undefined;
}
export default HungerSystem;
