/**
 * Module de sécurité pour le service de chat
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
	 * Sanitise un message de chat
	 */
	static sanitizeChatMessage(message) {
		if (!message) return '';

		// Supprimer tous les tags HTML
		let sanitized = message.replace(/<[^>]*>/g, '');
		
		// Supprimer les URLs javascript:
		sanitized = sanitized.replace(/javascript:/gi, '');
		
		// Supprimer les event handlers
		sanitized = sanitized.replace(/on\w+\s*=/gi, '');
		
		// Limiter la longueur
		const MAX_MESSAGE_LENGTH = 500;
		if (sanitized.length > MAX_MESSAGE_LENGTH) {
			sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
		}

		return sanitized.trim();
	}

	/**
	 * Sanitise un username
	 */
	static sanitizeUsername(username) {
		if (!username) return '';

		// Supprimer HTML et scripts
		let sanitized = username.replace(/<[^>]*>/g, '');
		sanitized = sanitized.replace(/javascript:/gi, '');
		sanitized = sanitized.replace(/on\w+\s*=/gi, '');
		
		// Garder seulement alphanumériques, _ et -
		sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');
		
		// Limiter longueur
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

		// Supprimer HTML et scripts
		let sanitized = displayName.replace(/<[^>]*>/g, '');
		sanitized = sanitized.replace(/javascript:/gi, '');
		sanitized = sanitized.replace(/on\w+\s*=/gi, '');
		
		// Garder seulement alphanumériques et underscores
		sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');
		
		// Limiter longueur
		const MAX_DISPLAY_NAME_LENGTH = 24;
		if (sanitized.length > MAX_DISPLAY_NAME_LENGTH) {
			sanitized = sanitized.substring(0, MAX_DISPLAY_NAME_LENGTH);
		}

		return sanitized.trim();
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
		const displayNameRegex = /^[a-zA-Z0-9_]{1,24}$/;
		return displayNameRegex.test(displayName);
	}

	/**
	 * Valide un message
	 */
	static isValidMessage(message) {
		if (!message) return false;
		if (message.length < 1 || message.length > 500) return false;
		return true;
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
}
