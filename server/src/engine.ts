import world from "./world.js";
import config from "./config.js";
import registry from "./registry.js";
import { CONSTANTS } from "../../shared/constants.js";
import { Server } from "socket.io";
import { Animal, Resource, Item, Recipe, RuntimeRecipe } from "../../shared/types.js";

// ECS Systems
import { HungerSystem } from "./systems/HungerSystem.js";
import { AgingSystem } from "./systems/AgingSystem.js";
import { DecaySystem } from "./systems/DecaySystem.js";
import { SeasonSystem } from "./systems/SeasonSystem.js";
import { ProjectileSystem } from "./systems/ProjectileSystem.js";
import { AnimalAISystem } from "./systems/AnimalAISystem.js";
import { GrowthSystem } from "./systems/GrowthSystem.js";

// Managers
import { PlayerManager, PlayerData } from "./managers/PlayerManager.js";
import { StatisticsManager, GameStatistics } from "./managers/StatisticsManager.js";

// Components
import { ProjectileComponent } from "../../shared/components/ProjectileComponent.js";
import { ExperienceComponent } from "../../shared/components/ExperienceComponent.js";
import { InventoryComponent } from "../../shared/components/InventoryComponent.js";
import { HungerComponent } from "../../shared/components/HungerComponent.js";
import { AgeComponent } from "../../shared/components/AgeComponent.js";

/**
 * GameEngine - Orchestrates ECS systems and handles game state.
 */
class GameEngine {
  public io: Server;

  // Systems
  private hungerSystem: HungerSystem;
  private agingSystem: AgingSystem;
  private decaySystem: DecaySystem;
  private seasonSystem: SeasonSystem;
  private projectileSystem: ProjectileSystem;
  private animalSystem: AnimalAISystem;
  private growthSystem: GrowthSystem;

  // Manager
  private playerManager: PlayerManager;
  private statisticsManager: StatisticsManager;

  // Registry caches
  public animalRegistry: Record<number, Animal> = {};
  public resourceRegistry: Record<number, Resource> = {};
  public itemRegistry: Record<number, Item> = {};
  public recipes: RuntimeRecipe[] = [];

  // Component-to-player mappings
  private playerComponents: Map<string, { hunger: HungerComponent; age: AgeComponent }> = new Map();

  constructor(io: Server) {
    this.io = io;

    // Initialize systems
    this.hungerSystem = new HungerSystem(config.get("hungerSpeed"));
    this.agingSystem = new AgingSystem(config.get("agingSpeed"));
    this.decaySystem = new DecaySystem(60);
    this.seasonSystem = new SeasonSystem();
    this.projectileSystem = new ProjectileSystem();
    this.animalSystem = new AnimalAISystem(5);
    this.growthSystem = new GrowthSystem(60);

    // Initialize manager
    this.playerManager = new PlayerManager();
    this.statisticsManager = new StatisticsManager();

    // Initialize world season
    this.seasonSystem.createComponent();

    // Setup callbacks
    this.setupCallbacks();

    // Load registries
    this.reloadRegistry();
  }

  private setupCallbacks(): void {
    this.setupPlayerCallbacks();
    this.setupHungerCallbacks();
    this.setupSeasonCallbacks();
    this.setupDecayCallbacks();
    this.setupProjectileCallbacks();
    this.setupAnimalCallbacks();
    this.setupGrowthCallbacks();
  }

  private setupPlayerCallbacks(): void {
    this.playerManager.onPlayerDeath = (playerId, reason, stats) => {
      // Track death statistics
      const gender = this.playerManager.getPlayerGender(playerId) || 'male';
      this.statisticsManager.playerDied(reason, stats.age, gender);
      
      this.io.to(playerId).emit("deathScreen", {
        name: stats.name,
        age: stats.age,
        cause: reason,
        mother: stats.motherName,
        experience: stats.experience,
      });
      this.io.emit("playerDied", { id: playerId, reason });
      this.playerComponents.delete(playerId);
    };
  }

  private setupHungerCallbacks(): void {
    // Provide age lookup for baby hunger rate
    this.hungerSystem.getPlayerAge = (componentId: string) => {
      // The component ID is the same as the HungerComponent's ID
      // We need to find which player has this hunger component
      for (const [playerId, comps] of this.playerComponents) {
        if (comps.hunger.id === componentId) {
          return comps.age.age;
        }
      }
      return null;
    };
  }

  private setupSeasonCallbacks(): void {
    this.seasonSystem.onSeasonChange = (newSeason) => {
      this.statisticsManager.setSeason(newSeason);
      this.io.emit("seasonChange", newSeason);
    };
  }

  private setupDecayCallbacks(): void {
    this.decaySystem.onDecayTransition = (transition) => {
      if (transition.toType === null) {
        world.removeObject(transition.x, transition.y);
      } else {
        world.setObject(transition.x, transition.y, transition.toType, { decay: 0 });
      }
      this.io.emit("worldUpdate", {
        x: transition.x,
        y: transition.y,
        type: transition.toType,
      });
    };
  }

  private setupProjectileCallbacks(): void {
    this.projectileSystem.getObjectAt = (x, y) => world.getObject(x, y);
    this.projectileSystem.isTileEmpty = (x, y) => !world.getObject(x, y);

    this.projectileSystem.onHit = (hit) => {
      this.handleProjectileHit(hit);
    };

    this.projectileSystem.onLand = (landed) => {
      world.setObject(landed.tileX, landed.tileY, landed.projectileType);
      this.io.emit("worldUpdate", {
        x: landed.tileX,
        y: landed.tileY,
        type: landed.projectileType,
      });
    };
  }

  private setupAnimalCallbacks(): void {
    this.animalSystem.isTileEmpty = (x, y) => !world.getObject(x, y) && world.isPassable(x, y);

    this.animalSystem.getPlayersInRange = (x, y, range) => {
      const result: string[] = [];
      for (const playerId of this.playerManager.getPlayerIds()) {
        const data = this.playerManager.getPlayerData(playerId);
        if (!data) continue;
        const dist = Math.sqrt(
          Math.pow(x - data.x / CONSTANTS.TILE_SIZE, 2) +
          Math.pow(y - data.y / CONSTANTS.TILE_SIZE, 2)
        );
        if (dist < range) result.push(playerId);
      }
      return result;
    };

    this.animalSystem.onAnimalMove = (move) => {
      world.removeObject(move.fromX, move.fromY);
      world.setObject(move.toX, move.toY, move.type, move.data);
      this.io.emit("worldUpdate", { x: move.fromX, y: move.fromY, type: null });
      this.io.emit("worldUpdate", { x: move.toX, y: move.toY, type: move.type, data: move.data });
    };

    this.animalSystem.onAnimalAttack = (attack) => {
      const comps = this.playerComponents.get(attack.playerId);
      if (comps) {
        comps.hunger.decreaseHunger(attack.damage);
      }
      this.io.to(attack.playerId).emit("textMessage", {
        text: `Attacked by a ${attack.animalName}!`,
      });
    };
  }

  private setupGrowthCallbacks(): void {
    this.growthSystem.onGrowthComplete = (transition) => {
      world.setObject(transition.x, transition.y, transition.toType);
      this.io.emit("worldUpdate", {
        x: transition.x,
        y: transition.y,
        type: transition.toType,
      });
    };
  }

  private handleProjectileHit(hit: any): void {
    const animalDef = this.animalRegistry[hit.targetType];
    if (!animalDef) return;

    let data = world.objectsData[`${hit.tileX},${hit.tileY}`] || {};
    if (data.hp === undefined) data.hp = animalDef.hp;

    const projComp = hit.projectile.getComponent(ProjectileComponent);
    const dmg = projComp?.damage ?? 5;
    data.hp -= dmg;

    if (data.hp <= 0) {
      const recipe = this.recipes.find(
        (r) => r.tool === projComp?.type && r.target === hit.targetType
      );
      if (recipe) {
        world.setObject(hit.tileX, hit.tileY, recipe.result);
        this.io.emit("worldUpdate", { x: hit.tileX, y: hit.tileY, type: recipe.result });

        if (projComp?.ownerId) {
          const player = this.playerManager.getPlayer(projComp.ownerId);
          player?.getComponent(ExperienceComponent)?.addExperience(config.get("xpPerHunt"));
        }
      }
    } else {
      world.objectsData[`${hit.tileX},${hit.tileY}`] = data;
      this.io.emit("worldUpdate", { x: hit.tileX, y: hit.tileY, type: hit.targetType, data });
    }
  }

  reloadRegistry(): void {
    const animals = registry.get("animals") as Record<string, Animal>;
    const resources = registry.get("resources") as Record<string, Resource>;
    const items = registry.get("items") as Record<string, Item>;

    this.animalRegistry = {};
    for (const key in animals) this.animalRegistry[animals[key].id] = animals[key];

    this.resourceRegistry = {};
    for (const key in resources) this.resourceRegistry[resources[key].id] = resources[key];

    this.itemRegistry = {};
    for (const key in items) this.itemRegistry[items[key].id] = items[key];

    const getId = (key: any): number | null => {
      if (typeof key === "number") return key;
      // Use registry lookup instead of CONSTANTS
      const registryId = registry.getId(key);
      if (registryId !== null) return registryId;
      // Fallback to direct lookup
      if (animals[key]) return animals[key].id;
      if (resources[key]) return resources[key].id;
      if (items[key]) return items[key].id;
      return null;
    };

    this.recipes = (registry.get("recipes") as Recipe[]).map((r): RuntimeRecipe => ({
      id: r.id,
      name: r.name,
      description: r.description,
      tool: r.tool === null ? null : getId(r.tool)!,
      target: getId(r.target)!,
      result: getId(r.result)!,
      targetBecomesType: r.targetBecomesType ? getId(r.targetBecomesType)! : undefined,
      targetPersists: r.targetPersists,
    }));
  }

  /**
   * Get an entity definition by ID - checks resources, items, and animals.
   */
  getEntityById(id: number): Resource | Item | Animal | undefined {
    return this.resourceRegistry[id] || this.itemRegistry[id] || this.animalRegistry[id];
  }

  /**
   * Get an item or resource definition by ID (for objects that can be held/used).
   */
  getObjectDef(id: number): Resource | Item | undefined {
    return this.resourceRegistry[id] || this.itemRegistry[id];
  }

  /**
   * Register a planted crop with the growth system.
   */
  registerPlantedCrop(x: number, y: number, objectType: number): void {
    const itemDef = this.itemRegistry[objectType];
    if (itemDef && 'growsInto' in itemDef && 'growthTicks' in itemDef) {
      this.growthSystem.createComponent(
        x,
        y,
        objectType,
        itemDef.growsInto as string,
        (itemDef.growthTicks as number) || 3
      );
    }
  }

  // Public API
  get players(): Record<string, PlayerData> {
    return this.playerManager.getAllPlayersData();
  }

  get currentSeason(): string {
    return this.seasonSystem.getCurrentSeason();
  }

  /**
   * Move a player and return updated data.
   * Returns both the player and any held baby that moved with them.
   */
  movePlayer(socketId: string, dx: number, dy: number): { player: PlayerData; heldBaby?: PlayerData } | null {
    // Allow water tiles if player is in boat
    const BOAT = registry.getId('BOAT') ?? 0;
    const inBoat = this.playerManager.isInBoat(socketId, BOAT);
    return this.playerManager.movePlayer(socketId, dx, dy, (x, y) => {
      return inBoat ? true : world.isPassable(x, y);
    });
  }

  /**
   * Move player to specific world coordinates (for boat exit, spawning, etc.).
   */
  movePlayerTo(socketId: string, x: number, y: number): { player: PlayerData; heldBaby?: PlayerData } | null {
    return this.playerManager.movePlayerTo(socketId, x, y);
  }

  /**
   * Toggle boat state for a player.
   */
  toggleBoat(socketId: string, hasBoat: boolean, boatItemId: number): boolean | null {
    return this.playerManager.toggleBoat(socketId, hasBoat, boatItemId);
  }

  /**
   * Feed a player - increases hunger by the specified amount.
   */
  feedPlayer(socketId: string, amount: number): { hunger: number; maxHunger: number } | null {
    return this.playerManager.feedPlayer(socketId, amount);
  }

  /**
   * Update a player's held item.
   */
  updatePlayerHolding(socketId: string, holding: number | null, holdingData: any = null): { holding: number | null; holdingData: any } | null {
    return this.playerManager.updatePlayerHolding(socketId, holding, holdingData);
  }

  /**
   * Get a player's holding data for container modification.
   */
  getPlayerHoldingData(socketId: string): { holding: number | null; holdingData: any } | null {
    return this.playerManager.getPlayerHoldingData(socketId);
  }

  /**
   * Equip a container as backpack.
   */
  equipBackpack(socketId: string, containerId: number, containerData?: { inventory: number[] }): boolean {
    return this.playerManager.equipBackpack(socketId, containerId, containerData);
  }

  /**
   * Unequip backpack. Returns the container data.
   */
  unequipBackpack(socketId: string): { containerId: number | null; containerData: any } | null {
    return this.playerManager.unequipBackpack(socketId);
  }

  /**
   * Get player's backpack data.
   */
  getPlayerBackpackData(socketId: string): { backpack: number | null; backpackData: any } | null {
    return this.playerManager.getPlayerBackpackData(socketId);
  }

  /**
   * Add item to player's backpack.
   */
  addToBackpack(socketId: string, itemId: number, capacity: number = 3): boolean {
    return this.playerManager.addToBackpack(socketId, itemId, capacity);
  }

  /**
   * Take item from player's backpack (removes last item).
   */
  takeFromBackpack(socketId: string): number | null {
    return this.playerManager.takeFromBackpack(socketId);
  }

  /**
   * Add a new player. Returns player data and any updates needed (mother holding baby, dropped items).
   */
  addPlayer(socketId: string, motherId: string | null, forcedGender?: 'male' | 'female', forcedName?: string): { 
    player: PlayerData; 
    motherUpdate?: PlayerData; 
    droppedItem?: { x: number; y: number; type: number; data: any } 
  } {
    const result = this.playerManager.createPlayer(socketId, motherId, {
      maxHunger: config.get("maxHunger"),
      spawnEveAge: config.get("spawnEveAge"),
      maxAge: config.get("maxAge"),
    }, forcedGender, forcedName);

    // Track player statistics
    const isEve = !motherId;
    const gender = this.playerManager.getPlayerGender(socketId) || 'male';
    this.statisticsManager.playerJoined(isEve, gender);
    
    // Track generation for babies
    if (motherId) {
      const motherData = this.playerManager.getPlayerData(motherId);
      if (motherData && motherData.generation) {
        const babyGeneration = motherData.generation + 1;
        this.statisticsManager.updateGeneration(babyGeneration);
      }
    }

    // Get the components from the PlayerManager's entity
    const player = this.playerManager.getPlayer(socketId);
    if (player) {
      const hunger = player.getComponent(HungerComponent);
      const age = player.getComponent(AgeComponent);
      if (hunger && age) {
        // Register these components with the systems
        this.hungerSystem.registerComponent(hunger);
        this.agingSystem.registerComponent(age);
        this.playerComponents.set(socketId, { hunger, age });
      }
    }

    return result;
  }

  /**
   * Pick up a baby player.
   */
  pickUpBaby(holderId: string, babyId: string): boolean {
    return this.playerManager.pickUpBaby(holderId, babyId);
  }

  /**
   * Put down a baby being held.
   */
  putDownBaby(holderId: string): string | null {
    return this.playerManager.putDownBaby(holderId);
  }

  /**
   * Check if a player is being held.
   */
  isPlayerBeingHeld(playerId: string): boolean {
    return this.playerManager.isBeingHeld(playerId);
  }

  /**
   * Check if a player is holding a baby.
   */
  isPlayerHoldingBaby(playerId: string): boolean {
    return this.playerManager.isHoldingBaby(playerId);
  }

  /**
   * Rename a baby player.
   */
  renameBaby(babyId: string, firstName: string): PlayerData | null {
    return this.playerManager.renameBaby(babyId, firstName);
  }

  /**
   * Get a player's gender.
   */
  getPlayerGender(playerId: string): 'male' | 'female' | null {
    return this.playerManager.getPlayerGender(playerId);
  }

  removePlayer(socketId: string): void {
    const playerData = this.playerManager.getPlayerData(socketId);
    if (playerData) {
      // Spawn bones at player position
      const tx = Math.floor(playerData.x / CONSTANTS.TILE_SIZE);
      const ty = Math.floor(playerData.y / CONSTANTS.TILE_SIZE);
      
      // Only spawn if tile is effectively empty (it's okay to overwrite grass or other small things?)
      // For simplicity, we just place it if there's nothing major there.
      const existing = world.getObject(tx, ty);
      const def = existing ? this.getEntityById(existing) : null;
      const isLarge = def && 'isLarge' in def && def.isLarge;

      if (!isLarge) {
        const bonesType = registry.getId('BONES');
        if (bonesType) {
          const bonesData = {
            name: playerData.name || "Unknown Soul",
            age: Math.floor(playerData.age),
            diedAt: Date.now(),
            cause: playerData.isDead ? "Starvation / Old Age" : "Left the world"
          };
          
          world.setObject(tx, ty, bonesType, bonesData);
          this.io.emit('worldUpdate', { 
            x: tx, 
            y: ty, 
            type: bonesType, 
            data: bonesData 
          });
        }
      }
    }

    const comps = this.playerComponents.get(socketId);
    if (comps) {
      // Mark components as deleted so systems stop updating them
      comps.hunger.delete();
      comps.age.delete();
      this.playerComponents.delete(socketId);
    }
    this.playerManager.removePlayer(socketId);
  }

  /**
   * Update player's socket ID (for reconnection).
   */
  updatePlayerId(oldId: string, newId: string): boolean {
    const success = this.playerManager.updatePlayerId(oldId, newId);
    if (success) {
      // Update component mappings
      const comps = this.playerComponents.get(oldId);
      if (comps) {
        this.playerComponents.set(newId, comps);
        this.playerComponents.delete(oldId);
      }
    }
    return success;
  }

  update(): void {
    this.hungerSystem.update(1);
    this.agingSystem.update(1);

    if (this.agingSystem.isAgingTick()) {
      this.seasonSystem.advanceTime(60000);
    }

    this.animalSystem.movementEnabled = config.get("animalMovement");
    this.animalSystem.aggressionEnabled = config.get("carnivoreAggression");
    this.animalSystem.update(1);

    this.decaySystem.update(1);
    this.growthSystem.update(1);
    this.syncPlayerStats();
    this.cleanupSystems();
  }

  updateProjectiles(): void {
    this.projectileSystem.update(0.05);
    this.projectileSystem.deleteStaleComponents();

    const projectiles = this.projectileSystem.getProjectilesForSync();
    if (projectiles.length > 0) {
      this.io.emit("projectileUpdate", projectiles);
    }
  }

  private syncPlayerStats(): void {
    for (const [playerId, comps] of this.playerComponents) {
      if (comps.hunger.isStarving()) {
        this.killPlayer(playerId, "Starvation");
        continue;
      }
      if (comps.age.isDead()) {
        this.killPlayer(playerId, "Old Age");
        continue;
      }

      // Update max hunger based on age (babies have smaller stomachs)
      comps.hunger.updateMaxHungerForAge(comps.age.age, CONSTANTS.BABY_MAX_AGE);

      const data = this.playerManager.getPlayerData(playerId);
      if (data) {
        this.io.emit("playerStatUpdate", {
          id: playerId,
          age: comps.age.age,
          hunger: comps.hunger.currentHunger,
          maxHunger: comps.hunger.maxHunger,
          experience: data.experience,
          heldBy: data.heldBy,
          holdingPlayerId: data.holdingPlayerId,
        });
      }
    }
  }

  private cleanupSystems(): void {
    this.hungerSystem.deleteStaleComponents();
    this.agingSystem.deleteStaleComponents();
    this.decaySystem.deleteStaleComponents();
    this.animalSystem.deleteStaleComponents();
  }

  killPlayer(id: string, reason: string): void {
    this.playerManager.killPlayer(id, reason);
  }

  handleShoot(socketId: string, angle: number): void {
    const data = this.playerManager.getPlayerData(socketId);
    if (!data || data.isDead || !data.holding) return;

    // Weapons are in items registry
    const weaponDef = this.itemRegistry[data.holding];
    if (!weaponDef?.isWeapon) return;

    const projType = data.holding; // The weapon itself becomes projectile for throw

    if (weaponDef.weaponType === "ranged") {
      const player = this.playerManager.getPlayer(socketId);
      const inv = player?.getComponent(InventoryComponent);
      // Get the ammo type ID from registry by key (e.g., "ARROW")
      const ammoTypeId = weaponDef.ammoType ? registry.getId(weaponDef.ammoType) : null;
      if (!ammoTypeId) {
        this.io.to(socketId).emit("textMessage", { text: "No ammo type defined!" });
        return;
      }
      
      // Try to consume from backpack first, then inventory
      let ammoConsumed = false;
      if (inv?.consumeFromBackpack(ammoTypeId)) {
        ammoConsumed = true;
        // Send backpack update
        this.io.emit("playerStatUpdate", { 
          id: socketId, 
          backpack: inv.backpack, 
          backpackData: inv.backpackData 
        });
      } else if (inv?.consumeItem(ammoTypeId)) {
        ammoConsumed = true;
      }
      
      if (!ammoConsumed) {
        this.io.to(socketId).emit("textMessage", { text: "No ammo!" });
        return;
      }
    } else {
      const player = this.playerManager.getPlayer(socketId);
      player?.getComponent(InventoryComponent)?.drop();
      this.io.emit("playerStatUpdate", { id: socketId, holding: null, holdingData: null });
    }

    const comps = this.playerComponents.get(socketId);
    const age = comps?.age.age ?? 30;
    const exp = data.experience;

    const ageFactor = Math.max(0.2, 1 - Math.abs(age - 30) / 30);
    const expFactor = 1 + exp / 500;
    const maxDist = (weaponDef.weaponMaxDist || 200) * ageFactor * expFactor;
    const accuracy = (0.2 * (1 - ageFactor)) / expFactor;
    const finalAngle = angle + (Math.random() - 0.5) * accuracy;

    this.projectileSystem.createProjectile(
      socketId, data.x, data.y, finalAngle, projType, maxDist, weaponDef.weaponDamage || 5
    );
  }

  /**
   * Get game statistics for admin dashboard.
   */
  getStatistics(): GameStatistics & { uptime: string } {
    // Update world stats before returning
    this.statisticsManager.updateWorldStats(
      CONSTANTS.MAP_SIZE,
      world.objects,
      this.animalRegistry,
      this.resourceRegistry
    );
    
    // Update year from season system
    this.statisticsManager.setYear(this.seasonSystem.getCurrentYear());
    
    return {
      ...this.statisticsManager.getStats(),
      uptime: this.statisticsManager.getUptime()
    };
  }

  /**
   * Reinitialize the world - regenerates terrain and objects.
   */
  reinitializeWorld(): void {
    // Regenerate world with new seed
    world.regenerate();
    world.saveWorld();
    
    // Reset statistics
    this.statisticsManager.resetWorldStats();
    
    // Notify all clients
    this.io.emit("worldReset", world.getState());
  }

  /**
   * Get current module states for admin.
   */
  getModuleStates(): Record<string, boolean> {
    return {
      animalMovement: config.get("animalMovement"),
      carnivoreAggression: config.get("carnivoreAggression"),
      weatherEnabled: config.get("weatherEnabled")
    };
  }

  /**
   * Set a module state.
   */
  setModuleState(module: string, enabled: boolean): boolean {
    const validModules = ["animalMovement", "carnivoreAggression", "weatherEnabled"];
    if (!validModules.includes(module)) return false;
    
    config.set(module, enabled);
    this.io.emit("configUpdate", config.getAll());
    return true;
  }
}

export default GameEngine;
