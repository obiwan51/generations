/**
 * Name validation and profanity filter utility
 */
/**
 * Validate a player name
 * Returns { valid: true } or { valid: false, reason: string }
 */
export declare function validateName(name: string): {
    valid: boolean;
    reason?: string;
};
/**
 * Capitalize first letter, lowercase rest
 */
export declare function formatName(name: string): string;
