'user strict';

const nodemailer = require('nodemailer');
const { SMTP } = require('../../config');
const { templateHTML, templateMailText } = require('./mailTemplateHelper');

class Mailer {

	/**
	 * Constructor
	 */
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: SMTP.host,
			port: SMTP.port,
			secure: SMTP.secure, // true for 465, false for other ports
			auth: {
				user: SMTP.user,
				pass: SMTP.pass,
			}
		});
	};

	/**
	 * Send mail to users
	 * 
	 * @param {Object} mailDetails 
	 * @returns {String} messageId
	 */
	async sendMail(mailDetails) {
		try {
			let attachments = mailDetails.attachments || [];

			if (mailDetails.useTemplate) {
				mailDetails.html = templateHTML(mailDetails.html);				
				mailDetails.text = templateMailText(mailDetails.text);
				attachments = [
					...attachments,
					{
						filename: 'Logo.png',
						path: __dirname +'/../assets/images/logo.png',
						cid: 'logo'
					}
				];
			}
	 

			const info = await this.transporter.sendMail({
				from: '"' + SMTP.fromAlias + '" <' + SMTP.fromEmail + '>', // sender address
				to: mailDetails.to, // list of receivers
				bcc: mailDetails.sendBCC ? SMTP.adminEmail : null, // list of BCC receivers
				subject: mailDetails.subject, // Subject line
				text: mailDetails.text, // plain text body
				html: mailDetails.html, // html body
				attachments: attachments, // Attachments if any
				priority: mailDetails.priority || "normal", // Priority if any
			});    
			console.log('Message sent: %s', info.messageId);
			return info.messageId;
		} catch (error) {
			console.log("ERROR IN sendMail ==> ", error);
		}
	};

}

module.exports = Mailer;