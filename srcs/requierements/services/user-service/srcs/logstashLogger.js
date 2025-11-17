import net from 'net';

const LOGSTASH_HOST = process.env.LOGSTASH_HOST || 'logstash';
const LOGSTASH_PORT = process.env.LOGSTASH_PORT || 5000;

/**
 * Send a log event to Logstash
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {string} message - Log message
 * @param {object} data - Additional data to include in the log
 */
export function sendToLogstash(level, message, data = {}) {
	const logEvent = {
		'@timestamp': new Date().toISOString(),
		level: level,
		message: message,
		service: 'user-service',
		type: 'application',
		...data
	};

	const client = new net.Socket();
	
	client.connect(LOGSTASH_PORT, LOGSTASH_HOST, () => {
		client.write(JSON.stringify(logEvent) + '\n');
		client.destroy();
	});

	client.on('error', (err) => {
		console.error('Failed to send log to Logstash:', err.message);
	});
}

export default { sendToLogstash };
