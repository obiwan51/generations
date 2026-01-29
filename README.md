# Generations

**Generations** is a multiplayer survival engine and sandbox platform inspired by *One Hour One Life*, built with **Node.js**, **Socket.io**, and **HTML5 Canvas**. 

More than just a survival game, **Generations** is a data-driven platform designed to allow developers and designers to create their own unique survival adventures. The entire game world—from biology and crafting recipes to ecosystems and object properties—is defined dynamically, making it a powerful engine for emergent multiplayer storytelling.

## 🚀 Technologies

*   **Runtime**: [Node.js](https://nodejs.org/) (Server)
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (Shared codebase)
*   **Networking**: [Socket.io](https://socket.io/) (Real-time communication)
*   **Client**: [Vite](https://vitejs.dev/) + HTML5 Canvas
*   **Architecture**: Entity-Component-System (ECS)

## ✨ Features

*   **Multiplayer Survival**: Real-time interaction with other players in a shared persistent world.
*   **Lifecycle Mechanics**: Players are born, age, get hungry, and eventually die.
*   **Dynamic World**:
    *   **Seasons**: The world cycles through Spring, Summer, Autumn, and Winter (10-minute duration).
    *   **Biomes**: Grasslands, Deserts, Swamps, Forests, and Water.
    *   **Decay & Growth**: Objects decay over time; plants grow and spread.
*   **Crafting System**: Context-based interaction to combine items (e.g., *Sharp Stone* + *Log* = *Spear*).
*   **Ecosystem**: Animals (Rabbits, Deer, Wolves, Bears) with AI behaviors.
*   **ECS Architecture**: Flexible system for managing game entities, components (Health, Position, Inventory), and logic systems (Physics, Hunger, Rendering).

## 🌍 World Management Platform

**Generations** empowers administrators to be game designers. The logic is decoupled from the content, allowing you to reshape the experience without touching code.

### 1. Data-Driven Design (JSON)
The core game rules are defined in accessible JSON files in `server/data/`:
*   **`items.json`**: Define tools, food, containers, and their properties (edible, capacity, decay rate).
*   **`recipes.json`**: Create complex crafting trees. Define inputs, outputs, tools required, and transformation logic.
*   **`animals.json`**: Design ecosystem behaviors. Set speed, aggression, health, and loot drops.
*   **`resources.json`**: Configure map generation, biome distribution, and spawn rates for natural resources.

### 2. Live Admin Panel
Includes a comprehensive web-based Admin Dashboard (`/admin.html`) for real-time management:
*   **Entity Inspector**: View and edit live entities, players, and animals.
*   **Hot-Reloading**: Modify recipes or item stats in JSON and reload them instantly without restarting the server.
*   **World Manipulation**: 
    *   Reset map objects while preserving terrain.
    *   Spawn items or entities for events.
    *   Monitor server performance and entity counts.
*   **Player Oversight**: Manage bans, view logs, and monitor interactions.

This system allows for rapid prototyping of new survival concepts (e.g., a "Space Survival" mod or a "Medieval Farming" sim) just by swapping the data files.

## 🛠️ Installation & Usage

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd one-life
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run in Development Mode:**
    You need two terminals for development:

    *   **Terminal 1 (Server)**:
        ```bash
        npm run dev
        ```
        *Runs the backend on port 3000 (auto-reloads).*

    *   **Terminal 2 (Client)**:
        ```bash
        npm run dev:client
        ```
        *Starts the Vite dev server (usually http://localhost:5173).*

4.  **Build for Production:**
    ```bash
    npm run build
    ```

5.  **Access**:
    Open the URL provided by Vite (e.g., `http://localhost:5173`) in your browser to play.
    Access `http://localhost:5173/admin.html` for game administration tools.

## 🎮 Controls

The game uses a **Contextual Mouse Click System**. Action depends on what you are holding and what you click.

*   **Move**: Left Click on empty ground (far away).
*   **Interact**: Left Click on an object (nearby).
    *   *Empty Hand*: Pick up item / Eat food.
    *   *Holding Item*: Use item on target / Craft / Drop (if clicking ground).
    *   *Dig*: **Shift** + Click with a shovel on ground.
*   **Drop Item**: Left click on self/ground (unless using Shift for Digging).
*   **Attack**: Left Click nearby animal/player (requires weapon for full damage).
*   **Chat**: Press `Enter` to type and send messages.
*   **Recipe Book**: Press `R` to toggle the recipe guide.
*   **Coordinates**: Press `C` to toggle position display.

## 📂 Project Structure

*   **/client**: Frontend logic.
    *   `src/systems/`: Client-side ECS systems (Rendering, Input, Audio).
    *   `src/network/`: Socket event handling.
*   **/server**: Backend logic.
    *   `src/systems/`: Server-side ECS systems (Physics, Decay, Hunger, Growth).
    *   `src/managers/`: Player and World state management.
    *   `data/`: JSON definitions for `animals`, `recipes`, `items`, etc.
*   **/shared**: Code used by both client and server.
    *   `ecs/`: Base `Entity`, `Component`, `System` classes.
    *   `components/`: Shared component definitions (Position, Health, Inventory).
    *   `constants.ts`: Global configurations (Map size, Season duration).
*   **/assets**: Visual assets (SVG format).

## 📝 License

This project is licensed under the **ISC License**.
