import userService from './userService.js';

// Middleware d'authentification
export async function authenticateToken(request, reply) {
	try {
		const authHeader = request.headers.authorization;
		const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

		if (!token) {
			reply.code(401).send({ error: 'Access token required' });
			return;
		}

		const decoded = await userService.verifyToken(token);
		request.user = decoded;
		request.token = token; // Stocker le token pour le logout
	} catch (error) {
		reply.code(403).send({ error: 'Invalid or expired token' });
	}
}

// Middleware de validation des données
export function validateUserData(schema) {
	return async function(request, reply) {
		try {
			// Validation basique
			if (schema.username && !request.body.username) {
				reply.code(400).send({ error: 'Username is required' });
				return;
			}
			if (schema.email && !request.body.email) {
				reply.code(400).send({ error: 'Email is required' });
				return;
			}
			if (schema.password && !request.body.password) {
				reply.code(400).send({ error: 'Password is required' });
				return;
			}

			// Validation du format email
			if (schema.email && request.body.email) {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(request.body.email)) {
					reply.code(400).send({ error: 'Invalid email format' });
					return;
				}
			}

			// Validation de la longueur du mot de passe
			if (schema.password && request.body.password && request.body.password.length < 6) {
				reply.code(400).send({ error: 'Password must be at least 6 characters long' });
				return;
			}
		} catch (error) {
			reply.code(400).send({ error: 'Validation failed' });
		}
	};
}
