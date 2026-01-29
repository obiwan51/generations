import { System } from '../../../shared/ecs/System.js';
import { DecayComponent } from '../../../shared/components/DecayComponent.js';
import registry from '../registry.js';

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
export class DecaySystem extends System<DecayComponent> {
  private tickCounter: number = 0;
  private decayTickInterval: number = 60; // Every 60 ticks
  
  /** Callback when an object transitions to a new decay state */
  public onDecayTransition?: (transition: DecayTransition) => void;

  constructor(decayTickInterval: number = 60) {
    super();
    this.decayTickInterval = decayTickInterval;
  }

  /**
   * Create and register a new DecayComponent.
   */
  createComponent(
    x: number,
    y: number,
    objectType: number,
    maxDecayTicks: number = 3
  ): DecayComponent & { x: number; y: number; objectType: number } {
    const component = new DecayComponent(maxDecayTicks) as DecayComponent & {
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
   * Update all decay components.
   * Called every server tick (1000ms).
   */
  update(_delta: number): void {
    this.tickCounter++;
    
    if (this.tickCounter % this.decayTickInterval !== 0) {
      return;
    }

    for (const component of this.components) {
      if (component.isDeleted) continue;
      
      const extComp = component as DecayComponent & {
        x: number;
        y: number;
        objectType: number;
      };
      
      if (component.incrementDecay()) {
        // Fully decayed - determine next state
        const transition = this.getNextState(extComp);
        
        if (this.onDecayTransition) {
          this.onDecayTransition(transition);
        }

        if (transition.toType === null) {
          // Object is gone
          component.delete();
        } else {
          // Reset decay for next stage
          extComp.objectType = transition.toType;
          component.decayTicks = 0;
          
          // Bones take longer to decay
          const bonesId = registry.getId('BONES');
          if (bonesId && transition.toType === bonesId) {
            component.maxDecayTicks = 6;
          }
        }
      }
    }
  }

  /**
   * Determine the next decay state for an object.
   */
  private getNextState(component: { 
    id: string; 
    x: number; 
    y: number; 
    objectType: number 
  }): DecayTransition {
    const type = component.objectType;
    let toType: number | null = null;
    
    const decayedId = registry.getId('DECAYED_ANIMAL');
    const bonesId = registry.getId('BONES');

    // Dead animals → Decayed
    if (this.isDeadAnimal(type)) {
      toType = decayedId;
    }
    // Decayed → Bones
    else if (decayedId && type === decayedId) {
      toType = bonesId;
    }
    // Bones → Gone
    else if (bonesId && type === bonesId) {
      toType = null;
    }

    return {
      componentId: component.id,
      x: component.x,
      y: component.y,
      fromType: type,
      toType,
    };
  }

  /**
   * Check if a type is a dead animal.
   */
  private isDeadAnimal(type: number): boolean {
    const deadTypes = [
      registry.getId('DEAD_RABBIT'),
      registry.getId('DEAD_DEER'),
      registry.getId('DEAD_WOLF'),
      registry.getId('DEAD_BOAR'),
    ].filter((id): id is number => id !== null);
    
    return deadTypes.includes(type);
  }

  /**
   * Get a component by coordinates.
   */
  getComponentAt(x: number, y: number): (DecayComponent & { x: number; y: number; objectType: number }) | undefined {
    return this.components.find(c => {
      const ext = c as DecayComponent & { x: number; y: number };
      return !c.isDeleted && ext.x === x && ext.y === y;
    }) as (DecayComponent & { x: number; y: number; objectType: number }) | undefined;
  }
}

export default DecaySystem;
