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
	MAX_CHILD_LIMIT: 10,
	SITE_URL: process.env.SITE_URL,
	/* SMTP: {
		host: 'mail.lovestoriez.com',
		port: 465,
		secure: true, // true for 465, false for other ports
		user: 'noreply@lovestoriez.com',
		pass: 'noreply@lovestoriez123#',
		fromEmail: 'noreply@lovestoriez.com',
		fromAlias: 'LevelHub Admin',
		adminEmail: ['kanishkclerisy@gmail.com'],
	}, */
	SMTP: {
		host: 'smtp.gmail.com',
		port: 465,
		secure: true, // true for 465, false for other ports
		user: 'dev.kanishk.gupta@gmail.com',
		pass: 'djxt vvdz xpgc acmj',
		fromEmail: 'dev.kanishk.gupta@gmail.com',
		fromAlias: 'LevelHub Team',
		adminEmail: ['dev.kanishk.gupta@gmail.com'],
	},
	/* SMTP: {
		host: 'smtp.gmail.com',
		port: 465,
		secure: true, // true for 465, false for other ports
		user: 'anandslk1997@gmail.com',
		pass: 'gfry ryrh kfpw abmk',
		fromEmail: 'anandslk1997@gmail.com',
		fromAlias: 'LevelHub Admin',
		adminEmail: ['anandslk1997@gmail.com'],
	}, */
	OTP_VALIDITY: 30, // In minutes
	INVITE_VALIDITY: 7, // In days
};
