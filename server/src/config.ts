import { GameConfig } from '../../shared/types.js';

class Config {
    private settings: GameConfig;

    constructor() {
        this.settings = {
            agingSpeed: 60000,      // 1 year per minute
            hungerSpeed: 20000,     // 1 hunger per 20s
            maxAge: 60,
            maxHunger: 20,
            spawnEveAge: 14,
            animalMovement: true,
            carnivoreAggression: true,
            weatherEnabled: true,
            xpPerHunt: 10,
            animalRespawn: true,
            animalRespawnInterval: 60,  // Check every 60 seconds
            animalMaxPopulation: 100,   // Max total animals on the map
            animalMinDistance: 15       // Min tiles from players to spawn
        };
    }

    get(key: string): any {
        return this.settings[key];
    }

    set(key: string, value: any) {
        this.settings[key] = value;
        console.log(`[CONFIG] ${key} set to ${value}`);
    }

    getAll(): GameConfig {
        return this.settings;
    }
}

export default new Config();
