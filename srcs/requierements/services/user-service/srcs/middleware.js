import jwt from 'jsonwebtoken';
import userService from './userService.js';

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
			// Validation basique
			if (schema.username && (!request.body.username || typeof request.body.username !== 'string' || request.body.username.trim().length < 3)) {
				reply.code(400).send({ error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères.' });
				return;
			}
			if (schema.email && (!request.body.email || typeof request.body.email !== 'string')) {
				reply.code(400).send({ error: 'Email requis.' });
				return;
			}
			if (schema.password && (!request.body.password || typeof request.body.password !== 'string')) {
				reply.code(400).send({ error: 'Mot de passe requis.' });
				return;
			}

			// Validation du format email
			if (schema.email && request.body.email) {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(request.body.email)) {
					reply.code(400).send({ error: 'Format d\'email invalide.' });
					return;
				}
			}

			// Validation de la longueur du mot de passe
			if (schema.password && request.body.password && request.body.password.length < 6) {
				reply.code(400).send({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
				return;
			}

			// Sanitisation : trim les chaînes
			if (request.body.username) request.body.username = request.body.username.trim();
			if (request.body.email) request.body.email = request.body.email.trim().toLowerCase();
		} catch (error) {
			reply.code(400).send({ error: 'Erreur de validation.' });
		}
	};
}
