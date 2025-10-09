import Fastify from 'fastify'
import client from 'prom-client'

/*					____METRICS Prometheus____						*/

const gameRequests = new client.Counter({
    name: 'game_requests_total',
    help: 'Total game requests',
    labelNames: ['method']
});

/*					____SERVER Fastify____						*/

const fastify = Fastify({
	logger : true
})

// Route for testing health
fastify.get('/health', async (request, reply) => {
	console.log('health route accessed!');
	return {
		status: 'OK',
		service: 'chat-service',
		timestamp: new Date().toISOString()
	};
});

fastify.get('/api/game', async (request, reply) => {
	console.log('frontend route accessed!');
    gameRequests.inc({ method: 'GET' });
    return { message: 'Game service is running' };
});

// Endpoint pour Prometheus
fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return await client.register.metrics();
});

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3002, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`[game-service]Server listening on ${address}`);
});

/*					____METRICS Prometheus____						*/