import Fastify from 'fastify'
import client from 'prom-client'

/*					____METRICS Prometheus____						*/

const loginAttempts = new client.Counter({
	name: 'login_attempts',
	help: 'Total login attempts',
	labelNames: ['status']
});

const activeSessions = new client.Counter({
	name: 'active_sessions',
	help: 'Currently active sessions'
	//registers: [registers],
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
		service: 'auth-service',
		timestamp: new Date().toISOString()
	};
});

// temp route
fastify.get('/api/auth', async (request, reply) => {
	console.log('auth route accessed!');
    return { message: 'Auth service is running' };
});

// Route for login utilisateur
fastify.get('/api/login', async (request, reply) => {
	var successLogin = false // temp variable en attente du systeme de login
	if (successLogin)
	{
		loginAttempts.inc({status: 'success'});
		activeSessions.inc();
	}
	else
		loginAttempts.inc({status: 'failed'});
	return {message: successLogin ? 'Login OK' : 'Login failed'};
});

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3004, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`[auth-service]Server listening on ${address}`);
});