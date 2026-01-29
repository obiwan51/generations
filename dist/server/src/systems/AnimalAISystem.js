import { System } from '../../../shared/ecs/System.js';
import { Component } from '../../../shared/ecs/Component.js';
import { CONSTANTS } from '../../../shared/constants.js';
/**
 * AnimalComponent - Tracks animal state in the world.
 */
export class AnimalComponent extends Component {
    x;
    y;
    animalType;
    animalDef;
    age = 0;
    constructor(x, y, animalType, animalDef) {
        super();
        this.x = x;
        this.y = y;
        this.animalType = animalType;
        this.animalDef = animalDef;
    }
}
/**
 * AnimalAISystem - Manages animal movement and behavior.
 */
export class AnimalAISystem extends System {
    tickCounter = 0;
    updateInterval = 5;
    /** Callback when animal moves */
    onAnimalMove;
    /** Callback when carnivore attacks player */
    onAnimalAttack;
    /** Callback when animal dies of old age */
    onAnimalDeath;
    /** Function to check if tile is empty */
    isTileEmpty;
    /** Function to get player positions for aggression checks */
    getPlayersInRange;
    /** Config flags */
    movementEnabled = true;
    aggressionEnabled = true;
    constructor(updateInterval = 5) {
        super();
        this.updateInterval = updateInterval;
    }
    /**
     * Create and register a new animal component.
     */
    createComponent(x, y, animalType, animalDef) {
        const component = new AnimalComponent(x, y, animalType, animalDef);
        this.addComponent(component);
        return component;
    }
    /**
     * Update all animals - movement and behavior.
     */
    update(_delta) {
        this.tickCounter++;
        if (this.tickCounter % this.updateInterval !== 0) {
            return;
        }
        if (!this.movementEnabled) {
            return;
        }
        for (const component of this.components) {
            if (component.isDeleted)
                continue;
            // Check carnivore aggression
            if (component.animalDef.isCarnivore && this.aggressionEnabled) {
                this.checkAggression(component);
            }
            // Random movement
            const moveChance = component.animalDef.speed || 0.2;
            if (Math.random() < moveChance) {
                this.tryMove(component);
            }
        }
    }
    checkAggression(component) {
        if (!this.getPlayersInRange || !this.onAnimalAttack)
            return;
        const playersInRange = this.getPlayersInRange(component.x, component.y, 1.5);
        for (const playerId of playersInRange) {
            this.onAnimalAttack({
                animalName: component.animalDef.name,
                playerId,
                damage: 5,
            });
        }
    }
    tryMove(component) {
        if (!this.isTileEmpty || !this.onAnimalMove)
            return;
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const dir = directions[Math.floor(Math.random() * 4)];
        const nx = component.x + dir[0];
        const ny = component.y + dir[1];
        // Check bounds
        if (nx < 0 || nx >= CONSTANTS.MAP_SIZE || ny < 0 || ny >= CONSTANTS.MAP_SIZE) {
            return;
        }
        // Check if destination is empty
        if (!this.isTileEmpty(nx, ny)) {
            return;
        }
        const oldX = component.x;
        const oldY = component.y;
        component.x = nx;
        component.y = ny;
        this.onAnimalMove({
            fromX: oldX,
            fromY: oldY,
            toX: nx,
            toY: ny,
            type: component.animalType,
            data: { age: component.age },
        });
    }
    /**
     * Get component at coordinates.
     */
    getComponentAt(x, y) {
        return this.components.find(c => !c.isDeleted && c.x === x && c.y === y);
    }
    /**
     * Update animal position (called when world state changes externally).
     */
    updatePosition(oldX, oldY, newX, newY) {
        const component = this.getComponentAt(oldX, oldY);
        if (component) {
            component.x = newX;
            component.y = newY;
        }
    }
    /**
     * Remove animal at coordinates.
     */
    removeAt(x, y) {
        const component = this.getComponentAt(x, y);
        if (component) {
            component.delete();
        }
    }
}
export default AnimalAISystem;
//# sourceMappingURL=AnimalAISystem.js.map