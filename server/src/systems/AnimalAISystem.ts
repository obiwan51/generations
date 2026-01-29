import { System } from '../../../shared/ecs/System.js';
import { Component } from '../../../shared/ecs/Component.js';
import { CONSTANTS } from '../../../shared/constants.js';
import { Animal } from '../../../shared/types.js';

/**
 * AnimalComponent - Tracks animal state in the world.
 */
export class AnimalComponent extends Component {
  public age: number = 0;

  constructor(
    public x: number,
    public y: number,
    public animalType: number,
    public animalDef: Animal
  ) {
    super();
  }
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
export class AnimalAISystem extends System<AnimalComponent> {
  private tickCounter: number = 0;
  private updateInterval: number = 5;
  
  /** Callback when animal moves */
  public onAnimalMove?: (move: AnimalMove) => void;
  
  /** Callback when carnivore attacks player */
  public onAnimalAttack?: (attack: AnimalAttack) => void;
  
  /** Callback when animal dies of old age */
  public onAnimalDeath?: (death: AnimalDeath) => void;
  
  /** Function to check if tile is empty */
  public isTileEmpty?: (x: number, y: number) => boolean;
  
  /** Function to get player positions for aggression checks */
  public getPlayersInRange?: (x: number, y: number, range: number) => string[];
  
  /** Config flags */
  public movementEnabled: boolean = true;
  public aggressionEnabled: boolean = true;

  constructor(updateInterval: number = 5) {
    super();
    this.updateInterval = updateInterval;
  }

  /**
   * Create and register a new animal component.
   */
  createComponent(
    x: number,
    y: number,
    animalType: number,
    animalDef: Animal,
    data?: any
  ): AnimalComponent {
    const component = new AnimalComponent(x, y, animalType, animalDef);
    if (data && typeof data.age === 'number') {
      component.age = data.age;
    }
    this.addComponent(component);
    return component;
  }

  /**
   * Update all animals - movement and behavior.
   */
  update(_delta: number): void {
    this.tickCounter++;

    if (this.tickCounter % this.updateInterval !== 0) {
      return;
    }

    if (!this.movementEnabled) {
      return;
    }

    for (const component of this.components) {
      if (component.isDeleted) continue;

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

  private checkAggression(component: AnimalComponent): void {
    if (!this.getPlayersInRange || !this.onAnimalAttack) return;

    const playersInRange = this.getPlayersInRange(component.x, component.y, 1.5);
    
    for (const playerId of playersInRange) {
      this.onAnimalAttack({
        animalName: component.animalDef.name,
        playerId,
        damage: 5,
      });
    }
  }

  private tryMove(component: AnimalComponent): void {
    if (!this.isTileEmpty || !this.onAnimalMove) return;

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
  getComponentAt(x: number, y: number): AnimalComponent | undefined {
    return this.components.find(
      c => !c.isDeleted && c.x === x && c.y === y
    );
  }

  /**
   * Update animal position (called when world state changes externally).
   */
  updatePosition(oldX: number, oldY: number, newX: number, newY: number): void {
    const component = this.getComponentAt(oldX, oldY);
    if (component) {
      component.x = newX;
      component.y = newY;
    }
  }

  /**
   * Remove animal at coordinates.
   */
  removeAt(x: number, y: number): void {
    const component = this.getComponentAt(x, y);
    if (component) {
      component.delete();
    }
  }
}

export default AnimalAISystem;
