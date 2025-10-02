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

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';
    console.log('🔐 Using JWT secret:', JWT_SECRET ? 'Present' : 'Missing');
    console.log('🔐 JWT secret value:', JWT_SECRET.substring(0, 10) + '...'); // Debug sécurisé
    
    // 🔧 NOUVELLE VERSION : JWT synchrone avec try/catch
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ JWT verified successfully for user:', decoded.userId);
        request.user = decoded;
        // Fastify continue automatiquement
        return; // Important : return explicite pour éviter la suite
    } catch (err) {
        console.log('❌ JWT verification failed:', err.message);
        console.log('🔍 Error details:', err);
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
