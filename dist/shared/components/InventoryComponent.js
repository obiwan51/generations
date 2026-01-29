import { Component } from '../ecs/Component.js';
/**
 * InventoryComponent - Stores held items and container contents.
 * Used by players and container objects (baskets).
 */
export class InventoryComponent extends Component {
    capacity;
    holding = null;
    holdingData = null;
    inventory = [];
    // Backpack (worn container like basket)
    backpack = null;
    backpackData = null;
    constructor(capacity = 3) {
        super();
        this.capacity = capacity;
    }
    /**
     * Pick up an item. Returns false if hands are full.
     */
    pickUp(itemId, itemData) {
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
    drop() {
        const result = { itemId: this.holding, itemData: this.holdingData };
        this.holding = null;
        this.holdingData = null;
        return result;
    }
    /**
     * Add item to container inventory. Returns false if full.
     */
    addToInventory(itemId) {
        if (this.inventory.length >= this.capacity) {
            return false;
        }
        this.inventory.push(itemId);
        return true;
    }
    /**
     * Remove item from container inventory by index.
     */
    removeFromInventory(index) {
        if (index < 0 || index >= this.inventory.length) {
            return null;
        }
        return this.inventory.splice(index, 1)[0];
    }
    /**
     * Check if inventory contains an item type.
     */
    hasItem(itemId) {
        return this.inventory.includes(itemId);
    }
    /**
     * Find and remove first occurrence of item type.
     */
    consumeItem(itemId) {
        const index = this.inventory.indexOf(itemId);
        if (index === -1)
            return false;
        this.inventory.splice(index, 1);
        return true;
    }
    /**
     * Equip a container as backpack.
     */
    equipBackpack(containerId, containerData) {
        if (this.backpack !== null)
            return false;
        this.backpack = containerId;
        this.backpackData = containerData ?? { inventory: [] };
        return true;
    }
    /**
     * Remove backpack. Returns the container.
     */
    unequipBackpack() {
        const result = { containerId: this.backpack, containerData: this.backpackData };
        this.backpack = null;
        this.backpackData = null;
        return result;
    }
    /**
     * Check if backpack contains an item type.
     */
    backpackHasItem(itemId) {
        return this.backpackData?.inventory?.includes(itemId) ?? false;
    }
    /**
     * Consume item from backpack.
     */
    consumeFromBackpack(itemId) {
        if (!this.backpackData?.inventory)
            return false;
        const index = this.backpackData.inventory.indexOf(itemId);
        if (index === -1)
            return false;
        this.backpackData.inventory.splice(index, 1);
        return true;
    }
    /**
     * Add item to backpack.
     */
    addToBackpack(itemId, capacity = 3) {
        if (!this.backpackData)
            return false;
        if (this.backpackData.inventory.length >= capacity)
            return false;
        this.backpackData.inventory.push(itemId);
        return true;
    }
}
export default InventoryComponent;
//# sourceMappingURL=InventoryComponent.js.map