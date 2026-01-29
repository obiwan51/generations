# Copilot Instructions for One Life

Project Overview: A multiplayer survival game (One Hour One Life clone) built with Node.js, Socket.io, and HTML5 Canvas.

## Architecture (Refactoring In Progress)
The codebase is being refactored to use an **Entity-Component-System (ECS)** architecture. The goal is to keep individual files under ~150 lines for maintainability.

### ECS Pattern Overview
- **Entity**: A unique ID with a collection of components. No behavior, just an identifier.
- **Component**: Pure data attached to entities (e.g., `PositionComponent`, `HealthComponent`).
- **System**: Logic that operates on entities with specific components (e.g., `PhysicsSystem`, `DecaySystem`).

### Target Structure
```
shared/
  ecs/                # Base ECS classes (shared between client/server)
    Entity.ts
    Component.ts
    System.ts
  components/         # Shared component definitions
    PositionComponent.ts
    HealthComponent.ts
    HungerComponent.ts
    InventoryComponent.ts
  types.ts            # Shared interfaces
  constants.ts        # Static IDs and configuration

server/src/
  systems/            # Server-side systems
    PhysicsSystem.ts
    DecaySystem.ts
    SeasonSystem.ts
    CombatSystem.ts
    HungerSystem.ts
  managers/           # State managers
    PlayerManager.ts
    WorldManager.ts
  engine.ts           # Thin orchestrator - wires systems, runs game loop

client/src/
  systems/            # Client-side systems
    RenderSystem.ts
    InputSystem.ts
    AudioSystem.ts
    UISystem.ts
  network/            # Socket event handlers
    NetworkManager.ts
  game.ts             # Thin orchestrator
```

### Current State
- [server/src/engine.ts](server/src/engine.ts) (~420 lines) - needs splitting into ECS systems
- [client/src/game.ts](client/src/game.ts) (~780 lines) - needs splitting into ECS systems
- **Registry Pattern**: Game entity definitions in JSON ([server/data/](server/data/)), loaded by [server/src/registry.ts](server/src/registry.ts)

### Refactoring Guidelines
1. **Create base ECS classes first** in `shared/ecs/` - these are used by both client and server.
2. **Extract components**: Identify data groupings (position, health, hunger, inventory) → create component classes.
3. **Extract systems by responsibility**: Each system operates on entities with specific components.
   - `updateDecay()` → `DecaySystem.update()`
   - `updateAnimals()` → `AISystem.update()`
   - `updateProjectiles()` → `PhysicsSystem.update()`
4. **Systems create their components**: Each system is responsible for creating and managing its component instances.
5. **System update order matters**: Physics → Collision → Combat → Decay → Render.

### ECS Code Pattern
```typescript
// shared/ecs/Component.ts
export class Component {
  id = crypto.randomUUID();
  isDeleted = false;
  delete() { this.isDeleted = true; }
}

// shared/components/PositionComponent.ts
export class PositionComponent extends Component {
  constructor(public x: number, public y: number) { super(); }
}

// server/src/systems/PhysicsSystem.ts
export class PhysicsSystem extends System {
  update(delta: number) {
    for (const component of this.components) {
      if (component.isDeleted) continue;
      // Update logic here
    }
  }
}
```

## Developer Workflows
- **Backend**: `npm run dev` (tsx watch)
- **Frontend**: `npm run dev:client` (Vite)
- **Entity Changes**: Update JSON in [server/data/](server/data/), hot-reload via Admin API (`/admin-api/registry/:type`).

## Code Conventions
- **TypeScript & ESM**: Use `NodeNext` module resolution. **Always use `.js` extensions in imports**.
  ```typescript
  import { PositionComponent } from '../components/PositionComponent.js';
  ```
- **Shared Code**: ECS base classes and components live in `shared/` for use by both client and server.
- **Constants**: Use `CONSTANTS.OBJECT_TYPES` from [shared/constants.ts](shared/constants.ts).
- **Assets**: SVG format in [assets/](assets/).
- **File Size**: Aim for <150 lines per file. If a file grows larger, split it.

## Socket.io Events
- **Server → Client**: `init`, `playerMoved`, `worldUpdate`, `seasonChange`, `deathScreen`, `registryUpdate`
- **Client → Server**: `move`, `eat`, `shoot`, `drop`, `pickup`, `use`, `chat`

## Game Loop Frequencies
- **50ms**: Projectiles, smooth movement interpolation
- **1000ms**: Life ticks (hunger, aging, decay)
