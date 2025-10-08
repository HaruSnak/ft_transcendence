import Fastify from 'fastify'
import client from 'prom-client'
import userService from './userService.js'
import { authenticateToken, validateUserData } from './middleware.js'
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
fastify.post('/api/auth/logout', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		await userService.logoutUser(request.user.userId, request.token);
		reply.send({
			success: true,
			message: 'Logout successful'
		});
	} catch (error) {
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
		const user = await userService.getUserById(request.user.userId);
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
		const updates = request.body;
		const user = await userService.updateUser(request.user.userId, updates);
		reply.send({
			success: true,
			message: 'Profile updated successfully',
			user
		});
	} catch (error) {
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
		const data = await request.file();
		if (!data) {
			return reply.code(400).send({ success: false, error: 'No file uploaded' });
		}

		const userId = request.user.userId;
		const avatarsDir = path.join(process.cwd(), 'avatars');
		if (!fs.existsSync(avatarsDir)) {
			fs.mkdirSync(avatarsDir);
		}

		const ext = path.extname(data.filename) || '.png';
		const filename = `${userId}${ext}`;
		const filepath = path.join(avatarsDir, filename);

		// Save file
		const buffer = await data.toBuffer();
		fs.writeFileSync(filepath, buffer);

		// Update user avatar_url
		const avatarUrl = `/api/user/avatar/${userId}`;
		await userService.updateUser(userId, { avatar_url: avatarUrl });

		reply.send({
			success: true,
			message: 'Avatar uploaded successfully',
			avatar_url: avatarUrl
		});
	} catch (error) {
		reply.code(500).send({
			success: false,
			error: error.message
		});
	}
});

// Get avatar
fastify.get('/api/user/avatar/:id', async (request, reply) => {
	try {
		const userId = request.params.id;
		const avatarsDir = path.join(process.cwd(), 'avatars');
		if (!fs.existsSync(avatarsDir)) {
			return reply.code(404).send({ success: false, error: 'Avatar not found' });
		}
		const files = fs.readdirSync(avatarsDir);
		const file = files.find(f => f.startsWith(userId + '.'));
		if (!file) {
			return reply.code(404).send({ success: false, error: 'Avatar not found' });
		}
		const filepath = path.join(avatarsDir, file);
		const stream = fs.createReadStream(filepath);
		reply.type('image/png'); // or detect mime
		reply.send(stream);
	} catch (error) {
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
		const { player1_id, player2_id, winner_id, score_player1, score_player2, game_type } = request.body;
		
		if (!player1_id || !player2_id || winner_id === undefined) {
			return reply.code(400).send({
				success: false,
				error: 'Missing required fields: player1_id, player2_id, winner_id'
			});
		}
		
		const result = await userService.addMatch(
			player1_id, 
			player2_id, 
			winner_id, 
			score_player1 || 0, 
			score_player2 || 0, 
			game_type
		);
		
		reply.code(201).send({
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

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3003, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`[user-service] Server listening on ${address}`);
});

/*					____METRICS Prometheus____						*/