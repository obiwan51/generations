# One Life - One Hour One Life Clone

## Overview
One Life is a multiplayer survival game where players live for 60 minutes, with each minute representing one year of life. Players are born to existing players and must work together to build a civilization, farm, craft, and survive.

## Technical Stack
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.io
- **Database**: PostgreSQL (for persistence) / Redis (for game state)
- **Frontend**: HTML5 Canvas with PixiJS or Vanilla JS
- **Language**: JavaScript / TypeScript

## 10 Improvement Ideas
1. **Modern Crafting Interface**: A searchable, categorized crafting menu that shows requirements and prerequisites clearly.
2. **Advanced Family Lineage**: A persistent, interactive family tree that records achievements, deaths, and significant historical events of each generation.
3. **Seasons and Weather**: A dynamic weather system that affects crop growth, temperature management, and resource availability (e.g., snow in winter, droughts in summer).
4. **Enhanced Chat and Emotes**: A more expressive communication system including contextual emotes and a refined local chat to facilitate better teamwork.
5. **Trade Systems**: Formalize bartering between different families or tribes with a secure trade interface.
6. **Procedural Landmarks**: Naturally occurring structures or anomalies that provide unique resources or historical interest to encourage exploration.
7. **Legacy Skills**: Small, non-game-breaking bonuses inherited from parents or gained through experience that improve efficiency in specific tasks (farming, smithing, etc.).
8. **Improved Inventory Control**: A drag-and-drop inventory system with better organization for containers like backpacks and baskets.
9. **Global Event System**: Server-wide events like migrations, plagues, or festivals that force or encourage collaboration between distant settlements.
10. **Better New Player Onboarding**: An interactive, contextual tutorial system that guides new players through the basics of survival and reproduction without breaking immersion.

## Project Structure
- `/client`: Frontend assets and logic
- `/server`: Node.js server, logic, and state management
- `/shared`: Shared constants and utility functions
- `/assets`: Sprites, sounds, and data files
