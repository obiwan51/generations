import { RegistryData, Animal, Resource } from '../../../shared/types.js';
import { Season } from './WeatherSystem.js';
import { PlayerRenderData } from './PlayerRenderer.js';
export interface WorldData {
    tiles: string[][];
    objects: Record<string, number>;
    objectsData: Record<string, any>;
}
export interface ProjectileData {
    x: number;
    y: number;
    angle: number;
    type: number;
}
export type { PlayerRenderData as PlayerData };
/**
 * RenderSystem - Orchestrates all canvas drawing
 */
export declare class RenderSystem {
    private canvas;
    private ctx;
    private images;
    private registry;
    private weatherSystem;
    private playerRenderer;
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D);
    setRegistry(registry: RegistryData): void;
    setWeatherEnabled(enabled: boolean): void;
    private setupResize;
    private getAssetUrl;
    private loadImage;
    private loadBaseImages;
    private loadRegistryImages;
    getObjectMetadata(id: number): (Resource | Animal | any) & {
        category: string;
    } | null;
    getObjectName(type: number): string;
    private getObjectImage;
    draw(world: WorldData | null, players: Record<string, PlayerRenderData>, projectiles: ProjectileData[], myId: string | null, season: Season): void;
    private collectDrawables;
    private biomeColors;
    private seededRandom;
    private drawTiles;
    private drawTileTexture;
    private drawObject;
    private drawHealthBar;
    private drawProjectiles;
}
