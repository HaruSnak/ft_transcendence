import Fastify from 'fastify'
import client from 'prom-client'

/*					____METRICS Prometheus____						*/

const msgSentReceived = new client.Counter({
    name: 'msg_send_received',
    help: 'Number of messages sent/received',
    labelNames: ['status']
});

/*					____SERVER Fastify____						*/

const fastify = Fastify({
    logger: true
})

// Storage pour les clients connectés
const clients = new Map();
const clientUsernames = new Map();

// Enregistrer le plugin WebSocket
await fastify.register(import('@fastify/websocket'));

// Route for testing health
fastify.get('/health', async (request, reply) => {
    console.log('health route accessed!');
    return {
        status: 'OK',
        service: 'chat-service',
        timestamp: new Date().toISOString()
    };
});

fastify.get('/api/chat', async (request, reply) => {
    console.log('frontend route accessed!');
    return { message: 'Chat service is running' };
});

// Endpoint pour Prometheus
fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return await client.register.metrics();
});

/*					____WEBSOCKET ROUTE____						*/

fastify.get('/ws', { websocket: true }, (connection, req) => {
    const clientId = Date.now().toString();
    console.log('📡 Client connecté:', clientId);
    console.log('🔍 ReadyState initial:', connection?.readyState);
    
    // STOCKEZ IMMÉDIATEMENT (pas de vérification readyState)
    clients.set(clientId, connection);
    console.log('✅ Connexion stockée pour', clientId);

    // Envoyez le message de bienvenue (sans vérifier readyState)
    try {
        connection.send(JSON.stringify({
            type: 'welcome',
            clientId: clientId,
            message: 'Connexion établie'
        }));
        console.log('✅ Message de bienvenue envoyé à', clientId);
    } catch (error) {
        console.error('❌ Erreur envoi bienvenue:', error);
        clients.delete(clientId);
        return;
    }

    // Gérez les événements APRÈS
    connection.on('close', (code, reason) => {
        console.log('❌ Client déconnecté:', clientId, code, reason);
        clients.delete(clientId);
        const username = clientUsernames.get(clientId);
        if (username) {
            clients.delete(username);
            clientUsernames.delete(clientId);
        }
        broadcastUserList();
    });

    connection.on('error', (error) => {
        console.error('❌ Erreur WebSocket:', clientId, error);
        clients.delete(clientId);
    });

	connection.on('message', (rawMessage) => {
		try {
			const msg = JSON.parse(rawMessage.toString());
			console.log('← message reçu de', clientId, ':', msg);
			
			if (msg.type === 'register') {
				// Enregistrer le username
				const username = msg.username;
				if (username) {
					clientUsernames.set(clientId, username);
					clients.set(username, connection);
					clients.delete(clientId);
					console.log('✅ Client enregistré:', username);
					broadcastUserList();
				}
				return;
			}
			
			if (msg.type === 'message') {
				// Créer le message à diffuser
				const fromUsername = clientUsernames.get(clientId) || clientId;
				const broadcastMessage = {
					type: 'message',
					from: fromUsername,
					to: msg.to || '', // '' = général, sinon DM
					text: msg.text,
					timestamp: Date.now()
				};
				
				const messageStr = JSON.stringify(broadcastMessage);
				
				if (msg.to && msg.to !== '') {
					// MESSAGE PRIVÉ : envoyer seulement au destinataire
					const targetClient = clients.get(msg.to);
					if (targetClient) {
						targetClient.send(messageStr);
						console.log('✅ Message privé envoyé de', username || clientId, 'vers', msg.to);
					} else {
						console.log('⚠️ Destinataire introuvable:', msg.to);
					}
					
					// Envoyer aussi à l'expéditeur pour qu'il voie son message
					connection.send(messageStr);
				} else {
					// MESSAGE GÉNÉRAL : diffuser à tous les clients
					for (const [otherClientId, otherConnection] of clients) {
						try {
							if (otherConnection && typeof otherConnection.send === 'function') {
								otherConnection.send(messageStr);
							}
						} catch (error) {
							console.error('❌ Erreur diffusion à', otherClientId, ':', error);
							clients.delete(otherClientId);
						}
					}
					console.log('✅ Message général diffusé à tous les clients');
				}
			}
			
			// ACK pour confirmer la réception
			connection.send(JSON.stringify({
				type: 'ack',
				originalMessage: msg,
				clientId: username || clientId
			}));
			
		} catch (error) {
			console.error('❌ Erreur parsing message:', error);
		}
	});

    // Broadcast immédiat (sans setTimeout)
    broadcastUserList();
});

function broadcastUserList() {
    console.log('📢 Broadcasting to', clients.size, 'clients');
    
    if (clients.size === 0) {
        console.log('📢 Aucun client connecté');
        return;
    }
    
    const userList = Array.from(clients.keys());
    const message = JSON.stringify({
        type: 'user_list',
        users: userList,
        timestamp: Date.now()
    });

    // Parcourez directement la Map (pas de copie)
    for (const [clientId, connection] of clients) {
        try {
            // Test simple : juste vérifier que connection existe
            if (connection && typeof connection.send === 'function') {
                connection.send(message);
                console.log('✅ Message envoyé à', clientId);
            } else {
                console.log('⚠️ Connexion invalide pour', clientId);
                clients.delete(clientId);
            }
        } catch (error) {
            console.error('❌ Erreur envoi à', clientId, ':', error.message);
            clients.delete(clientId);
        }
    }
}

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port: 3001, host: '0.0.0.0' }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`[chat-service] Server listening on ${address}`);
    fastify.log.info(`[chat-service] WebSocket available at ws://localhost:3001/ws`);
    fastify.log.info(`[chat-service] Metrics available at http://localhost:3001/metrics`);
});