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

    /**
     * Validate username with error codes
     * -1: Username too short or too long (min 3, max 10)
     * -2: Username can only contain letters and numbers
     * -3: Username forbidden
     */
    static validateUsername(username: string): number {
        if (username.length < 3 || username.length > 10) return -1;
        if (!/^[a-zA-Z0-9]{3,10}$/.test(username)) return -2;
        
        const blacklisted = ['admin', 'administrator', 'root', 'system', 'bot', 'cpu', 'moderator', 'mod', 'staff', 'support', 'owner', 'master', 'player', 'user', 'guest', 'anonymous', 'test', 'demo', 'winner', 'loser', 'champion', 'tournament', 'game'];
        if (blacklisted.includes(username.toLowerCase())) return -3;
        return 0;
    }

    /**
     * Validate email with error codes
     * -1: Email too short or too long
     * -2: Missing @ in email
     * -3: Missing . in domain extension
     * -4: Only one @ allowed
     * -5: Invalid local part
     * -6: Invalid domain
     * -7: Invalid extension
     */
    static validateEmail(email: string): number {
        if (email.length < 6 || email.length > 100) return -1;
        const dotIndex = email.lastIndexOf('.');
        if (!email.includes('@') || !(dotIndex >= 2 && dotIndex <= 6)) {
            if (!(dotIndex >= 2 && dotIndex <= 6)) return -2;
            return -3;
        }
        const parts = email.split('@');
        if (parts.length > 2) return -4;
        const local = parts[0];
        const domainParts = parts[1].split('.');
        if (domainParts.length === 1) return -3;
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/.test(local)) return -5;
        for (let i = 0; i < domainParts.length - 1; i++) {
            if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(domainParts[i])) return -6;
        }
        if (!/^[a-zA-Z]{2,6}$/.test(domainParts[domainParts.length - 1])) return -7;
        return 0;
    }
}