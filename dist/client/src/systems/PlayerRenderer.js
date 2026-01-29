export class PlayerRenderer {
    ctx;
    images;
    getObjectImage;
    constructor(ctx, images, getObjectImage) {
        this.ctx = ctx;
        this.images = images;
        this.getObjectImage = getObjectImage;
    }
    draw(players, offsetX, offsetY, tileSize, myId) {
        for (const id in players) {
            this.drawSingle(players[id], offsetX, offsetY, tileSize, id === myId);
        }
    }
    drawSingle(p, offsetX, offsetY, tileSize, isMe = false) {
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
    drawShadow(px, py, size) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
        this.ctx.beginPath();
        this.ctx.ellipse(px, py + size / 3, size / 2, size / 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    drawSprite(p, px, py, size, isMe) {
        let playerImg;
        if (p.age < 5) {
            playerImg = this.images['baby'];
        }
        else {
            const gender = p.gender || 'female';
            playerImg = this.images[`player_${gender}`] || this.images['player'];
        }
        // Improved animation: Swaying + Bobbing
        const time = Date.now() * 0.005;
        const bob = Math.sin(time * 2) * 2;
        const sway = Math.sin(time) * 0.05; // Slight rotation
        const isReady = playerImg instanceof HTMLCanvasElement ||
            (playerImg instanceof HTMLImageElement && playerImg.complete && playerImg.naturalWidth > 0);
        if (playerImg && isReady) {
            this.ctx.save();
            // Apply sway rotation around bottom center
            this.ctx.translate(px, py + size / 2);
            this.ctx.rotate(sway);
            this.ctx.translate(-px, -(py + size / 2));
            if (isMe) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#4caf50';
            }
            // Draw slightly larger to account for new detail
            this.ctx.drawImage(playerImg, px - size / 2, py - size / 2 + bob, size, size);
            if (p.age >= 40 && p.gender === 'male') {
                const beardSize = Math.min((p.age - 40) / 30, 1.2);
                const whiteness = Math.min(255, (p.age - 40) * 4);
                this.ctx.fillStyle = `rgba(${whiteness},${whiteness},${whiteness}, 0.9)`;
                this.ctx.beginPath();
                // Adjusted beard coordinates for new face shape
                this.ctx.moveTo(px - size / 6, py + size / 20 + bob);
                this.ctx.lineTo(px + size / 6, py + size / 20 + bob);
                this.ctx.lineTo(px + size / 10, py + size / 4 * beardSize + bob);
                this.ctx.lineTo(px - size / 10, py + size / 4 * beardSize + bob);
                this.ctx.closePath();
                this.ctx.fill();
            }
            this.ctx.restore();
        }
        else {
            this.ctx.fillStyle = isMe ? '#4caf50' : '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(px, py, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    drawNameTag(p, px, py, size, scale) {
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
    drawHeldItem(p, px, py, size, scale) {
        if (!p.holding)
            return;
        const itemImg = this.getObjectImage(p.holding);
        const isReady = itemImg instanceof HTMLCanvasElement ||
            (itemImg instanceof HTMLImageElement && itemImg.complete && itemImg.naturalWidth > 0);
        if (itemImg && isReady) {
            const itemSize = size * 0.5;
            this.ctx.drawImage(itemImg, px + size / 4, py - size / 4, itemSize, itemSize);
            if (p.holdingData?.inventory?.length) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = `bold ${Math.max(8, 10 * scale)}px Arial`;
                this.ctx.fillText(String(p.holdingData.inventory.length), px + size / 2, py + size / 4);
            }
        }
    }
    drawBackpack(p, px, py, size, scale) {
        if (!p.backpack)
            return;
        const backpackImg = this.getObjectImage(p.backpack);
        const isReady = backpackImg instanceof HTMLCanvasElement ||
            (backpackImg instanceof HTMLImageElement && backpackImg.complete && backpackImg.naturalWidth > 0);
        if (backpackImg && isReady) {
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
    drawChatBubble(p, px, py) {
        if (p.lastMsg && p.lastMsgTime && Date.now() - p.lastMsgTime < 5000) {
            this.drawBubble(px, py - 60, p.lastMsg);
        }
        else if (p.hunger <= 5) {
            this.drawBubble(px, py - 60, "🍖?", true);
        }
    }
    drawBubble(x, y, text, isEmote = false) {
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
//# sourceMappingURL=PlayerRenderer.js.map