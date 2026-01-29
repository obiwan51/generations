/**
 * Game Client - Thin orchestrator that wires together all systems
 */
import { RuntimeRecipe } from '../../shared/types.js';
import { NetworkManager } from './network/NetworkManager.js';
import { AudioSystem, InputSystem, UISystem, RenderSystem, PlayerData, WorldData, ProjectileData, Season } from './systems/index.js';

// Game state
let myId: string | null = null;
let players: Record<string, PlayerData> = {};
let world: WorldData | null = null;
let projectiles: ProjectileData[] = [];
let currentSeason: Season = 'spring';
let serverRecipes: RuntimeRecipe[] = [];
let isAlive = false;

// Session management
const SESSION_TOKEN_KEY = 'onelife_session_token';

// Get session token (don't create if missing)
function getSessionToken(): string | null {
    return localStorage.getItem(SESSION_TOKEN_KEY);
}

// Clear session token (on permanent death)
function clearSessionToken(): void {
    localStorage.removeItem(SESSION_TOKEN_KEY);
}

// // Warn before page unload if player is alive
// window.addEventListener('beforeunload', (e) => {
//     if (isAlive && myId && players[myId] && !players[myId].isDead) {
//         e.preventDefault();
//         e.returnValue = 'Your character will die if you leave. Are you sure?';
//         return e.returnValue;
//     }
// });

// Initialize canvas
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
// Initial size (will be updated by RenderSystem)
canvas.width = Math.min(window.innerWidth, 1280);
canvas.height = Math.min(window.innerHeight, 900);

// Initialize systems
const network = new NetworkManager();
const audio = new AudioSystem();
const render = new RenderSystem(canvas, ctx);
const ui = new UISystem(network.getSocket(), (type) => render.getObjectName(type));
const input = new InputSystem(canvas, network.getSocket(), audio);

// Send session token to attempt reconnection (only if we have one)
const sessionToken = getSessionToken();
if (sessionToken) {
    network.emit('requestReconnect', { sessionToken });
} else {
    // No session token - request new birth
    network.emit('requestBirth');
}

// Wire up chat focus
ui.setOnChatFocusChange((focused) => input.setChatting(focused));
input.setCallbacks({
    onChatFocus: () => ui.focusChat(),
    onToggleRecipeBook: () => ui.toggleRecipeBook(serverRecipes),
    onShowObjectActions: (objectId, holding) => ui.showObjectActions(objectId, holding)
});
input.setPlayerHoldingGetter(() => myId && players[myId] ? players[myId].holding : null);
input.setPlayerDataGetter(() => myId && players[myId] ? { 
    x: players[myId].x, 
    y: players[myId].y, 
    holding: players[myId].holding 
} : null);
input.setWorldDataGetter(() => world ? { objects: world.objects } : null);
input.setPlayersDataGetter(() => players as any);
input.setMyIdGetter(() => myId);

// Network callbacks
network.setCallbacks({
    onInit: (data) => {
        players = data.players;
        world = data.world;
        currentSeason = data.season;
        myId = data.myId;
        serverRecipes = data.recipes;
        render.setRegistry(data.registry);
        input.setRegistry(data.registry);
        input.setRecipes(data.recipes);
        ui.setRecipes(data.recipes);
        render.setWeatherEnabled(data.config.weatherEnabled !== false);
        ui.updateSeason(currentSeason);
        isAlive = true;
        
        // Debug: Log player position on init
        if (data.reconnected && myId && players[myId]) {
            console.log('[Reconnect] Player position:', players[myId].x, players[myId].y);
        }
        
        // Save session token from server (for new births or reconnections)
        if (data.sessionToken) {
            localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
        }
        
        // Notify if reconnected
        if (data.reconnected) {
            ui.showNotification('You have been reconnected to your character!');
        }
    },
    onNewPlayer: (player) => { players[player.id] = player; },
    onPlayerMoved: (player) => { players[player.id] = player; },
    onPlayerStatUpdate: (data) => {
        if (players[data.id]) {
            if (data.age !== undefined) players[data.id].age = data.age;
            if (data.hunger !== undefined) players[data.id].hunger = data.hunger;
            if (data.maxHunger !== undefined) players[data.id].maxHunger = data.maxHunger;
            if (data.holding !== undefined) players[data.id].holding = data.holding;
            if (data.holdingData !== undefined) players[data.id].holdingData = data.holdingData;
            if (data.heldBy !== undefined) players[data.id].heldBy = data.heldBy;
            if (data.holdingPlayerId !== undefined) players[data.id].holdingPlayerId = data.holdingPlayerId;
            if (data.name !== undefined) players[data.id].name = data.name;
            if (data.inBoat !== undefined) players[data.id].inBoat = data.inBoat;
            if (data.isDead !== undefined) players[data.id].isDead = data.isDead;
            if (data.backpack !== undefined) players[data.id].backpack = data.backpack;
            if (data.backpackData !== undefined) players[data.id].backpackData = data.backpackData;
        }
    },
    onWorldUpdate: (data) => {
        if (!world) return;
        const key = `${data.x},${data.y}`;
        if (data.type === null) {
            delete world.objects[key];
            delete world.objectsData[key];
        } else {
            world.objects[key] = data.type;
            if (data.data) world.objectsData[key] = data.data;
            else delete world.objectsData[key];
        }
    },
    onPlayerDied: (data) => { 
        delete players[data.id];
        if (data.id === myId) {
            isAlive = false;
            clearSessionToken(); // Clear token so they get a new character next time
        }
    },
    onPlayerDisconnected: (id) => { delete players[id]; },
    onSeasonChange: (season) => { currentSeason = season; ui.updateSeason(season); },
    onProjectileUpdate: (data) => { projectiles = data; },
    onChatMsg: (data) => {
        if (players[data.id]) {
            players[data.id].lastMsg = data.text;
            players[data.id].lastMsgTime = Date.now();
        }
        ui.addChatMessage(data.name, data.text);
    },
    onDeathScreen: (stats) => {
        clearSessionToken(); // Clear session on permanent death
        ui.showDeathScreen(stats);
    },
    onTextMessage: (data) => ui.showNotification(data.text),
    onNameBaby: (data) => ui.showNamingModal(data),
    onNameError: (data) => ui.showNameError(data.message),
    onNameSuccess: () => ui.hideNamingModal()
});

// Game loop
function loop(): void {
    try {
        input.update();

        // Update HUD
        if (myId && players[myId]) {
            const p = players[myId];
            ui.updatePlayerStats({
                age: p.age,
                hunger: p.hunger,
                maxHunger: p.maxHunger || 20,
                experience: (p as any).experience || 0,
                x: p.x,
                y: p.y,
                holding: p.holding,
                holdingData: p.holdingData,
                heldBy: p.heldBy,
                holdingPlayerId: p.holdingPlayerId
            });
        }

        render.draw(world, players, projectiles, myId, currentSeason);
    } catch (e) {
        console.error("Game loop error:", e);
    }
    requestAnimationFrame(loop);
}

loop();
