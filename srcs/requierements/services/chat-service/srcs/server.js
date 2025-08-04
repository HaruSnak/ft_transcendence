import Fastify from 'fastify'

const fastify = Fastify({
	logger : true
})

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3001, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info('[chat-service]Server listening on ${address}');
})