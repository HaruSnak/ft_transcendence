import Fastify from 'fastify'
import client from 'prom-client'
import { Server } from 'socket.io'

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
const clientDisplayNames = new Map();

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

/*					____SOCKET.IO____						*/

const io = new Server(fastify.server, {
    cors: {
        origin: true
    }
});

io.on('connection', (socket) => {
    const clientId = socket.id;
    console.log('📡 Client connecté:', clientId);
    
    // STOCKEZ IMMÉDIATEMENT
    clients.set(clientId, socket);
    console.log('✅ Connexion stockée pour', clientId);

    // Envoyez le message de bienvenue
    socket.emit('welcome', {
        clientId: clientId,
        message: 'Connexion établie'
    });
    console.log('✅ Message de bienvenue envoyé à', clientId);

    // Gérez les événements
    socket.on('disconnect', () => {
        console.log('❌ Client déconnecté:', clientId);
        clients.delete(clientId);
        const username = clientUsernames.get(clientId);
        if (username) {
            clients.delete(username);
            clientUsernames.delete(clientId);
            clientDisplayNames.delete(clientId);
        }
        broadcastUserList();
    });

    socket.on('register', (msg) => {
        console.log('← register reçu de', clientId, ':', msg);
        // Enregistrer le username et display_name
        const username = msg.username;
        const display_name = msg.display_name || username;
        if (username) {
            clientUsernames.set(clientId, username);
            clientDisplayNames.set(clientId, display_name);
            clients.set(username, socket);
            clients.delete(clientId);
            console.log('✅ Client enregistré:', username, display_name);
            broadcastUserList();
        }
    });

    socket.on('message', (msg) => {
        console.log('← message reçu de', clientId, ':', msg);
        // Créer le message à diffuser
        const fromUsername = clientUsernames.get(clientId) || clientId;
        const fromDisplayName = clientDisplayNames.get(clientId) || fromUsername;
        const broadcastMessage = {
            type: 'message',
            from: fromUsername,
            from_display_name: fromDisplayName,
            to: msg.to || '', // '' = général, sinon DM
            text: msg.text,
            timestamp: Date.now()
        };
        
        if (msg.to && msg.to !== '') {
            // MESSAGE PRIVÉ : envoyer seulement au destinataire
            const targetSocket = clients.get(msg.to);
            if (targetSocket) {
                targetSocket.emit('message', broadcastMessage);
                console.log('✅ Message privé envoyé de', fromUsername, 'vers', msg.to);
            } else {
                console.log('⚠️ Destinataire introuvable:', msg.to);
            }
            
            // Envoyer aussi à l'expéditeur pour qu'il voie son message
            socket.emit('message', broadcastMessage);
        } else {
            // MESSAGE GÉNÉRAL : diffuser à tous les clients
            io.emit('message', broadcastMessage);
            console.log('✅ Message général diffusé à tous les clients');
        }
    });

    // Broadcast immédiat
    broadcastUserList();
});

function broadcastUserList() {
    console.log('📢 Broadcasting to', clients.size, 'clients');
    
    if (clients.size === 0) {
        console.log('📢 Aucun client connecté');
        return;
    }
    
    const userList = [];
    for (const [clientId, socket] of clients) {
        if (clientUsernames.has(clientId)) {
            userList.push({
                username: clientUsernames.get(clientId),
                display_name: clientDisplayNames.get(clientId)
            });
        }
    }
    
    io.emit('user_list', {
        users: userList,
        timestamp: Date.now()
    });
}

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port: 3001, host: '0.0.0.0' }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`[chat-service] Server listening on ${address}`);
    fastify.log.info(`[chat-service] Socket.IO available at http://localhost:3001`);
    fastify.log.info(`[chat-service] Metrics available at http://localhost:3001/metrics`);
});