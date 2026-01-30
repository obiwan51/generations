import { CONSTANTS } from '../../../shared/constants.js';
import { RegistryData, Animal, Resource } from '../../../shared/types.js';
import { Season, WeatherSystem } from './WeatherSystem.js';
import { PlayerRenderer, PlayerRenderData } from './PlayerRenderer.js';

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

// Re-export for backwards compatibility
export type { PlayerRenderData as PlayerData };

/**
 * RenderSystem - Orchestrates all canvas drawing
 */
export class RenderSystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private images: Record<string, CanvasImageSource> = {};
    private registry: RegistryData | null = null;
    private weatherSystem: WeatherSystem;
    private playerRenderer: PlayerRenderer;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.weatherSystem = new WeatherSystem(canvas, ctx);
        this.loadBaseImages();
        this.setupResize();
        this.playerRenderer = new PlayerRenderer(ctx, this.images, (t) => this.getObjectImage(t));
    }

    setRegistry(registry: RegistryData): void {
        this.registry = registry;
        this.loadRegistryImages(registry);
    }

    setWeatherEnabled(enabled: boolean): void {
        this.weatherSystem.setWeatherEnabled(enabled);
    }

    private setupResize(): void {
        const resize = () => {
            // Limit internal resolution for performance
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 900;
            
            // Calculate aspect ratio to maintain square pixels or just fill?
            // User just asked to force smaller size.
            // Let's scale down if the window is larger than MAX dimensions
            
            let width = window.innerWidth;
            let height = window.innerHeight;
            
            // If we want to strictly cap at 1280x900 but keep aspect ratio...
            // Or just cap the render buffer size.
            
            if (width > MAX_WIDTH) width = MAX_WIDTH;
            if (height > MAX_HEIGHT) height = MAX_HEIGHT;

            this.canvas.width = width;
            this.canvas.height = height;
            
            // CSS handles stretching to fill screen
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            
            // Re-disable smoothing for pixel art look if desired, though SVG assets are used essentially.
            this.ctx.imageSmoothingEnabled = false; 
        };

        window.addEventListener('resize', resize);
        resize(); // Initial sizing
    }

    private getAssetUrl(path: string): string {
        // In development, assets are served from the server on a different port
        // In production, assets come from the same origin
        const serverUrl = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
        return `${serverUrl}${path}`;
    }

    private loadImage(key: string, path: string): void {
        if (this.images[key]) return; // Already loading/loaded

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = this.getAssetUrl(path);
        
        // Store loading image
        this.images[key] = img;

        img.onload = () => {
            // Optimization: Rasterize SVG to Canvas to avoid expensive filter calc per frame
            try {
                const size = Math.max(img.naturalWidth || 128, 128); 
                const offscreen = document.createElement('canvas');
                offscreen.width = size;
                offscreen.height = size;
                const ctx = offscreen.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, size, size);
                    this.images[key] = offscreen;
                }
            } catch (e) {
                console.warn('Failed to rasterize image', path, e);
            }
        };
    }

    private loadBaseImages(): void {
        const baseUrls: Record<string, string> = {
            grass: '/assets/grass.svg',
            player: '/assets/player.svg',
            player_male: '/assets/player_male.svg',
            player_female: '/assets/player_female.svg',
            baby: '/assets/baby.svg'
        };
        for (const key in baseUrls) {
            this.loadImage(key, baseUrls[key]);
        }
    }

    private loadRegistryImages(registryData: RegistryData): void {
        for (const key in registryData.animals) {
            const animal = registryData.animals[key] as Animal;
            const animalAssets = animal.assets as Record<string, string | undefined>;
            for (const assetKey in animalAssets) {
                const assetPath = animalAssets[assetKey];
                if (assetPath) {
                    const fullPath = `/assets/${assetPath}`;
                    this.loadImage(fullPath, fullPath);
                }
            }
        }
        for (const key in registryData.resources) {
            const res = registryData.resources[key] as Resource;
            if (res.asset) {
                const fullPath = `/assets/${res.asset}`;
                this.loadImage(fullPath, fullPath);
            }
        }
        for (const key in registryData.items) {
            const item = registryData.items[key] as any;
            if (item.asset) {
                const fullPath = `/assets/${item.asset}`;
                this.loadImage(fullPath, fullPath);
            }
        }
    }

    getObjectMetadata(id: number): (Resource | Animal | any) & { category: string } | null {
        if (!this.registry) return null;
        const res = Object.values(this.registry.resources).find(r => r.id === id);
        if (res) return { ...res, category: 'resource' };
        const ani = Object.values(this.registry.animals).find(a => a.id === id);
        if (ani) return { ...ani, category: 'animal' };
        const item = Object.values(this.registry.items).find(i => (i as any).id === id);
        if (item) return { ...item, category: (item as any).category || 'item' };
        return null;
    }

    getObjectName(type: number): string {
        const meta = this.getObjectMetadata(type);
        return meta ? meta.name : 'Unknown';
    }

    private getObjectImage(type: number): CanvasImageSource | null {
        const meta = this.getObjectMetadata(type);
        if (!meta) {
            // Fallback: try to find by asset pattern if not in registry metadata
            return null;
        }
        if (meta.category === 'resource' || meta.category === 'tool' || meta.category === 'material' || meta.category === 'structure' || meta.category === 'food' || meta.category === 'weapon' || meta.category === 'ammo' || meta.category === 'container' || meta.category === 'carcass' || meta.category === 'seed' || meta.category === 'crop') {
            return this.images[`/assets/${(meta as any).asset}`];
        } else if (meta.category === 'animal') {
            return this.images[`/assets/${(meta as Animal).assets.alive}`];
        }
        return null;
    }

    draw(
        world: WorldData | null,
        players: Record<string, PlayerRenderData>,
        projectiles: ProjectileData[],
        animals: Array<{ id: string; type: number; x: number; y: number; hp?: number }>,
        myId: string | null,
        season: Season
    ): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!world) return;

        const myPlayer = myId ? players[myId] : null;
        const offsetX = this.canvas.width / 2 - (myPlayer?.x || 0);
        const offsetY = this.canvas.height / 2 - (myPlayer?.y || 0);
        const TILE_SIZE = CONSTANTS.TILE_SIZE;

        // Draw tiles first (ground layer)
        this.drawTiles(world, offsetX, offsetY, TILE_SIZE);
        
        // Collect all drawable entities and sort by Y for proper depth
        const drawables = this.collectDrawables(world, players, animals, offsetX, offsetY, TILE_SIZE, myId);
        drawables.sort((a, b) => a.sortY - b.sortY);
        
        // Draw all entities in sorted order
        for (const drawable of drawables) {
            drawable.draw();
        }
        
        this.weatherSystem.applySeasonEffects(season);
        this.weatherSystem.drawWeather(season);
        this.drawProjectiles(projectiles, offsetX, offsetY);
    }

    private collectDrawables(
        world: WorldData,
        players: Record<string, PlayerRenderData>,
        animals: Array<{ id: string; type: number; x: number; y: number; hp?: number }>,
        offsetX: number,
        offsetY: number,
        TILE_SIZE: number,
        myId: string | null
    ): { sortY: number; draw: () => void }[] {
        const drawables: { sortY: number; draw: () => void }[] = [];

        // Collect world objects (skip floor objects and animals - animals rendered separately)
        for (const key in world.objects) {
            const [xStr, yStr] = key.split(',');
            const x = parseInt(xStr), y = parseInt(yStr);
            const screenX = x * TILE_SIZE + offsetX;
            const screenY = y * TILE_SIZE + offsetY;

            // Culling
            if (screenX + TILE_SIZE * 2 < 0 || screenX > this.canvas.width ||
                screenY + TILE_SIZE * 2 < 0 || screenY > this.canvas.height) continue;

            const obj = world.objects[key];
            const data = world.objectsData[key];
            const meta = this.getObjectMetadata(obj);
            
            // Skip floor objects - they're rendered below players with tiles
            if (meta && (meta as any).isFloor) continue;
            
            // Skip live animals - they're rendered separately with smooth positions
            // Dead animals (carcasses) are still rendered as world objects
            if (meta && meta.category === 'animal') {
                // If there's a live animal at this tile, skip rendering the world object
                const isLiveAnimal = animals.some(a => {
                    const aTileX = Math.floor(a.x / TILE_SIZE);
                    const aTileY = Math.floor(a.y / TILE_SIZE);
                    return aTileX === x && aTileY === y && a.type === obj;
                });
                if (isLiveAnimal) continue;
            }
            
            // Calculate the "foot" Y position for sorting (bottom of the object)
            let sortY = screenY + TILE_SIZE;
            if (meta && (meta as any).isLarge) {
                // Large objects like trees: sort by their base tile
                sortY = screenY + TILE_SIZE;
            }

            drawables.push({
                sortY,
                draw: () => this.drawObject(obj, screenX, screenY, TILE_SIZE, data)
            });
        }

        // Collect live animals (smooth pixel positions)
        for (const animal of animals) {
            const screenX = animal.x + offsetX - TILE_SIZE / 2;
            const screenY = animal.y + offsetY - TILE_SIZE / 2;
            
            // Culling
            if (screenX + TILE_SIZE * 2 < 0 || screenX > this.canvas.width ||
                screenY + TILE_SIZE * 2 < 0 || screenY > this.canvas.height) continue;
            
            drawables.push({
                sortY: screenY + TILE_SIZE,
                draw: () => this.drawAnimal(animal, screenX, screenY, TILE_SIZE)
            });
        }

        // Collect players
        for (const id in players) {
            const player = players[id];
            const screenX = player.x + offsetX;
            const screenY = player.y + offsetY;
            const isMe = id === myId;
            
            drawables.push({
                sortY: screenY + TILE_SIZE / 2, // Player's feet position
                draw: () => this.playerRenderer.drawSingle(player, offsetX, offsetY, TILE_SIZE, isMe)
            });
        }

        return drawables;
    }

    private drawAnimal(
        animal: { id: string; type: number; x: number; y: number; hp?: number },
        screenX: number,
        screenY: number,
        TILE_SIZE: number
    ): void {
        const meta = this.getObjectMetadata(animal.type) as Animal | null;
        if (!meta) return;
        
        const img = this.images[`/assets/${meta.assets.alive}`];
        const isReady = img instanceof HTMLCanvasElement || 
            (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0);
        
        if (img && isReady) {
            const w = TILE_SIZE * 1.2;
            const h = TILE_SIZE * 1.2;
            const yOffset = TILE_SIZE * 0.2;
            this.ctx.drawImage(img, screenX, screenY - yOffset, w, h);
            
            // Draw health bar if damaged
            if (animal.hp !== undefined) {
                this.drawHealthBar(screenX, screenY - yOffset - 5, TILE_SIZE, animal.hp, meta.hp || 100);
            }
        } else {
            // Fallback circle
            this.ctx.fillStyle = '#E91E63';
            this.ctx.beginPath();
            this.ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // Biome color definitions with texture colors
    private biomeColors: Record<string, { fill: string; stroke: string; detail: string; detail2: string }> = {
        grassland: { fill: '#4CAF50', stroke: 'rgba(0,0,0,0.03)', detail: '#66BB6A', detail2: '#388E3C' },
        forest: { fill: '#2E7D32', stroke: 'rgba(0,0,0,0.05)', detail: '#43A047', detail2: '#1B5E20' },
        desert: { fill: '#D4A54A', stroke: 'rgba(0,0,0,0.02)', detail: '#E0B76B', detail2: '#C49A38' },
        swamp: { fill: '#5D7A54', stroke: 'rgba(0,0,0,0.06)', detail: '#6B8B60', detail2: '#4A6344' },
        water: { fill: '#2196F3', stroke: 'rgba(0,0,0,0.04)', detail: '#64B5F6', detail2: '#1976D2' }
    };

    // Simple seeded random for consistent tile textures
    private seededRandom(x: number, y: number, seed: number = 0): number {
        const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
        return n - Math.floor(n);
    }

    private drawTiles(world: WorldData, offsetX: number, offsetY: number, TILE_SIZE: number): void {
        for (let y = 0; y < world.tiles.length; y++) {
            for (let x = 0; x < world.tiles[y].length; x++) {
                const screenX = x * TILE_SIZE + offsetX;
                const screenY = y * TILE_SIZE + offsetY;

                if (screenX + TILE_SIZE < 0 || screenX > this.canvas.width ||
                    screenY + TILE_SIZE < 0 || screenY > this.canvas.height) continue;

                const biome = world.tiles[y][x];
                const colors = this.biomeColors[biome] || this.biomeColors.grassland;
                
                // Draw biome base color
                this.ctx.fillStyle = colors.fill;
                this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                
                // Draw texture details based on biome
                this.drawTileTexture(screenX, screenY, TILE_SIZE, x, y, biome, colors);
                
                // Draw subtle grid
                this.ctx.strokeStyle = colors.stroke;
                this.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                
                // Draw floor objects (like grass) on top of tiles but below players
                const key = `${x},${y}`;
                const obj = world.objects[key];
                if (obj) {
                    const meta = this.getObjectMetadata(obj);
                    if (meta && (meta as any).isFloor) {
                        const img = this.getObjectImage(obj);
                        const isReady = img instanceof HTMLCanvasElement || 
                            (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0);
                        if (img && isReady) {
                            this.ctx.drawImage(img, screenX, screenY, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
            }
        }
    }

    private drawTileTexture(
        screenX: number, screenY: number, TILE_SIZE: number,
        tileX: number, tileY: number, biome: string,
        colors: { fill: string; stroke: string; detail: string; detail2: string }
    ): void {
        const ctx = this.ctx;
        
        if (biome === 'grassland' || biome === 'forest') {
            // Draw small grass tufts
            for (let i = 0; i < 6; i++) {
                const rx = this.seededRandom(tileX, tileY, i * 3) * (TILE_SIZE - 8) + 4;
                const ry = this.seededRandom(tileX, tileY, i * 3 + 1) * (TILE_SIZE - 8) + 4;
                const size = 3 + this.seededRandom(tileX, tileY, i * 3 + 2) * 4;
                
                ctx.strokeStyle = this.seededRandom(tileX, tileY, i * 5) > 0.5 ? colors.detail : colors.detail2;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(screenX + rx, screenY + ry + size);
                ctx.quadraticCurveTo(screenX + rx - 2, screenY + ry + size/2, screenX + rx, screenY + ry);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(screenX + rx, screenY + ry + size);
                ctx.quadraticCurveTo(screenX + rx + 2, screenY + ry + size/2, screenX + rx + 1, screenY + ry + 1);
                ctx.stroke();
            }
        } else if (biome === 'desert') {
            // Draw sand dots/pebbles
            for (let i = 0; i < 4; i++) {
                const rx = this.seededRandom(tileX, tileY, i * 2) * (TILE_SIZE - 6) + 3;
                const ry = this.seededRandom(tileX, tileY, i * 2 + 1) * (TILE_SIZE - 6) + 3;
                ctx.fillStyle = this.seededRandom(tileX, tileY, i * 4) > 0.5 ? colors.detail : colors.detail2;
                ctx.beginPath();
                ctx.arc(screenX + rx, screenY + ry, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (biome === 'swamp') {
            // Draw murky water patches
            for (let i = 0; i < 3; i++) {
                const rx = this.seededRandom(tileX, tileY, i * 2) * (TILE_SIZE - 12) + 6;
                const ry = this.seededRandom(tileX, tileY, i * 2 + 1) * (TILE_SIZE - 12) + 6;
                const size = 4 + this.seededRandom(tileX, tileY, i * 3) * 6;
                ctx.fillStyle = 'rgba(60, 80, 50, 0.3)';
                ctx.beginPath();
                ctx.ellipse(screenX + rx, screenY + ry, size, size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (biome === 'water') {
            // Draw water ripples/waves
            const time = Date.now() / 1000;
            for (let i = 0; i < 3; i++) {
                const baseX = this.seededRandom(tileX, tileY, i * 2) * (TILE_SIZE - 16) + 8;
                const baseY = this.seededRandom(tileX, tileY, i * 2 + 1) * (TILE_SIZE - 16) + 8;
                // Animate wave position slightly
                const waveOffset = Math.sin(time + tileX * 0.5 + tileY * 0.3 + i) * 2;
                ctx.strokeStyle = colors.detail;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(screenX + baseX + waveOffset, screenY + baseY, 6 + i * 2, 0, Math.PI);
                ctx.stroke();
            }
            // Add shimmer highlight
            const shimmerX = this.seededRandom(tileX, tileY, 99) * (TILE_SIZE - 10) + 5;
            const shimmerY = this.seededRandom(tileX, tileY, 100) * (TILE_SIZE - 10) + 5;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX + shimmerX, screenY + shimmerY, 4, 2, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawObject(obj: number, screenX: number, screenY: number, TILE_SIZE: number, data?: any): void {
        const img = this.getObjectImage(obj);
        const meta = this.getObjectMetadata(obj);

        const isReady = img instanceof HTMLCanvasElement || 
            (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0);

        if (img && isReady) {
            let w = TILE_SIZE, h = TILE_SIZE, yOffset = 0;
            if (meta) {
                if ((meta as any).isLarge) {
                    const scale = (meta as any).size || 2;
                    // Preserve aspect ratio of the original image
                    const naturalWidth = img instanceof HTMLImageElement ? img.naturalWidth || 1 : img.width;
                    const naturalHeight = img instanceof HTMLImageElement ? img.naturalHeight || 1 : img.height;
                    const imgAspect = naturalWidth / naturalHeight;
                    h = TILE_SIZE * scale;
                    w = h * imgAspect;
                    yOffset = (meta as any).yOffset || TILE_SIZE;
                    // Center horizontally on the tile
                    screenX = screenX + (TILE_SIZE - w) / 2;
                } else if (meta.category === 'animal') {
                    w = TILE_SIZE * 1.2; h = TILE_SIZE * 1.2; yOffset = TILE_SIZE * 0.2;
                }
            }
            this.ctx.drawImage(img, screenX, screenY - yOffset, w, h);

            // Draw burial info for Grave or Bones
            if (data?.buriedName || data?.name) {
                const nameText = data.buriedName || data.name;
                const ageText = data.buriedAge !== undefined ? data.buriedAge : (data.age !== undefined ? data.age : "?");
                
                this.ctx.save();
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText(`${nameText} (${ageText})`, screenX + TILE_SIZE / 2, screenY - yOffset - 5);
                this.ctx.restore();
            }

            if (data?.hp !== undefined && meta?.category === 'animal') {
                this.drawHealthBar(screenX, screenY - yOffset - 5, TILE_SIZE, data.hp, (meta as Animal).hp || 100);
            }
            if (data?.inventory?.length > 0) {
                data.inventory.forEach((itemType: number, index: number) => {
                    const subImg = this.getObjectImage(itemType);
                    const subIsReady = subImg instanceof HTMLCanvasElement || (subImg instanceof HTMLImageElement && subImg.complete);
                    if (subImg && subIsReady) this.ctx.drawImage(subImg, screenX + 5 + (index * 15), screenY + 10, 20, 20);
                });
            }
        } else {
            this.ctx.fillStyle = meta?.category === 'animal' ? '#E91E63' :
                (meta?.name === 'Tree' ? '#795548' : (meta?.name === 'Rock' ? '#9E9E9E' : 'black'));
            this.ctx.beginPath();
            this.ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    private drawHealthBar(x: number, y: number, tileSize: number, hp: number, maxHp: number): void {
        const barWidth = tileSize * 0.8, barHeight = 4;
        const barX = x + (tileSize - barWidth) / 2;
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(barX, y, barWidth, barHeight);
        const hpPercent = Math.max(0, hp / maxHp);
        this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.2 ? '#FFC107' : '#F44336';
        this.ctx.fillRect(barX, y, barWidth * hpPercent, barHeight);
    }

    private drawProjectiles(projectiles: ProjectileData[], offsetX: number, offsetY: number): void {
        projectiles.forEach(proj => {
            const px = proj.x + offsetX, py = proj.y + offsetY;
            const img = this.getObjectImage(proj.type);
            const isReady = img instanceof HTMLCanvasElement || 
                (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0);
            if (img && isReady) {
                this.ctx.save();
                this.ctx.translate(px, py);
                this.ctx.rotate(proj.angle + Math.PI / 4);
                this.ctx.drawImage(img, -10, -10, 20, 20);
                this.ctx.restore();
            }
        });
    }
}
