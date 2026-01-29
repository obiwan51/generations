import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class Registry {
    data;
    idCache = new Map();
    constructor() {
        this.data = {
            animals: {},
            resources: {},
            items: {},
            recipes: []
        };
        this.load();
    }
    load() {
        try {
            const dataDir = path.join(__dirname, '../data');
            const animalsPath = path.join(dataDir, 'animals.json');
            const resourcesPath = path.join(dataDir, 'resources.json');
            const itemsPath = path.join(dataDir, 'items.json');
            const recipesPath = path.join(dataDir, 'recipes.json');
            if (fs.existsSync(animalsPath)) {
                this.data.animals = JSON.parse(fs.readFileSync(animalsPath, 'utf8'));
            }
            if (fs.existsSync(resourcesPath)) {
                this.data.resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
            }
            if (fs.existsSync(itemsPath)) {
                this.data.items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
            }
            if (fs.existsSync(recipesPath)) {
                this.data.recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
            }
            // Rebuild ID cache
            this.rebuildIdCache();
            console.log('[Registry] Data loaded successfully');
            console.log(`  - ${Object.keys(this.data.animals).length} animals`);
            console.log(`  - ${Object.keys(this.data.resources).length} resources`);
            console.log(`  - ${Object.keys(this.data.items).length} items`);
            console.log(`  - ${this.data.recipes.length} recipes`);
        }
        catch (error) {
            console.error('[Registry] Failed to load data:', error);
        }
    }
    rebuildIdCache() {
        this.idCache.clear();
        for (const key in this.data.resources) {
            this.idCache.set(key, this.data.resources[key].id);
        }
        for (const key in this.data.items) {
            this.idCache.set(key, this.data.items[key].id);
        }
        for (const key in this.data.animals) {
            this.idCache.set(key, this.data.animals[key].id);
        }
    }
    /**
     * Get entity ID by key name (e.g., "ROCK" -> 3, "BOW" -> 109)
     */
    getId(key) {
        return this.idCache.get(key) ?? null;
    }
    /**
     * Get entity ID by key name, throws if not found
     */
    getIdOrThrow(key) {
        const id = this.idCache.get(key);
        if (id === undefined) {
            throw new Error(`Registry: Unknown entity key "${key}"`);
        }
        return id;
    }
    get(type) {
        return this.data[type];
    }
    set(type, content) {
        this.data[type] = content;
        this.rebuildIdCache();
        this.save(type);
    }
    save(type) {
        try {
            const dataDir = path.join(__dirname, '../data');
            const saveFile = (filename, data) => {
                const filePath = path.join(dataDir, filename);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            };
            // Save only specific type if provided, otherwise save all
            if (!type || type === 'animals')
                saveFile('animals.json', this.data.animals);
            if (!type || type === 'resources')
                saveFile('resources.json', this.data.resources);
            if (!type || type === 'items')
                saveFile('items.json', this.data.items);
            if (!type || type === 'recipes')
                saveFile('recipes.json', this.data.recipes);
            console.log('[Registry] Data saved successfully');
        }
        catch (error) {
            console.error('[Registry] Failed to save data:', error);
        }
    }
    getAll() {
        return this.data;
    }
}
export default new Registry();
//# sourceMappingURL=registry.js.map