'user strict';

const {
  Tutors,
  TutorClasses,
  TutorQualifications,
  SpokenLanguages
} = require("../models");


/**
 * Check if tutor class already exists
 * 
 * @param {string} classId 
 * @param {string} tutorId 
 * @param {string} tutorClassId 
 * @returns {boolean}
 */
const checkIfClassExists = async (classId, tutorId, tutorClassId) => {
	try {
		let where = { classId, tutorId };
		if (tutorClassId) {
			where = { ...where, _id: { $ne: tutorClassId } }
		}
		const result = await TutorClasses.findOne(where).exec();
		return result?._id ? true : false;
	} catch (error) {
		throw error;
	}   
};


/**
 * Check if tutor degree already exists
 * 
 * @param {string} degreeId 
 * @param {string} tutorId 
 * @param {string} tutorQualificationId 
 * @returns {boolean}
 */
const checkIfDegreeExists = async (degreeId, tutorId, tutorQualificationId) => {
	try {
		let where = { degreeId, tutorId };
		if (tutorQualificationId) {
			where = { ...where, _id: { $ne: tutorQualificationId } }
		}
		const result = await TutorQualifications.findOne(where).exec();
		return result?._id ? true : false;
	} catch (error) {
		throw error;
	}   
};

/**
 * Check if known language already exists
 * 
 * @param {string} languageId 
 * @param {string} tutorId 
 * @param {string} tutorLanguageId 
 * @returns {boolean}
 */
const checkIfLanguageExists = async (languageId, tutorId, tutorLanguageId) => {
	try {
		let where = { languageId, tutorId };
		if (tutorLanguageId) {
			where = { ...where, _id: { $ne: tutorLanguageId } }
		}
		const result = await SpokenLanguages.findOne(where).exec();
		return result?._id ? true : false;
	} catch (error) {
		throw error;
	}   
};

module.exports = {
  checkIfClassExists,
  checkIfDegreeExists,
  checkIfLanguageExists,
};