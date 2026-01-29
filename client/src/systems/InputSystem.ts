import { Socket } from 'socket.io-client';
import { AudioSystem } from './AudioSystem.js';
import { RegistryData, Item, RuntimeRecipe } from '../../../shared/types.js';

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
export class InputSystem {
    private keys: Record<string, boolean> = {};
    private isChatting = false;
    private canvas: HTMLCanvasElement;
    private socket: Socket;
    private audio: AudioSystem;
    private callbacks: InputCallbacks = {};
    private registry: RegistryData | null = null;
    private recipes: RuntimeRecipe[] = [];

    // Player and world state for contextual actions
    private getPlayerHolding: () => number | null = () => null;
    private getPlayerData: () => PlayerData | null = () => null;
    private getWorldData: () => WorldData | null = () => null;
    private getPlayersData: () => Record<string, FullPlayerData> | null = () => null;
    private getMyId: () => string | null = () => null;

    // Target position for click-to-move
    private targetPosition: { x: number; y: number } | null = null;
    
    // Bounce-to-use state
    private bounceState: {
        originalPosition: { x: number; y: number };
        targetObject: { x: number; y: number };
        phase: 'moving-to' | 'using' | 'moving-back';
        useTimer: number;
    } | null = null;

    constructor(
        canvas: HTMLCanvasElement,
        socket: Socket,
        audio: AudioSystem
    ) {
        this.canvas = canvas;
        this.socket = socket;
        this.audio = audio;
        this.setupListeners();
    }

    setCallbacks(callbacks: InputCallbacks): void {
        this.callbacks = callbacks;
    }

    setPlayerHoldingGetter(getter: () => number | null): void {
        this.getPlayerHolding = getter;
    }

    setPlayerDataGetter(getter: () => PlayerData | null): void {
        this.getPlayerData = getter;
    }

    setWorldDataGetter(getter: () => WorldData | null): void {
        this.getWorldData = getter;
    }

    setPlayersDataGetter(getter: () => Record<string, FullPlayerData> | null): void {
        this.getPlayersData = getter;
    }

    setMyIdGetter(getter: () => string | null): void {
        this.getMyId = getter;
    }

    setRegistry(registry: RegistryData): void {
        this.registry = registry;
    }

    setRecipes(recipes: RuntimeRecipe[]): void {
        this.recipes = recipes;
    }

    private getItemIdByKey(key: string): number | null {
        if (!this.registry) return null;
        const item = this.registry.items[key] as Item | undefined;
        return item?.id ?? null;
    }

    setChatting(chatting: boolean): void {
        this.isChatting = chatting;
    }

    isChatMode(): boolean {
        return this.isChatting;
    }

    private setupListeners(): void {
        // Keyboard listeners
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Open chat with T or Enter
            if ((e.key === 't' || e.key === 'T' || e.key === 'Enter') && !this.isChatting) {
                e.preventDefault();
                this.callbacks.onChatFocus?.();
            }
            
            // Drop backpack with B
            if ((e.key === 'b' || e.key === 'B') && !this.isChatting) {
                e.preventDefault();
                this.socket.emit('dropBackpack');
            }
            
            // Add held item to backpack with G
            if ((e.key === 'g' || e.key === 'G') && !this.isChatting) {
                e.preventDefault();
                this.socket.emit('addToBackpack');
            }
            
            // Take item from backpack with H
            if ((e.key === 'h' || e.key === 'H') && !this.isChatting) {
                e.preventDefault();
                this.socket.emit('takeFromBackpack');
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Contextual mouse click handling
        window.addEventListener('mousedown', (e) => {
            if (this.isChatting) return;
            if (e.button !== 0) return; // Left click only

            this.handleContextualClick(e);
        });

        // Hover detection for action popup
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.callbacks.onShowObjectActions) return;
            
            const playerData = this.getPlayerData();
            if (!playerData) return;

            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            const worldX = mouseX - this.canvas.width / 2 + playerData.x;
            const worldY = mouseY - this.canvas.height / 2 + playerData.y;

            const hoveredObject = this.getObjectAtPosition(worldX, worldY);
            const holding = this.getPlayerHolding();

            if (hoveredObject) {
                this.callbacks.onShowObjectActions(hoveredObject, holding);
            } else {
                this.callbacks.onShowObjectActions(null, null);
            }
        });
    }

    /**
     * Handle contextual mouse click based on what's at the click location
     */
    private handleContextualClick(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const playerData = this.getPlayerData();
        if (!playerData) return;

        const screenCenterX = this.canvas.width / 2;
        const screenCenterY = this.canvas.height / 2;

        // Convert screen to world coords
        const worldX = playerData.x + (mouseX - screenCenterX);
        const worldY = playerData.y + (mouseY - screenCenterY);

        // Check if shift is held for attack
        const isShiftHeld = this.keys['shift'];

        // Get what's at this position
        const clickedObject = this.getObjectAtPosition(worldX, worldY);
        const holding = this.getPlayerHolding();
        
        // Get what's at player's current position
        const playerGridX = Math.floor(playerData.x / 64);
        const playerGridY = Math.floor(playerData.y / 64);
        const playerObject = this.getObjectAtPosition(playerData.x, playerData.y);
        
        // Get clicked object grid position
        const objectGridX = Math.floor(worldX / 64);
        const objectGridY = Math.floor(worldY / 64);
        
        // Check if clicking on same grid cell as player or adjacent
        const gridDistX = Math.abs(objectGridX - playerGridX);
        const gridDistY = Math.abs(objectGridY - playerGridY);
        const isPlayerCell = gridDistX === 0 && gridDistY === 0;
        const isAdjacent = gridDistX <= 1 && gridDistY <= 1;

        // Determine contextual action
        if (isShiftHeld && holding) {
            // Shift + holding weapon/tool = attack/shoot
            const bowId = this.getItemIdByKey('BOW');
            const spearId = this.getItemIdByKey('SPEAR');
            
            if (holding === bowId || holding === spearId) {
                const angle = Math.atan2(mouseY - screenCenterY, mouseX - screenCenterX);
                this.socket.emit('shoot', { angle });
                this.audio.play('shoot');
                return;
            }
        }

        // If clicking on an object
        if (clickedObject) {
            if (isPlayerCell && clickedObject === playerObject) {
                // Clicking on the same object we're standing on
                if (holding) {
                    // Check if holding edible item - eat it
                    const holdingMeta = this.getObjectMetadataById(holding);
                    if (holdingMeta && (holdingMeta as any).isEdible) {
                        this.socket.emit('eat');
                        this.audio.play('eat');
                    } else {
                        // Holding tool + clicking same object = use
                        this.socket.emit('use');
                        this.audio.play('craft');
                    }
                } else {
                    // Empty hands - check if there's a bare-hands recipe for this object
                    const hasBareHandsRecipe = this.hasBareHandsRecipe(clickedObject);
                    
                    if (hasBareHandsRecipe) {
                        // There's a bare-hands recipe (e.g., berry bush -> berries)
                        this.socket.emit('use');
                        this.audio.play('craft');
                    } else {
                        // No recipe, try to pick it up (including edible items on ground)
                        this.socket.emit('pickUp');
                        this.audio.play('pick');
                    }
                }
            } else if (isAdjacent && holding) {
                // Adjacent different object + holding tool = bounce to it, use, bounce back
                this.bounceState = {
                    originalPosition: { x: playerData.x, y: playerData.y },
                    targetObject: { 
                        x: objectGridX * 64 + 32, 
                        y: objectGridY * 64 + 32 
                    },
                    phase: 'moving-to',
                    useTimer: 0
                };
                this.targetPosition = null;
            } else if (isAdjacent) {
                // Adjacent different object + empty hands = move and pick up
                this.targetPosition = { x: objectGridX * 64 + 32, y: objectGridY * 64 + 32 };
            } else {
                // Far away object = move to it
                this.targetPosition = { x: objectGridX * 64 + 32, y: objectGridY * 64 + 32 };
            }
        } else if (holding && isPlayerCell) {
            // Check if there's a ground-target recipe for the held item
            const hasGroundRecipe = this.recipes.some(r => r.tool === holding && r.target === null);

            // Shift+Click with allowed tool on ground = Use (Dig)
            // Regular Click = Drop
            if (hasGroundRecipe && (isShiftHeld || e.shiftKey)) {
                // Execute recipe (e.g. dig hole)
                this.socket.emit('use');
                this.audio.play('craft');
            } else {
                // Drop the item
                this.socket.emit('drop');
                this.audio.play('drop');
            }
        } else {
            // Check if there's a baby at the clicked position we can pick up
            const babyAtPosition = this.getBabyAtPosition(worldX, worldY);
            if (babyAtPosition && !holding && isAdjacent) {
                // Click on nearby baby with empty hands = pick up baby
                this.socket.emit('pickUp'); // Server will detect the baby
                this.audio.play('pick');
            } else {
                // Clicking empty ground = move there
                this.targetPosition = { x: worldX, y: worldY };
            }
        }
    }

    /**
     * Get baby (young player not being held) at world position
     */
    private getBabyAtPosition(worldX: number, worldY: number): FullPlayerData | null {
        const players = this.getPlayersData();
        const myId = this.getMyId();
        if (!players || !myId) return null;

        const gridX = Math.floor(worldX / 64);
        const gridY = Math.floor(worldY / 64);

        for (const id in players) {
            if (id === myId) continue; // Skip self
            const p = players[id];
            const pGridX = Math.floor(p.x / 64);
            const pGridY = Math.floor(p.y / 64);
            
            // Check if this is a baby (age < 3) on the ground (not being held)
            if (pGridX === gridX && pGridY === gridY && p.age < 3 && !p.heldBy) {
                return p;
            }
        }
        return null;
    }

    /**
     * Get object at world position
     */
    private getObjectAtPosition(worldX: number, worldY: number): number | null {
        const world = this.getWorldData();
        if (!world) return null;

        const gridX = Math.floor(worldX / 64);
        const gridY = Math.floor(worldY / 64);
        const key = `${gridX},${gridY}`;
        
        return world.objects[key] ?? null;
    }

    /**
     * Get object metadata by ID
     */
    private getObjectMetadataById(id: number): any {
        if (!this.registry) return null;
        
        const resource = Object.values(this.registry.resources).find(r => r.id === id);
        if (resource) return resource;
        
        const item = Object.values(this.registry.items).find((i: any) => i.id === id);
        if (item) return item;
        
        const animal = Object.values(this.registry.animals).find(a => a.id === id);
        if (animal) return animal;
        
        return null;
    }

    /**
     * Get the category of an object (item, resource, or animal)
     */
    private getObjectCategory(id: number): 'item' | 'resource' | 'animal' | null {
        if (!this.registry) return null;
        
        if (Object.values(this.registry.items).find((i: any) => i.id === id)) {
            return 'item';
        }
        if (Object.values(this.registry.resources).find(r => r.id === id)) {
            return 'resource';
        }
        if (Object.values(this.registry.animals).find(a => a.id === id)) {
            return 'animal';
        }
        
        return null;
    }

    /**
     * Check if there's a bare-hands recipe for the given target object
     */
    private hasBareHandsRecipe(targetId: number): boolean {
        if (!this.recipes || this.recipes.length === 0) return false;
        
        // Bare hands recipes have tool: null
        return this.recipes.some(recipe => 
            recipe.tool === null && recipe.target === targetId
        );
    }

    /**
     * Process input state and emit events - call this every frame
     */
    update(): void {
        if (this.isChatting) return;

        const playerData = this.getPlayerData();
        let dx = 0;
        let dy = 0;

        // Handle bounce-to-use behavior
        if (this.bounceState && playerData) {
            if (this.bounceState.phase === 'moving-to') {
                // Move towards object
                const distX = this.bounceState.targetObject.x - playerData.x;
                const distY = this.bounceState.targetObject.y - playerData.y;
                const distance = Math.sqrt(distX * distX + distY * distY);

                if (distance < 8) {
                    // Reached object, switch to using phase
                    this.bounceState.phase = 'using';
                    this.bounceState.useTimer = 0;
                    this.socket.emit('use');
                    this.audio.play('craft');
                } else {
                    // Continue moving towards object
                    const angle = Math.atan2(distY, distX);
                    dx = Math.cos(angle) * 3; // Faster movement for bounce
                    dy = Math.sin(angle) * 3;
                }
            } else if (this.bounceState.phase === 'using') {
                // Wait a moment after using
                this.bounceState.useTimer++;
                if (this.bounceState.useTimer > 5) { // Wait ~5 frames
                    this.bounceState.phase = 'moving-back';
                }
            } else if (this.bounceState.phase === 'moving-back') {
                // Move back to original position
                const distX = this.bounceState.originalPosition.x - playerData.x;
                const distY = this.bounceState.originalPosition.y - playerData.y;
                const distance = Math.sqrt(distX * distX + distY * distY);

                if (distance < 5) {
                    // Back at original position, clear bounce state
                    this.bounceState = null;
                } else {
                    // Continue moving back
                    const angle = Math.atan2(distY, distX);
                    dx = Math.cos(angle) * 3;
                    dy = Math.sin(angle) * 3;
                }
            }
        } 
        // Check if we have a click-to-move target (only if not bouncing)
        else if (this.targetPosition && playerData) {
            const distX = this.targetPosition.x - playerData.x;
            const distY = this.targetPosition.y - playerData.y;
            const distance = Math.sqrt(distX * distX + distY * distY);

            // If we're close enough, clear the target
            if (distance < 5) {
                this.targetPosition = null;
            } else {
                // Move towards target
                const angle = Math.atan2(distY, distX);
                dx = Math.cos(angle) * 2;
                dy = Math.sin(angle) * 2;
            }
        }

        // WASD/Arrow keys override click-to-move and bounce
        if (this.keys['arrowup'] || this.keys['w']) {
            dy = -2;
            this.targetPosition = null;
            this.bounceState = null;
        }
        if (this.keys['arrowdown'] || this.keys['s']) {
            dy = 2;
            this.targetPosition = null;
            this.bounceState = null;
        }
        if (this.keys['arrowleft'] || this.keys['a']) {
            dx = -2;
            this.targetPosition = null;
            this.bounceState = null;
        }
        if (this.keys['arrowright'] || this.keys['d']) {
            dx = 2;
            this.targetPosition = null;
            this.bounceState = null;
        }

        if (dx !== 0 || dy !== 0) {
            this.socket.emit('move', { dx, dy });
        }

        // Recipe book toggle
        if (this.keys['r']) {
            this.callbacks.onToggleRecipeBook?.();
            this.keys['r'] = false;
        }

        // Optional: Keep E for quick eat (without clicking)
        if (this.keys['e']) {
            this.socket.emit('eat');
            this.audio.play('eat');
            this.keys['e'] = false;
        }
    }
}
