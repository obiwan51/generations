import { System } from '../../../shared/ecs/System.js';
import { DecayComponent } from '../../../shared/components/DecayComponent.js';
interface DecayTransition {
    componentId: string;
    x: number;
    y: number;
    fromType: number;
    toType: number | null;
}
/**
 * DecaySystem - Manages decay progression for world objects.
 * Handles dead animals → decayed → bones → gone transitions.
 */
export declare class DecaySystem extends System<DecayComponent> {
    private tickCounter;
    private decayTickInterval;
    /** Callback when an object transitions to a new decay state */
    onDecayTransition?: (transition: DecayTransition) => void;
    constructor(decayTickInterval?: number);
    /**
     * Create and register a new DecayComponent.
     */
    createComponent(x: number, y: number, objectType: number, maxDecayTicks?: number): DecayComponent & {
        x: number;
        y: number;
        objectType: number;
    };
    /**
     * Update all decay components.
     * Called every server tick (1000ms).
     */
    update(_delta: number): void;
    /**
     * Determine the next decay state for an object.
     */
    private getNextState;
    /**
     * Check if a type is a dead animal.
     */
    private isDeadAnimal;
    /**
     * Get a component by coordinates.
     */
    getComponentAt(x: number, y: number): (DecayComponent & {
        x: number;
        y: number;
        objectType: number;
    }) | undefined;
}
export default DecaySystem;
