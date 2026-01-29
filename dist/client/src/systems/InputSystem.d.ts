import { Socket } from 'socket.io-client';
import { AudioSystem } from './AudioSystem.js';
import { RegistryData, RuntimeRecipe } from '../../../shared/types.js';
export type InputAction = 'move' | 'eat' | 'pickUp' | 'drop' | 'use' | 'shoot' | 'toggleRecipeBook';
export interface InputCallbacks {
    onMove?: (dx: number, dy: number) => void;
    onEat?: () => void;
    onPickUp?: () => void;
    onDrop?: () => void;
    onDropBackpack?: () => void;
    onUse?: () => void;
    onShoot?: (angle: number) => void;
    onToggleRecipeBook?: () => void;
    onChatFocus?: () => void;
    onShowObjectActions?: (objectId: number | null, holding: number | null) => void;
}
export interface PlayerData {
    x: number;
    y: number;
    holding: number | null;
}
export interface FullPlayerData extends PlayerData {
    id: string;
    age: number;
    heldBy?: string | null;
}
export interface WorldData {
    objects: Record<string, number>;
}
/**
 * InputSystem - Handles keyboard and mouse input with contextual actions
 */
export declare class InputSystem {
    private keys;
    private isChatting;
    private canvas;
    private socket;
    private audio;
    private callbacks;
    private registry;
    private recipes;
    private getPlayerHolding;
    private getPlayerData;
    private getWorldData;
    private getPlayersData;
    private getMyId;
    private targetPosition;
    private bounceState;
    constructor(canvas: HTMLCanvasElement, socket: Socket, audio: AudioSystem);
    setCallbacks(callbacks: InputCallbacks): void;
    setPlayerHoldingGetter(getter: () => number | null): void;
    setPlayerDataGetter(getter: () => PlayerData | null): void;
    setWorldDataGetter(getter: () => WorldData | null): void;
    setPlayersDataGetter(getter: () => Record<string, FullPlayerData> | null): void;
    setMyIdGetter(getter: () => string | null): void;
    setRegistry(registry: RegistryData): void;
    setRecipes(recipes: RuntimeRecipe[]): void;
    private getItemIdByKey;
    setChatting(chatting: boolean): void;
    isChatMode(): boolean;
    private setupListeners;
    /**
     * Handle contextual mouse click based on what's at the click location
     */
    private handleContextualClick;
    /**
     * Get baby (young player not being held) at world position
     */
    private getBabyAtPosition;
    /**
     * Get object at world position
     */
    private getObjectAtPosition;
    /**
     * Get object metadata by ID
     */
    private getObjectMetadataById;
    /**
     * Get the category of an object (item, resource, or animal)
     */
    private getObjectCategory;
    /**
     * Check if there's a bare-hands recipe for the given target object
     */
    private hasBareHandsRecipe;
    /**
     * Process input state and emit events - call this every frame
     */
    update(): void;
}
