import { Component } from '../ecs/Component.js';
/**
 * InventoryComponent - Stores held items and container contents.
 * Used by players and container objects (baskets).
 */
export declare class InventoryComponent extends Component {
    capacity: number;
    holding: number | null;
    holdingData: any;
    inventory: number[];
    backpack: number | null;
    backpackData: {
        inventory: number[];
    } | null;
    constructor(capacity?: number);
    /**
     * Pick up an item. Returns false if hands are full.
     */
    pickUp(itemId: number, itemData?: any): boolean;
    /**
     * Drop the currently held item. Returns the item ID or null.
     */
    drop(): {
        itemId: number | null;
        itemData: any;
    };
    /**
     * Add item to container inventory. Returns false if full.
     */
    addToInventory(itemId: number): boolean;
    /**
     * Remove item from container inventory by index.
     */
    removeFromInventory(index: number): number | null;
    /**
     * Check if inventory contains an item type.
     */
    hasItem(itemId: number): boolean;
    /**
     * Find and remove first occurrence of item type.
     */
    consumeItem(itemId: number): boolean;
    /**
     * Equip a container as backpack.
     */
    equipBackpack(containerId: number, containerData?: {
        inventory: number[];
    }): boolean;
    /**
     * Remove backpack. Returns the container.
     */
    unequipBackpack(): {
        containerId: number | null;
        containerData: any;
    };
    /**
     * Check if backpack contains an item type.
     */
    backpackHasItem(itemId: number): boolean;
    /**
     * Consume item from backpack.
     */
    consumeFromBackpack(itemId: number): boolean;
    /**
     * Add item to backpack.
     */
    addToBackpack(itemId: number, capacity?: number): boolean;
}
export default InventoryComponent;
