import { System } from '../../../shared/ecs/System.js';
import { Component } from '../../../shared/ecs/Component.js';
import { CONSTANTS } from '../../../shared/constants.js';
import { Animal } from '../../../shared/types.js';

const TILE_SIZE = CONSTANTS.TILE_SIZE;

/**
 * AnimalComponent - Tracks animal state with smooth pixel-based movement.
 */
export class AnimalComponent extends Component {
  // Pixel position (for smooth rendering)
  public x: number;
  public y: number;
  
  // Target tile position
  public targetTileX: number;
  public targetTileY: number;
  
  // Movement state
  public isMoving: boolean = false;
  public moveSpeed: number; // pixels per update (50ms)
  
  // Combat state
  public lastAttackTime: number = 0;
  
  // Life state
  public age: number = 0;
  public hp: number;
  public maxHp: number;

  constructor(
    tileX: number,
    tileY: number,
    public animalType: number,
    public animalDef: Animal
  ) {
    super();
    // Convert tile position to pixel position (center of tile)
    this.x = tileX * TILE_SIZE + TILE_SIZE / 2;
    this.y = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.targetTileX = tileX;
    this.targetTileY = tileY;
    
    // Speed: animalDef.speed (0-1) maps to pixels per 50ms update
    // 0.2 = slow (2 px/tick), 0.9 = fast (7 px/tick)
    this.moveSpeed = Math.max(1.5, (animalDef.speed || 0.2) * 8);
    
    this.hp = animalDef.hp || 10;
    this.maxHp = this.hp;
  }

  /** Get current tile X position */
  get tileX(): number {
    return Math.floor(this.x / TILE_SIZE);
  }

  /** Get current tile Y position */
  get tileY(): number {
    return Math.floor(this.y / TILE_SIZE);
  }
}

interface AnimalAttack {
  animalName: string;
  playerId: string;
  damage: number;
  animalX: number;
  animalY: number;
}

/**
 * AnimalAISystem - Manages animal AI with smooth pixel-based movement.
 * 
 * - Fast update (50ms): Movement interpolation
 * - Slow update (1000ms): AI decisions, wandering
 */
export class AnimalAISystem extends System<AnimalComponent> {
  private aiTickCounter: number = 0;
  private aiUpdateInterval: number = 20; // Every 20 fast ticks = 1 second
  
  /** Callback when carnivore attacks player */
  public onAnimalAttack?: (attack: AnimalAttack) => void;
  
  /** Callback when animal changes tiles (for world object sync) */
  public onAnimalTileChange?: (component: AnimalComponent, fromTileX: number, fromTileY: number) => void;
  
  /** Function to check if a tile is passable for animals */
  public isTilePassable?: (tileX: number, tileY: number) => boolean;
  
  /** Function to get player positions for aggression/fleeing */
  public getPlayersInRange?: (tileX: number, tileY: number, range: number) => Array<{ id: string; x: number; y: number }>;
  
  /** Config flags */
  public movementEnabled: boolean = true;
  public aggressionEnabled: boolean = true;

  constructor() {
    super();
  }

  /**
   * Create and register a new animal component.
   */
  createComponent(
    tileX: number,
    tileY: number,
    animalType: number,
    animalDef: Animal,
    data?: { age?: number; hp?: number }
  ): AnimalComponent {
    const component = new AnimalComponent(tileX, tileY, animalType, animalDef);
    if (data?.age !== undefined) component.age = data.age;
    if (data?.hp !== undefined) component.hp = data.hp;
    this.addComponent(component);
    return component;
  }

  /**
   * Fast update - called every 50ms for smooth movement.
   */
  update(_delta: number): void {
    this.aiTickCounter++;
    const isAITick = this.aiTickCounter % this.aiUpdateInterval === 0;

    for (const component of this.components) {
      if (component.isDeleted) continue;

      // Smooth movement update (every tick)
      if (this.movementEnabled && component.isMoving) {
        this.updateMovement(component);
      }

      // Aggression check (every tick for responsiveness)
      if (this.aggressionEnabled && component.animalDef.isCarnivore) {
        this.checkAggression(component);
      }

      // AI decisions (every ~1 second)
      if (isAITick) {
        this.updateAI(component);
      }
    }
  }

  /**
   * Update smooth movement towards target.
   */
  private updateMovement(component: AnimalComponent): void {
    const targetPxX = component.targetTileX * TILE_SIZE + TILE_SIZE / 2;
    const targetPxY = component.targetTileY * TILE_SIZE + TILE_SIZE / 2;
    
    const dx = targetPxX - component.x;
    const dy = targetPxY - component.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < component.moveSpeed) {
      // Arrived at target
      const prevTileX = component.tileX;
      const prevTileY = component.tileY;
      
      component.x = targetPxX;
      component.y = targetPxY;
      component.isMoving = false;
      
      // Notify if we changed tiles
      if (component.tileX !== prevTileX || component.tileY !== prevTileY) {
        this.onAnimalTileChange?.(component, prevTileX, prevTileY);
      }
    } else {
      // Move towards target
      const prevTileX = component.tileX;
      const prevTileY = component.tileY;
      
      component.x += (dx / dist) * component.moveSpeed;
      component.y += (dy / dist) * component.moveSpeed;
      
      // Check if we crossed into a new tile
      if (component.tileX !== prevTileX || component.tileY !== prevTileY) {
        this.onAnimalTileChange?.(component, prevTileX, prevTileY);
      }
    }
  }

  /**
   * AI decision making - called every ~1 second.
   */
  private updateAI(component: AnimalComponent): void {
    // Don't make new decisions if still moving to target
    if (component.isMoving) return;

    // Check for nearby players
    const nearbyPlayers = this.getPlayersInRange?.(
      component.tileX, 
      component.tileY, 
      5 // Detection range in tiles
    ) || [];

    if (component.animalDef.isCarnivore && nearbyPlayers.length > 0) {
      // Carnivore: chase nearest player
      this.chaseTarget(component, nearbyPlayers[0]);
    } else if (!component.animalDef.isCarnivore && nearbyPlayers.length > 0) {
      // Herbivore: flee from nearest player if too close
      const nearest = nearbyPlayers[0];
      const distToPlayer = Math.sqrt(
        Math.pow(component.x - nearest.x, 2) +
        Math.pow(component.y - nearest.y, 2)
      ) / TILE_SIZE;
      
      if (distToPlayer < 3) {
        this.fleeFromPixel(component, nearest.x, nearest.y);
      } else {
        this.wander(component);
      }
    } else {
      // No players nearby - wander randomly
      this.wander(component);
    }
  }

  /**
   * Random wandering behavior.
   */
  private wander(component: AnimalComponent): void {
    if (!this.isTilePassable) return;
    
    // Random chance to not move (animals rest)
    if (Math.random() > 0.6) return;

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    // Shuffle directions for variety
    directions.sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = component.tileX + dx;
      const ny = component.tileY + dy;

      if (nx >= 0 && nx < CONSTANTS.MAP_SIZE && 
          ny >= 0 && ny < CONSTANTS.MAP_SIZE &&
          this.isTilePassable(nx, ny)) {
        component.targetTileX = nx;
        component.targetTileY = ny;
        component.isMoving = true;
        return;
      }
    }
  }

  /**
   * Chase a target (for carnivores).
   */
  private chaseTarget(component: AnimalComponent, target: { x: number; y: number }): void {
    if (!this.isTilePassable) return;

    const targetTileX = Math.floor(target.x / TILE_SIZE);
    const targetTileY = Math.floor(target.y / TILE_SIZE);

    // Calculate direction towards target
    const dx = targetTileX - component.tileX;
    const dy = targetTileY - component.tileY;

    // Try to move towards target
    const possibleMoves: [number, number][] = [];
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx !== 0) possibleMoves.push([Math.sign(dx), 0]);
      if (dy !== 0) possibleMoves.push([0, Math.sign(dy)]);
    } else {
      if (dy !== 0) possibleMoves.push([0, Math.sign(dy)]);
      if (dx !== 0) possibleMoves.push([Math.sign(dx), 0]);
    }

    for (const [mx, my] of possibleMoves) {
      const nx = component.tileX + mx;
      const ny = component.tileY + my;

      if (nx >= 0 && nx < CONSTANTS.MAP_SIZE && 
          ny >= 0 && ny < CONSTANTS.MAP_SIZE &&
          this.isTilePassable(nx, ny)) {
        component.targetTileX = nx;
        component.targetTileY = ny;
        component.isMoving = true;
        return;
      }
    }
  }

  /**
   * Flee from a threat (pixel coordinates).
   */
  private fleeFromPixel(component: AnimalComponent, threatX: number, threatY: number): void {
    if (!this.isTilePassable) return;

    // Calculate direction away from threat
    const dx = component.x - threatX;
    const dy = component.y - threatY;

    // Build priority list of directions (away from threat first)
    const directions: [number, number][] = [];
    
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx !== 0) directions.push([Math.sign(dx), 0]);
      if (dy !== 0) directions.push([0, Math.sign(dy)]);
    } else {
      if (dy !== 0) directions.push([0, Math.sign(dy)]);
      if (dx !== 0) directions.push([Math.sign(dx), 0]);
    }
    // Fallback: perpendicular directions
    directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);

    for (const [mx, my] of directions) {
      const nx = component.tileX + mx;
      const ny = component.tileY + my;

      if (nx >= 0 && nx < CONSTANTS.MAP_SIZE && 
          ny >= 0 && ny < CONSTANTS.MAP_SIZE &&
          this.isTilePassable(nx, ny)) {
        component.targetTileX = nx;
        component.targetTileY = ny;
        component.isMoving = true;
        // Boost speed when fleeing
        component.moveSpeed = Math.max(component.moveSpeed, 5);
        return;
      }
    }
  }

  /**
   * Check if carnivore should attack nearby players.
   */
  private checkAggression(component: AnimalComponent): void {
    if (!this.getPlayersInRange || !this.onAnimalAttack) return;

    // Attack cooldown - 2 seconds between attacks
    const now = Date.now();
    if (now - component.lastAttackTime < 2000) return;

    // Check for players within attack range (~1.5 tiles)
    const attackRangePx = TILE_SIZE * 1.5;
    const players = this.getPlayersInRange(component.tileX, component.tileY, 2);
    
    for (const player of players) {
      const distPx = Math.sqrt(
        Math.pow(component.x - player.x, 2) + 
        Math.pow(component.y - player.y, 2)
      );
      
      if (distPx < attackRangePx) {
        const baseDamage = Math.round((component.animalDef.aggression || 0.5) * 10);
        component.lastAttackTime = now;
        this.onAnimalAttack({
          animalName: component.animalDef.name,
          playerId: player.id,
          damage: baseDamage,
          animalX: component.x,
          animalY: component.y,
        });
        return; // Only attack one player per cycle
      }
    }
  }

  /**
   * Get component at tile coordinates.
   */
  getComponentAt(tileX: number, tileY: number): AnimalComponent | undefined {
    return this.components.find(
      c => !c.isDeleted && c.tileX === tileX && c.tileY === tileY
    );
  }

  /**
   * Remove animal at tile coordinates.
   */
  removeAt(tileX: number, tileY: number): void {
    const component = this.getComponentAt(tileX, tileY);
    if (component) {
      component.delete();
    }
  }

  /**
   * Make animal flee from a threat (tile coordinates - for projectile hits).
   */
  fleeFrom(animalTileX: number, animalTileY: number, threatTileX: number, threatTileY: number): boolean {
    const component = this.getComponentAt(animalTileX, animalTileY);
    if (!component) return false;

    this.fleeFromPixel(
      component, 
      threatTileX * TILE_SIZE + TILE_SIZE / 2,
      threatTileY * TILE_SIZE + TILE_SIZE / 2
    );
    return component.isMoving;
  }

  /**
   * Get all animals for network sync.
   */
  getAnimalsForSync(): Array<{
    id: string;
    type: number;
    x: number;
    y: number;
    hp?: number;
  }> {
    return this.components
      .filter(c => !c.isDeleted)
      .map(c => ({
        id: c.id,
        type: c.animalType,
        x: Math.round(c.x),
        y: Math.round(c.y),
        hp: c.hp < c.maxHp ? c.hp : undefined,
      }));
  }
}

export default AnimalAISystem;
