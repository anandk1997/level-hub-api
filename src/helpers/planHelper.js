'user strict';

const { CURRENCY } = require('../../config');
const { db } = require('../db');
const { calculateDollarPrice, calculateCentPrice, calculatePercentDiscount } = require('../utils');
const stripe = require('./stripeHelper');
/* const {
	ROLES: {
		PARENT_OWNER,
		COACH_OWNER,
		GYM_OWNER
	},
	USER_ASSOCIATIONS: {
		PARENT_CHILD,
		ORGANIZATION_USER,
		GYM_COACH
	}
} = require('../constants');

 */
const { Op } = db.Sequelize;

/**
 * Check if plan exists by given field
 * 
 * @param {string} value
 * @param {string?} field
 * @param {string?} planId
 * @param {boolean?} next
 */
const checkIfPlanExists = async (value, field = "name", planId = null, returnResult = false) => {
	try {
		let where = { [field]: value, isActive: true };
		if (planId) {
			where = { ...where, id: { [Op.ne]: planId } };
		}
		const result = await db.Plans.findOne({ where });
		if (returnResult) { return result; }
		return result ? true : false;
	} catch (error) {
		throw error;
	}   
};

/**
 * Evaluate the changes in the plan while updating
 *
 * @param {Object} newValues
 * @param {Object} orgValues
 * @returns {Object} planChanges
 */
const evaluateChanges =  async (newValues, orgValues) => {
	try {
		const productFields = ['name', 'description'];
		const productMetaFields = ['maxUsers', 'minUsers'];
		const planChanges = {
			product: false,
			productMeta: false,
			name: false,
			role: false,
			monthlyPrice: false,
			yearlyPrice: false,
		};
		productFields.forEach(field => {
			if (typeof newValues[field] === 'string' && typeof orgValues[field] === 'string') {
				newValues[field] = newValues[field]?.trim();
				orgValues[field] = orgValues[field]?.trim();
			}
			if (newValues[field] !== orgValues[field]) {
				planChanges.product = true;
			}
			if (newValues.name !== orgValues.name) {
				planChanges.name = true;
			}
		});
		productMetaFields.forEach(field => {
			if (typeof newValues[field] === 'number' && typeof orgValues[field] === 'number') {
				newValues[field] = parseInt(newValues[field]);
				orgValues[field] = parseInt(orgValues[field]);
			}
			if (newValues[field] !== orgValues[field]) {
				planChanges.productMeta = true;
			}
		});
		if (newValues.roleId !== orgValues.roleId) {
			planChanges.role = true;
		}
		if (newValues.monthlyPrice !== orgValues.monthlyPrice) {
			planChanges.monthlyPrice = true;
		}
		if (newValues.yearlyPrice !== orgValues.yearlyPrice) {
			planChanges.yearlyPrice = true;
		}
		return planChanges;
	} catch (error) {
		throw error;
	}
};

/**
 * Prepare the stripe product and price object based on changes required in update
 *
 * @param {Object} planChanges
 * @param {Object} plan
 * @param {Number} role
 * @param {Number} yearlyDiscount
 * @returns {Object}
 */
const prepareProdPrice = async (planChanges, plan, roleId, yearlyDiscount) => {
  try {
    let sProduct, sMonthlyPrice, sYearlyPrice;
    const planName = plan?.name?.trim();
    if (planChanges?.product) {
      sProduct = {
        ...sProduct,
        name: planName,
        description: plan?.description,
      }
    }
    if (planChanges?.productMeta) {
      sProduct = {
        ...sProduct,
        metadata: {
          ...sProduct?.metadata,
          maxUsers: plan?.maxUsers,
          minUsers: plan?.minUsers,
          // yearlyDiscount: originalPlan.yearlyDiscount
        },
      };
    }
    if (planChanges.role) {
      sProduct = {
        ...sProduct,
        metadata: {
          ...sProduct?.metadata,
          role: plan?.role,
          roleId,
        },
      };

      sMonthlyPrice = {
        ...sMonthlyPrice,
        metadata: {
          ...sMonthlyPrice?.metadata,
          role: plan?.role,
          roleId,
        }
      };
      sYearlyPrice = {
        ...sYearlyPrice,
        metadata: {
          ...sMonthlyPrice?.metadata,
          role: plan?.role,
          roleId,
        }
      };
    }
    if (planChanges.name) {
      sMonthlyPrice = { ...sMonthlyPrice, nickname: `${planName} | Monthly` };
      sYearlyPrice = { ...sYearlyPrice, nickname: `${planName} | Yearly` };
    }

    if (planChanges.monthlyPrice) {
      sMonthlyPrice = {
        nickname: `${planName} | Monthly`,
        unit_amount: calculateCentPrice(plan.monthlyPrice), // In cents
        currency: CURRENCY,
        recurring: { interval: 'month' },
        metadata: {
          role: plan?.role,
          roleId,
        }
      };
      sProduct = { ...sProduct, metadata: { ...sProduct?.metadata, yearlyDiscount } };
    }
    if (planChanges.yearlyPrice) {
      sYearlyPrice = {
        nickname: `${planName} | Yearly`,
        unit_amount: calculateCentPrice(plan.yearlyPrice), // In cents
        currency: CURRENCY,
        recurring: { interval: 'year' },
        metadata: {
          role: plan?.role,
          roleId,
        }
      };
      sProduct = { ...sProduct, metadata: { ...sProduct?.metadata, yearlyDiscount } };
    }
    return { sProduct, sMonthlyPrice, sYearlyPrice };
  } catch (error) {
    throw error;
  }
};

/**
 * Find out the monhtly or yearly price from list of prices
 *
 * @param {Object[]} priceListData
 * @param {string} interval
 * @returns {Object}
 */
const findPriceForInterval = (priceListData, interval) => {
	const filtered = priceListData
		.filter(p => p.recurring && p.recurring.interval === interval)
		.filter(p => (p.currency || '').toLowerCase() === CURRENCY.toLowerCase())
		.filter(p => p?.metadata?.isDeleted != false);

	if (filtered.length === 0) return null;
	// choose smallest unit_amount (Stripe uses cents)
	filtered.sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0));
	return filtered[0];
}

/**
 * Handles syncing of products from stripe to DB
 *
 * @returns {Object}
 */
const syncStripeProducts = async () => {
  const summary = [];
  const productList = await stripe.products.list();
  // return productList;
  for (const product of productList.data) {
    try {
      // Skip if metadata.isDeleted is set to true-ish
      const metadata = product.metadata || {};
      const isDeletedMeta = metadata.isDeleted;
      const isDeleted = (typeof isDeletedMeta === 'string' && ['true', '1', 'yes'].includes(isDeletedMeta.toLowerCase())) || isDeletedMeta === true || isDeletedMeta === 1;
      if (isDeleted) {
        summary.push({ productId: product.id, action: 'skipped', reason: 'metadata.isDeleted' });
        continue;
      }

      // get prices for product (up to 100); if more prices exist, consider pagination similarly
      const priceList = await stripe.prices.list({ product: product.id, limit: 10 });
      const prices = priceList.data || [];

      const monthlyPriceObj = findPriceForInterval(prices, 'month');
      const yearlyPriceObj = findPriceForInterval(prices, 'year');

      if (!monthlyPriceObj) {
        summary.push({ productId: product.id, action: 'skipped', reason: 'no-monthly-price' });
        continue;
      }

      const monthlyPrice = calculateDollarPrice(monthlyPriceObj.unit_amount);
      const yearlyPrice = calculateDollarPrice(yearlyPriceObj?.unit_amount);
      /* const yearlyPrice = yearlyPriceObj && typeof yearlyPriceObj.unit_amount === 'number'
        ? Number((yearlyPriceObj.unit_amount / 100).toFixed(2))
        : 0.00; */

      // roleId: prefer product.metadata.roleId else defaultRoleId
      const roleId = metadata?.roleId ? parseInt(metadata?.roleId, 10) : null;

      // Build payload
      const planPayload = {
        roleId,
        tier: product.name || 'standard',
        name: product.name,
        description: product.description || null,
        minUsers: metadata.minUsers ? parseInt(metadata.minUsers, 10) : 1,
        maxUsers: metadata.maxUsers ? parseInt(metadata.maxUsers, 10) : 1,
        monthlyPrice,
        yearlyPrice,
        yearlyDiscount: metadata.yearlyDiscount ? Number(metadata.yearlyDiscount) : 0,
        currency: (monthlyPriceObj && monthlyPriceObj.currency) || CURRENCY,
        stripeProductId: product.id,
        stripePriceIdMonthly: monthlyPriceObj ? monthlyPriceObj.id : null,
        stripePriceIdYearly: yearlyPriceObj ? yearlyPriceObj.id : null,
        isActive: product.active === true, // archived products will be false
        isFreemium: metadata.isFreemium == "true",
      };
      // summary.push({ planPayload, productId: product.id, action: 'success', monthlyPriceObj, yearlyPriceObj, product });
      // summary.push({ planPayload, productId: product.id, action: 'success' });
      // continue;

      // Upsert into DB (rely on unique stripeProductId to avoid duplicate inserts)
      // Note: upsert will insert new or update existing row.
      await db.Plans.upsert(planPayload);
      summary.push({ productId: product.id, action: 'upserted' });

    } catch (error) {
      // catch any unexpected error per-product
      summary.push({ productId: product.id, action: 'error', reason: error.message });
    }
  }

  return summary;
};


module.exports = {
	checkIfPlanExists,
	evaluateChanges,
	syncStripeProducts,
  prepareProdPrice,
};