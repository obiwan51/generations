/**
 * AudioSystem - Handles all game audio using Web Audio API synthesis
 */
export declare class AudioSystem {
    private audioCtx;
    constructor();
    /**
     * Play a synthesized sound effect
     */
    play(type: 'pick' | 'drop' | 'eat' | 'craft' | 'shoot'): void;
    /**
     * Resume audio context (required after user interaction)
     */
    resume(): void;
}
