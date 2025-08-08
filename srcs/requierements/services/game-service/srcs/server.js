import Fastify from 'fastify'

const fastify = Fastify({
	logger : true
})

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
    return { message: 'Game service is running' };
});

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3002, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info('[game-service]Server listening on ${address}');
})