import { System } from '../../../shared/ecs/System.js';
import { Component } from '../../../shared/ecs/Component.js';
import { CONSTANTS } from '../../../shared/constants.js';
import { Animal } from '../../../shared/types.js';

/**
 * AnimalComponent - Tracks animal state in the world.
 */
export class AnimalComponent extends Component {
  public age: number = 0;
  public lastAttackTime: number = 0;

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
  animalX: number;
  animalY: number;
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

    // Check carnivore aggression EVERY tick for responsive attacks
    if (this.aggressionEnabled) {
      for (const component of this.components) {
        if (component.isDeleted) continue;
        if (component.animalDef.isCarnivore) {
          this.checkAggression(component);
        }
      }
    }

    // Movement only happens at intervals
    if (this.tickCounter % this.updateInterval !== 0) {
      return;
    }

    if (!this.movementEnabled) {
      return;
    }

    for (const component of this.components) {
      if (component.isDeleted) continue;

      // Random movement
      const moveChance = component.animalDef.speed || 0.2;
      if (Math.random() < moveChance) {
        this.tryMove(component);
      }
    }
  }

  private checkAggression(component: AnimalComponent): void {
    if (!this.getPlayersInRange || !this.onAnimalAttack) return;

    // Attack cooldown - 2 seconds between attacks
    const now = Date.now();
    if (now - component.lastAttackTime < 2000) return;

    const playersInRange = this.getPlayersInRange(component.x, component.y, 1.5);
    
    for (const playerId of playersInRange) {
      // Use aggression stat for damage (default 5)
      const baseDamage = Math.round((component.animalDef.aggression || 0.5) * 10);
      component.lastAttackTime = now;
      this.onAnimalAttack({
        animalName: component.animalDef.name,
        playerId,
        damage: baseDamage,
        animalX: component.x,
        animalY: component.y,
      });
      break; // Only attack one player per cycle
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

  /**
   * Make animal flee from a threat (move away from attacker position).
   * Returns true if the animal successfully moved.
   */
  fleeFrom(animalX: number, animalY: number, threatX: number, threatY: number): boolean {
    if (!this.isTileEmpty || !this.onAnimalMove) return false;

    const component = this.getComponentAt(animalX, animalY);
    if (!component) return false;

    // Calculate direction away from threat
    const dx = animalX - threatX;
    const dy = animalY - threatY;

    // Normalize and pick primary direction
    const directions: [number, number][] = [];
    
    // Add directions sorted by how much they move away from threat
    if (Math.abs(dx) >= Math.abs(dy)) {
      // Prioritize horizontal movement
      if (dx !== 0) directions.push([Math.sign(dx), 0]);
      if (dy !== 0) directions.push([0, Math.sign(dy)]);
      if (dx !== 0) directions.push([0, -Math.sign(dy) || 1]); // perpendicular
      if (dx !== 0) directions.push([-Math.sign(dx), 0]); // opposite (last resort)
    } else {
      // Prioritize vertical movement
      if (dy !== 0) directions.push([0, Math.sign(dy)]);
      if (dx !== 0) directions.push([Math.sign(dx), 0]);
      if (dy !== 0) directions.push([-Math.sign(dx) || 1, 0]); // perpendicular
      if (dy !== 0) directions.push([0, -Math.sign(dy)]); // opposite (last resort)
    }

    // Also add random perpendicular directions as fallback
    directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);

    for (const [dirX, dirY] of directions) {
      const nx = animalX + dirX;
      const ny = animalY + dirY;

      // Check bounds
      if (nx < 0 || nx >= CONSTANTS.MAP_SIZE || ny < 0 || ny >= CONSTANTS.MAP_SIZE) {
        continue;
      }

      // Check if destination is empty
      if (!this.isTileEmpty(nx, ny)) {
        continue;
      }

      // Move the animal
      component.x = nx;
      component.y = ny;

      this.onAnimalMove({
        fromX: animalX,
        fromY: animalY,
        toX: nx,
        toY: ny,
        type: component.animalType,
        data: { age: component.age },
      });

      return true;
    }

    return false;
  }
}

export default AnimalAISystem;
