import { Component } from '../ecs/Component.js';

/**
 * InventoryComponent - Stores held items and container contents.
 * Used by players and container objects (baskets).
 */
export class InventoryComponent extends Component {
  public holding: number | null = null;
  public holdingData: any = null;
  public inventory: number[] = [];
  
  // Backpack (worn container like basket)
  public backpack: number | null = null;
  public backpackData: { inventory: number[] } | null = null;

  constructor(
    public capacity: number = 3
  ) {
    super();
  }

  /**
   * Pick up an item. Returns false if hands are full.
   */
  pickUp(itemId: number, itemData?: any): boolean {
    if (this.holding !== null) {
      return false;
    }
    this.holding = itemId;
    this.holdingData = itemData ?? null;
    return true;
  }

  /**
   * Drop the currently held item. Returns the item ID or null.
   */
  drop(): { itemId: number | null; itemData: any } {
    const result = { itemId: this.holding, itemData: this.holdingData };
    this.holding = null;
    this.holdingData = null;
    return result;
  }

  /**
   * Set the currently held item directly (e.g., when weapon returns to hand).
   */
  setHolding(itemId: number | null, itemData?: any): void {
    this.holding = itemId;
    this.holdingData = itemData ?? null;
  }

  /**
   * Add item to container inventory. Returns false if full.
   */
  addToInventory(itemId: number): boolean {
    if (this.inventory.length >= this.capacity) {
      return false;
    }
    this.inventory.push(itemId);
    return true;
  }

  /**
   * Remove item from container inventory by index.
   */
  removeFromInventory(index: number): number | null {
    if (index < 0 || index >= this.inventory.length) {
      return null;
    }
    return this.inventory.splice(index, 1)[0];
  }

  /**
   * Check if inventory contains an item type.
   */
  hasItem(itemId: number): boolean {
    return this.inventory.includes(itemId);
  }

  /**
   * Find and remove first occurrence of item type.
   */
  consumeItem(itemId: number): boolean {
    const index = this.inventory.indexOf(itemId);
    if (index === -1) return false;
    this.inventory.splice(index, 1);
    return true;
  }

  /**
   * Equip a container as backpack.
   */
  equipBackpack(containerId: number, containerData?: { inventory: number[] }): boolean {
    if (this.backpack !== null) return false;
    this.backpack = containerId;
    this.backpackData = containerData ?? { inventory: [] };
    return true;
  }

  /**
   * Remove backpack. Returns the container.
   */
  unequipBackpack(): { containerId: number | null; containerData: any } {
    const result = { containerId: this.backpack, containerData: this.backpackData };
    this.backpack = null;
    this.backpackData = null;
    return result;
  }

  /**
   * Check if backpack contains an item type.
   */
  backpackHasItem(itemId: number): boolean {
    return this.backpackData?.inventory?.includes(itemId) ?? false;
  }

  /**
   * Consume item from backpack.
   */
  consumeFromBackpack(itemId: number): boolean {
    if (!this.backpackData?.inventory) return false;
    const index = this.backpackData.inventory.indexOf(itemId);
    if (index === -1) return false;
    this.backpackData.inventory.splice(index, 1);
    return true;
  }

  /**
   * Add item to backpack.
   */
  addToBackpack(itemId: number, capacity: number = 3): boolean {
    if (!this.backpackData) return false;
    if (this.backpackData.inventory.length >= capacity) return false;
    this.backpackData.inventory.push(itemId);
    return true;
  }
}

export default InventoryComponent;
