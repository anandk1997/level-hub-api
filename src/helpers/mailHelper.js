'user strict';

const { SITE_URL } = require("../../config");
const Mailer = require("./mailer");


/**
 * Send leveling up email to users
 * 
 * @param {Object} mailData
 * @param {string} mailData.fullName
 * @param {string} mailData.email
 * @param {number} mailData.currentLevel
 * @param {number} mailData.currentXP
 * @param {number} mailData.targetXP
 */
const sendLevelUpEmail = async (mailData) => {
	try {
		const mailer = new Mailer();

		let mailText = `Hi ${mailData.fullName},\n\n🔥Congratulations! You've just reached Level ${mailData.currentLevel} with ${mailData.currentXP} XP out of ${mailData.targetXP} XP!\n\nYour progress is nothing short of inspiring, and you're well on your way to mastering the journey. Every step you take is fueling your momentum, keep that fire burning!\n\nStay consistent. Stay driven. Greatness is just around the corner.\n\n🚀 Let's go even further, we believe in you.\n`;


    const mailHtml = `<b>Hi ${mailData.fullName}</b>,<br/><br/>
    🔥Congratulations! You've just reached <b>Level ${mailData.currentLevel}</b> with ${mailData.currentXP} XP out of ${mailData.targetXP} XP!<br/><br/>
    Your progress is nothing short of inspiring, and you're well on your way to mastering the journey. Every step you take is fueling your momentum, keep that fire burning!<br/><br/>
    Stay consistent. Stay driven. Greatness is just around the corner.<br/><br/>
    🚀 Let's go even further, we believe in you.`;

		const mailDetails = {
			to: mailData.email,
			subject: `🎉 You're Leveling Up, ${mailData.fullName}! 🚀`, // Subject line
			text: mailText, // plain text body
			html: mailHtml, // html body
			priority: "high",
			useTemplate: true,
			sendBCC: false,
		};
		return await mailer.sendMail(mailDetails);
	} catch (error) {
		console.log("ERROR in sendLevelUpEmail : ", error);
		throw error;
	}
};

/**
 * Send leveling up email to parent
 * 
 * @param {Object} mailData
 * @param {string} mailData.fullName
 * @param {string} mailData.parentFullName
 * @param {string} mailData.email
 * @param {number} mailData.currentLevel
 * @param {number} mailData.currentXP
 * @param {number} mailData.targetXP
 */
const sendLevelUpEmailToParent = async (mailData) => {
	try {
		const mailer = new Mailer();

		let mailText = `Hi ${mailData.parentFullName}, \n\nGreat news! 🎉 Your child, ${mailData.fullName} has just reached Level ${mailData.currentLevel} with ${mailData.currentXP} XP out of ${mailData.targetXP} XP! \n\nThey've been working hard, completing activities and pushing boundaries — and it's paying off! 🚀 Their commitment and energy are truly inspiring.\n\n This is a moment to celebrate their progress and cheer them on as they continue leveling up, one activity at a time. 🎯 \n\n🚀We're thrilled to be part of their journey — and you should be super proud! 🏆\n`;


    const mailHtml = `<b>Hi ${mailData.parentFullName}</b>,<br/><br/>
    Great news! 🎉 Your child, <b>${mailData.fullName}</b>, has just reached <b>Level ${mailData.currentLevel}</b> with ${mailData.currentXP} XP out of ${mailData.targetXP} XP!<br/><br/>
    They've been working hard, completing activities and pushing boundaries — and it's paying off! 🚀 Their commitment and energy are truly inspiring.<br/><br/>
    This is a moment to celebrate their progress and cheer them on as they continue leveling up, one activity at a time. 🎯<br/><br/>
    We're thrilled to be part of their journey — and you should be super proud! 🏆`;

		const mailDetails = {
			to: mailData.email,
			subject: `🎉 ${mailData.fullName} Just Leveled Up to Level to ${mailData.currentLevel}! 🚀`, // Subject line
			text: mailText, // plain text body
			html: mailHtml, // html body
			priority: "high",
			useTemplate: true,
			sendBCC: false,
		};
		return await mailer.sendMail(mailDetails);
	} catch (error) {
		console.log("ERROR in sendLevelUpEmail : ", error);
		throw error;
	}
};

/**
 * Send invite to create a subaccount to user via email
 * 
 * @param {Object} mailData 
 */
const sendInviteEmail = async (mailData) => {
	try {
		const mailer = new Mailer();
		const inviteUrl = `${SITE_URL}invite/${mailData.params}`;

		let mailText = `Hi ${mailData.fullName}, \n\n${mailData.ownerName} has invited you to join them — and we're excited to have you onboard! \nTo get started, simply copy the link into your browser.\n${inviteUrl} \n\n🎉 Congratulations on being part of something awesome — we can't wait to see what you'll do!\n`;

		let mailHtml =
		`<b>Hi ${mailData.fullName},</b><br/><br/>
		${mailData.ownerName} has invited you to join them — and we're excited to have you onboard!<br/>
		To get started, simply click the button below or copy the link into your browser:<br/>
		<b><a style="color:blue" href=${inviteUrl} target="_blank">Join Now<a/></b><br/>
		If the button doesn't work, you can also use this link:<br/>
		${inviteUrl}<br/><br/>
		🎉 Congratulations on being part of something awesome — we can't wait to see what you'll do!<br/>`;

		const mailDetails = {
			to: mailData.email,
			subject: `You're Invited to Join by ${mailData.ownerName}!`, // Subject line
			text: mailText, // plain text body
			html: mailHtml, // html body
			priority: "high",
			useTemplate: true,
			sendBCC: false,
		};
		return await mailer.sendMail(mailDetails);
	} catch (error) {
		console.log("ERROR in sendRegistrationEmail : ", error);
		throw error;
	}
};

module.exports = {
	sendLevelUpEmail,
  sendLevelUpEmailToParent,
	sendInviteEmail,
}