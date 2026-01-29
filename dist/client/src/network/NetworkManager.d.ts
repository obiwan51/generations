import { Socket } from 'socket.io-client';
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
        backpackData?: {
            inventory: number[];
        } | null;
    }) => void;
    onWorldUpdate?: (data: {
        x: number;
        y: number;
        type: number | null;
        data?: any;
    }) => void;
    onPlayerDied?: (data: {
        id: string;
    }) => void;
    onPlayerDisconnected?: (id: string) => void;
    onSeasonChange?: (season: Season) => void;
    onProjectileUpdate?: (projectiles: ProjectileData[]) => void;
    onChatMsg?: (data: {
        id: string;
        name: string;
        text: string;
    }) => void;
    onDeathScreen?: (stats: {
        name: string;
        age: number;
        experience: number;
        cause: string;
        mother: string;
    }) => void;
    onTextMessage?: (data: {
        text: string;
    }) => void;
    onNameBaby?: (data: {
        babyId: string;
        gender: 'male' | 'female';
        message: string;
    }) => void;
    onNameError?: (data: {
        message: string;
    }) => void;
    onNameSuccess?: (data: {
        babyId: string;
        name: string;
    }) => void;
}
/**
 * NetworkManager - Handles all socket.io communication
 */
export declare class NetworkManager {
    private socket;
    private callbacks;
    constructor();
    getSocket(): Socket;
    setCallbacks(callbacks: NetworkCallbacks): void;
    private setupListeners;
    emit(event: string, data?: any): void;
}
