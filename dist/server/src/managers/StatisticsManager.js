export class StatisticsManager {
    stats;
    tickTimes = [];
    constructor() {
        this.stats = {
            serverStartTime: Date.now(),
            currentYear: 0,
            currentSeason: 'spring',
            currentPopulation: 0,
            peakPopulation: 0,
            totalPlayersEver: 0,
            totalDeaths: 0,
            totalBirths: 0,
            babiesAlive: 0,
            adultsAlive: 0,
            eldersAlive: 0,
            maleCount: 0,
            femaleCount: 0,
            worldSize: 0,
            totalObjects: 0,
            totalAnimals: 0,
            animalCounts: {},
            resourceCounts: {},
            deathsByCause: {},
            currentGeneration: 1,
            longestLineage: 0,
            tickRate: 0,
            lastTickDuration: 0
        };
    }
    // Time tracking
    setYear(year) {
        this.stats.currentYear = year;
    }
    setSeason(season) {
        this.stats.currentSeason = season;
    }
    // Population tracking
    playerJoined(isEve, gender) {
        this.stats.totalPlayersEver++;
        this.stats.currentPopulation++;
        if (isEve) {
            this.stats.adultsAlive++;
        }
        else {
            this.stats.totalBirths++;
            this.stats.babiesAlive++;
        }
        if (gender === 'male') {
            this.stats.maleCount++;
        }
        else {
            this.stats.femaleCount++;
        }
        if (this.stats.currentPopulation > this.stats.peakPopulation) {
            this.stats.peakPopulation = this.stats.currentPopulation;
        }
    }
    playerDied(cause, age, gender) {
        this.stats.totalDeaths++;
        this.stats.currentPopulation = Math.max(0, this.stats.currentPopulation - 1);
        // Update demographic counts
        if (age < 3) {
            this.stats.babiesAlive = Math.max(0, this.stats.babiesAlive - 1);
        }
        else if (age < 40) {
            this.stats.adultsAlive = Math.max(0, this.stats.adultsAlive - 1);
        }
        else {
            this.stats.eldersAlive = Math.max(0, this.stats.eldersAlive - 1);
        }
        if (gender === 'male') {
            this.stats.maleCount = Math.max(0, this.stats.maleCount - 1);
        }
        else {
            this.stats.femaleCount = Math.max(0, this.stats.femaleCount - 1);
        }
        // Track death cause
        this.stats.deathsByCause[cause] = (this.stats.deathsByCause[cause] || 0) + 1;
    }
    playerAged(fromAge, toAge) {
        // Track demographic transitions
        if (fromAge < 3 && toAge >= 3) {
            this.stats.babiesAlive = Math.max(0, this.stats.babiesAlive - 1);
            this.stats.adultsAlive++;
        }
        else if (fromAge < 40 && toAge >= 40) {
            this.stats.adultsAlive = Math.max(0, this.stats.adultsAlive - 1);
            this.stats.eldersAlive++;
        }
    }
    // World tracking
    updateWorldStats(worldSize, objects, animalRegistry, resourceRegistry) {
        this.stats.worldSize = worldSize;
        // Count objects by type
        const animalCounts = {};
        const resourceCounts = {};
        let totalAnimals = 0;
        let totalObjects = 0;
        for (const key in objects) {
            const typeId = objects[key];
            totalObjects++;
            if (animalRegistry[typeId]) {
                const name = animalRegistry[typeId].name;
                animalCounts[name] = (animalCounts[name] || 0) + 1;
                totalAnimals++;
            }
            else if (resourceRegistry[typeId]) {
                const name = resourceRegistry[typeId].name;
                resourceCounts[name] = (resourceCounts[name] || 0) + 1;
            }
        }
        this.stats.animalCounts = animalCounts;
        this.stats.resourceCounts = resourceCounts;
        this.stats.totalAnimals = totalAnimals;
        this.stats.totalObjects = totalObjects;
    }
    // Generation tracking
    updateGeneration(generation) {
        if (generation > this.stats.currentGeneration) {
            this.stats.currentGeneration = generation;
        }
        if (generation > this.stats.longestLineage) {
            this.stats.longestLineage = generation;
        }
    }
    // Performance tracking
    recordTick(duration) {
        this.tickTimes.push(duration);
        if (this.tickTimes.length > 60) {
            this.tickTimes.shift();
        }
        this.stats.lastTickDuration = duration;
        this.stats.tickRate = this.tickTimes.length > 0
            ? Math.round(1000 / (this.tickTimes.reduce((a, b) => a + b, 0) / this.tickTimes.length))
            : 0;
    }
    // Reset stats (for world regeneration)
    resetWorldStats() {
        this.stats.totalObjects = 0;
        this.stats.totalAnimals = 0;
        this.stats.animalCounts = {};
        this.stats.resourceCounts = {};
    }
    resetPopulationStats() {
        this.stats.currentPopulation = 0;
        this.stats.babiesAlive = 0;
        this.stats.adultsAlive = 0;
        this.stats.eldersAlive = 0;
        this.stats.maleCount = 0;
        this.stats.femaleCount = 0;
    }
    getStats() {
        return { ...this.stats };
    }
    getUptime() {
        const ms = Date.now() - this.stats.serverStartTime;
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    }
}
export default StatisticsManager;
//# sourceMappingURL=StatisticsManager.js.map