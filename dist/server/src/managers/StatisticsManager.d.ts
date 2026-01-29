/**
 * StatisticsManager - Tracks game statistics for admin dashboard
 */
export interface GameStatistics {
    serverStartTime: number;
    currentYear: number;
    currentSeason: string;
    currentPopulation: number;
    peakPopulation: number;
    totalPlayersEver: number;
    totalDeaths: number;
    totalBirths: number;
    babiesAlive: number;
    adultsAlive: number;
    eldersAlive: number;
    maleCount: number;
    femaleCount: number;
    worldSize: number;
    totalObjects: number;
    totalAnimals: number;
    animalCounts: Record<string, number>;
    resourceCounts: Record<string, number>;
    deathsByCause: Record<string, number>;
    currentGeneration: number;
    longestLineage: number;
    tickRate: number;
    lastTickDuration: number;
}
export declare class StatisticsManager {
    private stats;
    private tickTimes;
    constructor();
    setYear(year: number): void;
    setSeason(season: string): void;
    playerJoined(isEve: boolean, gender: 'male' | 'female'): void;
    playerDied(cause: string, age: number, gender: 'male' | 'female'): void;
    playerAged(fromAge: number, toAge: number): void;
    updateWorldStats(worldSize: number, objects: Record<string, number>, animalRegistry: Record<number, {
        name: string;
    }>, resourceRegistry: Record<number, {
        name: string;
    }>): void;
    updateGeneration(generation: number): void;
    recordTick(duration: number): void;
    resetWorldStats(): void;
    resetPopulationStats(): void;
    getStats(): GameStatistics;
    getUptime(): string;
}
export default StatisticsManager;
