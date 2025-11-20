import jwt from 'jsonwebtoken';
import userService from './userService.js';

// 5 tentatives de login par minute et par IP
const loginAttempts = {};
const LOGIN_WINDOW_MS = 60_000; // 1 minute
const LOGIN_MAX_ATTEMPTS = 5;

function getClientIp(request) {
	const forwarded = request.headers['x-forwarded-for'];
	if (forwarded && typeof forwarded === 'string') {
		return forwarded.split(',')[0].trim();
	}
	if (request.ip) {
		return request.ip;
	}
	if (request.socket && request.socket.remoteAddress) {
		return request.socket.remoteAddress;
	}
	return 'unknown';
}

// Rate limite pour la route de login
export async function rateLimitLogin(request, reply) {
	const ip = getClientIp(request);
	const now = Date.now();

	let record = loginAttempts[ip];

	if (!record || now - record.firstAttempt > LOGIN_WINDOW_MS) {
		record = { count: 1, firstAttempt: now };
		loginAttempts[ip] = record;
		return;
	}

	record.count += 1;
	loginAttempts[ip] = record;

	if (record.count > LOGIN_MAX_ATTEMPTS) {
		return reply.code(429).send({
			success: false,
			error: 'Too many login attempts. Please try again later.'
		});
	}
}

// Détecter les tentatives d'injection SQL
function detectSQLInjection(input) {
	const sqlPatterns = [
		/(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
		/(\-\-|;|\/\*|\*\/)/,
		/(\bOR\b|\bAND\b)\s+[\w\d]+\s*=\s*[\w\d]+/i,
		/'(\s*OR\s*'?\d+)?=/i
	];
	for (const pattern of sqlPatterns) {
		if (pattern.test(input)) {
			return true;
		}
	}
	return false;
}

// Sanitiser un username
function sanitizeUsername(username) {
	if (!username)
		return '';
	let sanitized = username.replace(/<[^>]*>/g, '');
	sanitized = sanitized.replace(/javascript:/gi, '');
	sanitized = sanitized.replace(/on\w+\s*=/gi, '');
	sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');
	return sanitized.substring(0, 20).trim();
}

// Sanitiser un email
function sanitizeEmail(email) {
	if (!email)
		return '';
	let sanitized = email.trim().toLowerCase();
	sanitized = sanitized.replace(/javascript:/gi, '');
	sanitized = sanitized.replace(/on\w+\s*=/gi, '');
	return sanitized;
}

// Sanitiser un display name
function sanitizeDisplayName(displayName) {
	if (!displayName)
		return '';
	let sanitized = displayName.replace(/<[^>]*>/g, '');
	sanitized = sanitized.replace(/javascript:/gi, '');
	sanitized = sanitized.replace(/on\w+\s*=/gi, '');
	return sanitized.substring(0, 50).trim();
}

// Middleware d'authentification
export async function authenticateToken(request, reply) {
	const authHeader = request.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return reply.code(401).send({
			success: false,
			error: 'Access token required'
		});
	}

	try {
		const decoded = await userService.verifyToken(token);
		request.user = decoded;
		request.token = token;
		return;
	} catch (err) {
		return reply.code(403).send({
			success: false,
			error: 'Invalid or expired token'
		});
	}
}

// Middleware de validation des données
export function validateUserData(schema) {
	return async function(request, reply) {
		try {
			if (schema.username) {
				const username = request.body.username;
				
				if (!username || typeof username !== 'string' || username.trim().length < 3) {
					reply.code(400).send({ error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères.' });
					return;
				}

				if (detectSQLInjection(username)) {
					reply.code(400).send({ error: 'Caractères dangereux détectés dans le nom d\'utilisateur.' });
					return;
				}

				const sanitized = sanitizeUsername(username);
				if (sanitized.length < 3 || sanitized.length > 20) {
					reply.code(400).send({ error: 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères alphanumériques.' });
					return;
				}

				request.body.username = sanitized;
			}

			if (schema.email) {
				const email = request.body.email;

				if (!email || typeof email !== 'string') {
					reply.code(400).send({ error: 'Email requis.' });
					return;
				}

				if (detectSQLInjection(email)) {
					reply.code(400).send({ error: 'Caractères dangereux détectés dans l\'email.' });
					return;
				}

				const sanitized = sanitizeEmail(email);
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(sanitized)) {
					reply.code(400).send({ error: 'Format d\'email invalide.' });
					return;
				}

				request.body.email = sanitized;
			}

			if (schema.password) {
				const password = request.body.password;

				if (!password || typeof password !== 'string') {
					reply.code(400).send({ error: 'Mot de passe requis.' });
					return;
				}

				if (password.length < 8) {
					reply.code(400).send({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
					return;
				}
			}

			if (request.body.display_name) {
				const displayName = request.body.display_name;

				if (detectSQLInjection(displayName)) {
					reply.code(400).send({ error: 'Caractères dangereux détectés dans le nom d\'affichage.' });
					return;
				}

				request.body.display_name = sanitizeDisplayName(displayName);
			}

		} catch (error) {
			reply.code(400).send({ error: 'Erreur de validation.' });
		}
	};
}
