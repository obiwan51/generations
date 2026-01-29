declare class World {
    private size;
    private chunkSize;
    private chunks;
    private seed;
    private autoSaveTimer;
    private autoSaveDelay;
    private isSaving;
    private lastSaveTime;
    private minSaveInterval;
    params: {
        noiseScale: number;
        noiseOctaves: number;
        noisePersistence: number;
        waterThreshold: number;
        waterPocketThreshold: number;
        waterPocketChance: number;
        edgeBiasStart: number;
        edgeBiasStrength: number;
        spawnProtectionRadius: number;
        swampElevation: number;
        swampMoisture: number;
        forestMoisture: number;
        desertMoisture: number;
    };
    tiles: string[][];
    objects: Record<string, number>;
    objectsData: Record<string, any>;
    constructor();
    private getChunkKey;
    private getChunkCoords;
    private getBiome;
    private generateChunk;
    private generateInitialArea;
    ensureChunkAt(worldX: number, worldY: number): void;
    getObject(x: number, y: number): number | null;
    getBiomeAt(x: number, y: number): string;
    removeObject(x: number, y: number): {
        type: number;
        data: any;
    } | null;
    setObject(x: number, y: number, type: number, data?: any): void;
    getObjectData(x: number, y: number): any | null;
    isPassable(x: number, y: number): boolean;
    /**
     * Finds a random passable position for spawning
     */
    getRandomPassablePos(): {
        x: number;
        y: number;
    };
    regenerate(): void;
    clearObjects(): void;
    getState(): {
        tiles: string[][];
        objects: Record<string, number>;
        objectsData: Record<string, any>;
    };
    getSeed(): number;
    getParams(): {
        seed: number;
        noiseScale: number;
        noiseOctaves: number;
        noisePersistence: number;
        waterThreshold: number;
        waterPocketThreshold: number;
        waterPocketChance: number;
        edgeBiasStart: number;
        edgeBiasStrength: number;
        spawnProtectionRadius: number;
        swampElevation: number;
        swampMoisture: number;
        forestMoisture: number;
        desertMoisture: number;
    };
    setParams(params: Partial<typeof this.params>): void;
    private scheduleAutoSave;
    flushAutoSave(): void;
    saveWorld(): boolean;
    loadWorld(): boolean;
    deleteSave(): boolean;
}
declare const _default: World;
export default _default;
