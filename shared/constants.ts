export const CONSTANTS = {
    MAP_SIZE: 200, // 200x200 tiles
    TILE_SIZE: 64,  // Pixels per tile
    CHUNK_SIZE: 16, // Tiles per chunk
    BIOMES: {
        GRASSLAND: 'grassland',
        DESERT: 'desert',
        SWAMP: 'swamp',
        FOREST: 'forest',
        WATER: 'water'
    },
    // Only special runtime types that aren't in registries
    OBJECT_TYPES: {
        NONE: 0,
        BABY: 100 // Special type for held babies
    },
    // Baby/child age thresholds
    BABY_MAX_AGE: 3,        // Age when child can walk normally
    BABY_CRAWL_SPEED: 0.5,  // Speed multiplier when crawling
    BABY_HUNGER_RATE: 2,    // Hunger depletes 2x faster
    SEASONS: {
        SPRING: 'spring',
        SUMMER: 'summer',
        AUTUMN: 'autumn',
        WINTER: 'winter'
    },
    SEASON_DURATION: 600000 // 10 minutes in ms
};

export default CONSTANTS;
