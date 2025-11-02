import Fastify from 'fastify'
import client from 'prom-client'
import { Server } from 'socket.io'
import { SecurityUtils } from './security.js'

/*					____METRICS Prometheus____						*/

const msgSentReceived = new client.Counter({
    name: 'msg_send_received',
    help: 'Number of messages sent/received',
    labelNames: ['status']
});

const socketConnections = new client.Counter({
    name: 'socket_connections_total',
    help: 'Total number of socket connections'
});

/*					____SERVER Fastify____						*/

const fastify = Fastify({
    logger: true
})

// Storage pour les clients connectés
const clients = new Map();
const clientUsernames = new Map();
const clientDisplayNames = new Map();
const socketToUsername = new Map();

// Route for testing health
fastify.get('/health', async (request, reply) => {
    console.log('health route accessed!');
    return {
        status: 'OK',
        service: 'chat-service',
        timestamp: new Date().toISOString()
    };
});

// Endpoint pour Prometheus
fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return (await client.register.metrics());
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
    
    socketConnections.inc(); // Incrémenter le compteur de connexions
    
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
        const username = socketToUsername.get(clientId);
        if (username) {
            clients.delete(username);
            clientUsernames.delete(username);
            clientDisplayNames.delete(username);
            socketToUsername.delete(clientId);
        }
        broadcastUserList();
    });

    socket.on('register', (msg) => {
        console.log('← register reçu de', clientId, ':', msg);
        
        // SANITIZE ET VALIDER les inputs
        const username = SecurityUtils.sanitizeUsername(msg.username);
        const display_name = SecurityUtils.sanitizeDisplayName(msg.display_name || username);
        
        // Validation
        if (!SecurityUtils.isValidUsername(username)) {
            console.log('⚠️ Username invalide:', username);
            socket.emit('error', { message: 'Invalid username format' });
            return ;
        }
        
        if (!SecurityUtils.isValidDisplayName(display_name)) {
            console.log('⚠️ Display name invalide:', display_name);
            socket.emit('error', { message: 'Invalid display name format' });
            return ;
        }
        
        // Détection d'injection SQL
        if (SecurityUtils.detectSQLInjection(username) || SecurityUtils.detectSQLInjection(display_name)) {
            console.log('🚨 Tentative d\'injection SQL détectée!');
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
            console.log('✅ Client enregistré:', username, display_name);
            broadcastUserList();
        }
    });

    socket.on('message', (msg) => {
        console.log('← message reçu de', clientId, ':', msg);
        
        // SANITIZE le message
        const sanitizedText = SecurityUtils.sanitizeChatMessage(msg.text);
        
        // Validation
        if (!SecurityUtils.isValidMessage(sanitizedText)) {
            console.log('⚠️ Message invalide');
            socket.emit('error', { message: 'Invalid message format or length' });
            return ;
        }
        
        // Détection d'injection SQL
        if (SecurityUtils.detectSQLInjection(sanitizedText)) {
            console.log('🚨 Tentative d\'injection SQL dans le message!');
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
            console.log('✅ Message privé envoyé de', fromUsername, 'vers', msg.to);
            msgSentReceived.inc({status: 'sent'});
        } else {
            console.log('⚠️ Destinataire introuvable:', msg.to);
        }
        
        // Envoyer aussi à l'expéditeur pour qu'il voie son message
        socket.emit('message', broadcastMessage);
    });

    // Broadcast immédiat
    broadcastUserList();
});

function broadcastUserList() {
    console.log('📢 Broadcasting to', clients.size, 'clients');
    
    if (clients.size === 0) {
        console.log('📢 Aucun client connecté');
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