import Fastify from 'fastify'
import client from 'prom-client'

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

fastify.get('/api/user', async (request, reply) => {
	console.log('frontend route accessed!');
    return { message: 'User service is running' };
});

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3003, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`[user-service]Server listening on ${address}`);
});

/*					____METRICS Prometheus____						*/