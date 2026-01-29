import { CONSTANTS } from '../../shared/constants.js';
import registry from './registry.js';
import { Animal, Resource } from '../../shared/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple 2D noise function for procedural generation
function noise2D(x: number, y: number, seed: number = 12345): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
}

// Smoothed noise with interpolation
function smoothNoise(x: number, y: number, scale: number, seed: number): number {
    const sx = x / scale;
    const sy = y / scale;
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const fx = sx - x0;
    const fy = sy - y0;
    
    const v00 = noise2D(x0, y0, seed);
    const v10 = noise2D(x0 + 1, y0, seed);
    const v01 = noise2D(x0, y0 + 1, seed);
    const v11 = noise2D(x0 + 1, y0 + 1, seed);
    
    const i1 = v00 * (1 - fx) + v10 * fx;
    const i2 = v01 * (1 - fx) + v11 * fx;
    
    return i1 * (1 - fy) + i2 * fy;
}

// Multi-octave noise for more natural terrain
function fractalNoise(x: number, y: number, octaves: number, persistence: number, scale: number, seed: number): number {
    let value = 0;
    let amplitude = 1;
    let maxValue = 0;
    let currentScale = scale;
    
    for (let i = 0; i < octaves; i++) {
        value += smoothNoise(x, y, currentScale, seed + i * 1000) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        currentScale *= 0.5;
    }
    
    return value / maxValue;
}

interface Chunk {
    tiles: string[][];
    objects: Record<string, number>;
    objectsData: Record<string, any>;
    generated: boolean;
}

class World {
    private size: number;
    private chunkSize: number;
    private chunks: Map<string, Chunk> = new Map();
    private seed: number;
    private autoSaveTimer: NodeJS.Timeout | null = null;
    private autoSaveDelay = 30000; // Save 30 seconds after last change
    private isSaving: boolean = false;
    private lastSaveTime: number = 0;
    private minSaveInterval = 15000; // Minimum 15 seconds between saves
    
    // World generation parameters (exposed for admin control)
    public params = {
        noiseScale: 80,
        noiseOctaves: 4,
        noisePersistence: 0.5,
        waterThreshold: 0.28,
        waterPocketThreshold: 0.32,
        waterPocketChance: 0.35,
        edgeBiasStart: 0.80,
        edgeBiasStrength: 3,
        spawnProtectionRadius: 0,
        swampElevation: 0.35,
        swampMoisture: 0.55,
        forestMoisture: 0.60,
        desertMoisture: 0.35
    };
    
    // Flat accessors for backward compatibility
    public tiles: string[][] = [];
    public objects: Record<string, number> = {};
    public objectsData: Record<string, any> = {};

    constructor() {
        this.size = CONSTANTS.MAP_SIZE;
        this.chunkSize = CONSTANTS.CHUNK_SIZE;
        this.seed = Math.floor(Math.random() * 100000);
        
        // Initialize the tiles array for the full map size (for backward compatibility)
        for (let y = 0; y < this.size; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.size; x++) {
                this.tiles[y][x] = CONSTANTS.BIOMES.GRASSLAND; // Placeholder
            }
        }
        
        // Try to load saved world, otherwise generate new one
        if (!this.loadWorld()) {
            this.generateInitialArea();
        }
    }

    private getChunkKey(chunkX: number, chunkY: number): string {
        return `${chunkX},${chunkY}`;
    }

    private getChunkCoords(worldX: number, worldY: number): { chunkX: number; chunkY: number } {
        return {
            chunkX: Math.floor(worldX / this.chunkSize),
            chunkY: Math.floor(worldY / this.chunkSize)
        };
    }

    // Determine biome based on elevation and moisture noise
    private getBiome(x: number, y: number): string {
        // Elevation noise - medium scale for distinct continents
        const elevation = fractalNoise(x, y, this.params.noiseOctaves, this.params.noisePersistence, this.params.noiseScale, this.seed);
        
        // Moisture noise - determines forest/desert/swamp
        const moisture = fractalNoise(x, y, 3, 0.5, 60, this.seed + 50000);
        
        // Distance from world center (only for spawn protection)
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const normalizedDist = distFromCenter / (this.size / 2);
        
        // Add edge bias to encourage water near map boundaries
        const edgeBiasX = Math.abs(x - centerX) / (this.size / 2);
        const edgeBiasY = Math.abs(y - centerY) / (this.size / 2);
        const edgeBias = Math.max(edgeBiasX, edgeBiasY);
        const elevationWithBias = elevation - (edgeBias > this.params.edgeBiasStart ? (edgeBias - this.params.edgeBiasStart) * this.params.edgeBiasStrength : 0);

        // Spawn protection - center area is always land (if enabled)
        const spawnProtection = this.params.spawnProtectionRadius > 0 && normalizedDist < this.params.spawnProtectionRadius;
        
        // Water: Create distinct continents
        if (!spawnProtection) {
            // Higher threshold to create distinct landmasses
            if (elevationWithBias < this.params.waterThreshold) {
                return CONSTANTS.BIOMES.WATER;
            }
            
            // Additional water pockets for variety
            if (elevationWithBias < this.params.waterPocketThreshold && smoothNoise(x, y, 35, this.seed + 60000) < this.params.waterPocketChance) {
                return CONSTANTS.BIOMES.WATER;
            }
        }
        
        // Land biomes
        // Swamp near water
        if (elevation < this.params.swampElevation && moisture > this.params.swampMoisture) {
            return CONSTANTS.BIOMES.SWAMP;
        }
        
        // Forest in moist areas
        if (moisture > this.params.forestMoisture) {
            return CONSTANTS.BIOMES.FOREST;
        }
        
        // Desert in dry areas
        if (moisture < this.params.desertMoisture) {
            return CONSTANTS.BIOMES.DESERT;
        }
        
        return CONSTANTS.BIOMES.GRASSLAND;
    }

    private generateChunk(chunkX: number, chunkY: number): Chunk {
        const key = this.getChunkKey(chunkX, chunkY);
        
        // Return existing chunk if already generated
        if (this.chunks.has(key)) {
            return this.chunks.get(key)!;
        }
        
        const animals = registry.get('animals') as Record<string, Animal>;
        const resources = registry.get('resources') as Record<string, Resource>;
        
        // Build spawnable lists per biome
        const biomeSpawnables: Record<string, { type: number; rate: number }[]> = {
            [CONSTANTS.BIOMES.GRASSLAND]: [],
            [CONSTANTS.BIOMES.FOREST]: [],
            [CONSTANTS.BIOMES.DESERT]: [],
            [CONSTANTS.BIOMES.SWAMP]: [],
            [CONSTANTS.BIOMES.WATER]: []
        };
        
        // Add resources to appropriate biome lists
        for (const resKey in resources) {
            const r = resources[resKey];
            if (r.spawnRate) {
                const biomes = r.biomes || [CONSTANTS.BIOMES.GRASSLAND];
                for (const biome of biomes) {
                    if (biomeSpawnables[biome]) {
                        const rate = biomes.length === 1 ? r.spawnRate * 1.5 : r.spawnRate;
                        biomeSpawnables[biome].push({ type: r.id, rate });
                    }
                }
            }
        }
        
        // Add animals to appropriate biome lists
        for (const animalKey in animals) {
            const a = animals[animalKey];
            if (a.spawnRate) {
                const biomes = a.biomes || [CONSTANTS.BIOMES.GRASSLAND, CONSTANTS.BIOMES.FOREST];
                for (const biome of biomes) {
                    if (biomeSpawnables[biome]) {
                        biomeSpawnables[biome].push({ type: a.id, rate: a.spawnRate });
                    }
                }
            }
        }
        
        const chunk: Chunk = {
            tiles: [],
            objects: {},
            objectsData: {},
            generated: true
        };
        
        const startX = chunkX * this.chunkSize;
        const startY = chunkY * this.chunkSize;
        
        for (let ly = 0; ly < this.chunkSize; ly++) {
            chunk.tiles[ly] = [];
            for (let lx = 0; lx < this.chunkSize; lx++) {
                const worldX = startX + lx;
                const worldY = startY + ly;
                
                // Skip if outside world bounds
                if (worldX < 0 || worldX >= this.size || worldY < 0 || worldY >= this.size) {
                    chunk.tiles[ly][lx] = CONSTANTS.BIOMES.WATER; // Ocean outside world
                    continue;
                }
                
                const biome = this.getBiome(worldX, worldY);
                chunk.tiles[ly][lx] = biome;
                
                // Update the main tiles array for backward compatibility
                if (this.tiles[worldY]) {
                    this.tiles[worldY][worldX] = biome;
                }
                
                // Spawn objects based on seeded random for consistency
                const spawnables = biomeSpawnables[biome] || [];
                const rand = noise2D(worldX, worldY, this.seed + 99999);
                let cumulativeRate = 0;
                
                for (const spawn of spawnables) {
                    cumulativeRate += spawn.rate;
                    if (rand < cumulativeRate) {
                        const objKey = `${worldX},${worldY}`;
                        chunk.objects[objKey] = spawn.type;
                        this.objects[objKey] = spawn.type;
                        break;
                    }
                }
            }
        }
        
        this.chunks.set(key, chunk);
        return chunk;
    }

    private generateInitialArea(): void {
        console.log(`Generating world with seed: ${this.seed}`);
        
        // Generate all chunks for the entire map
        let chunksGenerated = 0;
        for (let cy = 0; cy < Math.ceil(this.size / this.chunkSize); cy++) {
            for (let cx = 0; cx < Math.ceil(this.size / this.chunkSize); cx++) {
                this.generateChunk(cx, cy);
                chunksGenerated++;
            }
        }
        
        // Log biome distribution
        const biomeCounts: Record<string, number> = {};
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const biome = this.tiles[y][x];
                biomeCounts[biome] = (biomeCounts[biome] || 0) + 1;
            }
        }
        console.log(`Generated ${chunksGenerated} chunks`);
        console.log("Biome distribution:", biomeCounts);
        
        // Warn if no water was generated
        if (!biomeCounts[CONSTANTS.BIOMES.WATER] || biomeCounts[CONSTANTS.BIOMES.WATER] === 0) {
            console.warn("WARNING: No water tiles generated! Adjusting parameters...");
        }
    }

    // Ensure a chunk is generated when accessing a tile
    ensureChunkAt(worldX: number, worldY: number): void {
        const { chunkX, chunkY } = this.getChunkCoords(worldX, worldY);
        if (!this.chunks.has(this.getChunkKey(chunkX, chunkY))) {
            this.generateChunk(chunkX, chunkY);
        }
    }

    getObject(x: number, y: number): number | null {
        this.ensureChunkAt(x, y);
        return this.objects[`${x},${y}`] ?? null;
    }

    getBiomeAt(x: number, y: number): string {
        this.ensureChunkAt(x, y);
        if (y >= 0 && y < this.tiles.length && x >= 0 && x < this.tiles[0].length) {
            return this.tiles[y][x];
        }
        return CONSTANTS.BIOMES.WATER; // Default to water outside bounds
    }

    removeObject(x: number, y: number): { type: number; data: any } | null {
        const key = `${x},${y}`;
        if (this.objects[key]) {
            const obj = this.objects[key];
            const data = this.objectsData[key] || null;
            delete this.objects[key];
            delete this.objectsData[key];            // Auto-save world state periodically (debounced)
            this.scheduleAutoSave();            return { type: obj, data: data };
        }
        return null;
    }

    setObject(x: number, y: number, type: number, data: any = null): void {
        const key = `${x},${y}`;
        if (type === CONSTANTS.OBJECT_TYPES.NONE) {
            delete this.objects[key];
            delete this.objectsData[key];
        } else {
            this.objects[key] = type;
            if (data) {
                this.objectsData[key] = data;
            } else {
                delete this.objectsData[key];
            }
        }
        // Auto-save world state periodically (debounced)
        this.scheduleAutoSave();
    }

    getObjectData(x: number, y: number): any | null {
        return this.objectsData[`${x},${y}`] || null;
    }

    // Check if a tile is passable (not deep water)
    isPassable(x: number, y: number): boolean {
        const biome = this.getBiomeAt(x, y);
        return biome !== CONSTANTS.BIOMES.WATER;
    }

    /**
     * Finds a random passable position for spawning
     */
    getRandomPassablePos(): { x: number; y: number } {
        let attempts = 0;
        const maxCoord = this.size;
        
        while (attempts < 100) {
            const tx = Math.floor(Math.random() * maxCoord);
            const ty = Math.floor(Math.random() * maxCoord);
            
            if (this.isPassable(tx, ty)) {
                return {
                    x: tx * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2,
                    y: ty * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2
                };
            }
            attempts++;
        }
        
        // Fallback to center if no spot found (center is protected by spawnProtection in getBiome)
        return {
            x: (this.size / 2) * CONSTANTS.TILE_SIZE,
            y: (this.size / 2) * CONSTANTS.TILE_SIZE
        };
    }

    // Regenerate the world with a new seed
    regenerate(): void {
        this.seed = Math.floor(Math.random() * 100000);
        this.chunks.clear();
        this.objects = {};
        this.objectsData = {};
        
        // Reinitialize tiles array
        for (let y = 0; y < this.size; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.size; x++) {
                this.tiles[y][x] = CONSTANTS.BIOMES.GRASSLAND;
            }
        }
        
        this.generateInitialArea();
        this.saveWorld();
    }

    getState() {
        return {
            tiles: this.tiles,
            objects: this.objects,
            objectsData: this.objectsData
        };
    }

    getSeed(): number {
        return this.seed;
    }

    getParams() {
        return { ...this.params, seed: this.seed };
    }

    setParams(params: Partial<typeof this.params>) {
        this.params = { ...this.params, ...params };
    }

    // Schedule an auto-save (debounced and throttled)
    private scheduleAutoSave(): void {
        // Clear existing timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        // Schedule save with debounce
        this.autoSaveTimer = setTimeout(() => {
            this.autoSaveTimer = null;
            
            // Throttle: Don't save if we saved recently
            const timeSinceLastSave = Date.now() - this.lastSaveTime;
            if (timeSinceLastSave < this.minSaveInterval) {
                console.log(`[World] Skipping auto-save (last save was ${Math.round(timeSinceLastSave/1000)}s ago)`);
                return;
            }
            
            this.saveWorld();
        }, this.autoSaveDelay);
    }

    // Flush any pending auto-save immediately
    flushAutoSave(): void {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
            this.saveWorld();
        }
    }

    // Save world to disk
    saveWorld(): boolean {
        // Prevent concurrent saves
        if (this.isSaving) {
            console.log('[World] Save already in progress, skipping');
            return false;
        }
        
        this.isSaving = true;
        
        try {
            const worldDir = path.join(__dirname, '../data');
            if (!fs.existsSync(worldDir)) {
                fs.mkdirSync(worldDir, { recursive: true });
            }

            const worldData = {
                seed: this.seed,
                params: this.params,
                tiles: this.tiles,
                objects: this.objects,
                objectsData: this.objectsData,
                savedAt: new Date().toISOString()
            };

            const worldPath = path.join(worldDir, 'world-save.json');
            const tempPath = path.join(worldDir, 'world-save.tmp.json');
            
            // Atomic write: write to temp file first, then rename
            fs.writeFileSync(tempPath, JSON.stringify(worldData), 'utf8');
            fs.renameSync(tempPath, worldPath);
            
            this.lastSaveTime = Date.now();
            console.log(`[World] Saved successfully (${Object.keys(this.objects).length} objects)`);
            return true;
        } catch (err) {
            console.error('[World] Failed to save:', err);
            return false;
        } finally {
            this.isSaving = false;
        }
    }

    // Load world from disk
    loadWorld(): boolean {
        try {
            const worldPath = path.join(__dirname, '../data/world-save.json');
            if (!fs.existsSync(worldPath)) {
                console.log('[World] No saved world found, generating new world');
                return false;
            }

            const worldData = JSON.parse(fs.readFileSync(worldPath, 'utf8'));
            
            // Restore world state
            this.seed = worldData.seed;
            this.params = { ...this.params, ...worldData.params };
            this.tiles = worldData.tiles;
            this.objects = worldData.objects || {};
            this.objectsData = worldData.objectsData || {};

            console.log(`[World] Loaded saved world (seed: ${this.seed}, saved at: ${worldData.savedAt})`);
            return true;
        } catch (err) {
            console.error('[World] Failed to load saved world:', err);
            return false;
        }
    }

    // Delete saved world
    deleteSave(): boolean {
        try {
            const worldPath = path.join(__dirname, '../data/world-save.json');
            if (fs.existsSync(worldPath)) {
                fs.unlinkSync(worldPath);
                console.log('[World] Deleted saved world');
                return true;
            }
            return false;
        } catch (err) {
            console.error('[World] Failed to delete save:', err);
            return false;
        }
    }
}

export default new World();
