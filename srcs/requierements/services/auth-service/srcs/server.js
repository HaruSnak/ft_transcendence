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

// In-memory user storage (temporary)
const users = [];
const sessions = new Map();

// Add a default user for testing
users.push({
	id: 1,
	username: 'testuser',
	display_name: 'Test User',
	email: 'test@example.com',
	password: 'password',
	createdAt: new Date().toISOString()
});

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

// POST /api/auth/register - User registration
fastify.post('/api/auth/register', async (request, reply) => {
	const { username, display_name, email, password } = request.body;

	// Basic validation
	if (!username || !display_name || !email || !password) {
		return reply.code(400).send({ error: 'Username, display name, email, and password are required' });
	}

	// Check if user already exists
	const existingUser = users.find(user => user.username === username || user.email === email);
	if (existingUser) {
		return reply.code(409).send({ error: 'User already exists' });
	}

	// Create user (in production, hash password!)
	const user = {
		id: users.length + 1,
		username,
		display_name,
		email,
		password, // In production: hash this!
		createdAt: new Date().toISOString()
	};

	users.push(user);

	console.log(`New user registered: ${username}`);

	return reply.code(201).send({
		message: 'User registered successfully',
		user: { id: user.id, username: user.username, display_name: user.display_name, email: user.email },
		token: `fake-jwt-token-${user.id}` // In production: generate real JWT
	});
});

// POST /api/auth/login - User login
fastify.post('/api/auth/login', async (request, reply) => {
	const { username, password } = request.body;

	if (!username || !password) {
		loginAttempts.inc({status: 'failed'});
		return reply.code(400).send({ error: 'Username and password are required' });
	}

	const user = users.find(u => (u.username === username || u.email === username) && u.password === password);
	if (!user) {
		loginAttempts.inc({status: 'failed'});
		return reply.code(401).send({ error: 'Invalid credentials' });
	}

	loginAttempts.inc({status: 'success'});
	activeSessions.inc();

	const token = `fake-jwt-token-${user.id}`;
	sessions.set(token, user);

	return reply.send({
		message: 'Login successful',
		user: { id: user.id, username: user.username, display_name: user.display_name, email: user.email },
		token
	});
});

// All interfaces IPV4 (host : '0.0.0.0'), 
fastify.listen({ port : 3004, host : '0.0.0.0'}, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`[auth-service]Server listening on ${address}`);
});