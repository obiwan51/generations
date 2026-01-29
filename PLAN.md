# One Life - Development Plan

This document tracks the progress and future milestones of the One Life project.

## Project Stages

### Phase 1: Foundations (COMPLETED)
- [x] Project initialization
- [x] Documentation & Improvement Roadmap
- [x] Basic Socket.io Server/Client handshake
- [x] Simple 2D rendering & movement

### Phase 2: Character & Survival (COMPLETED)
- [x] **Aging Mechanic**: Each minute = 1 year. Death at 60.
- [x] **Hunger System**: Food meter depletion and starvation.
- [x] **Eating Mechanic**: Picking up food items and consuming them. (Basic 'E' implemented)
- [x] **Player Stats UI**: Visible hunger, age, and temperature bars.
- [x] **Reproduction**: Being born to a random "mother" player or spawning as an "Eve".

### Phase 3: World & Environment (COMPLETED)
- [x] **Procedural Map Generation**: Tile-based grassland with resources.
- [x] **Resource Spawning**: Trees, rocks, berries, and wild carrots.
- [x] **Graphic Assets**: Custom SVG assets for world objects.
- [x] **Dynamic Seasons (Improvement 3)**: Each 10 minutes, visual transitions and effects.
- [x] **Procedural Landmarks (Improvement 6)**: Rare ruins added to the world for navigation.

### Phase 4: Interaction & Crafting (COMPLETED)
- [x] **Advanced Interaction System**: Pick up (G), drop (Q), and eat (E) held or ground items.
- [x] **Modern Crafting Interface (Improvement 1)**: Visual, searchable recipe book (R).
- [x] **Unified Inventory (Improvement 8)**: Baskets (nested inventory) with visual contents.
- [x] **Object Transitions**: Multi-step crafting (F).
- [x] **Hunting & Cooking**: 4 animal types (Herbivores/Carnivores), Bow/Arrow hunting, and Fire/Kitchen cooking.
- [x] **Projectile Mechanics**: AnimatedSpear and Bow/Arrow throwing with mouse-click targeting.
- [x] **Skill System**: Experience points (XP) that affect throw distance and accuracy based on age/skill.
- [x] **Expanded Recipes**: 10+ new advanced recipes for survival.

### Phase 5: Society & Lineage (COMPLETED)
- [x] **Lineage Tracking (Improvement 2)**: Ancestry information on Death Screen (Mother, Age).
- [x] **Communication System (Improvement 4)**: Local chat bubbles and contextual hunger emotes.
- [ ] **Trade Interface (Improvement 5)**: Secure bartering between players.
- [ ] **Legacy Skills (Improvement 7)**: Generational bonuses based on family history.

### Phase 6: Meta Systems & Polish (IN PROGRESS)
- [x] **Global Event System (Improvement 9)**: Procedural Weather (Rain/Snow) linked to seasons.
- [x] **Interactive Tutorial (Improvement 10)**: HUD instruction guide and simplified spawn.
- [x] **Audio Polish**: Procedural sound effects for all interactions (Web Audio API).
- [ ] **Architecture Refactor**: JSON-based recipe definitions and Object-Oriented server logic.
- [ ] **Admin Dashboard**: Web interface for server configuration and feature toggles.
- [ ] **Optimization**: Sprite sheet rendering and spatial partitioning for large maps.
- [ ] **Persistence**: Database integration for family history and world state.

---

## Current Sprint
- All core improvements (1-10) implemented or prototyped.
- Sound effects and weather particles added.
- **Next**: Refactoring recipes to JSON and modularizing engine code.
