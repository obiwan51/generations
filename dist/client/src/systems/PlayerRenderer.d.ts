/**
 * PlayerRenderer - Handles drawing players on canvas
 */
export interface PlayerRenderData {
    id: string;
    x: number;
    y: number;
    name: string;
    gender?: 'male' | 'female';
    age: number;
    hunger: number;
    maxHunger?: number;
    holding: number | null;
    holdingData?: {
        inventory?: number[];
        babyId?: string;
    };
    heldBy?: string | null;
    holdingPlayerId?: string | null;
    backpack?: number | null;
    backpackData?: {
        inventory: number[];
    } | null;
    lastMsg?: string;
    lastMsgTime?: number;
    isDead?: boolean;
    inBoat?: boolean;
}
export declare class PlayerRenderer {
    private ctx;
    private images;
    private getObjectImage;
    constructor(ctx: CanvasRenderingContext2D, images: Record<string, CanvasImageSource>, getObjectImage: (type: number) => CanvasImageSource | null);
    draw(players: Record<string, PlayerRenderData>, offsetX: number, offsetY: number, tileSize: number, myId: string | null): void;
    drawSingle(p: PlayerRenderData, offsetX: number, offsetY: number, tileSize: number, isMe?: boolean): void;
    private drawShadow;
    private drawSprite;
    private drawNameTag;
    private drawHeldItem;
    private drawBackpack;
    private drawChatBubble;
    private drawBubble;
}
