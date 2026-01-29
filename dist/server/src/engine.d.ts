import { Server } from "socket.io";
import { Animal, Resource, Item, RuntimeRecipe } from "../../shared/types.js";
import { PlayerData } from "./managers/PlayerManager.js";
import { GameStatistics } from "./managers/StatisticsManager.js";
/**
 * GameEngine - Orchestrates ECS systems and handles game state.
 */
declare class GameEngine {
    io: Server;
    private hungerSystem;
    private agingSystem;
    private decaySystem;
    private seasonSystem;
    private projectileSystem;
    private animalSystem;
    private growthSystem;
    private playerManager;
    private statisticsManager;
    animalRegistry: Record<number, Animal>;
    resourceRegistry: Record<number, Resource>;
    itemRegistry: Record<number, Item>;
    recipes: RuntimeRecipe[];
    private playerComponents;
    constructor(io: Server);
    private setupCallbacks;
    private setupPlayerCallbacks;
    private setupHungerCallbacks;
    private setupSeasonCallbacks;
    private setupDecayCallbacks;
    private setupProjectileCallbacks;
    private setupAnimalCallbacks;
    private setupGrowthCallbacks;
    private handleProjectileHit;
    reloadRegistry(): void;
    /**
     * Scan world objects and create animal entities for them.
     */
    initializeAnimals(): void;
    /**
     * Get an entity definition by ID - checks resources, items, and animals.
     */
    getEntityById(id: number): Resource | Item | Animal | undefined;
    /**
     * Get an item or resource definition by ID (for objects that can be held/used).
     */
    getObjectDef(id: number): Resource | Item | undefined;
    /**
     * Register a planted crop with the growth system.
     */
    registerPlantedCrop(x: number, y: number, objectType: number): void;
    /**
     * Unregister a planted crop from the growth system.
     * Call this when a crop is picked up or destroyed.
     */
    unregisterPlantedCrop(x: number, y: number): void;
    get players(): Record<string, PlayerData>;
    get currentSeason(): string;
    /**
     * Move a player and return updated data.
     * Returns both the player and any held baby that moved with them.
     */
    movePlayer(socketId: string, dx: number, dy: number): {
        player: PlayerData;
        heldBaby?: PlayerData;
    } | null;
    /**
     * Move player to specific world coordinates (for boat exit, spawning, etc.).
     */
    movePlayerTo(socketId: string, x: number, y: number): {
        player: PlayerData;
        heldBaby?: PlayerData;
    } | null;
    /**
     * Toggle boat state for a player.
     */
    toggleBoat(socketId: string, hasBoat: boolean, boatItemId: number): boolean | null;
    /**
     * Feed a player - increases hunger by the specified amount.
     */
    feedPlayer(socketId: string, amount: number): {
        hunger: number;
        maxHunger: number;
    } | null;
    /**
     * Update a player's held item.
     */
    updatePlayerHolding(socketId: string, holding: number | null, holdingData?: any): {
        holding: number | null;
        holdingData: any;
    } | null;
    /**
     * Get a player's holding data for container modification.
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
     * Add a new player. Returns player data and any updates needed (mother holding baby, dropped items).
     */
    addPlayer(socketId: string, motherId: string | null, forcedGender?: 'male' | 'female', forcedName?: string): {
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
     * Pick up a baby player.
     */
    pickUpBaby(holderId: string, babyId: string): boolean;
    /**
     * Attempt to pick up an animal at the player's location.
     */
    pickUpAnimal(playerId: string): boolean;
    /**
     * Put down a baby being held.
     */
    putDownBaby(holderId: string): string | null;
    /**
     * Check if a player is being held.
     */
    isPlayerBeingHeld(playerId: string): boolean;
    /**
     * Check if a player is holding a baby.
     */
    isPlayerHoldingBaby(playerId: string): boolean;
    /**
     * Rename a baby player.
     */
    renameBaby(babyId: string, firstName: string): PlayerData | null;
    /**
     * Get a player's gender.
     */
    getPlayerGender(playerId: string): 'male' | 'female' | null;
    removePlayer(socketId: string): void;
    /**
     * Update player's socket ID (for reconnection).
     */
    updatePlayerId(oldId: string, newId: string): boolean;
    update(): void;
    updateProjectiles(): void;
    private syncPlayerStats;
    private cleanupSystems;
    killPlayer(id: string, reason: string): void;
    handleShoot(socketId: string, angle: number): void;
    /**
     * Get game statistics for admin dashboard.
     */
    getStatistics(): GameStatistics & {
        uptime: string;
    };
    /**
     * Reinitialize the world - regenerates terrain and objects.
     */
    reinitializeWorld(): void;
    /**
     * Clear all objects from the world but keep terrain map methods.
     */
    clearWorldObjects(): void;
    /**
     * Get current module states for admin.
     */
    getModuleStates(): Record<string, boolean>;
    /**
     * Set a module state.
     */
    setModuleState(module: string, enabled: boolean): boolean;
}
export default GameEngine;
