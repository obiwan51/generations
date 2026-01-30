import { io, Socket } from 'socket.io-client';
import { RegistryData, GameConfig, RuntimeRecipe } from '../../../shared/types.js';
import { PlayerData, WorldData, ProjectileData } from '../systems/RenderSystem.js';
import { Season } from '../systems/WeatherSystem.js';

export interface InitData {
    players: Record<string, PlayerData>;
    world: WorldData;
    season: Season;
    myId: string;
    recipes: RuntimeRecipe[];
    config: GameConfig;
    registry: RegistryData;
    reconnected?: boolean;
    sessionToken?: string;
}

export interface NetworkCallbacks {
    onInit?: (data: InitData) => void;
    onNewPlayer?: (player: PlayerData) => void;
    onPlayerMoved?: (player: PlayerData) => void;
    onPlayerStatUpdate?: (data: { 
        id: string; 
        age?: number; 
        hunger?: number; 
        maxHunger?: number;
        holding?: number | null; 
        holdingData?: any;
        heldBy?: string | null;
        holdingPlayerId?: string | null;
        name?: string;
        isDead?: boolean;
        inBoat?: boolean;
        backpack?: number | null;
        backpackData?: { inventory: number[] } | null;
    }) => void;
    onWorldUpdate?: (data: { x: number; y: number; type: number | null; data?: any }) => void;
    onPlayerDied?: (data: { id: string }) => void;
    onPlayerDisconnected?: (id: string) => void;
    onSeasonChange?: (season: Season) => void;
    onProjectileUpdate?: (projectiles: ProjectileData[]) => void;
    onAnimalUpdate?: (animals: Array<{ id: string; type: number; x: number; y: number; hp?: number }>) => void;
    onChatMsg?: (data: { id: string; name: string; text: string }) => void;
    onDeathScreen?: (stats: { name: string; age: number; experience: number; cause: string; mother: string }) => void;
    onTextMessage?: (data: { text: string }) => void;
    onAnimalAttack?: (data: { animalName: string; damage: number; animalX: number; animalY: number }) => void;
    onNameBaby?: (data: { babyId: string; gender: 'male' | 'female'; message: string }) => void;
    onNameError?: (data: { message: string }) => void;
    onNameSuccess?: (data: { babyId: string; name: string }) => void;
}

/**
 * NetworkManager - Handles all socket.io communication
 */
export class NetworkManager {
    private socket: Socket;
    private callbacks: NetworkCallbacks = {};

    constructor() {
        // In development, connect to the server on a different port
        // In production, socket.io connects to the same origin
        const serverUrl = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:3001' : undefined);
        this.socket = io(serverUrl);
        this.setupListeners();
    }

    getSocket(): Socket {
        return this.socket;
    }

    setCallbacks(callbacks: NetworkCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    private setupListeners(): void {
        this.socket.on('init', (data: InitData) => {
            this.callbacks.onInit?.(data);
        });

        this.socket.on('newPlayer', (player: PlayerData) => {
            this.callbacks.onNewPlayer?.(player);
        });

        this.socket.on('playerMoved', (player: PlayerData) => {
            this.callbacks.onPlayerMoved?.(player);
        });

        this.socket.on('playerStatUpdate', (data) => {
            this.callbacks.onPlayerStatUpdate?.(data);
        });

        this.socket.on('worldUpdate', (data) => {
            this.callbacks.onWorldUpdate?.(data);
        });

        this.socket.on('playerDied', (data) => {
            this.callbacks.onPlayerDied?.(data);
        });

        this.socket.on('playerDisconnected', (id: string) => {
            this.callbacks.onPlayerDisconnected?.(id);
        });

        this.socket.on('seasonChange', (season: Season) => {
            this.callbacks.onSeasonChange?.(season);
        });

        this.socket.on('projectileUpdate', (projectiles: ProjectileData[]) => {
            this.callbacks.onProjectileUpdate?.(projectiles);
        });

        this.socket.on('animalUpdate', (animals) => {
            this.callbacks.onAnimalUpdate?.(animals);
        });

        this.socket.on('chatMsg', (data) => {
            this.callbacks.onChatMsg?.(data);
        });

        this.socket.on('deathScreen', (stats) => {
            this.callbacks.onDeathScreen?.(stats);
        });

        this.socket.on('textMessage', (data) => {
            this.callbacks.onTextMessage?.(data);
        });

        this.socket.on('animalAttack', (data) => {
            this.callbacks.onAnimalAttack?.(data);
        });

        this.socket.on('nameBaby', (data) => {
            this.callbacks.onNameBaby?.(data);
        });

        this.socket.on('nameError', (data) => {
            this.callbacks.onNameError?.(data);
        });

        this.socket.on('nameSuccess', (data) => {
            this.callbacks.onNameSuccess?.(data);
        });
    }

    // Emit methods for clarity
    emit(event: string, data?: any): void {
        this.socket.emit(event, data);
    }
}
