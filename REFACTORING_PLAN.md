# ECS Architecture Refactoring Plan

This document outlines the strategy for refactoring the monolithic game code into a modular **Entity-Component-System (ECS)** architecture, keeping files under ~150 lines for maintainability.

## 1. Goal
Transform the codebase from monolithic files (`engine.ts` ~420 lines, `game.ts` ~780 lines) into a clean ECS architecture where:
- **Entities** are just IDs with attached components
- **Components** are pure data (position, health, hunger, etc.)
- **Systems** contain all the logic, operating on entities with specific components

## 2. ECS Architecture Overview

### 2.1 Core Pattern (Reference: [jsforgames.com/ecs](https://jsforgames.com/ecs/))
```
Entity = ID + [Component, Component, ...]
Component = Pure Data (no behavior)
System = Logic that updates components each frame
```

### 2.2 Directory Structure
```
shared/
  ecs/                    # Base ECS classes ✅ DONE
    Entity.ts
    Component.ts  
    System.ts
  components/             # Shared component definitions ✅ DONE
    PositionComponent.ts
    VelocityComponent.ts
    HealthComponent.ts
    HungerComponent.ts
    InventoryComponent.ts
    AgeComponent.ts
    IdentityComponent.ts
    ExperienceComponent.ts
    ProjectileComponent.ts
    DecayComponent.ts
  types.ts                # Registry interfaces (Animal, Resource, Recipe)
  constants.ts            # Static IDs and configuration

server/src/
  systems/                # Server-side systems (TO DO)
    HungerSystem.ts       # Hunger depletion, starvation checks
    AgingSystem.ts        # Age progression, old age death
    DecaySystem.ts        # Object decay (dead animals → bones)
    AnimalAISystem.ts     # Animal movement, aggression
    ProjectileSystem.ts   # Projectile movement, collision, damage
    SeasonSystem.ts       # Season progression, weather
    CombatSystem.ts       # Damage calculation, death handling
  managers/
    PlayerManager.ts      # Player creation, removal, lookups
    WorldManager.ts       # World state, object placement
  engine.ts               # Thin orchestrator (~50 lines target)

client/src/
  systems/                # Client-side systems (TO DO)
    RenderSystem.ts       # Canvas drawing, sprites, animations
    InputSystem.ts        # Keyboard/mouse handling
    AudioSystem.ts        # Sound effects synthesis
    UISystem.ts           # HUD, chat, menus
    WeatherSystem.ts      # Particle effects (rain, snow)
  network/
    NetworkManager.ts     # Socket.io event handlers
  game.ts                 # Thin orchestrator (~50 lines target)
```

## 3. Refactoring Phases

### Phase 1: Shared Foundation ✅ COMPLETE
1. ✅ Create base ECS classes in `shared/ecs/`
2. ✅ Extract component classes in `shared/components/`
3. ✅ Update `shared/types.ts` to export ECS classes
4. ✅ Update `copilot-instructions.md` with ECS patterns

### Phase 2: Server Systems ✅ COMPLETE
Extract logic from `engine.ts` into dedicated systems:

| Current Method | Target System | Components Used |
|----------------|---------------|-----------------|
| `update()` hunger logic | `HungerSystem` | HungerComponent |
| `update()` aging logic | `AgingSystem` | AgeComponent |
| `updateDecay()` | `DecaySystem` | DecayComponent, HealthComponent |
| `updateAnimals()` | `AnimalAISystem` | PositionComponent, HealthComponent |
| `updateProjectiles()` | `ProjectileSystem` | PositionComponent, VelocityComponent, ProjectileComponent |
| `updateSeason()` | `SeasonSystem` | (world state) |
| `killPlayer()` | `CombatSystem` | HealthComponent, IdentityComponent |

**Refactoring Steps:**
1. Create system class with `update(delta)` method
2. Move relevant logic from `engine.ts` to system
3. System creates/manages its own components
4. Engine instantiates systems and calls `update()` in correct order

### Phase 3: Server Engine Simplification ✅ COMPLETE
Reduce `engine.ts` to a thin orchestrator:
```typescript
class GameEngine {
  private systems: System[] = [];
  
  constructor(io: Server) {
    this.systems = [
      new HungerSystem(),
      new AgingSystem(),
      new AnimalAISystem(),
      new ProjectileSystem(),
      new DecaySystem(),
      new SeasonSystem(),
    ];
  }
  
  update(delta: number) {
    for (const system of this.systems) {
      system.update(delta);
      system.deleteStaleComponents();
    }
  }
}
```

### Phase 4: Client Systems ✅ COMPLETE
Extract logic from `game.ts` into dedicated systems:

| Current Code Section | Target System | Responsibility |
|---------------------|---------------|----------------|
| `draw()`, rendering logic | `RenderSystem` | Canvas drawing, sprites |
| `update()`, key handling | `InputSystem` | Keyboard/mouse events |
| `playSound()` | `AudioSystem` | Web Audio synthesis |
| HUD updates, chat | `UISystem` | DOM manipulation |
| `drawWeather()`, particles | `WeatherSystem` | Rain/snow effects |
| Socket event handlers | `NetworkManager` | Server communication |

### Phase 5: Client Game Simplification ✅ COMPLETE
Reduce `game.ts` to a thin orchestrator:
```typescript
const networkManager = new NetworkManager(socket);
const systems = [
  new InputSystem(),
  new RenderSystem(canvas, ctx),
  new UISystem(),
  new AudioSystem(),
  new WeatherSystem(),
];

function gameLoop() {
  for (const system of systems) {
    system.update(deltaTime);
  }
  requestAnimationFrame(gameLoop);
}
```

## 4. System Update Order

**Server (1000ms tick):**
1. `HungerSystem` - Deplete hunger
2. `AgingSystem` - Increment ages
3. `AnimalAISystem` - Move animals, check aggression
4. `CombatSystem` - Process damage, deaths
5. `DecaySystem` - Progress decay states
6. `SeasonSystem` - Check season transitions

**Server (50ms tick):**
1. `ProjectileSystem` - Move projectiles, check collisions

**Client (requestAnimationFrame):**
1. `InputSystem` - Process inputs, emit events
2. `NetworkManager` - Process server updates
3. `WeatherSystem` - Update particles
4. `RenderSystem` - Draw everything
5. `UISystem` - Update HUD

## 5. Component-Entity Mapping

### Player Entity
```typescript
const player = new Entity(socketId);
player.attachComponents(
  new PositionComponent(x, y),
  new HealthComponent(100),
  new HungerComponent(20),
  new AgeComponent(startAge, 60),
  new IdentityComponent(name, motherId, motherName),
  new ExperienceComponent(0),
  new InventoryComponent(3),
);
```

### Projectile Entity
```typescript
const projectile = new Entity();
projectile.attachComponents(
  new PositionComponent(x, y),
  new VelocityComponent(vx, vy),
  new ProjectileComponent(ownerId, type, maxDist, angle, damage),
);
```

### Animal (World Object)
```typescript
const animal = new Entity();
animal.attachComponents(
  new PositionComponent(tileX, tileY),
  new HealthComponent(animalDef.hp),
  new AgeComponent(0, 100),
  new DecayComponent(3),
);
```

## 6. Registry Integration
The existing registry pattern (`server/data/*.json`) remains unchanged. Systems query the registry for entity definitions:
```typescript
// In AnimalAISystem
const animalDef = registry.get('animals')[animalKey];
const moveChance = animalDef.speed || 0.2;
```

## 7. Migration Strategy
1. **Incremental**: Refactor one system at a time, keeping the game functional
2. **Parallel paths**: New ECS code can coexist with old code during transition
3. **Test each system**: Verify behavior matches before removing old code
4. **File size rule**: If any file exceeds 150 lines, split it further

## 8. Next Steps
1. [x] Create `HungerSystem` - simplest system to start
2. [x] Create `AgingSystem` - similar pattern
3. [x] Create `DecaySystem` - more complex state transitions
4. [x] Create `SeasonSystem` - world time and seasons
5. [x] Create `ProjectileSystem` - collision detection
6. [x] Create `PlayerManager` - player entity management
7. [x] Create `AnimalAISystem` - animal movement and aggression
8. [x] Refactor `engine.ts` to use systems (420 → 360 lines)
9. [x] Create client `AudioSystem` (74 lines)
10. [x] Create client `InputSystem` (144 lines)
11. [x] Create client `WeatherSystem` (116 lines)
12. [x] Create client `UISystem` (183 lines)
13. [x] Create client `RenderSystem` + `PlayerRenderer` (230 + 155 lines)
14. [x] Create client `NetworkManager` (105 lines)
15. [x] Refactor `game.ts` to use systems (777 → 113 lines)

## 9. Final Line Counts

### Server Files
| File | Lines |
|------|-------|
| engine.ts | 360 |
| systems/HungerSystem.ts | 74 |
| systems/AgingSystem.ts | 87 |
| systems/DecaySystem.ts | 153 |
| systems/SeasonSystem.ts | 103 |
| systems/ProjectileSystem.ts | 187 |
| systems/AnimalAISystem.ts | 197 |
| managers/PlayerManager.ts | 220 |

### Client Files
| File | Lines |
|------|-------|
| game.ts | 113 |
| systems/AudioSystem.ts | 74 |
| systems/InputSystem.ts | 144 |
| systems/WeatherSystem.ts | 116 |
| systems/UISystem.ts | 183 |
| systems/RenderSystem.ts | 230 |
| systems/PlayerRenderer.ts | 155 |
| network/NetworkManager.ts | 105 |

**Total reduction:**
- `engine.ts`: 420 → 360 lines (14% reduction, logic distributed to 6 systems)
- `game.ts`: 777 → 113 lines (85% reduction, logic distributed to 7 files)
