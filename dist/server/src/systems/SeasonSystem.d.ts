import { System } from '../../../shared/ecs/System.js';
import { Component } from '../../../shared/ecs/Component.js';
/**
 * SeasonComponent - Tracks world time and current season.
 * Only one instance needed per game world.
 */
export declare class SeasonComponent extends Component {
    worldTime: number;
    currentSeason: string;
    constructor(worldTime?: number, currentSeason?: string);
}
/**
 * SeasonSystem - Manages season progression based on world time.
 */
export declare class SeasonSystem extends System<SeasonComponent> {
    private seasonDuration;
    /** Callback when season changes */
    onSeasonChange?: (newSeason: string) => void;
    constructor(seasonDuration?: number);
    /**
     * Create the world's season component.
     */
    createComponent(): SeasonComponent;
    /**
     * Get the current season component.
     */
    getSeasonComponent(): SeasonComponent | undefined;
    /**
     * Advance world time and check for season change.
     * Called when aging tick occurs.
     */
    advanceTime(deltaMs?: number): void;
    /**
     * Update - called every tick but season only advances on aging ticks.
     */
    update(_delta: number): void;
    /**
     * Check and update season based on world time.
     */
    private checkSeasonChange;
    /**
     * Get current season.
     */
    getCurrentSeason(): string;
    /**
     * Get world time.
     */
    getWorldTime(): number;
    /**
     * Get current year (based on world time).
     */
    getCurrentYear(): number;
}
export default SeasonSystem;
