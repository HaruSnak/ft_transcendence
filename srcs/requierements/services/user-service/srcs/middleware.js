import jwt from 'jsonwebtoken';
import userService from './userService.js';

// Détecte les tentatives d'injection SQL
function detectSQLInjection(input) {
	const sqlPatterns = [
		/(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
		/(\-\-|;|\/\*|\*\/)/,
		/(\bOR\b|\bAND\b)\s+[\w\d]+\s*=\s*[\w\d]+/i,
		/'(\s*OR\s*'?\d+)?=/i
	];
	return sqlPatterns.some(pattern => pattern.test(input));
}

// Sanitise un username (retire XSS et caractères dangereux)
function sanitizeUsername(username) {
	if (!username) return '';
	let sanitized = username.replace(/<[^>]*>/g, ''); // retire HTML tags
	sanitized = sanitized.replace(/javascript:/gi, '');
	sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // retire event handlers
	sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, ''); // uniquement alphanum + _ -
	return sanitized.substring(0, 20).trim(); // max 20 chars
}

//Sanitise un email
function sanitizeEmail(email) {
	if (!email) return '';
	let sanitized = email.trim().toLowerCase();
	sanitized = sanitized.replace(/javascript:/gi, '');
	sanitized = sanitized.replace(/on\w+\s*=/gi, '');
	return sanitized;
}

// Middleware d'authentification
export async function authenticateToken(request, reply) {
	console.log('🔐 Authentication middleware called');
	console.log('📋 Request headers:', request.headers);

	const authHeader = request.headers['authorization'];
	console.log('🔑 Auth header:', authHeader ? `Present: ${authHeader.substring(0, 20)}...` : 'Missing');

	const token = authHeader && authHeader.split(' ')[1];
	console.log('🎫 Extracted token:', token ? `Present (length: ${token.length})` : 'Missing');

	if (!token) {
		console.log('❌ No token provided');
		return reply.code(401).send({
			success: false,
			error: 'Access token required'
		});
	}

	// Verifier blacklist, signature et expiration du token
	try {
		const decoded = await userService.verifyToken(token);
		console.log('✅ Token verified (not blacklisted) for user:', decoded.userId);
		request.user = decoded;
		request.token = token;
		// Continue to the route handler
		return;
	} catch (err) {
		console.log('❌ Token verification failed:', err.message);
		return reply.code(403).send({
			success: false,
			error: 'Invalid or expired token',
			details: err.message
		});
	}
}

// Middleware de validation des données
export function validateUserData(schema) {
	return async function(request, reply) {
		try {
			// Validation username
			if (schema.username) {
				const username = request.body.username;
				
				if (!username || typeof username !== 'string' || username.trim().length < 3) {
					reply.code(400).send({ error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères.' });
					return;
				}

				// Détection SQL injection
				if (detectSQLInjection(username)) {
					reply.code(400).send({ error: 'Caractères dangereux détectés dans le nom d\'utilisateur.' });
					return;
				}

				// Sanitisation
				const sanitized = sanitizeUsername(username);
				if (sanitized.length < 3 || sanitized.length > 20) {
					reply.code(400).send({ error: 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères alphanumériques.' });
					return;
				}

				request.body.username = sanitized;
			}

			// Validation email
			if (schema.email) {
				const email = request.body.email;

				if (!email || typeof email !== 'string') {
					reply.code(400).send({ error: 'Email requis.' });
					return;
				}

				// Détection SQL injection
				if (detectSQLInjection(email)) {
					reply.code(400).send({ error: 'Caractères dangereux détectés dans l\'email.' });
					return;
				}

				// Sanitisation et validation format
				const sanitized = sanitizeEmail(email);
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(sanitized)) {
					reply.code(400).send({ error: 'Format d\'email invalide.' });
					return;
				}

				request.body.email = sanitized;
			}

			// Validation password
			if (schema.password) {
				const password = request.body.password;

				if (!password || typeof password !== 'string') {
					reply.code(400).send({ error: 'Mot de passe requis.' });
					return;
				}

				// Renforcement: min 8 caractères (au lieu de 6)
				if (password.length < 8) {
					reply.code(400).send({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
					return;
				}
			}

			// Validation display_name si présent
			if (request.body.display_name) {
				const displayName = request.body.display_name;

				if (detectSQLInjection(displayName)) {
					reply.code(400).send({ error: 'Caractères dangereux détectés dans le nom d\'affichage.' });
					return;
				}

				// Sanitisation légère (retire HTML mais garde espaces pour noms composés)
				let sanitized = displayName.replace(/<[^>]*>/g, '');
				sanitized = sanitized.replace(/javascript:/gi, '');
				sanitized = sanitized.replace(/on\w+\s*=/gi, '');
				sanitized = sanitized.substring(0, 50).trim(); // max 50 chars

				request.body.display_name = sanitized;
			}

		} catch (error) {
			reply.code(400).send({ error: 'Erreur de validation.' });
		}
	};
}
