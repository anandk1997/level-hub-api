const { createLogger, format, transports } = require('winston');

const transporters = [];

if (process.env.NODE_ENV === 'staging') {
	transporters.push(new transports.Console());
} else {
	transporters.push(
		new transports.File({ filename: 'logs/error.log', level: 'error' }),
		new transports.File({ filename: 'logs/combined.log' }) // Log all levels to another file
	)
}

const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp(),
		format.json(),
	),
	transports: transporters
});

module.exports = logger;