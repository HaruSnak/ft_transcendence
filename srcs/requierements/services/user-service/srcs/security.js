/**
 * Module de sécurité pour le service utilisateur
 * Protection contre les attaques XSS et validation des inputs
 */

export class SecurityUtils {
    /**
     * Échappe les caractères HTML dangereux
     */
    static escapeHTML(text) {
        if (!text) return '';
        
        const htmlEscapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };

        return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
    }

    /**
     * Sanitise un username
     */
    static sanitizeUsername(username) {
        if (!username) return '';

        let sanitized = username.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');
        
        const MAX_USERNAME_LENGTH = 20;
        if (sanitized.length > MAX_USERNAME_LENGTH) {
            sanitized = sanitized.substring(0, MAX_USERNAME_LENGTH);
        }

        return sanitized.trim();
    }

    /**
     * Sanitise un display name
     */
    static sanitizeDisplayName(displayName) {
        if (!displayName) return '';

        let sanitized = displayName.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
        
        const MAX_DISPLAY_NAME_LENGTH = 24;
        if (sanitized.length > MAX_DISPLAY_NAME_LENGTH) {
            sanitized = sanitized.substring(0, MAX_DISPLAY_NAME_LENGTH);
        }

        return sanitized.trim();
    }

    /**
     * Sanitise un email
     */
    static sanitizeEmail(email) {
        if (!email) return '';
        
        // Supprimer espaces et convertir en minuscule
        let sanitized = email.trim().toLowerCase();
        
        // Supprimer scripts
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        
        return sanitized;
    }

    /**
     * Valide un username
     */
    static isValidUsername(username) {
        if (!username) return false;
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        return usernameRegex.test(username);
    }

    /**
     * Valide un display name
     */
    static isValidDisplayName(displayName) {
        if (!displayName) return false;
        const displayNameRegex = /^[a-zA-Z0-9]{1,24}$/;
        return displayNameRegex.test(displayName);
    }

    /**
     * Valide un email
     */
    static isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valide un mot de passe
     */
    static isValidPassword(password) {
        if (!password) return false;
        // Au moins 8 caractères
        return password.length >= 8;
    }

    /**
     * Détecte les injections SQL
     */
    static detectSQLInjection(input) {
        const sqlPatterns = [
            /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
            /(\-\-|;|\/\*|\*\/)/,
            /(\bOR\b|\bAND\b)\s+[\w\d]+\s*=\s*[\w\d]+/i,
            /'(\s*OR\s*'?\d+)?=/i
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Valide et sanitise un input utilisateur
     */
    static validateAndSanitize(input, type) {
        if (!input) {
            return { valid: false, sanitized: '', error: 'Input cannot be empty' };
        }

        // Détection d'injection SQL
        if (this.detectSQLInjection(input)) {
            return { valid: false, sanitized: '', error: 'Potentially malicious input detected' };
        }

        let sanitized;
        let isValid;
        let error = null;

        switch (type) {
            case 'username':
                sanitized = this.sanitizeUsername(input);
                isValid = this.isValidUsername(sanitized);
                if (!isValid) error = 'Invalid username format (3-20 chars, alphanumeric, _, -)';
                break;

            case 'displayName':
                sanitized = this.sanitizeDisplayName(input);
                isValid = this.isValidDisplayName(sanitized);
                if (!isValid) error = 'Invalid display name format (1-24 chars, alphanumeric only)';
                break;

            case 'email':
                sanitized = this.sanitizeEmail(input);
                isValid = this.isValidEmail(sanitized);
                if (!isValid) error = 'Invalid email format';
                break;

            case 'password':
                sanitized = input; // Ne pas modifier le password
                isValid = this.isValidPassword(sanitized);
                if (!isValid) error = 'Password must be at least 8 characters';
                break;

            default:
                sanitized = this.escapeHTML(input);
                isValid = true;
        }

        return { valid: isValid, sanitized, error };
    }
}
