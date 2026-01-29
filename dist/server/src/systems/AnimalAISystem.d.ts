import { System } from '../../../shared/ecs/System.js';
import { Component } from '../../../shared/ecs/Component.js';
import { Animal } from '../../../shared/types.js';
/**
 * AnimalComponent - Tracks animal state in the world.
 */
export declare class AnimalComponent extends Component {
    x: number;
    y: number;
    animalType: number;
    animalDef: Animal;
    age: number;
    constructor(x: number, y: number, animalType: number, animalDef: Animal);
}
interface AnimalMove {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type: number;
    data: any;
}
interface AnimalAttack {
    animalName: string;
    playerId: string;
    damage: number;
}
interface AnimalDeath {
    x: number;
    y: number;
    deadType: number;
}
/**
 * AnimalAISystem - Manages animal movement and behavior.
 */
export declare class AnimalAISystem extends System<AnimalComponent> {
    private tickCounter;
    private updateInterval;
    /** Callback when animal moves */
    onAnimalMove?: (move: AnimalMove) => void;
    /** Callback when carnivore attacks player */
    onAnimalAttack?: (attack: AnimalAttack) => void;
    /** Callback when animal dies of old age */
    onAnimalDeath?: (death: AnimalDeath) => void;
    /** Function to check if tile is empty */
    isTileEmpty?: (x: number, y: number) => boolean;
    /** Function to get player positions for aggression checks */
    getPlayersInRange?: (x: number, y: number, range: number) => string[];
    /** Config flags */
    movementEnabled: boolean;
    aggressionEnabled: boolean;
    constructor(updateInterval?: number);
    /**
     * Create and register a new animal component.
     */
    createComponent(x: number, y: number, animalType: number, animalDef: Animal): AnimalComponent;
    /**
     * Update all animals - movement and behavior.
     */
    update(_delta: number): void;
    private checkAggression;
    private tryMove;
    /**
     * Get component at coordinates.
     */
    getComponentAt(x: number, y: number): AnimalComponent | undefined;
    /**
     * Update animal position (called when world state changes externally).
     */
    updatePosition(oldX: number, oldY: number, newX: number, newY: number): void;
    /**
     * Remove animal at coordinates.
     */
    removeAt(x: number, y: number): void;
}
export default AnimalAISystem;
