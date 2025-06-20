require('dotenv').config();

module.exports = {
	PORT: process.env.PORT || 8000,
	DB_NAME: process.env.DB_NAME,
	DB_USERNAME: process.env.DB_USERNAME,
	DB_PASSWORD: process.env.DB_PASSWORD,
	DB_HOST: process.env.DB_HOST,
	DB_PORT: process.env.DB_PORT || 5432,
	SECRET: process.env.SECRET,
	COMMON_ERR_MSG: 'Something went wrong. Please try again later.',
	SALT_ROUNDS: 10,
	EMAIL_VERIFICATION_OTP: 'email_verification',
	PASS_RESET_OTP: 'password_reset',
	APP_NAME: "Level Hub",
	SMTP: {
		host: 'mail.lovestoriez.com',
		port: 465,
		secure: true, // true for 465, false for other ports
		user: 'noreply@lovestoriez.com',
		pass: 'noreply@lovestoriez123#',
		fromEmail: 'noreply@lovestoriez.com',
		fromAlias: 'LevelHub Admin',
		adminEmail: ['kanishkclerisy@gmail.com'],
	},
	OTP_VALIDITY: 30, // In minutes
};
