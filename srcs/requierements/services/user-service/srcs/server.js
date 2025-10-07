import Fastify from 'fastify'
import client from 'prom-client'
import userService from './userService.js'
import { authenticateToken, validateUserData } from './middleware.js'
//import { request } from 'http'

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
		const { username, email, password, display_name } = request.body;
		const user = await userService.createUser({ username, email, password, display_name });
		
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
			const { player1_id, player2_id, winner_id, score_player1, score_player2, game_type, 
					player1_name, player2_name } = request.body;
			
			if (!player1_id && !player1_name) {
				return reply.code(400).send({
					success: false,
					error: 'Missing player1_id or player1_name'
				});
			}
			
			if (!player2_id && !player2_name) {
				return reply.code(400).send({
					success: false,
					error: 'Missing player2_id or player2_name'
				});
			}
			
			if (winner_id === undefined && !request.body.winner_player) {
				return reply.code(400).send({
					success: false,
					error: 'Missing winner_id or winner_player (1 or 2)'
				});
			}
			
			// 🎯 LOGIQUE INTELLIGENTE : Choisir la bonne table selon les joueurs
			const hasGuests = !player1_id || !player2_id;
			
			if (hasGuests) {
				// ✅ Au moins un guest → game_sessions (pas de contraintes FK)
				const winner_player = request.body.winner_player || 
									  (winner_id === player1_id ? 1 : 2);
				
				const result = await userService.addGameSession({
					player1_id: player1_id || null,
					player1_name: player1_name || `Player1_${Date.now()}`,
					player2_id: player2_id || null, 
					player2_name: player2_name || `Player2_${Date.now()}`,
					winner_player,
					score_player1: score_player1 || 0,
					score_player2: score_player2 || 0,
					game_type: game_type || 'pong'
				});
				
				reply.code(201).send({
					success: true,
					message: 'Game session recorded successfully (includes guests)',
					session_id: result.id,
					stored_in: 'game_sessions'
				});
			}
			else {
				// ✅ Tous des users → match_history (logique classique avec FK)
				// Vérifier que les users existent
				try {
					await userService.getUserById(player1_id);
					await userService.getUserById(player2_id);
				} catch (error) {
					return reply.code(404).send({
						success: false,
						error: `One of the players not found in database`
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
					message: 'Match added successfully (users only)',
					match_id: result.id,
					stored_in: 'match_history'
				});
			}
		} catch (error) {
			reply.code(500).send({
				success: false,
				error: error.message
			});
		}
	});

	// 🆕 Nouveau endpoint pour l'historique incluant les guests
	fastify.get('/api/user/:userId/game-sessions', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const { userId } = request.params;
			
			// Vérifier que l'utilisateur demande ses propres données ou est admin
			if (request.user.userId !== parseInt(userId)) {
				return reply.code(403).send({
					success: false,
					error: 'Access denied'
				});
			}
			
			const sessions = await userService.getUserGameSessions(userId);
			
			reply.send({
				success: true,
				sessions
			});
		} catch (error) {
			reply.code(500).send({
				success: false,
				error: error.message
			});
		}
	});// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3003, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`[user-service] Server listening on ${address}`);
});

/*					____METRICS Prometheus____						*/