import { Entity } from '../../../shared/ecs/Entity.js';
import { PositionComponent } from '../../../shared/components/PositionComponent.js';
import { HealthComponent } from '../../../shared/components/HealthComponent.js';
import { HungerComponent } from '../../../shared/components/HungerComponent.js';
import { AgeComponent } from '../../../shared/components/AgeComponent.js';
import { IdentityComponent } from '../../../shared/components/IdentityComponent.js';
import { ExperienceComponent } from '../../../shared/components/ExperienceComponent.js';
import { InventoryComponent } from '../../../shared/components/InventoryComponent.js';
import { CONSTANTS } from '../../../shared/constants.js';
import world from '../world.js';
/**
 * PlayerManager - Manages player entities and their components.
 */
export class PlayerManager {
    players = new Map();
    // Track who is holding whom (holderId -> babyId)
    holdingBaby = new Map();
    // Track who is being held (babyId -> holderId)
    heldBy = new Map();
    /** Callback when a player dies */
    onPlayerDeath;
    /** Callback when a baby is picked up or put down */
    onBabyPickedUp;
    onBabyPutDown;
    constructor() { }
    /**
     * Create a new player entity with all components.
     * If born from a mother, baby is automatically held by mother.
     */
    createPlayer(socketId, motherId, config, forcedGender, forcedName) {
        const motherEntity = motherId ? this.players.get(motherId) : null;
        const isEve = !motherEntity;
        const startAge = isEve ? config.spawnEveAge : 0;
        let startX, startY;
        if (isEve) {
            const spawnPos = world.getRandomPassablePos();
            startX = spawnPos.x;
            startY = spawnPos.y;
        }
        else {
            const motherPos = motherEntity.getComponent(PositionComponent);
            startX = motherPos.x;
            startY = motherPos.y;
        }
        const motherIdentity = motherEntity?.getComponent(IdentityComponent);
        const motherName = motherIdentity?.name ?? 'The Great Mother (EVE)';
        const motherGeneration = motherIdentity?.generation ?? 0;
        // Determine gender: use forced gender if provided, otherwise Eves are always female, babies are random
        let gender;
        if (forcedGender) {
            gender = forcedGender;
        }
        else if (isEve) {
            gender = 'female'; // Eves are always female
        }
        else {
            gender = Math.random() < 0.5 ? 'male' : 'female';
        }
        // Determine name: use forced name if provided, otherwise use default naming
        const playerName = forcedName ?? (isEve ? `Eve ${socketId.substring(0, 4)}` : `Baby`);
        const entity = new Entity(socketId);
        const position = new PositionComponent(startX, startY);
        const health = new HealthComponent(100);
        const hunger = new HungerComponent(config.maxHunger);
        const age = new AgeComponent(startAge, config.maxAge);
        const identity = new IdentityComponent(playerName, motherId, motherName, gender, isEve ? 1 : motherGeneration + 1 // Generation
        );
        const experience = new ExperienceComponent(0);
        const inventory = new InventoryComponent(3);
        // For babies, scale down max hunger
        if (!isEve) {
            hunger.updateMaxHungerForAge(0, CONSTANTS.BABY_MAX_AGE);
        }
        entity.attachComponents(position, health, hunger, age, identity, experience, inventory);
        this.players.set(socketId, entity);
        // If baby has a mother, mother picks up the baby
        let motherUpdate;
        let droppedItem;
        if (motherEntity && motherId) {
            const motherInv = motherEntity.getComponent(InventoryComponent);
            const motherPos = motherEntity.getComponent(PositionComponent);
            if (motherInv && motherPos) {
                // Drop whatever mother is holding
                if (motherInv.holding !== null) {
                    droppedItem = {
                        x: Math.floor(motherPos.x / CONSTANTS.TILE_SIZE),
                        y: Math.floor(motherPos.y / CONSTANTS.TILE_SIZE),
                        type: motherInv.holding,
                        data: motherInv.holdingData
                    };
                    motherInv.drop();
                }
                // Mother now holds the baby (using BABY type with baby's ID as data)
                motherInv.holding = CONSTANTS.OBJECT_TYPES.BABY;
                motherInv.holdingData = { babyId: socketId };
                // Track the holding relationship
                this.holdingBaby.set(motherId, socketId);
                this.heldBy.set(socketId, motherId);
            }
            motherUpdate = this.getPlayerData(motherId) ?? undefined;
        }
        return {
            player: this.getPlayerData(socketId),
            motherUpdate,
            droppedItem
        };
    }
    /**
     * Remove a player entity.
     */
    removePlayer(socketId) {
        // If this player was holding a baby, put them down
        const heldBabyId = this.holdingBaby.get(socketId);
        if (heldBabyId) {
            this.heldBy.delete(heldBabyId);
            this.holdingBaby.delete(socketId);
        }
        // If this player was being held, release from holder
        const holderId = this.heldBy.get(socketId);
        if (holderId) {
            const holder = this.players.get(holderId);
            if (holder) {
                const holderInv = holder.getComponent(InventoryComponent);
                if (holderInv && holderInv.holdingData?.babyId === socketId) {
                    holderInv.holding = null;
                    holderInv.holdingData = null;
                }
            }
            this.holdingBaby.delete(holderId);
            this.heldBy.delete(socketId);
        }
        const entity = this.players.get(socketId);
        if (entity) {
            entity.deleteComponents();
            this.players.delete(socketId);
        }
    }
    /**
     * Get a player entity.
     */
    getPlayer(socketId) {
        return this.players.get(socketId);
    }
    /**
     * Update player's socket ID (for reconnection).
     */
    updatePlayerId(oldId, newId) {
        const oldEntity = this.players.get(oldId);
        if (!oldEntity)
            return false;
        // Create new entity with new ID but same components
        const newEntity = new Entity(newId);
        newEntity.components = oldEntity.components; // Transfer all components
        // Update in players map
        this.players.set(newId, newEntity);
        this.players.delete(oldId);
        // Update holding/held relationships
        if (this.holdingBaby.has(oldId)) {
            const babyId = this.holdingBaby.get(oldId);
            this.holdingBaby.set(newId, babyId);
            this.holdingBaby.delete(oldId);
            this.heldBy.set(babyId, newId);
        }
        if (this.heldBy.has(oldId)) {
            const holderId = this.heldBy.get(oldId);
            this.heldBy.set(newId, holderId);
            this.heldBy.delete(oldId);
            this.holdingBaby.set(holderId, newId);
        }
        return true;
    }
    /**
     * Get player data for network sync.
     */
    getPlayerData(socketId) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        const position = entity.getComponent(PositionComponent);
        const hunger = entity.getComponent(HungerComponent);
        const age = entity.getComponent(AgeComponent);
        const identity = entity.getComponent(IdentityComponent);
        const experience = entity.getComponent(ExperienceComponent);
        const inventory = entity.getComponent(InventoryComponent);
        if (!position || !hunger || !age || !identity || !experience || !inventory) {
            return null;
        }
        return {
            id: entity.id,
            x: position.x,
            y: position.y,
            age: age.age,
            hunger: hunger.currentHunger,
            maxHunger: hunger.maxHunger,
            holding: inventory.holding,
            holdingData: inventory.holdingData,
            backpack: inventory.backpack,
            backpackData: inventory.backpackData,
            name: identity.name,
            gender: identity.gender,
            motherId: identity.motherId,
            motherName: identity.motherName,
            generation: identity.generation,
            experience: experience.experience,
            isDead: false,
            heldBy: this.heldBy.get(entity.id) ?? null,
            holdingPlayerId: this.holdingBaby.get(entity.id) ?? null,
            inBoat: false, // Will be determined by caller with proper boat ID
        };
    }
    /**
     * Get all players data for network sync.
     */
    getAllPlayersData() {
        const result = {};
        for (const [id] of this.players) {
            const data = this.getPlayerData(id);
            if (data) {
                result[id] = data;
            }
        }
        return result;
    }
    /**
     * Move a player. Returns updated data for player and any held baby.
     * - If player is being held, cannot move independently
     * - If player is a baby (age < 3), moves slower (crawling)
     * - If player is holding a baby, baby moves with them
     * - Cannot move into water tiles
     */
    movePlayer(socketId, dx, dy, isPassable) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        // Check if this player is being held - cannot move independently
        if (this.heldBy.has(socketId)) {
            return null; // Baby being held cannot move on their own
        }
        const position = entity.getComponent(PositionComponent);
        const age = entity.getComponent(AgeComponent);
        if (!position || !age)
            return null;
        // Apply crawling speed for babies (age < 3) who are not being held
        let actualDx = dx;
        let actualDy = dy;
        if (age.age < CONSTANTS.BABY_MAX_AGE) {
            actualDx = Math.round(dx * CONSTANTS.BABY_CRAWL_SPEED);
            actualDy = Math.round(dy * CONSTANTS.BABY_CRAWL_SPEED);
        }
        // Calculate new position
        const newX = position.x + actualDx;
        const newY = position.y + actualDy;
        // Check if target tile is passable (not water)
        if (isPassable) {
            const tileX = Math.floor(newX / CONSTANTS.TILE_SIZE);
            const tileY = Math.floor(newY / CONSTANTS.TILE_SIZE);
            if (!isPassable(tileX, tileY)) {
                return null; // Cannot move into water
            }
        }
        position.move(actualDx, actualDy);
        // If this player is holding a baby, move the baby too
        let heldBaby;
        const heldBabyId = this.holdingBaby.get(socketId);
        if (heldBabyId) {
            const babyEntity = this.players.get(heldBabyId);
            if (babyEntity) {
                const babyPos = babyEntity.getComponent(PositionComponent);
                if (babyPos) {
                    babyPos.x = position.x;
                    babyPos.y = position.y;
                    heldBaby = this.getPlayerData(heldBabyId) ?? undefined;
                }
            }
        }
        return { player: this.getPlayerData(socketId), heldBaby };
    }
    /**
     * Move player to specific coordinates (for boat exit, spawning, etc.).
     */
    movePlayerTo(socketId, x, y) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        const position = entity.getComponent(PositionComponent);
        if (!position)
            return null;
        position.x = x;
        position.y = y;
        // If this player is holding a baby, move the baby too
        let heldBaby;
        const heldBabyId = this.holdingBaby.get(socketId);
        if (heldBabyId) {
            const babyEntity = this.players.get(heldBabyId);
            if (babyEntity) {
                const babyPos = babyEntity.getComponent(PositionComponent);
                if (babyPos) {
                    babyPos.x = x;
                    babyPos.y = y;
                    heldBaby = this.getPlayerData(heldBabyId) ?? undefined;
                }
            }
        }
        return { player: this.getPlayerData(socketId), heldBaby };
    }
    /**
     * Pick up a baby (must be age < 3 and on same tile).
     */
    pickUpBaby(holderId, babyId) {
        const holder = this.players.get(holderId);
        const baby = this.players.get(babyId);
        if (!holder || !baby)
            return false;
        const holderInv = holder.getComponent(InventoryComponent);
        const holderAge = holder.getComponent(AgeComponent);
        const babyAge = baby.getComponent(AgeComponent);
        // Holder must not be holding anything and must be old enough (age >= 3)
        if (!holderInv || holderInv.holding !== null)
            return false;
        if (!holderAge || holderAge.age < CONSTANTS.BABY_MAX_AGE)
            return false;
        // Baby must be young enough and not already held
        if (!babyAge || babyAge.age >= CONSTANTS.BABY_MAX_AGE)
            return false;
        if (this.heldBy.has(babyId))
            return false;
        // Check if they're on same tile
        const holderPos = holder.getComponent(PositionComponent);
        const babyPos = baby.getComponent(PositionComponent);
        if (!holderPos || !babyPos)
            return false;
        const holderTileX = Math.floor(holderPos.x / CONSTANTS.TILE_SIZE);
        const holderTileY = Math.floor(holderPos.y / CONSTANTS.TILE_SIZE);
        const babyTileX = Math.floor(babyPos.x / CONSTANTS.TILE_SIZE);
        const babyTileY = Math.floor(babyPos.y / CONSTANTS.TILE_SIZE);
        if (holderTileX !== babyTileX || holderTileY !== babyTileY)
            return false;
        // Pick up the baby
        holderInv.holding = CONSTANTS.OBJECT_TYPES.BABY;
        holderInv.holdingData = { babyId };
        this.holdingBaby.set(holderId, babyId);
        this.heldBy.set(babyId, holderId);
        // Snap baby position to holder
        babyPos.x = holderPos.x;
        babyPos.y = holderPos.y;
        this.onBabyPickedUp?.(holderId, babyId);
        return true;
    }
    /**
     * Put down a baby the player is holding.
     */
    putDownBaby(holderId) {
        const babyId = this.holdingBaby.get(holderId);
        if (!babyId)
            return null;
        const holder = this.players.get(holderId);
        if (!holder)
            return null;
        const holderInv = holder.getComponent(InventoryComponent);
        if (!holderInv)
            return null;
        // Clear the holding
        holderInv.holding = null;
        holderInv.holdingData = null;
        this.holdingBaby.delete(holderId);
        this.heldBy.delete(babyId);
        this.onBabyPutDown?.(holderId, babyId);
        return babyId;
    }
    /**
     * Check if a player is being held.
     */
    isBeingHeld(playerId) {
        return this.heldBy.has(playerId);
    }
    /**
     * Get the ID of who is holding this player.
     */
    getHolderId(playerId) {
        return this.heldBy.get(playerId) ?? null;
    }
    /**
     * Check if a player is holding a baby.
     */
    isHoldingBaby(playerId) {
        return this.holdingBaby.has(playerId);
    }
    /**
     * Get the baby ID this player is holding.
     */
    getHeldBabyId(playerId) {
        return this.holdingBaby.get(playerId) ?? null;
    }
    /**
     * Kill a player.
     */
    killPlayer(socketId, reason) {
        const data = this.getPlayerData(socketId);
        if (!data)
            return;
        data.isDead = true;
        if (this.onPlayerDeath) {
            this.onPlayerDeath(socketId, reason, data);
        }
        this.removePlayer(socketId);
    }
    /**
     * Feed a player - increases hunger by the specified amount.
     * Returns the new hunger value and max hunger, or null if player not found.
     */
    feedPlayer(socketId, amount) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        const hunger = entity.getComponent(HungerComponent);
        if (!hunger)
            return null;
        hunger.eat(amount);
        return { hunger: hunger.currentHunger, maxHunger: hunger.maxHunger };
    }
    /**
     * Update a player's held item.
     * Returns the updated holding data, or null if player not found.
     */
    updatePlayerHolding(socketId, holding, holdingData = null) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        const inventory = entity.getComponent(InventoryComponent);
        if (!inventory)
            return null;
        if (holding === null) {
            inventory.drop();
        }
        else {
            inventory.holding = holding;
            inventory.holdingData = holdingData;
        }
        return { holding: inventory.holding, holdingData: inventory.holdingData };
    }
    /**
     * Get a player's holding data for container modification.
     * Returns the inventory component's holdingData reference (mutable).
     */
    getPlayerHoldingData(socketId) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        const inventory = entity.getComponent(InventoryComponent);
        if (!inventory)
            return null;
        return { holding: inventory.holding, holdingData: inventory.holdingData };
    }
    /**
     * Equip a container as backpack.
     */
    equipBackpack(socketId, containerId, containerData) {
        const entity = this.players.get(socketId);
        if (!entity)
            return false;
        const inventory = entity.getComponent(InventoryComponent);
        if (!inventory)
            return false;
        return inventory.equipBackpack(containerId, containerData);
    }
    /**
     * Unequip backpack. Returns the container data.
     */
    unequipBackpack(socketId) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        const inventory = entity.getComponent(InventoryComponent);
        if (!inventory)
            return null;
        return inventory.unequipBackpack();
    }
    /**
     * Get player's backpack data.
     */
    getPlayerBackpackData(socketId) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        const inventory = entity.getComponent(InventoryComponent);
        if (!inventory)
            return null;
        return { backpack: inventory.backpack, backpackData: inventory.backpackData };
    }
    /**
     * Add item to player's backpack.
     */
    addToBackpack(socketId, itemId, capacity = 3) {
        const entity = this.players.get(socketId);
        if (!entity)
            return false;
        const inventory = entity.getComponent(InventoryComponent);
        if (!inventory)
            return false;
        return inventory.addToBackpack(itemId, capacity);
    }
    /**
     * Take item from player's backpack (removes last item).
     */
    takeFromBackpack(socketId) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        const inventory = entity.getComponent(InventoryComponent);
        if (!inventory || !inventory.backpackData?.inventory?.length)
            return null;
        // Remove and return the last item
        return inventory.backpackData.inventory.pop() ?? null;
    }
    /**
     * Rename a baby. Sets full name as "{firstName} of {motherFirstName}"
     * Returns updated player data or null if not found.
     */
    renameBaby(babyId, firstName) {
        const entity = this.players.get(babyId);
        if (!entity)
            return null;
        const identity = entity.getComponent(IdentityComponent);
        if (!identity)
            return null;
        // Get mother's first name
        const motherFirstName = identity.motherName.split(' of ')[0];
        identity.setFullName(firstName, motherFirstName);
        return this.getPlayerData(babyId);
    }
    /**
     * Get baby's gender
     */
    getPlayerGender(playerId) {
        const entity = this.players.get(playerId);
        if (!entity)
            return null;
        const identity = entity.getComponent(IdentityComponent);
        return identity?.gender ?? null;
    }
    /**
     * Get potential mothers (age 14-40).
     */
    getPotentialMothers() {
        const mothers = [];
        for (const [id, entity] of this.players) {
            const age = entity.getComponent(AgeComponent);
            if (age && age.canReproduce(14, 40)) {
                mothers.push(id);
            }
        }
        return mothers;
    }
    /**
     * Get player count.
     */
    getPlayerCount() {
        return this.players.size;
    }
    /**
     * Get all player IDs.
     */
    getPlayerIds() {
        return Array.from(this.players.keys());
    }
    /**
     * Toggle boat state for a player.
     * Returns new boat state, or null if invalid.
     * @param socketId - Player socket ID
     * @param hasBoat - Whether to enter (true) or exit (false) boat
     * @param boatItemId - The item ID of the boat from registry
     */
    toggleBoat(socketId, hasBoat, boatItemId) {
        const entity = this.players.get(socketId);
        if (!entity)
            return null;
        // Store boat state in inventory component's custom data
        const inventory = entity.getComponent(InventoryComponent);
        if (!inventory)
            return null;
        // If entering boat, player must have boat item
        if (hasBoat && inventory.holding !== boatItemId) {
            return null;
        }
        // Store boat state in holdingData
        if (hasBoat) {
            inventory.holdingData = { ...inventory.holdingData, inBoat: true };
            return true;
        }
        else {
            if (inventory.holdingData) {
                inventory.holdingData = { ...inventory.holdingData, inBoat: false };
            }
            return false;
        }
    }
    /**
     * Check if player is in boat.
     * @param socketId - Player socket ID
     * @param boatItemId - The item ID of the boat from registry
     */
    isInBoat(socketId, boatItemId) {
        const entity = this.players.get(socketId);
        if (!entity)
            return false;
        const inventory = entity.getComponent(InventoryComponent);
        if (!inventory)
            return false;
        return inventory.holding === boatItemId && inventory.holdingData?.inBoat === true;
    }
}
export default PlayerManager;
//# sourceMappingURL=PlayerManager.js.map