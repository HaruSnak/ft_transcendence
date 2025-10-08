// src/utils/SecurityUtils.ts

export class SecurityUtils {
    /**
     * Sanitize username to prevent XSS and ensure it's safe
     */
    static sanitizeUsername(username: string): string {
        if (!username) return '';

        // Remove HTML tags
        let sanitized = username.replace(/<[^>]*>/g, '');

        // Remove potential script injections
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');

        // Trim whitespace
        sanitized = sanitized.trim();

        // Limit length (assuming max 50 chars)
        if (sanitized.length > 50) {
            sanitized = sanitized.substring(0, 50);
        }

        return sanitized;
    }

    /**
     * Sanitize display name to prevent XSS
     */
    static sanitizeDisplayName(displayName: string): string {
        if (!displayName) return '';

        // Remove HTML tags
        let sanitized = displayName.replace(/<[^>]*>/g, '');

        // Remove potential script injections
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');

        // Trim whitespace
        sanitized = sanitized.trim();

        // Limit length (assuming max 100 chars)
        if (sanitized.length > 100) {
            sanitized = sanitized.substring(0, 100);
        }

        return sanitized;
    }

    /**
     * General XSS sanitizer for any text input
     */
    static sanitizeText(text: string): string {
        if (!text) return '';

        // Remove HTML tags
        let sanitized = text.replace(/<[^>]*>/g, '');

        // Remove potential script injections
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');

        // Trim whitespace
        return sanitized.trim();
    }

    /**
     * Validate username format
     */
    static isValidUsername(username: string): boolean {
        if (!username) return false;

        // Only alphanumeric, underscore, dash, min 3 chars, max 50
        const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
        return usernameRegex.test(username);
    }

    /**
     * Validate display name format
     */
    static isValidDisplayName(displayName: string): boolean {
        if (!displayName) return false;

        // Allow letters, numbers, spaces, underscore, dash, min 1 char, max 100
        const displayNameRegex = /^[a-zA-Z0-9 _-]{1,100}$/;
        return displayNameRegex.test(displayName.trim());
    }
}