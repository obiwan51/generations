// Re-export ECS base classes and components for convenience
export * from './ecs/index.js';
export * from './components/index.js';

/**
 * Registry Entity - Base interface for registry-defined game objects.
 * Note: Named differently to avoid conflict with ECS Entity class.
 */
export interface RegistryEntity {
    id: number;
    name: string;
    asset: string;
}

export interface Animal extends RegistryEntity {
    hp: number;
    speed: number;
    aggression: number;
    isCarnivore: boolean;
    spawnRate: number;
    scale?: number;
    deadType?: string;
    biomes?: string[];  // Which biomes this animal spawns in
    assets: {
        alive: string;
        dead?: string;
        decayed?: string;
        bones?: string;
    };
}

export interface Resource extends RegistryEntity {
    description?: string;
    spawnRate: number;
    isEdible?: boolean;
    foodValue?: number;
    isLarge?: boolean;
    size?: number;
    yOffset?: number;
    isFloor?: boolean;  // Rendered below players (like grass)
    biomes?: string[];  // Which biomes this resource spawns in
}

export type ItemCategory = 'tool' | 'material' | 'food' | 'weapon' | 'ammo' | 'container' | 'structure' | 'carcass' | 'seed' | 'crop' | 'other';

export interface Item extends RegistryEntity {
    description?: string;
    category: ItemCategory;
    // Food properties
    isEdible?: boolean;
    foodValue?: number;
    // Weapon properties
    isWeapon?: boolean;
    weaponType?: 'ranged' | 'throw' | 'melee';
    weaponDamage?: number;
    weaponMaxDist?: number;
    ammoType?: string;
    // Container properties
    isContainer?: boolean;
    capacity?: number;
    // Placement properties
    isPlaceable?: boolean;
    isLarge?: boolean;
    // Growth properties (for crops)
    growsInto?: string;
    growthTicks?: number;
    // Consumable
    isConsumable?: boolean;
    // Tool durability (number of uses before breaking)
    uses?: number;
}

export interface Recipe {
    id: string;
    name: string;
    tool: string | null;
    target: string;
    result: string;
    targetBecomesType?: string; // Target transforms into this instead of being removed
    targetPersists?: boolean;   // If true, target stays and result goes to hand (e.g., cooking on fire)
    description?: string;
}

/** Runtime recipe with resolved numeric IDs */
export interface RuntimeRecipe {
    id: string;
    name: string;
    tool: number | null;
    target: number;
    result: number;
    targetBecomesType?: number; // Target transforms into this instead of being removed
    targetPersists?: boolean;   // If true, target stays and result goes to hand (e.g., cooking on fire)
    description?: string;
}

export interface RegistryData {
    animals: Record<string, Animal>;
    resources: Record<string, Resource>;
    items: Record<string, Item>;
    recipes: Recipe[];
}

export interface GameConfig {
    maxHunger: number;
    spawnEveAge: number;
    [key: string]: any;
}
