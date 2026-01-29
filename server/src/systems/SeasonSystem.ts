import { System } from '../../../shared/ecs/System.js';
import { Component } from '../../../shared/ecs/Component.js';
import { CONSTANTS } from '../../../shared/constants.js';

/**
 * SeasonComponent - Tracks world time and current season.
 * Only one instance needed per game world.
 */
export class SeasonComponent extends Component {
  constructor(
    public worldTime: number = 0,
    public currentSeason: string = CONSTANTS.SEASONS.SPRING
  ) {
    super();
  }
}

/**
 * SeasonSystem - Manages season progression based on world time.
 */
export class SeasonSystem extends System<SeasonComponent> {
  private seasonDuration: number;
  
  /** Callback when season changes */
  public onSeasonChange?: (newSeason: string) => void;

  constructor(seasonDuration: number = CONSTANTS.SEASON_DURATION) {
    super();
    this.seasonDuration = seasonDuration;
  }

  /**
   * Create the world's season component.
   */
  createComponent(): SeasonComponent {
    const component = new SeasonComponent();
    this.addComponent(component);
    return component;
  }

  /**
   * Get the current season component.
   */
  getSeasonComponent(): SeasonComponent | undefined {
    return this.components.find(c => !c.isDeleted);
  }

  /**
   * Advance world time and check for season change.
   * Called when aging tick occurs.
   */
  advanceTime(deltaMs: number = 60000): void {
    const component = this.getSeasonComponent();
    if (!component) return;

    component.worldTime += deltaMs;
    this.checkSeasonChange(component);
  }

  /**
   * Update - called every tick but season only advances on aging ticks.
   */
  update(_delta: number): void {
    // Season advancement is triggered by advanceTime() call from engine
    // This method exists for interface compliance
  }

  /**
   * Check and update season based on world time.
   */
  private checkSeasonChange(component: SeasonComponent): void {
    const seasonKeys = Object.values(CONSTANTS.SEASONS);
    const totalCycleDuration = this.seasonDuration * seasonKeys.length;
    const seasonIndex = Math.floor(
      (component.worldTime % totalCycleDuration) / this.seasonDuration
    ) % seasonKeys.length;
    
    const newSeason = seasonKeys[seasonIndex];

    if (newSeason !== component.currentSeason) {
      component.currentSeason = newSeason;
      if (this.onSeasonChange) {
        this.onSeasonChange(newSeason);
      }
    }
  }

  /**
   * Get current season.
   */
  getCurrentSeason(): string {
    return this.getSeasonComponent()?.currentSeason ?? CONSTANTS.SEASONS.SPRING;
  }

  /**
   * Get world time.
   */
  getWorldTime(): number {
    return this.getSeasonComponent()?.worldTime ?? 0;
  }

  /**
   * Get current year (based on world time).
   */
  getCurrentYear(): number {
    const worldTime = this.getWorldTime();
    const seasonKeys = Object.values(CONSTANTS.SEASONS);
    const yearDuration = this.seasonDuration * seasonKeys.length;
    return Math.floor(worldTime / yearDuration);
  }
}

export default SeasonSystem;
