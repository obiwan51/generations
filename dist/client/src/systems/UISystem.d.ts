import { Socket } from 'socket.io-client';
import { RuntimeRecipe } from '../../../shared/types.js';
import { Season } from './WeatherSystem.js';
export interface PlayerStats {
    age: number;
    hunger: number;
    maxHunger: number;
    experience: number;
    x: number;
    y: number;
    holding: number | null;
    holdingData?: {
        inventory?: number[];
        babyId?: string;
        usesRemaining?: number;
    };
    heldBy?: string | null;
    holdingPlayerId?: string | null;
}
export interface DeathStats {
    name: string;
    age: number;
    experience: number;
    cause: string;
    mother: string;
}
export interface NameBabyData {
    babyId: string;
    gender: 'male' | 'female';
    message: string;
}
/**
 * UISystem - Handles all HUD and menu updates
 */
export declare class UISystem {
    private chatInput;
    private chatDisplay;
    private socket;
    private getObjectName;
    private onChatFocusChange?;
    private currentBabyId;
    private actionPopup;
    private actionContent;
    private hideTimer;
    private availableRecipes;
    constructor(socket: Socket, getObjectName: (type: number) => string);
    setOnChatFocusChange(callback: (focused: boolean) => void): void;
    setRecipes(recipes: RuntimeRecipe[]): void;
    focusChat(): void;
    private setupChatListeners;
    private setupNamingModal;
    private submitBabyName;
    showNamingModal(data: NameBabyData): void;
    hideNamingModal(): void;
    showNameError(message: string): void;
    addChatMessage(name: string, text: string): void;
    showDeathScreen(stats: DeathStats): void;
    showNotification(text: string, duration?: number): void;
    updateSeason(season: Season): void;
    updatePlayerStats(stats: PlayerStats): void;
    populateRecipes(recipes: RuntimeRecipe[]): void;
    toggleRecipeBook(recipes: RuntimeRecipe[]): void;
    private setupActionPopup;
    showObjectActions(objectId: number | null, holding: number | null): void;
    hideActionPopup(): void;
    private findMatchingRecipes;
}
