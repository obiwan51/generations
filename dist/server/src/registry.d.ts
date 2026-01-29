import { RegistryData } from '../../shared/types.js';
declare class Registry {
    private data;
    private idCache;
    constructor();
    load(): void;
    private rebuildIdCache;
    /**
     * Get entity ID by key name (e.g., "ROCK" -> 3, "BOW" -> 109)
     */
    getId(key: string): number | null;
    /**
     * Get entity ID by key name, throws if not found
     */
    getIdOrThrow(key: string): number;
    get(type: keyof RegistryData): Record<string, import("../../shared/types.js").Animal> | Record<string, import("../../shared/types.js").Resource> | Record<string, import("../../shared/types.js").Item> | import("../../shared/types.js").Recipe[];
    set(type: keyof RegistryData, content: any): void;
    save(type?: keyof RegistryData): void;
    getAll(): RegistryData;
}
declare const _default: Registry;
export default _default;
