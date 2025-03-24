'user strict';

const { SMTP } = require('../../config');

/**
 * Add common HTML template to the mails
 * 
 * @param {String} content 
 * @returns {String} mailHtml
 */
const templateHTML = (content) => {
	let htmlContent = `
		<div style="width: 100%; min-width: 96vw;">
			<div style="text-align: center; width: 100%; padding: 16px 0px;">
				<img style="width: 250px;" src="cid:logo">
			</div>
			<br/>
	`;
	htmlContent += content;
	htmlContent += `<br/><br/><br/><b>Thanks and Regards<br/>${SMTP.fromAlias}</b></div>`;

	return htmlContent;
};

/**
 * Add template to the text of mails
 * 
 * @param {String} content 
 * @returns {String} mailHtml
 */
const templateMailText = (content) => {
	let textContent = content;
	textContent += "\n\n\nThanks and Regards\n" + SMTP.fromAlias;

	return textContent;
};

module.exports = {
	templateHTML,
	templateMailText,
};