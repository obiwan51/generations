import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import world from './world.js';
import config from './config.js';
import registry from './registry.js';
import GameEngine from './engine.js';
import { CONSTANTS } from '../../shared/constants.js';
import { RegistryData, Resource, Item } from '../../shared/types.js';
import { validateName, formatName } from './utils/nameFilter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});
const engine = new GameEngine(io);


// Ban Management
const BANNED_IPS_FILE = path.join(__dirname, '../data/banned_ips.json');
let bannedIPs: string[] = [];
try {
    if (fs.existsSync(BANNED_IPS_FILE)) {
        bannedIPs = JSON.parse(fs.readFileSync(BANNED_IPS_FILE, 'utf-8'));
    }
} catch (err) {
    console.error("Failed to load banned IPs:", err);
}

const saveBans = () => {
    try {
        fs.writeFileSync(BANNED_IPS_FILE, JSON.stringify(bannedIPs, null, 2));
    } catch (err) {
        console.error("Failed to save banned IPs:", err);
    }
};



// CORS middleware for static assets in development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const CLIENT_DIST = path.join(__dirname, '../../client');
const ASSETS_PATH = path.join(__dirname, '../../assets');

// Serve static files
app.use(express.static(CLIENT_DIST));
app.use('/shared', express.static(path.join(__dirname, '../../shared')));
app.use('/assets', express.static(ASSETS_PATH));

// === AUTHENTICATION ===
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Login endpoint
app.post('/admin-api/login', express.json(), (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        // In a real app, generate a token. Here we'll just return success 
        // and the client can use the password as the "token" or we could sign a JWT.
        // For simplicity, we'll return a simple token string that matches the password for now,
        // or a mock token if we wanted state. Let's just trust the password as the token for this scale.
        res.json({ success: true, token: "admin-session-token" }); 
    } else {
        res.status(401).json({ success: false, message: "Invalid password" });
    }
});

// Middleware to protect admin routes
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Skip auth for login
    if (req.path === '/admin-api/login') {
        return next();
    }

    // Check header
    const authHeader = req.headers.authorization;
    // We expect "Bearer <password>" or just checking a custom header for simplicity
    // But since we returned "admin-session-token", let's expect that.
    // Actually, for simplicity in this specific project context:
    if (authHeader === `Bearer admin-session-token`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Apply auth middleware to all admin-api routes
app.use('/admin-api', authMiddleware);

// === ADMIN API ROUTES ===

// Config management
app.get('/admin-api/config', (req, res) => {
    res.json(config.getAll());
});

app.post('/admin-api/config', express.json(), (req, res) => {
    for (const key in req.body) {
        config.set(key, req.body[key]);
    }
    io.emit('configUpdate', config.getAll());
    res.json({ success: true });
});

// Registry management
app.get('/admin-api/registry', (req, res) => {
    res.json(registry.getAll());
});

app.post('/admin-api/registry/:type', express.json(), (req, res) => {
    const type = req.params.type as keyof RegistryData;
    registry.set(type, req.body);
    // Reload engine cache
    engine.reloadRegistry();
    // Broadcast update to all clients
    io.emit('registryUpdate', registry.getAll());
    res.json({ success: true });
});

// Statistics endpoint
app.get('/admin-api/stats', (req, res) => {
    res.json(engine.getStatistics());
});

// World management
app.get('/admin-api/world/full', (req, res) => {
    res.json(world.getState());
});

app.get('/admin-api/world/params', (req, res) => {
    res.json(world.getParams());
});

app.post('/admin-api/world/params', express.json(), (req, res) => {
    world.setParams(req.body);
    world.regenerate();
    res.json({ success: true, params: world.getParams() });
});

app.post('/admin-api/world/save', (req, res) => {
    const success = world.saveWorld();
    res.json({ success, message: success ? 'World saved successfully' : 'Failed to save world' });
});

app.post('/admin-api/world/reinitialize', express.json(), (req, res) => {
    engine.reinitializeWorld();
    res.json({ success: true, message: 'World reinitialized' });
});

app.post('/admin-api/world/reset-map', express.json(), (req, res) => {
    engine.clearWorldObjects();
    res.json({ success: true, message: 'Map entities cleared' });
});

// Sprite upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const assetsPath = path.join(__dirname, '../../assets');
        // Ensure assets directory exists
        if (!fs.existsSync(assetsPath)) {
            fs.mkdirSync(assetsPath, { recursive: true });
        }
        cb(null, assetsPath);
    },
    filename: (req, file, cb) => {
        // Use the provided filename or generate one
        const customName = req.body.filename;
        if (customName) {
            // Ensure .svg extension
            const name = customName.endsWith('.svg') ? customName : `${customName}.svg`;
            cb(null, name);
        } else {
            cb(null, file.originalname);
        }
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Accept SVG and common image formats
        const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.svg')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (SVG, PNG, JPG, GIF, WebP) are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// Sprite upload endpoint
app.post('/admin-api/upload-sprite', upload.single('sprite'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.json({
        success: true,
        filename: req.file.filename,
        path: `/assets/${req.file.filename}`
    });
});

// List available sprites
app.get('/admin-api/sprites', (req, res) => {
    const assetsPath = path.join(__dirname, '../../assets');
    try {
        const files = fs.readdirSync(assetsPath)
            .filter(f => /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(f));
        res.json({ success: true, sprites: files });
    } catch (err) {
        res.json({ success: true, sprites: [] });
    }
});

// Module management
app.get('/admin-api/modules', (req, res) => {
    res.json(engine.getModuleStates());
});

app.post('/admin-api/modules/:module', express.json(), (req, res) => {
    const { enabled } = req.body;
    const success = engine.setModuleState(req.params.module, enabled);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'Invalid module name' });
    }
});

// Player Management APIs
app.get('/admin-api/players', (req, res) => {
    const playersList = [];
    const sockets = io.sockets.sockets;
    
    for (const [id, player] of Object.entries(engine.players)) {
        const socket = sockets.get(id);
        const ip = socket ? (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address) : 'Unknown';
        
        playersList.push({
            id: player.id,
            name: player.name,
            age: Math.floor(player.age),
            gender: player.gender,
            ip: ip,
            isDead: player.isDead,
            generation: player.generation
        });
    }
    res.json(playersList);
});

app.post('/admin-api/players/kick', express.json(), (req, res) => {
    const { id, reason } = req.body;
    const socket = io.sockets.sockets.get(id);
    if (socket) {
        socket.emit('textMessage', { text: 'You were kicked: ' + (reason || 'Admin kicked') });
        socket.disconnect(true);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Player not found' });
    }
});

app.post('/admin-api/players/ban', express.json(), (req, res) => {
    const { id, ip, reason } = req.body;
    let targetIp = ip;
    
    if (id && !targetIp) {
        const socket = io.sockets.sockets.get(id);
        if (socket) {
            targetIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
        }
    }
    
    if (targetIp) {
        if (!bannedIPs.includes(targetIp as string)) {
            bannedIPs.push(targetIp as string);
            saveBans();
        }
        
        // Kick any players with this IP
        for (const [sid, socket] of io.sockets.sockets) {
            const sIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
            if (sIp === targetIp) {
                socket.emit('textMessage', { text: 'You have been banned.' });
                socket.disconnect(true);
            }
        }
        
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'Could not determine IP' });
    }
});

app.get('/admin-api/bans', (req, res) => {
    res.json(bannedIPs);
});

app.post('/admin-api/bans/remove', express.json(), (req, res) => {
    const { ip } = req.body;
    if (ip) {
        bannedIPs = bannedIPs.filter(bannedIp => bannedIp !== ip);
        saveBans();
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'IP is required' });
    }
});

app.get('/admin-api/bans', (req, res) => {
    res.json(bannedIPs);
});

app.post('/admin-api/bans/remove', express.json(), (req, res) => {
    const { ip } = req.body;
    bannedIPs = bannedIPs.filter(b => b !== ip);
    saveBans();
    res.json({ success: true });
});

// Game loop (high frequency for engine internal updates)
setInterval(() => engine.update(), 1000); 
setInterval(() => engine.updateProjectiles(), 50);

// Session management for reconnection
const RECONNECT_GRACE_PERIOD = 60000; // 60 seconds
const disconnectedPlayers = new Map<string, { socketId: string; timestamp: number }>();

// Eve system - track generation
let eveGeneration = 1;

// Clean up abandoned players after grace period
setInterval(() => {
    const now = Date.now();
    for (const [sessionToken, data] of disconnectedPlayers.entries()) {
        if (now - data.timestamp > RECONNECT_GRACE_PERIOD) {
            // Grace period expired - remove player
            if (engine.players[data.socketId]) {
                engine.removePlayer(data.socketId);
                io.emit('playerDisconnected', data.socketId);
            }
            disconnectedPlayers.delete(sessionToken);
            console.log(`[Session] Player ${data.socketId} grace period expired`);
        }
    }
}, 5000); // Check every 5 seconds

io.on('connection', (socket) => {
    // Check Ban
    const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    if (bannedIPs.includes(ip as string)) {
        socket.disconnect(true);
        return;
    }

    console.log('User connected: ' + socket.id);

    let sessionToken: string | null = null;
    let hasRequestedBirth = false;

    // Handle new birth request (no reconnection)
    socket.on('requestBirth', () => {
        if (hasRequestedBirth) return; // Already spawned
        birthNewPlayer();
        hasRequestedBirth = true;
    });

    // Handle reconnection request
    socket.on('requestReconnect', (data: { sessionToken: string }) => {
        if (hasRequestedBirth) return; // Already spawned
        
        sessionToken = data.sessionToken;
        
        // Only try to reconnect if we have a valid session token
        if (sessionToken && sessionToken.startsWith('session_')) {
            const reconnectData = disconnectedPlayers.get(sessionToken);
            
            if (reconnectData && engine.players[reconnectData.socketId]) {
                // Player exists and is within grace period - reconnect them
                const oldSocketId = reconnectData.socketId;
                
                // Update player ID in engine (this updates all components and references)
                const success = engine.updatePlayerId(oldSocketId, socket.id);
                
                if (!success) {
                    console.log(`[Session] Failed to update player ID during reconnection`);
                    birthNewPlayer();
                    hasRequestedBirth = true;
                    return;
                }
                
                disconnectedPlayers.delete(sessionToken);
                
                // Get updated player data
                const player = engine.players[socket.id];
                
                // Send init with reconnected flag and session token
                socket.emit('init', {
                    players: engine.players,
                    world: world.getState(),
                    season: engine.currentSeason,
                    myId: socket.id,
                    recipes: engine.recipes,
                    config: config.getAll(),
                    registry: registry.getAll(),
                    reconnected: true,
                    sessionToken: sessionToken
                });
                
                // Notify others of the ID change
                io.emit('playerDisconnected', oldSocketId);
                socket.broadcast.emit('newPlayer', player);
                
                console.log(`[Session] Player reconnected: ${oldSocketId} -> ${socket.id}`);
                hasRequestedBirth = true;
                return;
            }
        }
        
        // No reconnection available - proceed with normal birth
        console.log(`[Session] No valid reconnection found for token, spawning new character`);
        birthNewPlayer();
        hasRequestedBirth = true;
    });

    function birthNewPlayer() {
        // Generate new session token for this character
        sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Birth Logic - check for fertile women first
        const playersArr = Object.values(engine.players);
        const fertileMothers = playersArr.filter(p => 
            p.gender === 'female' && 
            p.age >= 16 && p.age < 60 && 
            !p.holdingPlayerId && // Not already holding a baby
            !p.isDead
        );
        
        let motherId = null;
        let isEveSpawn = false;
        
        // If no fertile women exist, spawn an Eve
        if (fertileMothers.length === 0) {
            isEveSpawn = true;
            console.log(`[Eve System] No fertile mothers found. Spawning Eve Gen ${eveGeneration}`);
        } else {
            // Select random fertile mother
            motherId = fertileMothers[Math.floor(Math.random() * fertileMothers.length)].id;
        }

        const result = engine.addPlayer(socket.id, motherId, isEveSpawn ? 'female' : undefined, isEveSpawn ? `Eve Gen ${eveGeneration}` : undefined);
        const p = result.player;
        
        // Increment generation counter after Eve spawn
        if (isEveSpawn) {
            eveGeneration++;
        }

        // If mother dropped an item when picking up baby, place it in world
        if (result.droppedItem) {
            world.setObject(result.droppedItem.x, result.droppedItem.y, result.droppedItem.type, result.droppedItem.data);
            io.emit('worldUpdate', { 
                x: result.droppedItem.x, 
                y: result.droppedItem.y, 
                type: result.droppedItem.type,
                data: result.droppedItem.data
            });
        }

        // Send init state with new session token
        socket.emit('init', {
            players: engine.players,
            world: world.getState(),
            season: engine.currentSeason,
            myId: socket.id,
            recipes: engine.recipes,
            config: config.getAll(),
            registry: registry.getAll(),
            sessionToken: sessionToken
        });

        socket.broadcast.emit('newPlayer', p);
        
        // Notify mother and prompt for baby naming
        if (motherId && result.motherUpdate) {
            const gender = engine.getPlayerGender(socket.id);
            const genderText = gender === 'male' ? 'son' : 'daughter';
            
            // Send naming prompt to mother
            io.to(motherId).emit('nameBaby', { 
                babyId: socket.id,
                gender: gender,
                message: `You gave birth to a ${genderText}! What is ${gender === 'male' ? 'his' : 'her'} name?`
            });
            
            io.emit('playerStatUpdate', { 
                id: motherId, 
                holding: result.motherUpdate.holding,
                holdingData: result.motherUpdate.holdingData,
                holdingPlayerId: result.motherUpdate.holdingPlayerId
            });
        }
    }

    // Handle baby naming from mother
    socket.on('nameBaby', (data: { babyId: string; name: string }) => {
        // Verify this player is holding the baby
        const player = engine.players[socket.id];
        if (!player || player.holdingPlayerId !== data.babyId) {
            socket.emit('nameError', { message: 'You are not holding this baby' });
            return;
        }

        // Validate name
        const validation = validateName(data.name);
        if (!validation.valid) {
            socket.emit('nameError', { message: validation.reason });
            return;
        }

        // Format and set name
        const formattedName = formatName(data.name);
        const updatedBaby = engine.renameBaby(data.babyId, formattedName);
        
        if (updatedBaby) {
            // Send success to close the modal
            socket.emit('nameSuccess', { babyId: data.babyId, name: updatedBaby.name });
            // Notify everyone of the new name
            io.emit('playerStatUpdate', { id: data.babyId, name: updatedBaby.name });
            socket.emit('textMessage', { text: `You named your child ${updatedBaby.name}` });
            io.to(data.babyId).emit('textMessage', { text: `Your mother named you ${updatedBaby.name}` });
        }
    });

    socket.on('move', (data) => {
        const moveResult = engine.movePlayer(socket.id, data.dx, data.dy);
        if (moveResult) {
            io.emit('playerMoved', moveResult.player);
            // If holding a baby, also send the baby's updated position
            if (moveResult.heldBaby) {
                io.emit('playerMoved', moveResult.heldBaby);
            }
        }
    });

    socket.on('shoot', (data) => engine.handleShoot(socket.id, data.angle));

    socket.on('eat', () => {
        const p = engine.players[socket.id];
        if (!p) return;
        
        const resourceReg = registry.get('resources') as Record<string, Resource>;
        const itemReg = registry.get('items') as Record<string, Item>;
        
        // Check both items and resources for food value (player must be HOLDING the food)
        const getFoodValue = (type: number | null) => {
            if (type === null) return 0;
            // Check items first
            const itemDef = Object.values(itemReg).find(i => i.id === type);
            if (itemDef?.isEdible) return itemDef.foodValue || 5;
            // Also check resources (for wild carrots etc that can be picked up and eaten)
            const resDef = Object.values(resourceReg).find(r => r.id === type);
            if (resDef?.isEdible) return resDef.foodValue || 5;
            return 0;
        };
        
        // Check if item is a container (only items can be containers)
        const isContainer = (type: number | null) => {
            if (type === null) return null;
            const itemDef = Object.values(itemReg).find(i => i.id === type && i.isContainer);
            return itemDef || null;
        };

        // Baby being held by a woman - drinks milk (no food item needed)
        if (p.heldBy && p.age < CONSTANTS.BABY_MAX_AGE) {
            const holderId = p.heldBy;
            const holder = engine.players[holderId];
            if (holder) {
                // Baby drinks milk from mother - fixed food value of 3
                const milkValue = 3;
                const fed = engine.feedPlayer(socket.id, milkValue);
                if (fed) {
                    io.emit('playerStatUpdate', { id: socket.id, hunger: fed.hunger });
                }
            }
            return; // Baby can only eat milk when held
        }

        // Normal eating for non-babies (or babies not being held)
        // Player can ONLY eat what they are holding - no eating from ground
        const playerData = engine.getPlayerHoldingData(socket.id);
        if (!playerData) return;

        // Try eating held item
        const heldFoodVal = getFoodValue(playerData.holding);
        if (heldFoodVal > 0) {
            const fed = engine.feedPlayer(socket.id, heldFoodVal);
            engine.updatePlayerHolding(socket.id, null, null);
            if (fed) {
                io.emit('playerStatUpdate', { id: socket.id, hunger: fed.hunger, holding: null, holdingData: null });
            }
        } else if (playerData.holding !== null) {
            // Try eating from container being held
            const containerDef = isContainer(playerData.holding);
            if (containerDef && playerData.holdingData?.inventory?.length > 0) {
                const idx = playerData.holdingData.inventory.findIndex((t: number) => getFoodValue(t) > 0);
                if (idx !== -1) {
                    const itemType = playerData.holdingData.inventory[idx];
                    const itemFoodVal = getFoodValue(itemType);
                    playerData.holdingData.inventory.splice(idx, 1); // Modifying actual component data
                    const fed = engine.feedPlayer(socket.id, itemFoodVal);
                    if (fed) {
                        io.emit('playerStatUpdate', { id: socket.id, hunger: fed.hunger, holding: playerData.holding, holdingData: playerData.holdingData });
                    }
                }
            }
        }
        // No more eating from ground - player must pick up food first
    });

    socket.on('pickUp', () => {
        const p = engine.players[socket.id];
        if (!p) return;
        
        const tx = Math.floor(p.x / CONSTANTS.TILE_SIZE), ty = Math.floor(p.y / CONSTANTS.TILE_SIZE);
        
        // First try to pick up a baby on the same tile (only if hands are empty)
        if (!p.holding) {
            const playersOnTile = Object.values(engine.players).filter(other => 
                other.id !== socket.id &&
                other.age < CONSTANTS.BABY_MAX_AGE &&
                !other.heldBy && // Not already being held
                Math.floor(other.x / CONSTANTS.TILE_SIZE) === tx &&
                Math.floor(other.y / CONSTANTS.TILE_SIZE) === ty
            );
            
            if (playersOnTile.length > 0 && p.age >= CONSTANTS.BABY_MAX_AGE) {
                // Pick up the baby
                const baby = playersOnTile[0];
                if (engine.pickUpBaby(socket.id, baby.id)) {
                    const updatedP = engine.players[socket.id];
                    const updatedBaby = engine.players[baby.id];
                    io.emit('playerStatUpdate', { 
                        id: socket.id, 
                        holding: updatedP.holding, 
                        holdingData: updatedP.holdingData,
                        holdingPlayerId: updatedP.holdingPlayerId
                    });
                    io.emit('playerStatUpdate', { 
                        id: baby.id, 
                        heldBy: updatedBaby.heldBy
                    });
                    io.to(baby.id).emit('textMessage', { text: `${p.name} picked you up!` });
                    return;
                }
            }

            // Try picking up an animal
            if (engine.pickUpAnimal(socket.id)) {
                const updatedP = engine.players[socket.id];
                io.emit('playerStatUpdate', { 
                    id: socket.id, 
                    holding: updatedP.holding, 
                    holdingData: updatedP.holdingData
                });
                return;
            }
        }
        
        // Otherwise try to pick up a world object
        const targetType = world.getObject(tx, ty);
        const targetData = world.getObjectData(tx, ty);
        const targetDef = targetType !== null ? engine.getObjectDef(targetType) : undefined;
        
        // Restrictions: Cannot pick up large objects or structures
        if (targetDef) {
            const isLarge = 'isLarge' in targetDef && targetDef.isLarge;
            const isStructure = 'category' in targetDef && targetDef.category === 'structure';
            if (isLarge || isStructure) return;
        }
        
        // Check for bare-hands recipe (tool === null) - if exists, don't allow pickup
        // This ensures objects like berry bushes must be "used" to collect from them
        const bareHandsRecipe = engine.recipes.find(r => r.tool === null && r.target === targetType);
        if (bareHandsRecipe) {
            // There's a bare-hands interaction available - don't allow direct pickup
            return;
        }

        // Check if target is a container (basket) - equip as backpack if no backpack
        const isContainer = targetDef && 'isContainer' in targetDef && targetDef.isContainer;
        
        if (isContainer && !p.backpack) {
            // Equip container as backpack
            world.removeObject(tx, ty);
            engine.unregisterPlantedCrop(tx, ty);
            engine.equipBackpack(socket.id, targetType!, targetData);
            io.emit('worldUpdate', { x: tx, y: ty, type: null });
            const backpackData = engine.getPlayerBackpackData(socket.id);
            io.emit('playerStatUpdate', { 
                id: socket.id, 
                backpack: backpackData?.backpack ?? null, 
                backpackData: backpackData?.backpackData ?? null 
            });
            io.to(socket.id).emit('textMessage', { text: 'Equipped backpack!' });
            return;
        }

        // If hands are full, can't pick up non-container items
        if (p.holding) return;

        const result = world.removeObject(tx, ty);
        if (result) {
            engine.unregisterPlantedCrop(tx, ty);
            engine.updatePlayerHolding(socket.id, result.type, result.data);
            io.emit('worldUpdate', { x: tx, y: ty, type: null });
            io.emit('playerStatUpdate', { id: socket.id, holding: result.type, holdingData: result.data });
        }
    });

    socket.on('drop', () => {
        const p = engine.players[socket.id];
        if (p && p.holding) {
            // Check if holding a baby
            if (p.holding === CONSTANTS.OBJECT_TYPES.BABY && p.holdingPlayerId) {
                const babyId = engine.putDownBaby(socket.id);
                if (babyId) {
                    const updatedP = engine.players[socket.id];
                    const updatedBaby = engine.players[babyId];
                    io.emit('playerStatUpdate', { 
                        id: socket.id, 
                        holding: null, 
                        holdingData: null,
                        holdingPlayerId: null
                    });
                    if (updatedBaby) {
                        io.emit('playerStatUpdate', { 
                            id: babyId, 
                            heldBy: null
                        });
                        io.to(babyId).emit('textMessage', { text: `${p.name} put you down.` });
                    }
                }
                return;
            }
            
            // Otherwise drop world object
            const tx = Math.floor(p.x / CONSTANTS.TILE_SIZE), ty = Math.floor(p.y / CONSTANTS.TILE_SIZE);
            if (!world.getObject(tx, ty)) {
                world.setObject(tx, ty, p.holding, p.holdingData);
                const item = p.holding, data = p.holdingData;
                
                // Register for growth if it's a crop
                engine.registerPlantedCrop(tx, ty, item);
                
                // Register as animal if it's a live animal
                engine.registerAnimal(tx, ty, item, data);

                engine.updatePlayerHolding(socket.id, null, null);
                io.emit('worldUpdate', { x: tx, y: ty, type: item, data: data });
                io.emit('playerStatUpdate', { id: socket.id, holding: null, holdingData: null });
            }
        }
    });

    // Drop backpack (separate from regular drop)
    socket.on('dropBackpack', () => {
        const p = engine.players[socket.id];
        if (p && p.backpack) {
            const tx = Math.floor(p.x / CONSTANTS.TILE_SIZE), ty = Math.floor(p.y / CONSTANTS.TILE_SIZE);
            if (!world.getObject(tx, ty)) {
                const backpackResult = engine.unequipBackpack(socket.id);
                if (backpackResult && backpackResult.containerId !== null) {
                    world.setObject(tx, ty, backpackResult.containerId, backpackResult.containerData);
                    io.emit('worldUpdate', { x: tx, y: ty, type: backpackResult.containerId, data: backpackResult.containerData });
                    io.emit('playerStatUpdate', { id: socket.id, backpack: null, backpackData: null });
                    io.to(socket.id).emit('textMessage', { text: 'Dropped backpack.' });
                }
            } else {
                io.to(socket.id).emit('textMessage', { text: 'Cannot drop here - tile occupied!' });
            }
        }
    });

    // Add held item to backpack
    socket.on('addToBackpack', () => {
        const p = engine.players[socket.id];
        if (!p || !p.backpack || !p.holding) return;
        
        const itemReg = registry.get('items') as Record<string, Item>;
        const resourceReg = registry.get('resources') as Record<string, Resource>;
        
        // Get item definition
        const itemDef = Object.values(itemReg).find(i => i.id === p.holding) || 
                        Object.values(resourceReg).find(r => r.id === p.holding);
        
        // Don't allow large items or containers in backpack
        if (!itemDef) return;
        const isLarge = 'isLarge' in itemDef && itemDef.isLarge;
        const isContainer = 'isContainer' in itemDef && itemDef.isContainer;
        if (isLarge || isContainer) {
            io.to(socket.id).emit('textMessage', { text: 'This item is too big for the backpack!' });
            return;
        }
        
        // Get backpack capacity
        const backpackDef = Object.values(itemReg).find(i => i.id === p.backpack);
        const capacity = backpackDef?.capacity ?? 3;
        
        // Try to add item to backpack
        const added = engine.addToBackpack(socket.id, p.holding, capacity);
        if (added) {
            engine.updatePlayerHolding(socket.id, null, null);
            const backpackData = engine.getPlayerBackpackData(socket.id);
            io.emit('playerStatUpdate', { 
                id: socket.id, 
                holding: null, 
                holdingData: null,
                backpack: backpackData?.backpack ?? null, 
                backpackData: backpackData?.backpackData ?? null 
            });
            io.to(socket.id).emit('textMessage', { text: 'Added to backpack.' });
        } else {
            io.to(socket.id).emit('textMessage', { text: 'Backpack is full!' });
        }
    });

    // Take item from backpack (last item)
    socket.on('takeFromBackpack', () => {
        const p = engine.players[socket.id];
        if (!p || !p.backpack || p.holding) return; // Need backpack and empty hands
        
        const itemId = engine.takeFromBackpack(socket.id);
        if (itemId !== null) {
            engine.updatePlayerHolding(socket.id, itemId, null);
            const backpackData = engine.getPlayerBackpackData(socket.id);
            io.emit('playerStatUpdate', { 
                id: socket.id, 
                holding: itemId, 
                holdingData: null,
                backpack: backpackData?.backpack ?? null, 
                backpackData: backpackData?.backpackData ?? null 
            });
        } else {
            io.to(socket.id).emit('textMessage', { text: 'Backpack is empty!' });
        }
    });

    socket.on('use', () => {
        const p = engine.players[socket.id];
        if (!p) return;
        const tx = Math.floor(p.x / CONSTANTS.TILE_SIZE), ty = Math.floor(p.y / CONSTANTS.TILE_SIZE);
        const targetObj = world.getObject(tx, ty), targetData = world.getObjectData(tx, ty);
        const toolObj = p.holding, toolData = p.holdingData;

        const resourceReg = registry.get('resources') as Record<string, Resource>;
        const itemReg = registry.get('items') as Record<string, Item>;
        
        // Get definition from resources or items
        const getDef = (id: number | null): (Resource | Item | undefined) => {
            if (id === null) return undefined;
            const resDef = Object.values(resourceReg).find(r => r.id === id);
            if (resDef) return resDef;
            return Object.values(itemReg).find(i => i.id === id);
        };
        
        // Type guard for Item with container properties
        const isItemContainer = (def: Resource | Item | undefined): def is Item => {
            return def !== undefined && 'isContainer' in def && def.isContainer === true;
        };

        const toolDef = getDef(toolObj);
        const targetDef = getDef(targetObj);

        // For bare-hands recipes, toolObj is null but we still need to check
        // Only return early if there's no target AND no tool (nothing to interact with)
        if (toolObj === null && targetObj === null) {
            return;
        }

        // BOAT USAGE: Enter/Exit boat
        const BOAT = registry.getId('BOAT');
        if (BOAT && toolObj === BOAT) {
            const biome = world.getBiomeAt(tx, ty);
            const onWater = biome === CONSTANTS.BIOMES.WATER;
            const inBoat = p.inBoat;

            if (!inBoat && !onWater) {
                // On land with boat → Enter boat (toggle inBoat state)
                engine.toggleBoat(socket.id, true, BOAT);
                io.emit('playerStatUpdate', { id: socket.id, inBoat: true });
                io.to(socket.id).emit('textMessage', { text: 'You got in the boat. You can now travel on water!' });
                return;
            } else if (inBoat && onWater) {
                // On water in boat → Try to exit to nearest land
                const landTile = findNearestLand(tx, ty);
                if (landTile) {
                    // Exit boat and move to land
                    engine.toggleBoat(socket.id, false, BOAT);
                    const moveResult = engine.movePlayerTo(socket.id, landTile.x * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2, landTile.y * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2);
                    if (moveResult) {
                        io.emit('playerMoved', moveResult.player);
                    }
                    io.emit('playerStatUpdate', { id: socket.id, inBoat: false });
                    io.to(socket.id).emit('textMessage', { text: 'You got out of the boat.' });
                } else {
                    io.to(socket.id).emit('textMessage', { text: 'You need to be near land to exit the boat!' });
                }
                return;
            } else if (inBoat && !onWater) {
                // Already on land in boat → Exit boat
                engine.toggleBoat(socket.id, false, BOAT);
                io.emit('playerStatUpdate', { id: socket.id, inBoat: false });
                io.to(socket.id).emit('textMessage', { text: 'You got out of the boat.' });
                return;
            }
        }
        
        // Helper to find nearest land tile
        function findNearestLand(centerX: number, centerY: number): { x: number; y: number } | null {
            for (let radius = 1; radius <= 3; radius++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const checkX = centerX + dx;
                        const checkY = centerY + dy;
                        if (world.isPassable(checkX, checkY)) {
                            return { x: checkX, y: checkY };
                        }
                    }
                }
            }
            return null;
        }
        
        // Handle container drop (empty hands, container in hand with items, no target)
        if (!targetObj && isItemContainer(toolDef) && toolData?.inventory?.length > 0) {
            const item = toolData.inventory.pop();
            world.setObject(tx, ty, item);
            io.emit('worldUpdate', { x: tx, y: ty, type: item });
            const current = engine.getPlayerHoldingData(socket.id);
            io.emit('playerStatUpdate', { id: socket.id, holding: current?.holding ?? null, holdingData: current?.holdingData ?? null });
            return;
        }

        // Generic Container Logic - only if we have both a valid container and valid item
        if ((isItemContainer(toolDef) || isItemContainer(targetDef)) && toolObj !== null && targetObj !== null) {
            const isTargetBasket = isItemContainer(targetDef);
            const basket = isTargetBasket 
                ? { type: targetObj, data: targetData, isGround: true, def: targetDef as Item } 
                : { type: toolObj, data: toolData, isGround: false, def: toolDef as Item };
            const item = isTargetBasket 
                ? { type: toolObj, data: toolData, isGround: false, def: toolDef } 
                : { type: targetObj, data: targetData, isGround: true, def: getDef(targetObj) };

            if (!basket.data) basket.data = { inventory: [] };
            
            // Item can go in if it's not large and not a container itself (to avoid nesting)
            const itemIsLarge = item.def && 'isLarge' in item.def && item.def.isLarge;
            const itemIsContainer = isItemContainer(item.def);
            const canFit = item.def && !itemIsLarge && !itemIsContainer;

            if (canFit && basket.def && basket.data.inventory.length < (basket.def.capacity || 3)) {
                basket.data.inventory.push(item.type);
                if (item.isGround) { 
                    world.removeObject(tx, ty); 
                    engine.unregisterPlantedCrop(tx, ty);
                    io.emit('worldUpdate', { x: tx, y: ty, type: null }); 
                }
                else { engine.updatePlayerHolding(socket.id, null, null); }

                if (basket.isGround) { world.setObject(tx, ty, basket.type, basket.data); io.emit('worldUpdate', { x: tx, y: ty, type: basket.type, data: basket.data }); }
                else { engine.updatePlayerHolding(socket.id, basket.type, basket.data); }
                const current = engine.getPlayerHoldingData(socket.id);
                io.emit('playerStatUpdate', { id: socket.id, holding: current?.holding ?? null, holdingData: current?.holdingData ?? null });
                return;
            }
        }

        // Special Burial Interactions
        const SHOVEL = registry.getId('SHOVEL');
        const HOLE = registry.getId('HOLE');
        const BONES = registry.getId('BONES');
        const GRAVE = registry.getId('GRAVE');
        const GRAVE_STONE = registry.getId('GRAVE_STONE');
        const ROCK = registry.getId('ROCK');

        // 1. Shovel on empty ground -> Hole
        if (toolObj === SHOVEL && !targetObj && HOLE) {
            world.setObject(tx, ty, HOLE);
            io.emit('worldUpdate', { x: tx, y: ty, type: HOLE });
            return;
        }

        // 2. Bones on Hole -> Grave
        if (toolObj === BONES && targetObj === HOLE && GRAVE) {
            const graveData = {
                buriedName: toolData?.name || "Unknown Soul",
                buriedAge: toolData?.age || 0,
                diedAt: toolData?.diedAt || Date.now(),
                cause: toolData?.cause || "Unknown"
            };
            world.setObject(tx, ty, GRAVE, graveData);
            io.emit('worldUpdate', { x: tx, y: ty, type: GRAVE, data: graveData });
            
            engine.updatePlayerHolding(socket.id, null, null);
            io.emit('playerStatUpdate', { id: socket.id, holding: null, holdingData: null });
            return;
        }

        // 3. Rock on Grave -> Grave Stone
        if (toolObj === ROCK && targetObj === GRAVE && GRAVE_STONE) {
            // Transfer the burial data to the grave stone
            world.setObject(tx, ty, GRAVE_STONE, targetData);
            io.emit('worldUpdate', { x: tx, y: ty, type: GRAVE_STONE, data: targetData });
            
            engine.updatePlayerHolding(socket.id, null, null);
            io.emit('playerStatUpdate', { id: socket.id, holding: null, holdingData: null });
            return;
        }

        // Find recipe: tool can be null for bare hands interactions
        const recipe = engine.recipes.find(r => r.tool === toolObj && r.target === targetObj);
        if (recipe) {
            const isConsumableTool = toolDef && 'isConsumable' in toolDef && toolDef.isConsumable;
            const resultDef = engine.getObjectDef(recipe.result);
            
            // Check if result is a planted crop (goes in ground) or regular item (held)
            const isCrop = resultDef && 'category' in resultDef && resultDef.category === 'crop';
            
            // Check if tool has durability (uses property)
            const toolHasUses = toolDef && 'uses' in toolDef && typeof toolDef.uses === 'number';
            
            // Helper to handle tool durability
            const handleToolDurability = () => {
                if (toolHasUses && toolObj !== null) {
                    // Get current uses from holdingData or initialize from definition
                    const currentUses = toolData?.usesRemaining ?? (toolDef as Item).uses!;
                    const newUses = currentUses - 1;
                    
                    if (newUses <= 0) {
                        // Tool is broken
                        engine.updatePlayerHolding(socket.id, null, null);
                        io.emit('playerStatUpdate', { id: socket.id, holding: null, holdingData: null });
                        io.to(socket.id).emit('textMessage', { text: `Your ${(toolDef as Item).name} broke!` });
                    } else {
                        // Tool still has uses
                        engine.updatePlayerHolding(socket.id, toolObj, { ...toolData, usesRemaining: newUses });
                        io.emit('playerStatUpdate', { id: socket.id, holding: toolObj, holdingData: { ...toolData, usesRemaining: newUses } });
                    }
                } else if (isConsumableTool) {
                    // Legacy consumable behavior - tool is consumed immediately
                    engine.updatePlayerHolding(socket.id, null, null);
                    io.emit('playerStatUpdate', { id: socket.id, holding: null, holdingData: null });
                }
                // If tool has no uses and is not consumable, it stays in hand unchanged
            };
            
            if (isCrop) {
                // Planted crops go in the ground, not in hand
                world.setObject(tx, ty, recipe.result);
                io.emit('worldUpdate', { x: tx, y: ty, type: recipe.result });
                
                // Register with growth system
                engine.registerPlantedCrop(tx, ty, recipe.result);
                
                // Consume the seed/tool (seeds don't have durability)
                engine.updatePlayerHolding(socket.id, null, null);
                io.emit('playerStatUpdate', { id: socket.id, holding: null, holdingData: null });
            } else if (recipe.targetBecomesType !== undefined) {
                // Target transforms (e.g., berry bush -> empty bush) and result goes to hand
                world.setObject(tx, ty, recipe.targetBecomesType);
                io.emit('worldUpdate', { x: tx, y: ty, type: recipe.targetBecomesType });
                
                // Register transformed object with growth system if it's a crop
                const transformedDef = engine.getObjectDef(recipe.targetBecomesType);
                if (transformedDef && 'category' in transformedDef && transformedDef.category === 'crop') {
                    engine.registerPlantedCrop(tx, ty, recipe.targetBecomesType);
                }
                
                // Result goes to player's hand (bare hands recipe - no tool to handle)
                engine.updatePlayerHolding(socket.id, recipe.result, null);
                io.emit('playerStatUpdate', { id: socket.id, holding: recipe.result, holdingData: null });
            } else if (recipe.targetPersists) {
                // Target stays in place, result goes to hand (e.g., cooking on fire)
                // Tool is consumed and replaced by result
                engine.updatePlayerHolding(socket.id, recipe.result, null);
                io.emit('playerStatUpdate', { id: socket.id, holding: recipe.result, holdingData: null });
            } else {
                // Regular recipe with tool - result goes on ground, tool stays in hand (with durability)
                world.removeObject(tx, ty);
                engine.unregisterPlantedCrop(tx, ty);
                world.setObject(tx, ty, recipe.result);
                io.emit('worldUpdate', { x: tx, y: ty, type: recipe.result });
                
                // Handle tool durability (decrements uses or breaks tool)
                handleToolDurability();
            }
        }
    });

    socket.on('chat', (msg) => {
        const p = engine.players[socket.id];
        if (!p || p.isDead) return;
        const text = msg.substring(0, 50).trim();
        if (!text) return;
        p.lastMsg = text; p.lastMsgTime = Date.now();
        io.emit('chatMsg', { id: socket.id, text: text, name: p.name });
    });

    socket.on('disconnect', () => {
        const player = engine.players[socket.id];
        if (player && !player.isDead && sessionToken) {
            // Store for potential reconnection
            disconnectedPlayers.set(sessionToken, {
                socketId: socket.id,
                timestamp: Date.now()
            });
            console.log(`[Session] Player ${socket.id} disconnected, grace period started`);
            // Don't remove player yet - wait for grace period
        } else {
            // Player is dead or doesn't exist - remove immediately
            engine.removePlayer(socket.id);
            io.emit('playerDisconnected', socket.id);
        }
    });
});

// Serve admin panel at /admin
app.get('/admin', (req, res) => {
    const adminPath = path.join(CLIENT_DIST, 'admin.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        res.status(404).send('Admin panel not found.');
    }
});

// 3. Fallback: Any unknown route serves the index.html (Standard for SPA)
// MUST BE REGISTERED LAST!
app.get(/(.*)/, (req, res) => {
    const indexPath = path.join(CLIENT_DIST, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Client build not found. Did you run npm run build?');
    }
});

server.listen(PORT, () => {
    console.log('Server listening on port ' + PORT);
});

// Graceful shutdown handlers
process.on('SIGINT', () => {
    console.log('\n[Server] Received SIGINT, saving world and shutting down...');
    world.flushAutoSave();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[Server] Received SIGTERM, saving world and shutting down...');
    world.flushAutoSave();
    process.exit(0);
});

process.on('beforeExit', () => {
    world.flushAutoSave();
});
