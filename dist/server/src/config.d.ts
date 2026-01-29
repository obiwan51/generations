import { GameConfig } from '../../shared/types.js';
declare class Config {
    private settings;
    constructor();
    get(key: string): any;
    set(key: string, value: any): void;
    getAll(): GameConfig;
}
declare const _default: Config;
export default _default;
