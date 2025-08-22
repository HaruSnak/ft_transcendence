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
    console.log('🔍 Connection object:', typeof connection);
    console.log('🔍 ReadyState:', connection?.readyState);
    
    // Dans @fastify/websocket, connection EST directement le WebSocket
    if (connection && connection.readyState === 1) {
        clients.set(clientId, connection);
        console.log('✅ Connexion stockée pour', clientId);
        
        // Envoyez un message de bienvenue IMMÉDIATEMENT
        try {
            connection.send(JSON.stringify({
                type: 'welcome',
                clientId: clientId,
                message: 'Connexion établie'
            }));
            console.log('✅ Message de bienvenue envoyé à', clientId);
        } catch (error) {
            console.error('❌ Erreur envoi bienvenue:', error);
            clients.delete(clientId); // Supprimez si erreur
            return;
        }
    } else {
        console.log('⚠️ Connexion non valide, ne pas stocker');
        return;
    }

    // Gérez les événements
    connection.on('close', (code, reason) => {
        console.log('❌ Client déconnecté:', clientId, code, reason);
        clients.delete(clientId);
        // Broadcaster après suppression - ça c'est OK
        broadcastUserList();
    });

    connection.on('error', (error) => {
        console.error('❌ Erreur WebSocket:', clientId, error);
        clients.delete(clientId);
    });

    connection.on('message', (rawMessage) => {
        try {
            const msg = JSON.parse(rawMessage.toString());
            console.log('← message reçu:', msg);
            
            // Répondez au message pour maintenir la connexion
            connection.send(JSON.stringify({
                type: 'ack',
                originalMessage: msg
            }));
        } catch (error) {
            console.error('❌ Erreur parsing message:', error);
        }
    });

    // RETARDEZ cet appel avec setTimeout pour que la connexion soit stable
    setTimeout(() => {
        console.log('⏰ Broadcasting user list après délai...');
        // Double vérification avant broadcast
        if (clients.has(clientId) && connection && connection.readyState === 1) {
            broadcastUserList();
        } else {
            console.log('⚠️ Client déconnecté avant broadcast:', clientId);
            clients.delete(clientId);
        }
    }, 100); // Réduit à 100ms
});

function broadcastUserList() {
    console.log('📢 Broadcasting to', clients.size, 'clients');
    
    const userList = Array.from(clients.keys());
    const message = JSON.stringify({
        type: 'user_list',
        users: userList
    });

    // Créez une copie de la Map pour éviter les modifications concurrentes
    const clientsCopy = new Map(clients);
    
    for (const [clientId, connection] of clientsCopy) {
        console.log('🔍 Tentative envoi à:', clientId);
        
        try {
            // Triple vérification AVANT d'envoyer - connection EST le WebSocket
            if (connection && 
                typeof connection.send === 'function' &&
                connection.readyState === 1) {
                
                connection.send(message);
                console.log('✅ Message envoyé à', clientId);
            } else {
                console.log('⚠️ Connexion invalide pour', clientId, 
                           '- readyState:', connection?.readyState,
                           '- send exists:', typeof connection?.send);
                // Supprimez les connexions invalides
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