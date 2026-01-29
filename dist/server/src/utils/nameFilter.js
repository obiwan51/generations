/**
 * Name validation and profanity filter utility
 */
// Basic list of inappropriate words (can be expanded)
const BANNED_WORDS = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'cunt', 'dick', 'cock', 'pussy',
    'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore', 'bastard',
    'penis', 'vagina', 'nazi', 'hitler', 'rape', 'piss', 'crap'
];
// Common character substitutions for bypassing filters
const SUBSTITUTIONS = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
    '@': 'a', '$': 's', '!': 'i', '+': 't'
};
/**
 * Normalize text by replacing common substitutions
 */
function normalizeText(text) {
    let normalized = text.toLowerCase();
    for (const [sub, char] of Object.entries(SUBSTITUTIONS)) {
        normalized = normalized.split(sub).join(char);
    }
    // Remove repeated characters (e.g., "fuuuck" -> "fuck")
    normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
    return normalized;
}
/**
 * Check if text contains any banned words
 */
function containsBannedWord(text) {
    const normalized = normalizeText(text);
    return BANNED_WORDS.some(word => normalized.includes(word));
}
/**
 * Validate a player name
 * Returns { valid: true } or { valid: false, reason: string }
 */
export function validateName(name) {
    // Trim whitespace
    const trimmed = name.trim();
    // Check if empty
    if (!trimmed) {
        return { valid: false, reason: 'Name cannot be empty' };
    }
    // Check length (max 20 characters)
    if (trimmed.length > 20) {
        return { valid: false, reason: 'Name must be 20 characters or less' };
    }
    // Check for single word (no spaces)
    if (/\s/.test(trimmed)) {
        return { valid: false, reason: 'Name must be a single word (no spaces)' };
    }
    // Check for letters only (allow some accented characters)
    if (!/^[a-zA-ZÀ-ÿ]+$/.test(trimmed)) {
        return { valid: false, reason: 'Name must contain only letters' };
    }
    // Check for minimum length
    if (trimmed.length < 2) {
        return { valid: false, reason: 'Name must be at least 2 characters' };
    }
    // Check for profanity
    if (containsBannedWord(trimmed)) {
        return { valid: false, reason: 'Name contains inappropriate language' };
    }
    return { valid: true };
}
/**
 * Capitalize first letter, lowercase rest
 */
export function formatName(name) {
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
//# sourceMappingURL=nameFilter.js.map