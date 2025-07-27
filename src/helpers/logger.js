const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');

const isServerless = 1;

// Set log directory — use /tmp/logs in Vercel, otherwise ./logs
const logDir = isServerless ? path.join('/tmp', 'logs') : path.join(__dirname, '..', 'logs');

// Create the directory if file logging is used
if (!isServerless && !fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

const loggerTransports = [];

if (isServerless) {
	// Vercel: use console logging only
	loggerTransports.push(new transports.Console());
} else {
	// Local/Other: use file logging
	loggerTransports.push(
		new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
		new transports.File({ filename: path.join(logDir, 'combined.log') })
	);
}

const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp(),
		format.json()
	),
	transports: loggerTransports,
	exitOnError: false
});

module.exports = logger;
