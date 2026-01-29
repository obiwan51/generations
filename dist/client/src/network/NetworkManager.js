import { io } from 'socket.io-client';
/**
 * NetworkManager - Handles all socket.io communication
 */
export class NetworkManager {
    socket;
    callbacks = {};
    constructor() {
        // In development, connect to the server on a different port
        // In production, socket.io connects to the same origin
        const serverUrl = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:3001' : undefined);
        this.socket = io(serverUrl);
        this.setupListeners();
    }
    getSocket() {
        return this.socket;
    }
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    setupListeners() {
        this.socket.on('init', (data) => {
            this.callbacks.onInit?.(data);
        });
        this.socket.on('newPlayer', (player) => {
            this.callbacks.onNewPlayer?.(player);
        });
        this.socket.on('playerMoved', (player) => {
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
        this.socket.on('playerDisconnected', (id) => {
            this.callbacks.onPlayerDisconnected?.(id);
        });
        this.socket.on('seasonChange', (season) => {
            this.callbacks.onSeasonChange?.(season);
        });
        this.socket.on('projectileUpdate', (projectiles) => {
            this.callbacks.onProjectileUpdate?.(projectiles);
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
    emit(event, data) {
        this.socket.emit(event, data);
    }
}
//# sourceMappingURL=NetworkManager.js.map