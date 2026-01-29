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
    biomes?: string[];
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
    isFloor?: boolean;
    biomes?: string[];
}
export type ItemCategory = 'tool' | 'material' | 'food' | 'weapon' | 'ammo' | 'container' | 'structure' | 'carcass' | 'seed' | 'crop' | 'other';
export interface Item extends RegistryEntity {
    description?: string;
    category: ItemCategory;
    isEdible?: boolean;
    foodValue?: number;
    isWeapon?: boolean;
    weaponType?: 'ranged' | 'throw' | 'melee';
    weaponDamage?: number;
    weaponMaxDist?: number;
    ammoType?: string;
    isContainer?: boolean;
    capacity?: number;
    isPlaceable?: boolean;
    isLarge?: boolean;
    growsInto?: string;
    growthTicks?: number;
    isConsumable?: boolean;
    uses?: number;
}
export interface Recipe {
    id: string;
    name: string;
    tool: string | null;
    target: string;
    result: string;
    targetBecomesType?: string;
    targetPersists?: boolean;
    description?: string;
}
/** Runtime recipe with resolved numeric IDs */
export interface RuntimeRecipe {
    id: string;
    name: string;
    tool: number | null;
    target: number;
    result: number;
    targetBecomesType?: number;
    targetPersists?: boolean;
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
