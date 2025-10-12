import Fastify from 'fastify'
import client from 'prom-client'
import userService from './userService.js'
import { authenticateToken, validateUserData } from './middleware.js'
import database from './database.js'
import fs from 'fs'
import path from 'path'

/*					____SERVER Fastify____						*/

const fastify = Fastify({
	logger: true
})

// Enregistrer le support CORS
await fastify.register(import('@fastify/cors'), {
	origin: true
})

// Enregistrer le support pour les formulaires
await fastify.register(import('@fastify/formbody'))

// Enregistrer le support pour les fichiers multipart
await fastify.register(import('@fastify/multipart'))

// Route for testing health
fastify.get('/health', async (request, reply) => {
	console.log('health route accessed!');
	return {
		status: 'OK',
		service: 'user-service',
		timestamp: new Date().toISOString()
	};
});

// Route de test basique
fastify.get('/api/user', async (request, reply) => {
	console.log('frontend route accessed!');
	return { message: 'User service is running' };
});

/*					____AUTH ROUTES____						*/

// Inscription
fastify.post('/api/auth/register', {
	preHandler: validateUserData({ username: true, email: true, password: true })
	}, async (request, reply) => {
		try {
			const { username, email, password, display_name, avatar_url } = request.body;
			const user = await userService.createUser({ username, email, password, display_name, avatar_url });
        
			reply.code(201).send({
				success: true,
				message: 'User created successfully',
				user
			});
		} catch (error) {
			reply.code(400).send({
				success: false,
				error: error.message
			});
		}
	});

// Connexion
fastify.post('/api/auth/login', {
	preHandler: validateUserData({ username: true, password: true })
}, async (request, reply) => {
	try {
		const { username, password } = request.body;
		const result = await userService.authenticateUser(username, password);
		
		reply.send({
			success: true,
			message: 'Login successful',
			...result
		});
		//localStorage.setItem('authToken', result.token);
	} catch (error) {
		reply.code(401).send({
			success: false,
			error: error.message
		});
	}
});

// Déconnexion
fastify.post('/api/user/logout', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		console.log('📝 Logout requested for userId:', request.user.userId);
		await userService.logoutUser(request.user.userId, request.token);
		console.log('✅ Logout successful');
		reply.send({
			success: true,
			message: 'Logout successful'
		});
	} catch (error) {
		console.log('❌ Error during logout:', error.message);
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

/*					____USER ROUTES____						*/

// Obtenir le profil de l'utilisateur connecté
fastify.get('/api/user/profile', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		console.log('📝 Getting profile for userId:', request.user.userId);
		const user = await userService.getUserById(request.user.userId);
		console.log('✅ Profile retrieved successfully:', user ? 'found' : 'not found');
		reply.send({
			success: true,
			user
		});
	} catch (error) {
		console.log('❌ Error getting profile:', error.message);
		console.log('🔍 Error stack:', error.stack);
		reply.code(404).send({
			success: false,
			error: error.message
		});
	}
});

// Obtenir le profil d'un utilisateur par ID
fastify.get('/api/user/profile/:id', async (request, reply) => {
	try {
		const user = await userService.getUserById(request.params.id);
		// Ne pas exposer l'email pour les autres utilisateurs
		delete user.email;
		reply.send({
			success: true,
			user
		});
	} catch (error) {
		reply.code(404).send({
			success: false,
			error: error.message
		});
	}
});

// Obtenir le profil d'un utilisateur par username
fastify.get('/api/user/by-username/:username', async (request, reply) => {
	try {
		const user = await userService.getUserByUsername(request.params.username);
		// Ne pas exposer l'email pour les autres utilisateurs
		delete user.email;
		reply.send({
			success: true,
			user
		});
	} catch (error) {
		reply.code(404).send({
			success: false,
			error: error.message
		});
	}
});

// Mettre à jour le profil
fastify.put('/api/user/profile', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		console.log('📝 Updating profile for userId:', request.user.userId);
		console.log('📦 Updates:', request.body);
		const updates = request.body;
		const user = await userService.updateUser(request.user.userId, updates);
		console.log('✅ Profile updated successfully');
		reply.send({
			success: true,
			message: 'Profile updated successfully',
			user
		});
	} catch (error) {
		console.log('❌ Error updating profile:', error.message);
		console.log('🔍 Error stack:', error.stack);
		reply.code(400).send({
			success: false,
			error: error.message
		});
	}
});

// Supprimer le compte utilisateur
fastify.delete('/api/user/profile', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		await userService.deleteUser(request.user.userId);
		reply.send({
			success: true,
			message: 'User account deleted successfully'
		});
	} catch (error) {
		reply.code(400).send({
			success: false,
			error: error.message
		});
	}
});

// Upload avatar
fastify.post('/api/user/avatar', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		console.log('Avatar upload: received request');
		const data = await request.file();
		if (!data) {
			console.log('Avatar upload: no file');
			return reply.code(400).send({ success: false, error: 'No file uploaded' });
		}

		const userId = request.user.userId;
		console.log('Avatar upload: userId', userId);
		
		// Read file buffer
		const buffer = await data.toBuffer();
		console.log('Avatar upload: buffer length', buffer.length);
		
		// Convert to base64 data URL
		const base64 = buffer.toString('base64');
		const mimeType = data.mimetype || 'image/png';
		const dataUrl = `data:${mimeType};base64,${base64}`;
		console.log('Avatar upload: dataUrl length', dataUrl.length);
		
		// Update user avatar_url with data URL
		await userService.updateUser(userId, { avatar_url: dataUrl });
		console.log('Avatar upload: updated user');

		reply.send({
			success: true,
			message: 'Avatar uploaded successfully',
			avatar_url: dataUrl
		});
	} catch (error) {
		console.error('Avatar upload error:', error);
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

// Obtenir l'historique des matches
fastify.get('/api/user/matches', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		const matches = await userService.getUserMatchHistory(request.user.userId);
		reply.send({
			success: true,
			matches
		});
	} catch (error) {
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

// Obtenir l'historique des matches d'un utilisateur par ID
fastify.get('/api/user/matches/:id', async (request, reply) => {
	try {
		const matches = await userService.getUserMatchHistory(request.params.id);
		reply.send({
			success: true,
			matches
		});
	} catch (error) {
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

// Ajouter un match (pour les autres services)
fastify.post('/api/user/match', async (request, reply) => {
	try {
		const { player1_id, player2_id, winner_id, winner_player, score_player1, score_player2, game_type } = request.body;
		
		// Vérification: au moins player1_id doit être présent
		if (!player1_id) {
			return reply.code(400).send({
				success: false,
				error: 'Missing player1_id'
			});
		}
		
		// Déterminer le winner_id à partir de winner_player (1 ou 2) ou winner_id direct
		let finalWinnerId;
		if (winner_id !== undefined) {
			finalWinnerId = winner_id;
		} else if (winner_player !== undefined) {
			// Convertir winner_player (1 ou 2) en winner_id
			finalWinnerId = winner_player === 1 ? player1_id : player2_id;
		} else {
			return reply.code(400).send({
				success: false,
				error: 'Missing winner_id or winner_player'
			});
		}
		
		// Stocker dans match_history (player2_id peut être null pour les Guests)
		const result = await userService.addMatch(
			player1_id, 
			player2_id || null, 
			finalWinnerId, 
			score_player1 || 0, 
			score_player2 || 0, 
			game_type || 'pong'
		);
		
		return reply.code(201).send({
			success: true,
			message: 'Match added successfully',
			match_id: result.id
		});
	} catch (error) {
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

/*					____BLOCKED USERS ROUTES____						*/

// Obtenir les utilisateurs bloqués
fastify.get('/api/user/blocked', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		const blockedUsers = await userService.getBlockedUsers(request.user.userId);
		reply.send({
			success: true,
			blocked_users: blockedUsers
		});
	} catch (error) {
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

// Bloquer un utilisateur
fastify.post('/api/user/block', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		const { blocked_user_id } = request.body;
		if (!blocked_user_id) {
			return reply.code(400).send({
				success: false,
				error: 'blocked_user_id is required'
			});
		}
		
		await userService.blockUser(request.user.userId, blocked_user_id);
		reply.send({
			success: true,
			message: 'User blocked successfully'
		});
	} catch (error) {
		reply.code(400).send({
			success: false,
			error: error.message
		});
	}
});

// Débloquer un utilisateur
fastify.delete('/api/user/unblock/:blocked_user_id', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		await userService.unblockUser(request.user.userId, request.params.blocked_user_id);
		reply.send({
			success: true,
			message: 'User unblocked successfully'
		});
	} catch (error) {
		reply.code(400).send({
			success: false,
			error: error.message
		});
	}
});

/*					____GAME INVITATIONS ROUTES____						*/

// Obtenir les invitations de jeu
fastify.get('/api/user/game-invitations', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		const invitations = await userService.getGameInvitations(request.user.userId);
		reply.send({
			success: true,
			invitations: invitations
		});
	} catch (error) {
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

// Créer une invitation de jeu
fastify.post('/api/user/game-invitation', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		const { to_user_id, game_type } = request.body;
		if (!to_user_id) {
			return reply.code(400).send({
				success: false,
				error: 'to_user_id is required'
			});
		}
		
		const invitation = await userService.createGameInvitation(
			request.user.userId, 
			to_user_id, 
			game_type || 'pong'
		);
		reply.code(201).send({
			success: true,
			message: 'Game invitation sent',
			invitation
		});
	} catch (error) {
		reply.code(400).send({
			success: false,
			error: error.message
		});
	}
});

// Répondre à une invitation
fastify.put('/api/user/game-invitation/:id', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		const { status } = request.body;
		if (!['accepted', 'declined'].includes(status)) {
			return reply.code(400).send({
				success: false,
				error: 'Status must be "accepted" or "declined"'
			});
		}
		
		await userService.respondToGameInvitation(
			request.params.id, 
			request.user.userId, 
			status
		);
		reply.send({
			success: true,
			message: `Invitation ${status} successfully`
		});
	} catch (error) {
		reply.code(400).send({
			success: false,
			error: error.message
		});
	}
});

// Vérifier la disponibilité du display name
fastify.post('/api/user/check-display-name', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		const { display_name } = request.body;
		if (!display_name) {
			return reply.code(400).send({
				success: false,
				error: 'display_name is required'
			});
		}

		// Vérifier si le display name existe déjà (en excluant l' utilisateur actuel)
		const existingUser = await database.get(
			'SELECT id FROM users WHERE display_name = ? AND id != ?',
			[display_name, request.user.userId]
		);

		const available = !existingUser;
		reply.send({
			success: true,
			available
		});
	} catch (error) {
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

// Vérifier la disponibilité de l'email
fastify.post('/api/user/check-email', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		const { email } = request.body;
		if (!email) {
			return reply.code(400).send({
				success: false,
				error: 'email is required'
			});
		}

		// Vérifier si l'email existe déjà (en excluant l' utilisateur actuel)
		const existingUser = await database.get(
			'SELECT id FROM users WHERE email = ? AND id != ?',
			[email, request.user.userId]
		);

		const available = !existingUser;
		reply.send({
			success: true,
			available
		});
	} catch (error) {
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3003, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`[user-service] Server listening on ${address}`);
});

/*					____METRICS Prometheus____						*/