// Module de protection contre les attaques XSS (Cross-Site Scripting) et injection SQL
// Fournit des fonctions de sanitization et validation pour sécuriser les inputs utilisateur

export class SecurityUtils {
    // ==================== CONSTANTES DE VALIDATION ====================
    
    private static readonly BLACKLISTED_WORDS: string[] = [
        'admin', 'administrator', 'root', 'system', 'bot', 'cpu',
        'moderator', 'mod', 'staff', 'support', 'owner', 'master',
        'player', 'user', 'guest', 'anonymous', 'test', 'demo'
    ];
    
    private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    private static readonly DISPLAY_NAME_REGEX = /^[a-zA-Z0-9]{1,24}$/;

    // ==================== SANITIZATION XSS ====================

    /**
        Échappe les caractères HTML dangereux pour prévenir l'injection de scripts
        Convertit & < > " ' / en entités HTML sûres (&amp; &lt; etc.)
    */
    static escapeHTML(text: string): string {
        if (!text) return '';
        
        const htmlEscapeMap: { [key: string]: string } = {
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
        Sanitise un username en supprimant balises HTML, scripts et caractères spéciaux
        Garde uniquement alphanumériques, tirets et underscores (max 20 caractères)
    */
    static sanitizeUsername(username: string): string {
        if (!username) return '';

        let sanitized = username.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');
        sanitized = sanitized.trim();

        if (sanitized.length > 20) {
            sanitized = sanitized.substring(0, 20);
        }

        return sanitized;
    }

    /**
        Sanitise un display name en supprimant balises HTML et scripts
        Garde uniquement caractères alphanumériques (max 24 caractères)
    */
    static sanitizeDisplayName(displayName: string): string {
        if (!displayName) return '';

        let sanitized = displayName.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
        sanitized = sanitized.trim();

        if (sanitized.length > 24) {
            sanitized = sanitized.substring(0, 24);
        }

        return sanitized;
    }

    /**
        Sanitise un message de chat en supprimant balises HTML et scripts
        Limite la longueur à 500 caractères pour protection anti-spam
    */
    static sanitizeChatMessage(message: string): string {
        if (!message) return '';

        const MAX_MESSAGE_LENGTH = 500;
        let sanitized = message.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');

        if (sanitized.length > MAX_MESSAGE_LENGTH) {
            sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
        }

        return sanitized.trim();
    }

    /**
        Sanitiseur XSS générique pour tout texte
        Supprime balises HTML, scripts javascript: et event handlers
    */
    static sanitizeText(text: string): string {
        if (!text) return '';

        let sanitized = text.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');

        return sanitized.trim();
    }

    /**
        Sanitise une URL en acceptant uniquement http://, https:// et data:image/
        Bloque les protocoles dangereux (javascript:, vbscript:, file:)
    */
    static sanitizeURL(url: string): string {
        if (!url) return '';

        const urlPattern = /^(https?:\/\/|data:image\/)/i;
        
        if (!urlPattern.test(url)) {
            return '';
        }

        if (/javascript:|vbscript:|file:|data:(?!image)/i.test(url)) {
            return '';
        }

        return url;
    }

    // ==================== VALIDATION ====================

    /**
        Valide le format d'un username
        Retourne true si le username contient 3-20 caractères alphanumériques, _ ou - et n'est pas dans la liste noire
    */
    static isValidUsername(username: string): boolean {
        if (!username) return false;
        if (this.BLACKLISTED_WORDS.includes(username.toLowerCase())) return false;
        return this.USERNAME_REGEX.test(username);
    }

    /**
        Valide le format d'un display name
        Retourne true si le display name est valide selon validateDisplayName()
    */
    static isValidDisplayName(displayName: string): boolean {
        return this.validateDisplayName(displayName) === null;
    }

    /**
        Valide un display name et retourne un message d'erreur si invalide
        Vérifie la longueur (1-24 chars) et le format (alphanumériques uniquement)
    */
    static validateDisplayName(displayName: string): string | null {
        if (!displayName) return 'Display name cannot be empty';
        
        const trimmed = displayName.trim();
        if (trimmed !== displayName) return 'Display name cannot have leading or trailing spaces';
        if (trimmed.length === 0) return 'Display name cannot be empty';
        if (trimmed.length > 24) return 'Display name too long (max 24 characters)';
        if (!this.DISPLAY_NAME_REGEX.test(trimmed)) return 'Display name can only contain letters and numbers';
        
        return null;
    }

    /**
        Valide le format d'un email
        Retourne true si l'email suit le pattern basique adresse@domaine.extension
    */
    static isValidEmail(email: string): boolean {
        return this.EMAIL_REGEX.test(email);
    }

    // ==================== DÉTECTION D'INJECTIONS ====================

    /**
        Détecte les tentatives d'injection SQL courantes
        Recherche les mots-clés SQL (SELECT, DROP, etc.) et patterns dangereux
    */
    static detectSQLInjection(input: string): boolean {
        const sqlPatterns = [
            /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
            /(\-\-|;|\/\*|\*\/)/,
            /(\bOR\b|\bAND\b)\s+[\w\d]+\s*=\s*[\w\d]+/i,
            /'(\s*OR\s*'?\d+)?=/i
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    // ==================== MANIPULATION DOM SÉCURISÉE ====================

    /**
        Crée un élément texte sécurisé pour insertion dans le DOM
        Utilise createTextNode() pour éviter l'interprétation HTML
    */
    static createSafeTextNode(text: string): Text {
        return document.createTextNode(this.escapeHTML(text));
    }

    /**
        Insère du texte de manière sécurisée dans un élément HTML
        Utilise textContent au lieu de innerHTML pour prévenir l'exécution de scripts
    */
    static setElementText(element: HTMLElement, text: string): void {
        element.textContent = this.escapeHTML(text);
    }

    // ==================== VALIDATION COMPLÈTE ====================

    /**
        Valide et sanitise un input selon son type (username, displayName, message, email)
        Retourne un objet avec le statut de validation, la valeur sanitisée et un message d'erreur éventuel
    */
    static validateAndSanitizeInput(
        input: string, 
        type: 'username' | 'displayName' | 'message' | 'email'
    ): { valid: boolean, sanitized: string, error?: string } {
        if (!input) {
            return { valid: false, sanitized: '', error: 'Input cannot be empty' };
        }

        if (this.detectSQLInjection(input)) {
            return { valid: false, sanitized: '', error: 'Potentially malicious input detected' };
        }

        let sanitized: string;
        
        switch (type) {
            case 'username':
                sanitized = this.sanitizeUsername(input);
                if (sanitized.length < 3) {
                    return { valid: false, sanitized, error: 'Username must be at least 3 characters' };
                }
                if (!this.isValidUsername(sanitized)) {
                    return { valid: false, sanitized, error: 'Invalid username format' };
                }
                break;
            
            case 'displayName':
                sanitized = this.sanitizeDisplayName(input);
                const displayNameError = this.validateDisplayName(sanitized);
                if (displayNameError) {
                    return { valid: false, sanitized, error: displayNameError };
                }
                break;
            
            case 'message':
                sanitized = this.sanitizeChatMessage(input);
                if (sanitized.length < 1) {
                    return { valid: false, sanitized, error: 'Message cannot be empty' };
                }
                break;
            
            case 'email':
                sanitized = input.trim();
                if (!this.isValidEmail(sanitized)) {
                    return { valid: false, sanitized, error: 'Invalid email format' };
                }
                break;
            
            default:
                sanitized = this.escapeHTML(input);
        }

        return { valid: true, sanitized };
    }
}