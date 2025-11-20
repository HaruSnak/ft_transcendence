import Fastify from 'fastify';
import userService from './userService.js';
import { authenticateToken, validateUserData, rateLimitLogin } from './middleware.js';
import client from 'prom-client';
import { sendToLogstash } from './logstashLogger.js'

const userRegistrations = new client.Counter({
	name: 'user_registrations_total',
	help: 'Total number of user registrations'
});

const userLogins = new client.Counter({
	name: 'user_logins_total',
	help: 'Total number of user logins'
});

const fastify = Fastify({
	logger: true
});

// Enregistrer le support CORS
const allowedOrigin = 'https://localhost:8443';

await fastify.register(import('@fastify/cors'), {
	origin: allowedOrigin
});

// Enregistrer le support pour les fichiers multipart
await fastify.register(import('@fastify/multipart'));

// Route for testing health
fastify.get('/health', async (request, reply) => {
	return {
		status: 'OK',
		service: 'user-service',
		timestamp: new Date().toISOString()
	};
});

// Endpoint pour Prometheus
fastify.get('/metrics', async (request, reply) => {
	reply.type('text/plain');
	return (await client.register.metrics());
});

// Inscription
fastify.post('/api/auth/register', {
	preHandler: validateUserData({ username: true, email: true, password: true })
}, async (request, reply) => {
	try {
		const { username, email, password, display_name, avatar_url } = request.body;
		const user = await userService.createUser({ username, email, password, display_name, avatar_url });

		userRegistrations.inc();

		// Log successful registration
		sendToLogstash('info', 'User registered successfully', {
			event: 'user_register',
			username: username,
			email: email,
			display_name: display_name || username,
			userId: user.id,
			ip_address: request.ip,
			user_agent: request.headers['user-agent']
		});

		reply.code(201).send({
			success: true,
			message: 'User created successfully',
			user
		});
	} catch (error) {
		// Log failed registration
		sendToLogstash('warn', 'User registration failed', {
			event: 'user_register_failed',
			username: request.body.username,
			email: request.body.email,
			error: error.message,
			ip_address: request.ip,
			user_agent: request.headers['user-agent']
		});

		reply.code(400).send({
			success: false,
			error: error.message
		});
	}
});

// Connexion
fastify.post('/api/auth/login', {
	preHandler: [rateLimitLogin, validateUserData({ username: true, password: true })]
}, async (request, reply) => {
	try {
		const { username, password } = request.body;
		const result = await userService.authenticateUser(username, password);
		
		userLogins.inc();

	// Send log to Logstash
	sendToLogstash('info', 'User login successful', {
		event: 'user_login',
		username: username,
		userId: result.userId,
		ip_address: request.ip,
		user_agent: request.headers['user-agent']
	});

		reply.send({
			success: true,
			message: 'Login successful',
			...result
		});
	} catch (error) {
		// Send failed login attempt to Logstash
		sendToLogstash('warn', 'User login failed', {
			event: 'user_login_failed',
			username: request.body.username,
			error: error.message,
			ip_address: request.ip,
			user_agent: request.headers['user-agent']
		});

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
		await userService.logoutUser(request.user.userId, request.token);

		// Log successful logout
		sendToLogstash('info', 'User logged out', {
			event: 'user_logout',
			userId: request.user.userId,
			username: request.user.username,
			ip_address: request.ip,
			user_agent: request.headers['user-agent']
		});

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

// Obtenir le profil d'un utilisateur par username
fastify.get('/api/user/by-username/:username', async (request, reply) => {
	try {
		const user = await userService.getUserByUsername(request.params.username);
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

		// Log profile update
		sendToLogstash('info', 'User profile updated', {
			event: 'user_profile_update',
			userId: request.user.userId,
			username: request.user.username,
			updated_fields: Object.keys(updates),
			ip_address: request.ip,
			user_agent: request.headers['user-agent']
		});

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

// Upload avatar
fastify.post('/api/user/avatar', {
	preHandler: authenticateToken
}, async (request, reply) => {
	try {
		const data = await request.file();
		if (!data) {
			return reply.code(400).send({ 
				success: false, 
				error: 'No file uploaded' 
			});
		}

		const userId = request.user.userId;
		const buffer = await data.toBuffer();
		const base64 = buffer.toString('base64');
		const mimeType = data.mimetype || 'image/png';
		const dataUrl = `data:${mimeType};base64,${base64}`;
		
		await userService.updateUser(userId, { avatar_url: dataUrl });

		// Log avatar upload
		sendToLogstash('info', 'User avatar uploaded', {
			event: 'user_avatar_upload',
			userId: userId,
			username: request.user.username,
			file_size: buffer.length,
			mime_type: mimeType,
			ip_address: request.ip,
			user_agent: request.headers['user-agent']
		});

		reply.send({
			success: true,
			message: 'Avatar uploaded successfully',
			avatar_url: dataUrl
		});
	} catch (error) {
		console.error('Avatar upload failed:', error.message);
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
		
		if (!player1_id) {
			return reply.code(400).send({
				success: false,
				error: 'Missing player1_id'
			});
		}

		let finalWinnerId;
		if (winner_id !== undefined) {
			finalWinnerId = winner_id;
		} else if (winner_player !== undefined) {
			finalWinnerId = winner_player === 1 ? player1_id : player2_id;
		} else {
			return reply.code(400).send({
				success: false,
				error: 'Missing winner_id or winner_player'
			});
		}

		const result = await userService.addMatch(
			player1_id, 
			player2_id || null, 
			finalWinnerId, 
			score_player1 || 0, 
			score_player2 || 0, 
			game_type || 'pong'
		);

		// Log game match creation
		sendToLogstash('info', 'Game match recorded', {
			event: 'game_match_created',
			match_id: result.id,
			player1_id: player1_id,
			player2_id: player2_id || null,
			winner_id: finalWinnerId,
			score: `${score_player1 || 0} - ${score_player2 || 0}`,
			game_type: game_type || 'pong',
			ip_address: request.ip
		});

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

		// Log user block action
		sendToLogstash('info', 'User blocked another user', {
			event: 'user_block',
			blocker_userId: request.user.userId,
			blocker_username: request.user.username,
			blocked_userId: blocked_user_id,
			ip_address: request.ip,
			user_agent: request.headers['user-agent']
		});

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

		// Log user unblock action
		sendToLogstash('info', 'User unblocked another user', {
			event: 'user_unblock',
			unblocker_userId: request.user.userId,
			unblocker_username: request.user.username,
			unblocked_userId: request.params.blocked_user_id,
			ip_address: request.ip,
			user_agent: request.headers['user-agent']
		});

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

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3003, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		console.error('Server startup failed:', err.message);
		process.exit(1);
	}
	console.log(`[user-service] Server listening on ${address}`);
});
