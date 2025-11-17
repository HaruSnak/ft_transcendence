import net from 'net';

/**
 * Sends a log event to Logstash via TCP
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {object} data - Additional data to include in the log
 */
export function sendToLogstash(level, message, data = {}) {
	const logEntry = {
		'@timestamp': new Date().toISOString(),
		level: level,
		service: 'chat-service',
		message: message,
		...data
	};

	const client = new net.Socket();
	
	client.connect(5000, 'logstash', () => {
		client.write(JSON.stringify(logEntry) + '\n');
		client.end();
	});

	client.on('error', (err) => {
		console.error('Failed to send log to Logstash:', err.message);
	});
}
