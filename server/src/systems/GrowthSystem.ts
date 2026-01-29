import { System } from '../../../shared/ecs/System.js';
import { GrowthComponent } from '../../../shared/components/GrowthComponent.js';
import registry from '../registry.js';
import { Item } from '../../../shared/types.js';

interface GrowthTransition {
  componentId: string;
  x: number;
  y: number;
  fromType: number;
  toType: number;
}

/**
 * GrowthSystem - Manages growth progression for planted crops.
 * Handles planted crops → mature crops transitions.
 */
export class GrowthSystem extends System<GrowthComponent> {
  private tickCounter: number = 0;
  private growthTickInterval: number = 60; // Every 60 ticks (same as decay)
  
  /** Callback when a crop matures */
  public onGrowthComplete?: (transition: GrowthTransition) => void;

  constructor(growthTickInterval: number = 60) {
    super();
    this.growthTickInterval = growthTickInterval;
  }

  /**
   * Create and register a new GrowthComponent for a planted crop.
   */
  createComponent(
    x: number,
    y: number,
    objectType: number,
    growsInto: string,
    maxGrowthTicks: number = 3
  ): GrowthComponent & { x: number; y: number; objectType: number } {
    const component = new GrowthComponent(maxGrowthTicks, growsInto) as GrowthComponent & {
      x: number;
      y: number;
      objectType: number;
    };
    component.x = x;
    component.y = y;
    component.objectType = objectType;
    this.addComponent(component);
    return component;
  }

  /**
   * Update all growth components.
   * Called every server tick (1000ms).
   */
  update(_delta: number): void {
    this.tickCounter++;
    
    if (this.tickCounter % this.growthTickInterval !== 0) {
      return;
    }

    for (const component of this.components) {
      if (component.isDeleted) continue;
      
      const extComp = component as GrowthComponent & {
        x: number;
        y: number;
        objectType: number;
      };
      
      if (component.incrementGrowth()) {
        // Fully grown - transition to mature crop
        if (component.growsInto) {
          const matureId = registry.getId(component.growsInto);
          
          if (matureId && this.onGrowthComplete) {
            this.onGrowthComplete({
              componentId: component.id,
              x: extComp.x,
              y: extComp.y,
              fromType: extComp.objectType,
              toType: matureId
            });
          }
        }
        
        // Remove the growth component after maturing
        component.delete();
      }
    }
  }

  /**
   * Get a component by coordinates.
   */
  getComponentAt(x: number, y: number): (GrowthComponent & { x: number; y: number; objectType: number }) | undefined {
    return this.components.find(c => {
      const ext = c as GrowthComponent & { x: number; y: number };
      return !c.isDeleted && ext.x === x && ext.y === y;
    }) as (GrowthComponent & { x: number; y: number; objectType: number }) | undefined;
  }
}

export default GrowthSystem;
