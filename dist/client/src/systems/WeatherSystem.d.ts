export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
/**
 * WeatherSystem - Handles weather particle effects and seasonal overlays
 */
export declare class WeatherSystem {
    private particles;
    private canvas;
    private ctx;
    private weatherEnabled;
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D);
    setWeatherEnabled(enabled: boolean): void;
    private initParticles;
    /**
     * Apply color overlay based on season
     */
    applySeasonEffects(season: Season): void;
    /**
     * Draw animated weather particles (rain/snow)
     */
    drawWeather(season: Season): void;
}
