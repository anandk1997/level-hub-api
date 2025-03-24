'user strict';

const { Op, col } = require('sequelize');
const fs = require('fs');
const moment = require("moment");

const db = require("../models");
const { ErrorHandler } = require('../helpers/errorhandler');
const { paddZeros } = require('../helpers/commonHelper');
const {
	common_err_msg,
	loan_number_prefix,
	loan_number_zeros_length
} = require('../../config');
const Mailer = require('../helpers/mailer');


/**
 * Generate unique loan number
 * 
 * @returns {String} loanNumber
 */
const generate_loan_number = async () => {
	const result = await db.applications.findOne({
		attributes: ['id', 'loanNumber'],
		order: [['id', 'DESC']],
	});
	if (!result || !result.loanNumber) { return loan_number_prefix + paddZeros(1, loan_number_zeros_length); }
	const nextDigit = parseInt(result.loanNumber.replace(loan_number_prefix, '')) + 1
	return loan_number_prefix + paddZeros(nextDigit, loan_number_zeros_length);
};


/**
 * Save application files and request to 3rd party govt rent relief API
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const save_application = async (req, res, next) => {
	const userId = parseInt(req.user_id), data = JSON.parse(req.body.data);
	var filePaths;
	try {
		const fileNames = {
			lease : req.files?.lease[0]?.filename,
			impactLetter : req.files?.impactLetter ? req.files?.impactLetter[0]?.filename : null,
			rentInvoice : req.files?.rentInvoice ? req.files?.rentInvoice[0]?.filename : null,
			securityDeposit : req.files?.securityDeposit ? req.files?.securityDeposit[0]?.filename : null,
			utilityBills : req.files?.utilityBills ? req.files?.utilityBills[0]?.filename : null,
			internetInvoiceStatement : req.files?.internetInvoiceStatement ? req.files?.internetInvoiceStatement[0]?.filename : null,
			dueRentStatement : req.files?.dueRentStatement ? req.files?.dueRentStatement[0]?.filename : null,
			additionalInformation : req.files?.additionalInformation ? req.files?.additionalInformation[0]?.filename : null,
		};
		filePaths = {
			lease : req.files?.lease[0],
			impactLetter : req.files?.impactLetter ? req.files?.impactLetter[0]?.path : null,
			rentInvoice : req.files?.rentInvoice ? req.files?.rentInvoice[0]?.path : null,
			securityDeposit : req.files?.securityDeposit ? req.files?.securityDeposit[0]?.path : null,
			utilityBills : req.files?.utilityBills ? req.files?.utilityBills[0]?.path : null,
			internetInvoiceStatement : req.files?.internetInvoiceStatement ? req.files?.internetInvoiceStatement[0]?.path : null,
			dueRentStatement : req.files?.dueRentStatement ? req.files?.dueRentStatement[0]?.path : null,
			additionalInformation : req.files?.additionalInformation ? req.files?.additionalInformation[0]?.path : null,
		};
		const principal = parseFloat(data?.amount);
		const interest = parseFloat(data?.selectedState?.interest);
		const interestAmount = interest ? (principal * interest) / 100 : 0;
		const total = principal + interestAmount;

		const loanNumber = await generate_loan_number();

		const application = {
			loanNumber,
			userId,
			stateId							: data?.selectedState?.id,
			loanPrincipal				: data?.amount,
			loanInterest				: interest,
			loanInterestAmount	: interestAmount,
			loanTerm						: data?.term,
			loanTotal						: total,
			leaseFile						: fileNames.lease,
			impactLetterFile		: fileNames.impactLetter,
			rentInvoiceFile			: fileNames.rentInvoice,
			securityDepositFile	: fileNames.securityDeposit,
			utilityBillsFile		: fileNames.utilityBills,
			internetInvoiceFile	: fileNames.internetInvoiceStatement,
			dueRentStatementFile: fileNames.dueRentStatement,
			additionalInfoFile	: fileNames.additionalInformation,
		};

		const appResult = await db.applications.create(application);

		return res.status(201).json({ success: true, message: 'Application submitted successfully!', response: appResult });
	} catch (error) {
		for (const key in filePaths) {
			if (Object.hasOwnProperty.call(filePaths, key)) {
				delete_file(filePaths[key]);				
			}
		}
		return next(new ErrorHandler(500, common_err_msg, error));
	}
};


/**
 * Delete file
 * 
 * @param {*} filepath 
 */
const delete_file = (filepath) => {
	try {		
		if (fs.existsSync(filepath)) {
			fs.unlinkSync(filepath);
		}
	} catch (error) { }
};

/**
 * Get user applications
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const get_user_applications = async (req, res, next) => {
	const userId = parseInt(req.user_id);
	const request = {
		orderBy			: (req.body.orderBy !== undefined  && req.body.orderBy !== "") ? req.body.orderBy : 'id',
		order				: (req.body.order !== undefined && req.body.order !== "") ? req.body.order : 'ASC',
		pageSize		: (req.body.pageSize !== undefined) ? req.body.pageSize : 10,
		pageOffset 	: (req.body.pageOffset !== undefined && req.body.pageOffset !== null) ? req.body.pageOffset : 0,
		searchText 	: (req.body.searchText !== undefined) ? req.body.searchText : '',
	};
	// return res.json({ success: false, message: 'Test fetched successfully!', userId, request });
	const userFields = ['email', 'city', 'state', 'zip', 'rentAmount'];
	let order = [request.orderBy, request.order];
	if (userFields.includes(request.orderBy)) { 
		order = [db.users, request.orderBy, request.order];
	}

	const searchColumns = ['id', 'total_quantity', 'total_price', 'order_status', 'createdAt'];

	let likeSearch = {};
	if (request.searchText !== '') {
		const likeColumns = searchColumns.map(column => {
			return { [column]: { [Op.like]: '%' + request.searchText + '%' } };
		});
		likeSearch = { [Op.or]: likeColumns };
	}


	try {
		let result = await db.applications.findAndCountAll({
			// attributes: ['id', 'user_id', 'order_number', 'total_quantity', 'subtotal', 'tax', 'discount', 'total_price', 'order_status', 'createdAt', [fn('COUNT', col('order_products.id')), 'product_count'] ],
			where: { ...likeSearch, userId },
			include: { 
				model: db.users,
				// where: { type: 'shipping' },
				attributes: [ 'id', 'name', 'email','city', 'state', 'zip', 'rentAmount', 'impactReason', 'profileImage']
			},
			// group: ['id'],
			order: [order],
			offset: request.pageOffset,
			limit: request.pageSize,
			subQuery: false,
		});
		return res.json({ success: true, message: 'Applications fetched successfully!', data: result });
	} catch (error) {
		return next(new ErrorHandler(200, common_err_msg, error));
	}
};

/**
 * Get user applications
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const get_all_user_applications = async (req, res, next) => {
	const request = {
		orderBy			: (req.body.orderBy !== undefined  && req.body.orderBy !== "") ? req.body.orderBy : 'id',
		order				: (req.body.order !== undefined && req.body.order !== "") ? req.body.order : 'ASC',
		pageSize		: (req.body.pageSize !== undefined) ? req.body.pageSize : 10,
		pageOffset 	: (req.body.pageOffset !== undefined && req.body.pageOffset !== null) ? req.body.pageOffset : 0,
		searchText 	: (req.body.searchText !== undefined) ? req.body.searchText : '',
		filteredUser: (req.body.searchText !== undefined) ? req.body.filteredUser : 0,
	};

	const userFields = ['name', 'email', 'city', 'state', 'zip', 'rentAmount'];
	let order = [request.orderBy, request.order];
	if (userFields.includes(request.orderBy)) { 
		order = [db.users, request.orderBy, request.order];
	}

	const searchColumns = ['id', 'loanNumber', 'loanTotal', 'status', '$user.name$', '$user.email$', '$user.city$', '$user.state$', '$user.zip$', '$user.rentAmount$'];

	let likeSearch = {};
	if (request.searchText !== '') {
		const likeColumns = searchColumns.map(column => {
			return { [column]: { [Op.like]: '%' + request.searchText + '%' } };
		});
		likeSearch = { [Op.or]: likeColumns };
	}

	let userWhere = {};
	if (request.filteredUser) { userWhere = { ...userWhere, id: request.filteredUser }; }

	try {
		let result = await db.applications.findAndCountAll({
			attributes: ['id', 'loanNumber', 'loanTotal', 'status', 'createdAt'],
			where: { ...likeSearch },
			include: { 
				model: db.users,
				where: userWhere,
				attributes: [ 'id', 'name', 'email','city', 'state', 'zip', 'impactReason', 'profileImage']
			},
			// group: ['id'],
			order: [order],
			offset: request.pageOffset,
			limit: request.pageSize,
			subQuery: false,
		});
		return res.json({ success: true, message: 'Applications fetched successfully!', data: result });
	} catch (error) {
		next(new ErrorHandler(200, common_err_msg, error));
	}
};

/**
 * Fetch user application details
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns {JSON}
 */
const get_application_details = async (req, res, next) => {
	const appId = req.params.id;

	try {
		let result = await db.applications.findOne({
			where: { id: appId },
			include: { 
				model: db.users,
				attributes: [ 'id', 'name', 'email', 'city', 'state', 'zip', 'rentAmount', 'apartmentName', 'unitNumber', 'impactReason', 'profileImage']
			},
		});
		return res.json({ success: true, message: 'Application details fetched successfully!', data: { applicationDetails: result } });
	} catch (error) {
		return next(new ErrorHandler(200, common_err_msg, error));
	}
};

/**
 * Fetch user application details
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns {JSON}
 */
const approve_reject_application = async (req, res, next) => {
	const appId = req.params.id, request = req.body;
	// return res.json({ request, appId });
	try {
		let updateData = {
			status: request.status,
			note: request.note,
		};
		if (request.status === 'approved') {
			updateData = {
				...updateData,
				lenderName: request.lenderName,
				lenderPhone: request.lenderPhone,
				lenderEmail: request.lenderEmail,
				approvedAt: moment(),
			};
		}
		await db.applications.update(updateData, { where: { id: appId }});
		const updateApplication = await db.applications.findOne({
			where: { id: appId },
			include: { 
				model: db.users,
				attributes: [ 'id', 'name', 'email' ]
			},
		});
		const mailData = {
			name: updateApplication?.user?.name,
			loanNumber: updateApplication?.loanNumber,
			status: updateApplication?.status,
			email: updateApplication?.user?.email,
		}
		sendApplicationResponseEmail(mailData)
		return res.json({ success: true, message: `Application ${request.status} successfully!`, updateApplication, mailData });
	} catch (error) {
		return next(new ErrorHandler(500, common_err_msg, error));
	}
};

/**
 * Send registration email to user
 * 
 * @param {Object} mailData 
 */
const sendApplicationResponseEmail = async (mailData) => {
	try {
		const mailer = new Mailer();

		let mailText = `Hello ${mailData.name}`  + `\n\n Your application #${mailData.loanNumber} has been ${mailData.status} by admin.`;

		let mailHtml = `<b>Hello ` + mailData.name  + `</b><br/><br/>
										Your application #${mailData.loanNumber} has been <b>${mailData.status}</b> by admin. <br/>`;

		const mailDetails = {
			to: mailData.email,
			subject: `Loan Application #${mailData.loanNumber} is ${mailData.status}`, // Subject line
			text: mailText, // plain text body
			html: mailHtml, // html body
			priority: "high",
			useTemplate: true,
			sendBCC: true,
		};
		return await mailer.sendMail(mailDetails);
	} catch (error) {
		console.log("ERROR in sendRegistrationEmail : ", error);
		throw error;
	}
};


module.exports = {
	save_application,
	get_user_applications,
	get_all_user_applications,
	get_application_details,
	approve_reject_application,
};