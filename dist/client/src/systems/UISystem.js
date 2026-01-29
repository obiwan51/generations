/**
 * UISystem - Handles all HUD and menu updates
 */
export class UISystem {
    chatInput;
    chatDisplay;
    socket;
    getObjectName;
    onChatFocusChange;
    currentBabyId = null;
    actionPopup;
    actionContent;
    hideTimer = null;
    availableRecipes = [];
    constructor(socket, getObjectName) {
        this.socket = socket;
        this.getObjectName = getObjectName;
        this.chatInput = document.getElementById('chat-input');
        this.chatDisplay = document.getElementById('chat-display');
        this.setupChatListeners();
        this.setupNamingModal();
        this.setupActionPopup();
    }
    setOnChatFocusChange(callback) {
        this.onChatFocusChange = callback;
    }
    setRecipes(recipes) {
        this.availableRecipes = recipes;
    }
    focusChat() {
        this.chatInput.focus();
    }
    setupChatListeners() {
        this.chatInput.addEventListener('focus', () => {
            this.onChatFocusChange?.(true);
        });
        this.chatInput.addEventListener('blur', () => {
            this.onChatFocusChange?.(false);
        });
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = this.chatInput.value.trim();
                if (text) {
                    this.socket.emit('chat', text);
                    this.chatInput.value = '';
                }
                this.chatInput.blur();
            }
            e.stopPropagation();
        });
    }
    setupNamingModal() {
        const confirmBtn = document.getElementById('confirm-name-btn');
        const nameInput = document.getElementById('baby-name-input');
        if (confirmBtn && nameInput) {
            confirmBtn.addEventListener('click', () => this.submitBabyName());
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.submitBabyName();
                }
                e.stopPropagation();
            });
        }
    }
    submitBabyName() {
        const nameInput = document.getElementById('baby-name-input');
        const errorEl = document.getElementById('name-error');
        if (!nameInput || !this.currentBabyId)
            return;
        const name = nameInput.value.trim();
        // Client-side validation
        if (!name) {
            if (errorEl)
                errorEl.textContent = 'Please enter a name';
            return;
        }
        if (name.length > 20) {
            if (errorEl)
                errorEl.textContent = 'Name must be 20 characters or less';
            return;
        }
        if (/\s/.test(name)) {
            if (errorEl)
                errorEl.textContent = 'Name must be a single word';
            return;
        }
        if (!/^[a-zA-ZÀ-ÿ]+$/.test(name)) {
            if (errorEl)
                errorEl.textContent = 'Name must contain only letters';
            return;
        }
        // Clear any previous error
        if (errorEl)
            errorEl.textContent = '';
        // Send to server - modal stays open until server confirms success
        this.socket.emit('nameBaby', { babyId: this.currentBabyId, name });
    }
    showNamingModal(data) {
        const modal = document.getElementById('name-baby-modal');
        const message = document.getElementById('name-baby-message');
        const nameInput = document.getElementById('baby-name-input');
        const errorEl = document.getElementById('name-error');
        if (modal && message && nameInput) {
            this.currentBabyId = data.babyId;
            message.textContent = data.message;
            nameInput.value = '';
            if (errorEl)
                errorEl.textContent = '';
            modal.style.display = 'flex';
            nameInput.focus();
            this.onChatFocusChange?.(true); // Block game input
        }
    }
    hideNamingModal() {
        const modal = document.getElementById('name-baby-modal');
        if (modal) {
            modal.style.display = 'none';
            this.currentBabyId = null;
            this.onChatFocusChange?.(false); // Restore game input
        }
    }
    showNameError(message) {
        const errorEl = document.getElementById('name-error');
        if (errorEl)
            errorEl.textContent = message;
    }
    addChatMessage(name, text) {
        const div = document.createElement('div');
        div.className = 'chat-msg';
        div.innerHTML = `<span class="name">${name}:</span> ${text}`;
        this.chatDisplay.prepend(div);
        if (this.chatDisplay.children.length > 50 && this.chatDisplay.lastChild) {
            this.chatDisplay.removeChild(this.chatDisplay.lastChild);
        }
    }
    showDeathScreen(stats) {
        const screen = document.getElementById('death-screen');
        const summary = document.getElementById('death-summary');
        if (screen)
            screen.style.display = 'flex';
        if (summary) {
            summary.innerHTML = `
                <strong>${stats.name}</strong><br><br>
                You lived to be <strong>${stats.age}</strong> years old.<br>
                Experience gained: <strong>${stats.experience || 0}</strong> XP.<br>
                Cause of death: <strong>${stats.cause}</strong>.<br>
                Your mother was <strong>${stats.mother}</strong>.<br><br>
                <em>Life is short, but the world remembers your passing.</em>
            `;
        }
        // Hide stats
        const statsEl = document.getElementById('stats-container');
        if (statsEl)
            statsEl.style.display = 'none';
    }
    showNotification(text, duration = 5000) {
        const ui = document.getElementById('ui');
        if (!ui)
            return;
        const msg = document.createElement('div');
        msg.className = 'notification';
        msg.innerText = text;
        ui.appendChild(msg);
        setTimeout(() => msg.remove(), duration);
    }
    updateSeason(season) {
        const el = document.getElementById('seasonVal');
        if (!el)
            return;
        el.innerText = season.charAt(0).toUpperCase() + season.slice(1);
        const colors = {
            spring: '#4caf50',
            summer: '#ffeb3b',
            autumn: '#ff9800',
            winter: '#2196f3'
        };
        el.style.color = colors[season];
    }
    updatePlayerStats(stats) {
        const ageVal = document.getElementById('ageVal');
        const expVal = document.getElementById('expVal');
        const hungerBar = document.getElementById('hungerBar');
        const coords = document.getElementById('coords');
        const holdingVal = document.getElementById('holdingVal');
        if (ageVal)
            ageVal.innerText = String(stats.age);
        if (expVal)
            expVal.innerText = String(stats.experience || 0);
        const hungerPercent = (stats.hunger / stats.maxHunger) * 100;
        if (hungerBar)
            hungerBar.style.width = `${hungerPercent}%`;
        if (coords)
            coords.innerText = `Pos: ${Math.round(stats.x)}, ${Math.round(stats.y)}`;
        // Update holding UI
        let holdingName = 'None';
        if (stats.holding) {
            holdingName = this.getObjectName(stats.holding);
            if (stats.holdingData?.inventory) {
                holdingName += ` (${stats.holdingData.inventory.length}/3)`;
            }
            else if (stats.holdingData?.usesRemaining !== undefined) {
                holdingName += ` (${stats.holdingData.usesRemaining} uses)`;
            }
        }
        if (holdingVal)
            holdingVal.innerText = holdingName;
    }
    populateRecipes(recipes) {
        const list = document.getElementById('recipe-list');
        if (!list)
            return;
        list.innerHTML = '';
        recipes.forEach(recipe => {
            const item = document.createElement('div');
            item.style.marginBottom = '8px';
            item.style.fontSize = '12px';
            const toolName = recipe.tool === null ? '✋ Bare Hands' : this.getObjectName(recipe.tool);
            item.innerHTML = `
                <strong style="color: #4caf50;">${this.getObjectName(recipe.result)}</strong><br/>
                <span style="color: #aaa;">${toolName} + ${this.getObjectName(recipe.target)}</span>
            `;
            list.appendChild(item);
        });
    }
    toggleRecipeBook(recipes) {
        const book = document.getElementById('recipe-book');
        if (book) {
            book.style.display = book.style.display === 'none' ? 'block' : 'none';
            if (book.style.display === 'block') {
                this.availableRecipes = recipes;
                this.populateRecipes(recipes);
            }
        }
    }
    setupActionPopup() {
        this.actionPopup = document.createElement('div');
        this.actionPopup.className = 'action-popup';
        this.actionPopup.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            border: 2px solid #8b7355;
            font-family: Arial, sans-serif;
            font-size: 14px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            min-width: 200px;
            max-width: 300px;
            z-index: 1000;
        `;
        this.actionContent = document.createElement('div');
        this.actionPopup.appendChild(this.actionContent);
        document.body.appendChild(this.actionPopup);
    }
    showObjectActions(objectId, holding) {
        if (this.hideTimer !== null) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        // Hide popup if no object
        if (objectId === null) {
            this.hideActionPopup();
            return;
        }
        const recipes = this.findMatchingRecipes(objectId, holding);
        const objectName = this.getObjectName(objectId);
        let html = `<div style="font-weight: bold; margin-bottom: 8px;">${objectName}</div>`;
        if (recipes.length > 0) {
            html += '<div style="font-size: 12px; color: #aaa; margin-bottom: 6px;">Available recipes:</div>';
            recipes.forEach(recipe => {
                const resultName = this.getObjectName(recipe.result);
                const toolName = holding ? this.getObjectName(holding) : null;
                html += `<div style="margin: 4px 0; padding: 4px; background: rgba(139, 115, 85, 0.2); border-radius: 4px;">`;
                html += `<span style="color: #8b7355;">→</span> `;
                if (toolName) {
                    html += `<span style="color: #ffd700;">${toolName}</span> + `;
                }
                html += `<span style="color: #90ee90;">${objectName}</span> `;
                html += `<span style="color: #8b7355;">→</span> `;
                html += `<span style="color: #87ceeb;">${resultName}</span>`;
                html += `</div>`;
            });
        }
        else {
            const targetObj = this.availableRecipes.find(r => r.target === objectId);
            if (targetObj) {
                html += '<div style="color: #888; margin-top: 6px; font-style: italic;">Need tool to use</div>';
            }
            else if (!holding) {
                html += '<div style="color: #87ceeb; margin-top: 6px;">👋 Pick up</div>';
            }
            else {
                html += '<div style="color: #888; margin-top: 6px; font-style: italic;">No recipes available</div>';
            }
        }
        this.actionContent.innerHTML = html;
        requestAnimationFrame(() => {
            this.actionPopup.style.opacity = '1';
            this.actionPopup.style.transform = 'translateY(0)';
        });
    }
    hideActionPopup() {
        this.actionPopup.style.opacity = '0';
        this.actionPopup.style.transform = 'translateY(20px)';
    }
    findMatchingRecipes(targetId, toolId) {
        if (!this.availableRecipes)
            return [];
        return this.availableRecipes.filter(recipe => {
            return recipe.target === targetId && recipe.tool === toolId;
        });
    }
}
//# sourceMappingURL=UISystem.js.map