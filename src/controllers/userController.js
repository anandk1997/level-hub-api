'user strict';

const { hashSync, compareSync } = require('bcrypt');

const {
	SALT_ROUNDS
} = require('../../config');
const { db } = require('../db');
const {
	USER_DOESNT_EXISTS,
	USER_DOESNT_EXISTS_EXCEPTION,
	INCORRECT_PASS,
	INCORRECT_PASS_EXCEPTION,
	PASSWORD_UPDATE_SUCCESS,
	FETCH_PROFILE_SUCCESS,
	UPDATE_PROFILE_SUCCESS,
	USERNAME_EXISTS,
	USERNAME_EXISTS_EXCEPTION,
	ROLE_NOT_EXISTS,
	ROLE_NOT_EXISTS_EXCEPTION,
	CHILD_CREATE_SUCCESS,
} = require('../messages');


/**
 * API to fetch user profile
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchUserProfile = async (req, res, next) => {
	try {
		const userId = req.userId;
		const result = await db.Users.findOne({
			attributes: ['id', 'firstName', 'lastName', 'email', 'username', 'phone', 'dob', 'gender', 'profileImage', 'fullName'],
			where: { id: userId },
		});
		return res.response(FETCH_PROFILE_SUCCESS, { profile: result });
	} catch (error) {
		return next(new ErrorHandler(200, config.common_err_msg, error));
	}
};

/**
 * API to update user profile
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateUserProfile = async (req, res, next) => {
	try {
		const userId = req.userId, role = req.role;
		let {
			firstName,
			lastName,
			phone,
			gender,
			dob,
			organizationName
		} = req.body;

		const user = {
      firstName: firstName?.trim(),
      lastName: lastName ? lastName?.trim() : null,
      phone: phone ? phone?.trim() : null,
      gender: gender ? gender?.trim() : null,
      dob: dob,
      organizationName: organizationName ? organizationName?.trim() : null,
    };
		await db.Users.update(user, { where: { id: userId } });
		return res.response(UPDATE_PROFILE_SUCCESS);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to change user password
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const changePassword = async (req, res, next) => {
	try {
		const { oldPassword, newPassword } = req.body, userId = req.userId;
		const user = await db.Users.findOne({
			attributes: [
				'id',
				'firstName',
				'lastName',
				'email',
				'password',
			],
			where: { id: userId },
		});
		if (!user?.id) { return res.response(USER_DOESNT_EXISTS, {}, 401, USER_DOESNT_EXISTS_EXCEPTION, false); }

		let valid = await compareSync(oldPassword, user.password);
		if (!valid) {
			return res.response(INCORRECT_PASS, {}, 400, INCORRECT_PASS_EXCEPTION, false);
		}
    const passHash = await hashSync(newPassword, SALT_ROUNDS);
		await db.Users.update({ password: passHash }, { where: { id: user.id } });
		return res.response(PASSWORD_UPDATE_SUCCESS);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * Check if email exists
 * 
 * @param {*} email 
 * @param {*} userId 
 * @param {*} next 
 */
const check_if_email_exist = async (email, userId, next, returnResult) => {
	try {
		let where = { email };
		if (userId) {
			where = { ...where, id: { [Op.not]: userId } }
		}
		const result = await User.findOne({ where }); // , logging: console.log
		if (returnResult) { return result; }
		return (result) ? true : false;
	} catch (error) {
		next(new ErrorHandler(200, config.common_err_msg, error));
	}   
};


/**
 * Fetch user listing
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns {JSON}
 */
const get_users = async (req, res, next) => {
	let request = {};
	request.orderBy    	= (req.body.orderBy !== undefined  && req.body.orderBy !== "") ? req.body.orderBy : 'id';
	request.order   		= (req.body.order !== undefined && req.body.order !== "") ? req.body.order : 'ASC';
	request.pageSize 		= (req.body.pageSize !== undefined) ? req.body.pageSize : 10;
	request.pageOffset 	= (req.body.pageOffset !== undefined && req.body.pageOffset !== null) ? req.body.pageOffset : 0;
	request.searchText 	= (req.body.searchText !== undefined) ? req.body.searchText : '';

	const searchColumns = ['name', 'email', 'city', 'state', 'rentAmount', 'apartmentName'];
	let likeSearch = {};
	if (request.searchText !== '') {
		const likeColumns = searchColumns.map(column => {
			return { [column]: { [Op.like]: '%' + request.searchText + '%' } };
		});
		likeSearch = { [Op.or]: likeColumns };
	}
	let order = [request.orderBy, request.order];
	/* if (request.orderBy === "user_paid_plans") { 
		order = ['user_paid_plans', request.orderBy, request.order];
	} */
	
	try {
		// const currentDateTime = moment().toDate();
		let result = await db.users.findAndCountAll({
			attributes: ['id', 'name', 'email', 'city', 'state', 'rentAmount', 'apartmentName', 'createdAt', 'updatedAt'],
			where: {
				...likeSearch,
				role: { [Op.not]: 'admin' },
			},
			/* include: {
				model: UserPaidPlans,
				on: {
					col1: where(col("user_paid_plans.user_id"), "=", col("users.id")),
					col2: where(col("user_paid_plans.end_date"), ">=", currentDateTime),
					col3: where(col("user_paid_plans.is_active"), "=", true)
				},
			}, */
			order: [order],
			offset: request.pageOffset,
			limit: request.pageSize,
		});
		return res.json({ success: true, message: 'Fetched users successfully!', data: result });
	} catch (error) {
		return next(new ErrorHandler(500, config.common_err_msg, error));
	}
};

const get_user_filter = async (req, res, next) => {
	try {
		let result = await db.users.findAll({
			attributes: ['id', 'name'],
			where: {
				role: 'user',
			},
			order: [[ 'name', 'ASC' ]],
		});
		return res.json({ success: true, message: 'Fetched user filter successfully!', data: result });
	} catch (error) {
		return next(new ErrorHandler(500, config.common_err_msg, error));		
	}
};

/**
 * Add update user
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const save_user = async (req, res, next) => {
	const uploadDir = 'assets/profile_images/';
	let form = new IncomingForm();
	
	form.uploadDir = uploadDir;		//set upload directory
	form.keepExtensions = true;		//keep file extension
	
	form.parse(req, async (err, fields, files) => {
		if (err) { return next(new ErrorHandler(500, config.common_err_msg, err)); }
		// const userId = req.user_id;
		let filePath = (files && files.file) ? files.file.path : null;
		let filename = (filePath) ? filePath.replace(uploadDir, '') : null;
		if (!fields.first_name || !fields.email) { delete_file(filePath); return next(new ErrorHandler(400, 'Missing required name or label fields')); }
		fields.first_name = fields.first_name.trim();
		fields.email = fields.email.trim();
		fields.profile_image = filename;

		// return res.json({ success: false, message: 'User created successfully!', fields });
		try {
			const userId = (fields.type == 'edit' && fields.id !== undefined) ? fields.id : false;
			let ifExist = await check_if_email_exist(fields.email, userId, next);
			if (ifExist) {
				return res.json({ success: false, message: 'Email already exists!' });
			}

			let user = {
				first_name	: fields.first_name,
				last_name	: fields.last_name,
				email		: fields.email,
				mobile		: fields.mobile,
			};
			if (fields.type == 'add') {
				user.password = await bcrypt.hashSync(fields.password, saltRounds);
				user.profile_image = fields.profile_image;
				const result = await User.create(user);
				return res.json({ success: true, message: 'User created successfully!', result });
			} else {
				const result = await User.update(user, { where: { id: fields.id } });
				return res.json({ success: true, message: 'User updated successfully!', result });
			}
		} catch (error) {
			delete_file(filePath);
			next(new ErrorHandler(200, config.common_err_msg, error));
		}		
	});	
	form.on('error', (err) => {
		return next(new ErrorHandler(500, config.common_err_msg, err));
	});
};

/**
 * send otp on sign up
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */ 
const send_otp = async (req, res, next) => {
		const userId = (req.body.type == 'edit' && req.body.id !== undefined) ? req.body.id : false;
		let ifExist = await check_if_email_exist(req.body.email, userId, next);
		if (ifExist) {
			return res.json({ success: false, message: 'Email already exists!' });
		}
		let otp = Math.floor(Math.random() * 100000000);
		try {
			const mailer = new Mailer();
			//const resetLink = config.site_url + 'reset-pasword/' + mailData.hash;

			let mailText = 'Otp for signup -'+otp;
			mailText += "\n\n\nThanks and Regards\n" + config.smtp.fromAlias;

			let mailHtml = "<b>Otp for signup -"+otp+"</b>";
			mailHtml += "<br/><br/><br/><b>Thanks and Regards<br/>" + config.smtp.fromAlias + "</b>";

			const mailDetails = {
				to: req.body.email,
				// to: 'kanishkgupta55@gmail.com',
				subject: 'OTP For Signup', // Subject line
				text: mailText, // plain text body
				html: mailHtml, // html body
			};
			mailer.sendMail(mailDetails);
		
			/*mailgun.messages().send(data, function (error, body) {
			  console.log(body);
			});*/
			return res.json({ success: true,otp: otp});			
		} catch (error) {
			
			next(new ErrorHandler(200, config.common_err_msg, error));
		}
};

/**
 * Fetch user details
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const get_user_details = async (req, res, next) => {
	const userId = parseInt(req.params.id);
	try {
		const result = await db.users.findOne({
			attributes: ['id', 'name', 'email', 'address', 'city', 'state', 'zip', 'apartmentName', 'rentAmount', 'impactReason', 'profileImage', 'createdAt'],
			where: { id: userId, role: { [Op.not]: 'admin' } },
			include: {
				model: db.applications
			}
		});
		return res.json({ success: true, message: 'Fetched user details successfully!', data: { userDetails: result } });
	} catch (error) {
		return next(new ErrorHandler(200, config.common_err_msg, error));
	}
};


/**
 * Add delete user
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const delete_users = async (req, res, next) => {
	/* const request = req.body;
	if (!request.deleteIds) { next(new ErrorHandler(400, 'Missing delete IDs')); }
	// return res.json({ success: true, message: 'Fetched user successfully!', request });

	try {
		const result = await User.destroy({ where: { id: { [Op.in]: request.deleteIds } } });
		return res.json({ success: true, message: 'User deleted successfully!', result });
	} catch (error) {
		next(new ErrorHandler(200, config.common_err_msg, error));
	} */
};

/**
 * Fetch admin profile
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const get_profile = async (req, res, next) => {
	try {
		const userId = req.user_id;
		let result = await User.findOne({
			attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'profile_image', 'mobile'],
			where: { id: userId, is_deleted: false },
			raw: true,
		}); // , logging: console.log
		result.full_name = (result.first_name + ' ' + result.last_name).trim();
		return res.json({ success: true, message: 'Fetch user profile successfully!', data: { profile_details: result } });
	} catch (error) {
		next(new ErrorHandler(200, config.common_err_msg, error));
	}
};


/**
 * Update profile image
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const update_password = async (req, res, next) => {
	try {
		const request = req.body, userId = req.user_id;
		if (!request.password) { return next(new ErrorHandler(400, 'Missing required fields!')); }
		const passwordHash = await bcrypt.hashSync(request.password, saltRounds);
		// return res.json({ success: true, message: 'Fetch user profile successfully!', request, passwordHash });
		let result = await User.update({ password: passwordHash }, { where: { id: userId, role: 'admin' } }); // , logging: console.log
		return res.json({ success: true, message: 'Updated password successfully!' });
	} catch (error) {
		next(new ErrorHandler(200, config.common_err_msg, error));
	}
};

const delete_file = (filepath) => {
	if (fs.existsSync(filepath)) {
		fs.unlinkSync(filepath);
	}
};





/**
 * Update user profile
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 const update_user_profile = async (req, res, next) => {
	try {
		const request = req.body, userId = req.user_id;
		// return res.json({ request, userId })
		const user = {
			name					: request.name,
			address				: request.address,
			city					: request.city,
			state					: request.state,
			zip						: request.zip,
			apartmentName	: request.apartmentName,
			unitNumber		: request.unitNumber ? request.unitNumber : null,
			rentAmount		: request.rentAmount,
			impactReason	: request.impactReason,
			
		};
		// return res.json({ success: false, message: 'Fetch user profile successfully!', request, userId, user });		
		let result = await db.users.update(user, { where: { id: userId } }); // , logging: console.log
		return res.json({ success: true, message: 'Updated profile successfully!', result });
	} catch (error) {
		return next(new ErrorHandler(200, config.common_err_msg, error));
	}   
};

/**
 * Update user profile password
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const update_user_password = async (req, res, next) => {
	try {
		const request = req.body, userId = req.user_id;
		const passwordHash = await bcrypt.hashSync(request.password, saltRounds);
		await db.users.update({ password: passwordHash }, { where: { id: userId, role: 'user' } });
		return res.json({ success: true, message: 'Updated password successfully!' });
	} catch (error) {
		return next(new ErrorHandler(200, config.common_err_msg, error));
	}   
};

/**
 * Update profile image
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const update_profile_image = async (req, res, next) => {
	const uploadDir = 'assets/profile_images/';
	let form = new IncomingForm();
	
	form.uploadDir = uploadDir;		//set upload directory
	form.keepExtensions = true;		//keep file extension
	
	form.parse(req, async (err, fields, files) => {
		if (err) { return next(new ErrorHandler(500, config.common_err_msg, err)); }
		const userId = req.user_id;
		// return res.json({ success: false, message: 'reached!', files, fields });
		let filePath = files.file.path;
		// if (!fields.id) { delete_file(filePath); return next(new ErrorHandler(400, 'Missing dialogue ID!')); }
		let filename = filePath.replace(uploadDir, '');

		try {
			if (fields.old_image_path && fs.existsSync(uploadDir + fields.old_image_path)) {
				delete_file(uploadDir + fields.old_image_path);
			}
			// return res.json({ success: false, message: 'asdasd!', files, fields, ifExist, uploadDir, filePath, dialogue });
			const result = await User.update({ profile_image: filename }, { where: { id: userId } });
			return res.json({ success: true, message: 'Uploaded profile image successfully!', data: { filename } });
		} catch (error) {
			next(new ErrorHandler(200, config.common_err_msg, error));
		}			
	});	
	form.on('error', (err) => {
		return next(new ErrorHandler(500, config.common_err_msg, err));
	});
};


module.exports = {
	fetchUserProfile,
	updateUserProfile,
	changePassword,
};