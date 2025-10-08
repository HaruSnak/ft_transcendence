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

        // Limit length (max 24 chars)
        if (sanitized.length > 24) {
            sanitized = sanitized.substring(0, 24);
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
        return this.validateDisplayName(displayName) === null;
    }

    /**
     * Validate display name format and return error message if invalid
     */
    static validateDisplayName(displayName: string): string | null {
        if (!displayName) return 'Display name cannot be empty';
        
        const trimmed = displayName.trim();
        if (trimmed !== displayName) return 'Display name cannot have leading or trailing spaces';
        if (trimmed.length === 0) return 'Display name cannot be empty';
        if (trimmed.length > 24) return 'Display name too long (max 24 characters)';
        if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return 'Display name can only contain letters and numbers';
        
        return null;
    }
}