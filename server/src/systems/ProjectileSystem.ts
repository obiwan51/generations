import { System } from '../../../shared/ecs/System.js';
import { PositionComponent } from '../../../shared/components/PositionComponent.js';
import { VelocityComponent } from '../../../shared/components/VelocityComponent.js';
import { ProjectileComponent } from '../../../shared/components/ProjectileComponent.js';
import { Entity } from '../../../shared/ecs/Entity.js';
import { CONSTANTS } from '../../../shared/constants.js';

interface ProjectileHit {
  projectile: Entity;
  tileX: number;
  tileY: number;
  targetType: number;
}

interface ProjectileLanded {
  projectile: Entity;
  tileX: number;
  tileY: number;
  projectileType: number;
}

/**
 * ProjectileSystem - Manages projectile movement and collision.
 */
export class ProjectileSystem extends System<ProjectileComponent> {
  private projectileEntities: Map<string, Entity> = new Map();
  private speed: number = 15;
  
  /** Callback when projectile hits a target */
  public onHit?: (hit: ProjectileHit) => void;
  
  /** Callback when projectile lands (max distance) */
  public onLand?: (landed: ProjectileLanded) => void;
  
  /** Function to check what's at a tile position */
  public getObjectAt?: (x: number, y: number) => number | null;
  
  /** Function to check if tile is empty */
  public isTileEmpty?: (x: number, y: number) => boolean;

  constructor() {
    super();
  }

  /**
   * Create a new projectile entity with all required components.
   */
  createProjectile(
    ownerId: string,
    startX: number,
    startY: number,
    angle: number,
    projectileType: number,
    maxDist: number,
    damage: number = 5,
    remainingUses?: number
  ): Entity {
    const entity = new Entity();
    
    const position = new PositionComponent(startX, startY);
    const velocity = new VelocityComponent();
    velocity.setFromAngle(angle, this.speed);
    
    const projectile = new ProjectileComponent(
      ownerId,
      projectileType,
      maxDist,
      angle,
      damage,
      remainingUses
    );
    
    // Track starting tile to ignore collision there
    projectile.startTileX = Math.floor(startX / CONSTANTS.TILE_SIZE);
    projectile.startTileY = Math.floor(startY / CONSTANTS.TILE_SIZE);
    
    entity.attachComponents(position, velocity, projectile);
    
    this.addComponent(projectile);
    this.projectileEntities.set(projectile.id, entity);
    
    return entity;
  }

  /**
   * Update all projectiles - move them and check collisions.
   * Called every 50ms.
   */
  update(_delta: number): void {
    for (const component of this.components) {
      if (component.isDeleted) continue;
      
      const entity = this.projectileEntities.get(component.id);
      if (!entity) continue;
      
      const position = entity.getComponent(PositionComponent);
      const velocity = entity.getComponent(VelocityComponent);
      
      if (!position || !velocity) continue;
      
      // Move projectile
      position.move(velocity.vx, velocity.vy);
      component.updateDistance(this.speed);
      
      // Check collision
      const tileX = Math.floor(position.x / CONSTANTS.TILE_SIZE);
      const tileY = Math.floor(position.y / CONSTANTS.TILE_SIZE);
      
      // Skip collision check at starting tile (so you can throw past objects you're standing on)
      const isAtStartTile = tileX === component.startTileX && tileY === component.startTileY;
      
      const targetType = isAtStartTile ? null : (this.getObjectAt?.(tileX, tileY) ?? null);
      
      if (targetType !== null && this.onHit) {
        // Hit something
        this.onHit({
          projectile: entity,
          tileX,
          tileY,
          targetType,
        });
        this.removeProjectile(component.id);
      } else if (component.isExpired()) {
        // Reached max distance - land on ground
        if (this.isTileEmpty?.(tileX, tileY) && this.onLand) {
          this.onLand({
            projectile: entity,
            tileX,
            tileY,
            projectileType: component.type,
          });
        }
        this.removeProjectile(component.id);
      }
    }
  }

  /**
   * Remove a projectile by component ID.
   */
  private removeProjectile(componentId: string): void {
    const entity = this.projectileEntities.get(componentId);
    if (entity) {
      entity.deleteComponents();
      this.projectileEntities.delete(componentId);
    }
  }

  /**
   * Get all active projectiles for network sync.
   */
  getProjectilesForSync(): Array<{
    id: string;
    type: number;
    x: number;
    y: number;
    angle: number;
  }> {
    const result: Array<{
      id: string;
      type: number;
      x: number;
      y: number;
      angle: number;
    }> = [];
    
    for (const component of this.components) {
      if (component.isDeleted) continue;
      
      const entity = this.projectileEntities.get(component.id);
      if (!entity) continue;
      
      const position = entity.getComponent(PositionComponent);
      if (!position) continue;
      
      result.push({
        id: component.id,
        type: component.type,
        x: position.x,
        y: position.y,
        angle: component.angle,
      });
    }
    
    return result;
  }

  /**
   * Get projectile count.
   */
  getProjectileCount(): number {
    return this.projectileEntities.size;
  }
}

export default ProjectileSystem;
