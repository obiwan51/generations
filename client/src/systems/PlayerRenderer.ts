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
    holdingData?: { inventory?: number[]; babyId?: string };
    heldBy?: string | null;         // ID of player holding this baby
    holdingPlayerId?: string | null; // ID of baby being held
    backpack?: number | null;       // Container worn on back
    backpackData?: { inventory: number[] } | null;
    lastMsg?: string;
    lastMsgTime?: number;
    isDead?: boolean;
    inBoat?: boolean;
}

export class PlayerRenderer {
    private ctx: CanvasRenderingContext2D;
    private images: Record<string, HTMLImageElement>;
    private getObjectImage: (type: number) => HTMLImageElement | null;

    constructor(
        ctx: CanvasRenderingContext2D,
        images: Record<string, HTMLImageElement>,
        getObjectImage: (type: number) => HTMLImageElement | null
    ) {
        this.ctx = ctx;
        this.images = images;
        this.getObjectImage = getObjectImage;
    }

    draw(
        players: Record<string, PlayerRenderData>,
        offsetX: number,
        offsetY: number,
        tileSize: number,
        myId: string | null
    ): void {
        for (const id in players) {
            this.drawSingle(players[id], offsetX, offsetY, tileSize, id === myId);
        }
    }

    drawSingle(
        p: PlayerRenderData,
        offsetX: number,
        offsetY: number,
        tileSize: number,
        isMe: boolean = false
    ): void {
        const px = p.x + offsetX;
        const py = p.y + offsetY;

        const scale = 0.45 + (Math.min(p.age, 35) / 35) * 0.9;
        const size = tileSize * scale;

        this.drawShadow(px, py, size);
        this.drawBackpack(p, px, py, size, scale); // Draw backpack behind player
        this.drawSprite(p, px, py, size, isMe);
        this.drawNameTag(p, px, py, size, scale);
        this.drawHeldItem(p, px, py, size, scale);
        this.drawChatBubble(p, px, py);
    }

    private drawShadow(px: number, py: number, size: number): void {
        this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
        this.ctx.beginPath();
        this.ctx.ellipse(px, py + size / 3, size / 2, size / 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawSprite(p: PlayerRenderData, px: number, py: number, size: number, isMe: boolean): void {
        const playerImg = p.age < 5 ? this.images['baby'] : this.images['player'];
        const bob = Math.sin(Date.now() * 0.01) * 2;

        if (playerImg?.complete) {
            this.ctx.save();
            if (isMe) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#4caf50';
            }
            this.ctx.drawImage(playerImg, px - size / 2, py - size / 2 + bob, size, size);

            if (p.age >= 40) {
                const beardSize = Math.min((p.age - 40) / 30, 1.2);
                const whiteness = Math.min(255, (p.age - 40) * 4);
                this.ctx.fillStyle = `rgba(${whiteness},${whiteness},${whiteness}, 0.9)`;
                this.ctx.beginPath();
                this.ctx.moveTo(px - size / 4, py + size / 10 + bob);
                this.ctx.lineTo(px + size / 4, py + size / 10 + bob);
                this.ctx.lineTo(px + size / 8, py + size / 10 + (size / 2.5 * beardSize) + bob);
                this.ctx.lineTo(px - size / 8, py + size / 10 + (size / 2.5 * beardSize) + bob);
                this.ctx.closePath();
                this.ctx.fill();
            }
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = isMe ? '#4caf50' : '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(px, py, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    private drawNameTag(p: PlayerRenderData, px: number, py: number, size: number, scale: number): void {
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${Math.max(12, 14 * scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(p.name, px, py - (size / 1.2));
        this.ctx.shadowBlur = 0;

        this.ctx.font = `${Math.max(8, 10 * scale)}px Arial`;
        this.ctx.fillText(`Age: ${p.age}`, px, py - (size / 1.0));
    }

    private drawHeldItem(p: PlayerRenderData, px: number, py: number, size: number, scale: number): void {
        if (!p.holding) return;
        const itemImg = this.getObjectImage(p.holding);
        if (itemImg?.complete) {
            const itemSize = size * 0.5;
            this.ctx.drawImage(itemImg, px + size / 4, py - size / 4, itemSize, itemSize);
            if (p.holdingData?.inventory?.length) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = `bold ${Math.max(8, 10 * scale)}px Arial`;
                this.ctx.fillText(String(p.holdingData.inventory.length), px + size / 2, py + size / 4);
            }
        }
    }

    private drawBackpack(p: PlayerRenderData, px: number, py: number, size: number, scale: number): void {
        if (!p.backpack) return;
        const backpackImg = this.getObjectImage(p.backpack);
        if (backpackImg?.complete) {
            const backpackSize = size * 0.45;
            // Draw behind and below player (on back)
            const bob = Math.sin(Date.now() * 0.01) * 2;
            this.ctx.globalAlpha = 0.9;
            this.ctx.drawImage(backpackImg, px - size / 3, py + bob, backpackSize, backpackSize);
            this.ctx.globalAlpha = 1;
            // Show count of items in backpack
            if (p.backpackData?.inventory?.length) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = `bold ${Math.max(8, 10 * scale)}px Arial`;
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 2;
                this.ctx.fillText(String(p.backpackData.inventory.length), px - size / 6, py + backpackSize + bob);
                this.ctx.shadowBlur = 0;
            }
        }
    }

    private drawChatBubble(p: PlayerRenderData, px: number, py: number): void {
        if (p.lastMsg && p.lastMsgTime && Date.now() - p.lastMsgTime < 5000) {
            this.drawBubble(px, py - 60, p.lastMsg);
        } else if (p.hunger <= 5) {
            this.drawBubble(px, py - 60, "🍖?", true);
        }
    }

    private drawBubble(x: number, y: number, text: string, isEmote = false): void {
        this.ctx.font = isEmote ? 'bold 16px Arial' : '14px Arial';
        const metrics = this.ctx.measureText(text);
        const w = metrics.width + 20;
        const h = 25;

        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.roundRect(x - w / 2, y - h, w, h, 5);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x - 5, y);
        this.ctx.lineTo(x + 5, y);
        this.ctx.lineTo(x, y + 5);
        this.ctx.fill();

        this.ctx.fillStyle = isEmote ? '#ff5252' : 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y - 7);
    }
}
