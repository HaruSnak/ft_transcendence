// ========================= IMPORTS =========================
// On importe les modules necessaires : Fastify pour le serveur HTTP, prom-client pour les metriques, Socket.IO pour le temps reel, et les utilitaires de securite
import Fastify from 'fastify'
import client from 'prom-client'
import { Server } from 'socket.io'
import { SecurityUtils } from './security.js'
import { sendToLogstash } from './logstashLogger.js'

// ========================= METRICS PROMETHEUS =========================
// On configure les compteurs Prometheus pour surveiller les messages envoyes/recus et les connexions socket
const msgSentReceived = new client.Counter({
	name: 'msg_send_received_total',
	help: 'Number of messages sent/received',
	labelNames: ['status']
});

const socketConnections = new client.Counter({
	name: 'socket_connections_total',
	help: 'Total number of socket connections'
});

// ========================= SERVEUR FASTIFY =========================
// On cree l'instance Fastify avec les logs actives pour le serveur HTTP de base
const fastify = Fastify({
	logger: true
})

// ========================= STOCKAGE DES CLIENTS =========================
// On utilise des Maps pour stocker les clients connectes : par socket ID, username, display name, etc.
const clients = new Map();
const clientUsernames = new Map();
const clientDisplayNames = new Map();
const socketToUsername = new Map();

// ========================= ROUTES HTTP =========================
// Ces routes HTTP permettent de verifier l'etat du service et d'exposer des metriques pour le monitoring
// Route pour tester la sante du service (health check)
fastify.get('/health', async (request, reply) => {
	console.log('health route accessed!');
	return {
		status: 'OK',
		service: 'chat-service',
		timestamp: new Date().toISOString()
	};
});

// Endpoint pour exposer les metriques Prometheus aux outils de monitoring
fastify.get('/metrics', async (request, reply) => {
	reply.type('text/plain');
	return (await client.register.metrics());
});

// ========================= SOCKET.IO =========================
// On attache Socket.IO au serveur Fastify pour gerer les connexions temps reel
const io = new Server(fastify.server, {
	cors: {
		origin: true
	}
});

// ========================= GESTION DES CONNEXIONS SOCKET =========================
// Quand un client se connecte, on gere sa session : stockage, bienvenue, ecoute des evenements
io.on('connection', (socket) => {
	const clientId = socket.id;
	console.log('Client connecté:', clientId);
	
	socketConnections.inc(); // Incrémenter le compteur de connexions
	
	// Log chat connection
	sendToLogstash('info', 'Chat client connected', {
		event: 'chat_connection',
		socket_id: clientId,
		client_address: socket.handshake.address
	});
	
	// STOCKEZ IMMÉDIATEMENT
	clients.set(clientId, socket);
	console.log('Connexion stockée pour', clientId);

	// Envoyez le message de bienvenue
	socket.emit('welcome', {
		clientId: clientId,
		message: 'Connexion établie'
	});
	console.log('Message de bienvenue envoyé à', clientId);

	// Gérez les événements
	// ========================= GESTION DE LA DECONNEXION =========================
	// Quand un client se deconnecte, on nettoie ses donnees des Maps
	socket.on('disconnect', () => {
		console.log('Client déconnecté:', clientId);
		const username = socketToUsername.get(clientId);
		
		// Log chat disconnection
		sendToLogstash('info', 'Chat client disconnected', {
			event: 'chat_disconnection',
			socket_id: clientId,
			username: username || 'anonymous'
		});
		
		if (username) {
			clients.delete(username);
			clientUsernames.delete(username);
			clientDisplayNames.delete(username);
			socketToUsername.delete(clientId);
		}
		broadcastUserList();
	});

	// ========================= ENREGISTREMENT UTILISATEUR =========================
	// Quand un client s'enregistre, on valide et stocke ses infos pour le chat
	socket.on('register', (msg) => {
		console.log('← register reçu de', clientId, ':', msg);
		
		// SANITIZE ET VALIDER les inputs
		const username = SecurityUtils.sanitizeUsername(msg.username);
		const display_name = SecurityUtils.sanitizeDisplayName(msg.display_name || username);
		
		// Validation
		if (!SecurityUtils.isValidUsername(username)) {
			console.log('Username invalide:', username);
			
			// Log failed registration
			sendToLogstash('warn', 'Chat registration failed - invalid username', {
				event: 'chat_register_failed',
				username: msg.username,
				reason: 'invalid_username_format',
				socket_id: clientId
			});
			
			socket.emit('error', { message: 'Invalid username format' });
			return ;
		}
		
		if (!SecurityUtils.isValidDisplayName(display_name)) {
			console.log('Display name invalide:', display_name);
			
			// Log failed registration
			sendToLogstash('warn', 'Chat registration failed - invalid display name', {
				event: 'chat_register_failed',
				username: username,
				display_name: msg.display_name,
				reason: 'invalid_display_name_format',
				socket_id: clientId
			});
			
			socket.emit('error', { message: 'Invalid display name format' });
			return ;
		}
		
		// Détection d'injection SQL
		if (SecurityUtils.detectSQLInjection(username) || SecurityUtils.detectSQLInjection(display_name)) {
			console.log('Tentative d\'injection SQL détectée!');
			
			// Log SQL injection attempt
			sendToLogstash('error', 'SQL injection attempt blocked in chat registration', {
				event: 'sql_injection_blocked',
				username: msg.username,
				display_name: msg.display_name,
				socket_id: clientId,
				attack_type: 'sql_injection'
			});
			
			socket.emit('error', { message: 'Malicious input detected' });
			return ;
		}
		
		// Enregistrer le username et display_name
		if (username) {
			socketToUsername.set(clientId, username);
			clientUsernames.set(username, username);
			clientDisplayNames.set(username, display_name);
			clients.set(username, socket);
			clients.delete(clientId);
			console.log('Client enregistré:', username, display_name);
			
			// Log successful registration
			sendToLogstash('info', 'Chat user registered successfully', {
				event: 'chat_register',
				username: username,
				display_name: display_name,
				socket_id: clientId
			});
			
			broadcastUserList();
		}
	});

	// ========================= GESTION DES MESSAGES =========================
	// Quand un message arrive, on le valide, sanitise, et le diffuse aux destinataires
	socket.on('message', (msg) => {
		console.log('← message reçu de', clientId, ':', msg);
		
		// SANITIZE le message
		const sanitizedText = SecurityUtils.sanitizeChatMessage(msg.text);
		
		// Validation
		if (!SecurityUtils.isValidMessage(sanitizedText)) {
			console.log('Message invalide');
			socket.emit('error', { message: 'Invalid message format or length' });
			return ;
		}
		
		// Détection d'injection SQL
		if (SecurityUtils.detectSQLInjection(sanitizedText)) {
			console.log('Tentative d\'injection SQL dans le message!');
			
			const fromUsername = socketToUsername.get(clientId) || clientId;
			
			// Log SQL injection attempt in message
			sendToLogstash('error', 'SQL injection attempt blocked in chat message', {
				event: 'sql_injection_blocked',
				username: fromUsername,
				message_text: msg.text.substring(0, 100), // First 100 chars for analysis
				target_user: msg.to,
				socket_id: clientId,
				attack_type: 'sql_injection'
			});
			
			socket.emit('error', { message: 'Malicious content detected' });
			return ;
		}
		
		// Créer le message à diffuser
		const fromUsername = socketToUsername.get(clientId) || clientId;
		const fromDisplayName = clientDisplayNames.get(fromUsername) || fromUsername;
		const broadcastMessage = {
			type: 'message',
			from: fromUsername,
			from_display_name: fromDisplayName,
			to: msg.to,
			text: sanitizedText, // ✅ Utilise le texte sanitisé
			timestamp: Date.now()
		};
		
		// MESSAGE PRIVÉ : envoyer seulement au destinataire
		const targetSocket = clients.get(msg.to);
		if (targetSocket) {
			targetSocket.emit('message', broadcastMessage);
			console.log('Message privé envoyé de', fromUsername, 'vers', msg.to);
			msgSentReceived.inc({status: 'sent'});
			msgSentReceived.inc({status: 'received'}); // Le destinataire a reçu le message
			
			// Log successful message
			sendToLogstash('info', 'Chat message sent successfully', {
				event: 'message_sent',
				from_username: fromUsername,
				to_username: msg.to,
				message_length: sanitizedText.length,
				socket_id: clientId
			});
		} else {
			console.log('Destinataire introuvable:', msg.to);
			
			// Log failed message delivery
			sendToLogstash('warn', 'Chat message delivery failed - recipient not found', {
				event: 'message_failed',
				from_username: fromUsername,
				to_username: msg.to,
				reason: 'recipient_not_found',
				socket_id: clientId
			});
		}
		
		// Envoyer aussi à l'expéditeur pour qu'il voie son message
		socket.emit('message', broadcastMessage);
	});

	// Broadcast immédiat
	broadcastUserList();
});

// ========================= DIFFUSION DE LA LISTE UTILISATEURS =========================
// Fonction pour envoyer la liste des utilisateurs connectes a tous les clients
function broadcastUserList() {
	console.log('Broadcasting to', clients.size, 'clients');

	if (clients.size === 0) {
		console.log('Aucun client connecté');
		return ;
	}

	const userList = [];
	for (const username of clientUsernames.keys()) {
		userList.push({
			username: username,
			display_name: clientDisplayNames.get(username)
		});
	}

	io.emit('user_list', {
		users: userList,
		timestamp: Date.now()
	});
}

// ========================= DEMARRAGE DU SERVEUR =========================
// On demarre le serveur Fastify sur le port 3001, accessible de partout (host 0.0.0.0)
fastify.listen({ port: 3001, host: '0.0.0.0' }, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`[chat-service] Server listening on ${address}`);
	fastify.log.info(`[chat-service] Socket.IO available at http://localhost:3001`);
	fastify.log.info(`[chat-service] Metrics available at http://localhost:3001/metrics`);
});