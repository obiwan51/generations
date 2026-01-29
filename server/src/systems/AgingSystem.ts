import { System } from '../../../shared/ecs/System.js';
import { AgeComponent } from '../../../shared/components/AgeComponent.js';

/**
 * AgingSystem - Manages age progression for all entities.
 * Emits events when entities die of old age.
 */
export class AgingSystem extends System<AgeComponent> {
  private tickCounter: number = 0;
  private agingTickInterval: number;
  
  /** Callback when an entity dies of old age */
  public onOldAge?: (entityId: string) => void;
  
  /** Callback to emit age updates */
  public onAgeUpdate?: (entityId: string, age: number) => void;

  constructor(agingSpeed: number = 60000) {
    super();
    // Convert ms to tick count (assuming 1000ms per tick)
    this.agingTickInterval = Math.max(1, Math.floor(agingSpeed / 1000));
  }

  /**
   * Create and register a new AgeComponent.
   */
  createComponent(startAge: number = 0, maxAge: number = 60): AgeComponent {
    const component = new AgeComponent(startAge, maxAge);
    this.addComponent(component);
    return component;
  }

  /**
   * Register an existing AgeComponent with this system.
   */
  registerComponent(component: AgeComponent): void {
    this.addComponent(component);
  }

  /**
   * Update aging speed from config.
   */
  setAgingSpeed(agingSpeed: number): void {
    this.agingTickInterval = Math.max(1, Math.floor(agingSpeed / 1000));
  }

  /**
   * Check if this tick should process aging.
   */
  isAgingTick(): boolean {
    return this.tickCounter % this.agingTickInterval === 0;
  }

  /**
   * Update all age components.
   * Called every server tick (1000ms).
   */
  update(_delta: number): void {
    this.tickCounter++;
    
    // Only process aging on the configured interval
    if (!this.isAgingTick()) {
      return;
    }

    for (const component of this.components) {
      if (component.isDeleted) continue;
      
      const wasDead = component.isDead();
      component.incrementAge();
      
      // Check for old age death
      if (!wasDead && component.isDead() && this.onOldAge) {
        this.onOldAge(component.id);
      }
    }
  }

  /**
   * Get tick counter for world time calculations.
   */
  getTickCounter(): number {
    return this.tickCounter;
  }

  /**
   * Get a component by its ID.
   */
  getComponentById(id: string): AgeComponent | undefined {
    return this.components.find(c => c.id === id && !c.isDeleted);
  }
}

export default AgingSystem;
