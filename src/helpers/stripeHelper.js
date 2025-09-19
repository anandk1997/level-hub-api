'user strict';

const Stripe = require("stripe");
const { STRIPE_SK } = require("../../config");

/**
 * @type {import('stripe').Stripe}
 */
const stripeInstance = Stripe(STRIPE_SK);

module.exports = stripeInstance;