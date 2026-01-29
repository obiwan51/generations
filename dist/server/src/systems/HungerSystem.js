import { System } from '../../../shared/ecs/System.js';
import { HungerComponent } from '../../../shared/components/HungerComponent.js';
import { CONSTANTS } from '../../../shared/constants.js';
/**
 * HungerSystem - Manages hunger depletion for all entities.
 * Babies (age < 3) lose hunger 2x faster.
 */
export class HungerSystem extends System {
    tickCounter = 0;
    hungerTickInterval;
    /** Callback when an entity starves */
    onStarve;
    /** Callback to emit stat updates */
    onHungerUpdate;
    /** Function to get a player's age (for baby hunger rate) */
    getPlayerAge;
    constructor(hungerSpeed = 20000) {
        super();
        // Convert ms to tick count (assuming 1000ms per tick)
        this.hungerTickInterval = Math.max(1, Math.floor(hungerSpeed / 1000));
    }
    /**
     * Create and register a new HungerComponent.
     */
    createComponent(maxHunger = 20) {
        const component = new HungerComponent(maxHunger);
        this.addComponent(component);
        return component;
    }
    /**
     * Register an existing HungerComponent with this system.
     */
    registerComponent(component) {
        this.addComponent(component);
    }
    /**
     * Update hunger speed from config.
     */
    setHungerSpeed(hungerSpeed) {
        this.hungerTickInterval = Math.max(1, Math.floor(hungerSpeed / 1000));
    }
    /**
     * Update all hunger components.
     * Called every server tick (1000ms).
     * Babies lose hunger at 2x rate.
     */
    update(_delta) {
        this.tickCounter++;
        // Only process hunger on the configured interval
        if (this.tickCounter % this.hungerTickInterval !== 0) {
            return;
        }
        for (const component of this.components) {
            if (component.isDeleted)
                continue;
            const wasStarving = component.isStarving();
            // Determine hunger rate based on age
            let hungerAmount = 1;
            if (this.getPlayerAge) {
                const age = this.getPlayerAge(component.id);
                if (age !== null && age < CONSTANTS.BABY_MAX_AGE) {
                    hungerAmount = CONSTANTS.BABY_HUNGER_RATE; // 2x for babies
                }
            }
            component.decreaseHunger(hungerAmount);
            if (this.onHungerUpdate) {
                this.onHungerUpdate(component.id, component.currentHunger);
            }
            // Check for starvation
            if (!wasStarving && component.isStarving() && this.onStarve) {
                this.onStarve(component.id);
            }
        }
    }
    /**
     * Get a component by its ID.
     */
    getComponentById(id) {
        return this.components.find(c => c.id === id && !c.isDeleted);
    }
}
export default HungerSystem;
//# sourceMappingURL=HungerSystem.js.map