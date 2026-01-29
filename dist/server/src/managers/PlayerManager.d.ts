import { Entity } from '../../../shared/ecs/Entity.js';
import { Gender } from '../../../shared/components/IdentityComponent.js';
export interface PlayerData {
    id: string;
    x: number;
    y: number;
    age: number;
    hunger: number;
    maxHunger: number;
    holding: number | null;
    holdingData: any;
    backpack: number | null;
    backpackData: {
        inventory: number[];
    } | null;
    name: string;
    gender: Gender;
    motherId: string | null;
    motherName: string;
    experience: number;
    isDead: boolean;
    heldBy: string | null;
    holdingPlayerId: string | null;
    generation: number;
    inBoat: boolean;
    lastMsg?: string;
    lastMsgTime?: number;
}
/**
 * PlayerManager - Manages player entities and their components.
 */
export declare class PlayerManager {
    private players;
    private holdingBaby;
    private heldBy;
    /** Callback when a player dies */
    onPlayerDeath?: (playerId: string, reason: string, stats: PlayerData) => void;
    /** Callback when a baby is picked up or put down */
    onBabyPickedUp?: (holderId: string, babyId: string) => void;
    onBabyPutDown?: (holderId: string, babyId: string) => void;
    constructor();
    /**
     * Create a new player entity with all components.
     * If born from a mother, baby is automatically held by mother.
     */
    createPlayer(socketId: string, motherId: string | null, config: {
        maxHunger: number;
        spawnEveAge: number;
        maxAge: number;
    }, forcedGender?: 'male' | 'female', forcedName?: string): {
        player: PlayerData;
        motherUpdate?: PlayerData;
        droppedItem?: {
            x: number;
            y: number;
            type: number;
            data: any;
        };
    };
    /**
     * Remove a player entity.
     */
    removePlayer(socketId: string): void;
    /**
     * Get a player entity.
     */
    getPlayer(socketId: string): Entity | undefined;
    /**
     * Update player's socket ID (for reconnection).
     */
    updatePlayerId(oldId: string, newId: string): boolean;
    /**
     * Get player data for network sync.
     */
    getPlayerData(socketId: string): PlayerData | null;
    /**
     * Get all players data for network sync.
     */
    getAllPlayersData(): Record<string, PlayerData>;
    /**
     * Move a player. Returns updated data for player and any held baby.
     * - If player is being held, cannot move independently
     * - If player is a baby (age < 3), moves slower (crawling)
     * - If player is holding a baby, baby moves with them
     * - Cannot move into water tiles
     */
    movePlayer(socketId: string, dx: number, dy: number, isPassable?: (x: number, y: number) => boolean): {
        player: PlayerData;
        heldBaby?: PlayerData;
    } | null;
    /**
     * Move player to specific coordinates (for boat exit, spawning, etc.).
     */
    movePlayerTo(socketId: string, x: number, y: number): {
        player: PlayerData;
        heldBaby?: PlayerData;
    } | null;
    /**
     * Pick up a baby (must be age < 3 and on same tile).
     */
    pickUpBaby(holderId: string, babyId: string): boolean;
    /**
     * Put down a baby the player is holding.
     */
    putDownBaby(holderId: string): string | null;
    /**
     * Check if a player is being held.
     */
    isBeingHeld(playerId: string): boolean;
    /**
     * Get the ID of who is holding this player.
     */
    getHolderId(playerId: string): string | null;
    /**
     * Check if a player is holding a baby.
     */
    isHoldingBaby(playerId: string): boolean;
    /**
     * Get the baby ID this player is holding.
     */
    getHeldBabyId(playerId: string): string | null;
    /**
     * Kill a player.
     */
    killPlayer(socketId: string, reason: string): void;
    /**
     * Feed a player - increases hunger by the specified amount.
     * Returns the new hunger value and max hunger, or null if player not found.
     */
    feedPlayer(socketId: string, amount: number): {
        hunger: number;
        maxHunger: number;
    } | null;
    /**
     * Update a player's held item.
     * Returns the updated holding data, or null if player not found.
     */
    updatePlayerHolding(socketId: string, holding: number | null, holdingData?: any): {
        holding: number | null;
        holdingData: any;
    } | null;
    /**
     * Get a player's holding data for container modification.
     * Returns the inventory component's holdingData reference (mutable).
     */
    getPlayerHoldingData(socketId: string): {
        holding: number | null;
        holdingData: any;
    } | null;
    /**
     * Equip a container as backpack.
     */
    equipBackpack(socketId: string, containerId: number, containerData?: {
        inventory: number[];
    }): boolean;
    /**
     * Unequip backpack. Returns the container data.
     */
    unequipBackpack(socketId: string): {
        containerId: number | null;
        containerData: any;
    } | null;
    /**
     * Get player's backpack data.
     */
    getPlayerBackpackData(socketId: string): {
        backpack: number | null;
        backpackData: any;
    } | null;
    /**
     * Add item to player's backpack.
     */
    addToBackpack(socketId: string, itemId: number, capacity?: number): boolean;
    /**
     * Take item from player's backpack (removes last item).
     */
    takeFromBackpack(socketId: string): number | null;
    /**
     * Rename a baby. Sets full name as "{firstName} of {motherFirstName}"
     * Returns updated player data or null if not found.
     */
    renameBaby(babyId: string, firstName: string): PlayerData | null;
    /**
     * Get baby's gender
     */
    getPlayerGender(playerId: string): 'male' | 'female' | null;
    /**
     * Get potential mothers (age 14-40).
     */
    getPotentialMothers(): string[];
    /**
     * Get player count.
     */
    getPlayerCount(): number;
    /**
     * Get all player IDs.
     */
    getPlayerIds(): string[];
    /**
     * Toggle boat state for a player.
     * Returns new boat state, or null if invalid.
     * @param socketId - Player socket ID
     * @param hasBoat - Whether to enter (true) or exit (false) boat
     * @param boatItemId - The item ID of the boat from registry
     */
    toggleBoat(socketId: string, hasBoat: boolean, boatItemId: number): boolean | null;
    /**
     * Check if player is in boat.
     * @param socketId - Player socket ID
     * @param boatItemId - The item ID of the boat from registry
     */
    isInBoat(socketId: string, boatItemId: number): boolean;
}
export default PlayerManager;
