'use strict';

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculate level from target vs current XP
 *
 * @param {number} targetXP
 * @param {number} currentXP
 * @returns {number}
 */
const calculateLevel = (targetXP, currentXP) => {
  return targetXP && currentXP ? Math.floor(currentXP / targetXP) : 0;
};

/**
 * Calculate the distance between two coordinates
 * 
 * @param {Object} coord1
 * @param {number} coord1.latitude
 * @param {number} coord1.longitude
 * @param {Object} coord2
 * @param {number} coord2.latitude
 * @param {number} coord2.longitude
 * @returns {number}
 */
const calcDistanceFromLatLon = (coord1, coord2) => {
  if ((coord1.latitude == coord2.latitude) && (coord1.longitude == coord2.longitude)) {
		return 0;
	}
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(coord2.latitude - coord1.latitude);  // deg2rad below
  const dLon = deg2rad(coord2.longitude - coord1.longitude); 
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.latitude)) * Math.cos(deg2rad(coord2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in km
  return roundOffNumber(d, 2);
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180)
};

const roundOffNumber = (value, precision = 2) => {
  return parseFloat(value.toFixed(precision));
};

module.exports = {
  generateOtp,
  calculateLevel,
};
