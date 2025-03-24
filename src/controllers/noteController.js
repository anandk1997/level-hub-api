'user strict';

const { Op } = require('sequelize');
const fs = require('fs');

const db = require("../models");
const { ErrorHandler } = require('../helpers/errorhandler');
const { application_files_path, common_err_msg } = require('../../config');

const uploadDir = application_files_path;

/**
 * Save notes
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const save_notes = async (req, res, next) => {
	const request = req.body;

	try {
		const note = {
			title				: request.title,
			description	: request.description,
		};
		if (request.noteId) {
			const noteId = parseInt(request.noteId);
			const result = await db.notes.update(note, { where: { id: noteId } });
			return res.status(200).json({ success: true, message: 'Note updated successfully!', response: result });
		} else {
			const result = await db.notes.create(note);
			return res.status(201).json({ success: true, message: 'Note created successfully!', response: result });
		}
	} catch (error) {
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
 * Fetch notes listing
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const get_notes = async (req, res, next) => {
	const request = {
		orderBy			: (req.body.orderBy !== undefined  && req.body.orderBy !== "") ? req.body.orderBy : 'id',
		order				: (req.body.order !== undefined && req.body.order !== "") ? req.body.order : 'ASC',
		pageSize		: (req.body.pageSize !== undefined) ? req.body.pageSize : 10,
		pageOffset 	: (req.body.pageOffset !== undefined && req.body.pageOffset !== null) ? req.body.pageOffset : 0,
		searchText 	: (req.body.searchText !== undefined) ? req.body.searchText : '',
	};

	let order = [request.orderBy, request.order];

	const searchColumns = ['id', 'title', 'description', 'createdAt'];

	let likeSearch = {};
	if (request.searchText !== '') {
		const likeColumns = searchColumns.map(column => {
			return { [column]: { [Op.like]: '%' + request.searchText + '%' } };
		});
		likeSearch = { [Op.or]: likeColumns };
	}

	try {
		let result = await db.notes.findAndCountAll({
			// attributes: ['id', 'user_id', 'order_number', 'total_quantity', 'subtotal', 'tax', 'discount', 'total_price', 'order_status', 'createdAt', [fn('COUNT', col('order_products.id')), 'product_count'] ],
			where: { ...likeSearch },
			// group: ['id'],
			order: [order],
			offset: request.pageOffset,
			limit: request.pageSize,
			subQuery: false,
		});
		return res.json({ success: true, message: 'Notes fetched successfully!', data: result });
	} catch (error) {
		return next(new ErrorHandler(500, common_err_msg, error));
	}
};

/**
 * Fetch note details
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 * @returns {JSON}
 */
const get_note_details = async (req, res, next) => {
	const noteId = req.params.id;

	try {
		let result = await db.notes.findOne({
			where: { id: noteId },
		});
		return res.json({ success: true, message: 'Notes details fetched successfully!', data: { noteDetails: result } });
	} catch (error) {
		return next(new ErrorHandler(500, common_err_msg, error));
	}
};


/**
 * Delete product from cart
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const delete_notes = async (req, res, next) => {
	const request = req.body;
	if (!request.deleteIds) { next(new ErrorHandler(400, 'Missing delete IDs')); }

	try {
		const result = await db.notes.destroy({ where: { id: { [Op.in]: request.deleteIds } } });
		return res.json({ success: true, message: 'Notes deleted successfully!', result });
	} catch (error) {
		return next(new ErrorHandler(500, common_err_msg, error));
	}
};


module.exports = {
	get_notes,
	save_notes,
	get_note_details,
	delete_notes
};