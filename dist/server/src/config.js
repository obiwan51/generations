class Config {
    settings;
    constructor() {
        this.settings = {
            agingSpeed: 60000, // 1 year per minute
            hungerSpeed: 20000, // 1 hunger per 20s
            maxAge: 60,
            maxHunger: 20,
            spawnEveAge: 14,
            animalMovement: true,
            carnivoreAggression: true,
            weatherEnabled: true,
            xpPerHunt: 10
        };
    }
    get(key) {
        return this.settings[key];
    }
    set(key, value) {
        this.settings[key] = value;
        console.log(`[CONFIG] ${key} set to ${value}`);
    }
    getAll() {
        return this.settings;
    }
}
export default new Config();
//# sourceMappingURL=config.js.map