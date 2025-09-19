'use strict';

// const dayjs = require('dayjs');
const { db } = require('../db');
const logger = require('../helpers/logger');

const { stripe, planHelper } = require('../helpers');
const {
  PLANS_FETCH_SUCCESS,
  PLANS_DEFAULT_SUCCESS,
  ROLE_NOT_EXISTS,
  ROLE_NOT_EXISTS_EXCEPTION,
  PLANS_CREATE_SUCCESS,
  PLAN_EXISTS,
  PLAN_EXISTS_EXCEPTION,
  PLAN_FETCH_SUCCESS,
  PLAN_DOESNT_EXISTS,
  PLAN_DOESNT_EXCEPTION,
  PLAN_ACTIVATE_SUCCESS,
  PLAN_DEACTIVATE_SUCCESS,
  PLANS_UPDATE_SUCCESS,
  PLANS_UPDATE_ERROR,
} = require('../messages');
const {
  ROLES: {
    GYM_OWNER,
    COACH_OWNER,
    PARENT_OWNER,
    INDIVIDUAL_OWNER,
  }
} = require('../constants');
const { CURRENCY } = require('../../config');
const { calculatePercentDiscount, calculateCentPrice } = require('../utils/formatter');

// const { Op, fn, col, where, literal, QueryTypes } = db.Sequelize;

/**
 * Fetch all plans with role filter
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchAllPlans = async (req, res, next) => {
  try {
    const { role, page = 1, pageSize = 10, sortBy = 'name', sort = 'ASC' } = req.query;
    const pageOffset = pageSize * (page - 1);
	  const order = [sortBy, sort];

    let where = {};
    if (role) {
      const roleInfo = await db.Roles.findOne({
        attributes: ['id', 'name'],
        where: { name: role }
      });
      where = { ...where, roleId: roleInfo?.id ? roleInfo?.id : undefined }
    }
    // const plans = await stripe.plans.list({ limit: 100 });
    // const products = await stripe.products.list({ limit: 100 });
    const { count, rows } = await db.Plans.findAndCountAll({
      attributes: ['id', 'roleId', 'tier', 'name', 'maxUsers', 'monthlyPrice', 'yearlyPrice', 'yearlyDiscount', 'isActive', 'isFreemium'],
      where,
      limit: pageSize,
      offset: pageOffset,
      order: [order],
    });
    
    return res.response(PLANS_FETCH_SUCCESS, { count, rows });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch all plans with role filter
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createPlan = async (req, res, next) => {
  try {
    const request = req.body;
    const planName = request?.name?.trim();
    const planExists = await planHelper.checkIfPlanExists(planName);
    if (planExists) { return res.response(PLAN_EXISTS, {}, 409, PLAN_EXISTS_EXCEPTION, false); }

    const roleInfo = await db.Roles.findOne({
      attributes: ['id', 'name'],
      where: { name: request?.role }
    });
    if (!roleInfo?.id) { return res.response(ROLE_NOT_EXISTS, {}, 400, ROLE_NOT_EXISTS_EXCEPTION, false); }

    const monthlyPrice = request?.monthlyPrice ? parseFloat(request?.monthlyPrice) : 0;
    const yearlyPrice = request?.yearlyPrice ? parseFloat(request?.yearlyPrice) : 0;
    const minUsers = request?.minUsers ? parseInt(request?.minUsers) : 0;
    const maxUsers = request?.maxUsers ? parseInt(request?.maxUsers) : 0;
    const yearlyDiscount = calculatePercentDiscount(monthlyPrice, yearlyPrice);

    const stripeProduct = {
      product: {
        name: planName,
        description: request?.description?.trim(),
        metadata: {
          isFreemium: false,
          role: request?.role,
          roleId: roleInfo?.id,
          maxUsers,
          minUsers,
          yearlyDiscount,
        }
      },
      price: {
        monthly: {
          nickname: `${planName} | Monthly`,
          unit_amount: calculateCentPrice(monthlyPrice), // In cents
          currency: CURRENCY,
          recurring: { interval: 'month' },
          metadata: {
            role: request?.role,
            roleId: roleInfo?.id,
          }
        },
        yearly: {
          nickname: `${planName} | Yearly`,
          unit_amount: calculateCentPrice(yearlyPrice), // In cents
          currency: CURRENCY,
          recurring: { interval: 'year' },
          metadata: {
            role: request?.role,
            roleId: roleInfo?.id,
          }
        },
      }
    };

    const priceProductDetails = await createStripeProductAndPrice(stripeProduct.product, stripeProduct.price.monthly, stripeProduct.price.yearly);
    const productDetails = {
      roleId: roleInfo?.id,
      tier: planName,
      name: planName,
      description: request?.description?.trim(),
      minUsers,
      maxUsers,
      monthlyPrice,
      yearlyPrice,
      yearlyDiscount,
      currency: CURRENCY,
      stripeProductId: priceProductDetails?.sProduct?.id,
      stripePriceIdMonthly: priceProductDetails?.sPrices?.month?.id,
      stripePriceIdYearly: priceProductDetails?.sPrices?.year?.id,
      isActive: true,
      isFreemium: false,
    };

    try {
      const result = await db.sequelize.transaction(async (t) => {
        const product = await createProduct(productDetails, t);
        await deactivateFreeProduct(roleInfo?.id, t);
        return product;
      });
    } catch (error) {
      await deleteStripeProduct(productDetails?.stripeProductId, true);
      return next({ error, statusCode: 500, message: error?.message });
    }
    return res.response(PLANS_CREATE_SUCCESS);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Delete or deactivate stripe product by ID
 *
 * @param {string} productId
 * @param {boolean?} isDeleted
 * @returns {Promise<Object>}
 */
const deleteStripeProduct = async (productId, isDeleted = false) => {
  try {
    let delProduct;
    const prices = await stripe.prices.list({
      product: productId,
      active: true
    });
    if (prices?.data?.length) {
      await Promise.allSettled(
        prices?.data?.map(async (price) => deactivateStripePrice(price?.id, isDeleted, price?.nickname))
      );
    }
    try {
      delProduct = await stripe.products.del(productId);
    } catch (error) {
      delProduct = await deactivateStripeProduct(productId, isDeleted);
      console.log("ERROR in delete product : " + error?.message);
    }
    return delProduct;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * Deactivate stripe price by ID
 *
 * @param {string} priceId
 * @param {boolean?} isDeleted
 * @param {string?} nickname
 * @returns {Promise<Object>}
 */
const deactivateStripePrice = async (priceId, isDeleted = false, nickname = '') => {
  try {
    return await stripe.prices.update(
      priceId,
      {
        nickname: isDeleted ? `DELETED | ${nickname}` : undefined,
        active: false,
        metadata: { isDeleted }
      }
    );
  } catch (error) {
    console.error("ERROR in deactivateStripePrice: " + error);
    logger.error(error?.message);
    throw error;
  }
};

/**
 * Deactivate stripe product by product ID
 *
 * @param {string} prodId
 * @param {boolean?} isDeleted
 * @param {string?} name
 * @returns {Promise<Object>}
 */
const deactivateStripeProduct = async (prodId, isDeleted = false, name = '') => {
  try {
    if (isDeleted) {
      const productInfo = await stripe.products.retrieve(prodId);
      name = productInfo?.name;
    }
    return await stripe.products.update(
      prodId,
      {
        name: isDeleted ? `DELETED | ${name}` : undefined,
        active: false,
        metadata: { isDeleted }
      }
    );
  } catch (error) {
    console.error("ERROR in deactivateStripeProduct: " + error);
    logger.error(error?.message);
    throw error;
  }
};

/**
 * Create price for a given product in stripe
 *
 * @param {string} productId
 * @param {Object} price
 * @returns {Promise<Object>}
 */
const createStripePrice = async (productId, price) => {
  return await stripe.prices.create({
    product: productId,
    ...price
  });
};

/**
 * Create stripe product and monthly and yearly prices
 *
 * @param {Object} productData
 * @param {Object} monthlyPriceData
 * @param {Object?} yearlyPriceData
 * @returns {Promise<Object>}
 */
const createStripeProductAndPrice = async (productData, monthlyPriceData, yearlyPriceData = null) => {
  try {
    const sPrices = {};
    const sProduct = await stripe.products.create(productData);

    try {
      const pricePromise = [];
      if (monthlyPriceData) { pricePromise.push(createStripePrice(sProduct?.id, monthlyPriceData)); }
      if (yearlyPriceData) { pricePromise.push(createStripePrice(sProduct?.id, yearlyPriceData)); }
      const prices = await Promise.all(pricePromise);

      prices?.forEach(price => {
        sPrices[price?.recurring?.interval] = price;
      });
    } catch (error) {
      console.error("Error in createStripePrice : ", error);
      await deleteStripeProduct(sProduct?.id, true);
      throw new Error("Rollback completed", { cause: error });
    }
    return { sProduct, sPrices };
  } catch (error) {
    console.log("ERROR in createStripeProductAndPrice : ", error);
    throw error;
  }
};

/**
 * Create a new product in DB
 *
 * @param {Object} product
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<Object>}
 */
const createProduct = async (product, t) => {
  try {
    return await db.Plans.create(product, { transaction: t });
  } catch (error) {
    console.log("ERROR in createProduct: ", error);
    throw error;
  }
};

/**
 * Deactivte a product from stripe and DB
 *
 * @param {Object} product
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<Object>}
 */
const deactivateFreeProduct = async (roleId, t) => {
  try {
    return await db.Plans.update(
      { isActive: false },
      { where: { isFreemium: true, roleId } },
      { transaction: t }
    )
    /* const freePlan = await db.Plans.findOne({
      attributes: ['id', 'roleId', 'name', 'stripeProductId', 'stripePriceIdMonthly', 'isActive', 'isActive'],
      where: { isFreemium: true, roleId } },
      { transaction: t }
    );
    if (!freePlan?.id) { return false; }
    if (freePlan?.stripeProductId) {
      await deleteStripeProduct(freePlan?.stripeProductId)
    }
    await freePlan.update(
      { isActive: false },
      { transaction: t }
    )
    return freePlan; */
  } catch (error) {
    console.log("ERROR in deactivateFreeProduct: ", error);
    throw error;
  }
};

/**
 * Create default freemium products for the first time
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createFreemiumPlansStripe = async (req, res, next) => {
  try {
   const roles = await db.Roles.findAll({
      attributes: ['id', 'name'],
      where: { name: [INDIVIDUAL_OWNER, PARENT_OWNER, COACH_OWNER, GYM_OWNER] }
    });
    const roleIds = {};
    roles.forEach(role => {
      roleIds[role.name] = role.id
    });

    const defaultData = {
      individual: {
        product: {
          name: `Freemium | INDIVIDUAL`,
          description: 'Access to all freemium features.',
          metadata: {
            role: INDIVIDUAL_OWNER,
            roleId: roleIds[INDIVIDUAL_OWNER],
            isFreemium: true,
            maxUsers: 1,
            minUsers: 1,
            yearlyDiscount: 0,
          }
        },
        price: {
          monthly: {
            nickname: `Freemium | INDIVIDUAL | Monthly`,
            unit_amount: 0, // In cents
            currency: CURRENCY,
            recurring: { interval: 'month' },
            metadata: {
              role: INDIVIDUAL_OWNER,
              roleId: roleIds[INDIVIDUAL_OWNER],
            }
          }
        }
      },
      parent: {
        product: {
          name: `Freemium | PARENT`,
          description: 'Access to all freemium features.',
          metadata: {
            role: PARENT_OWNER,
            isFreemium: true,
            roleId: roleIds[PARENT_OWNER],
            maxUsers: 10,
            minUsers: 1,
            yearlyDiscount: 0,
          }
        },
        price: {
          monthly: {
            nickname: `Freemium | PARENT | Monthly`,
            unit_amount: 0, // In cents
            currency: CURRENCY,
            recurring: { interval: 'month' },
            metadata: {
              role: PARENT_OWNER,
              roleId: roleIds[PARENT_OWNER],
            }
          }
        }
      },
      coach: {
        product: {
          name: `Freemium | COACH`,
          description: 'Access to all freemium features.',
          metadata: {
            role: COACH_OWNER,
            isFreemium: true,
            roleId: roleIds[COACH_OWNER],
            maxUsers: 10,
            minUsers: 1,
            yearlyDiscount: 0,
          }
        },
        price: {
          monthly: {
            nickname: `Freemium | COACH | Monthly`,
            unit_amount: 0, // In cents
            currency: CURRENCY,
            recurring: { interval: 'month' },
            metadata: {
              role: COACH_OWNER,
              roleId: roleIds[COACH_OWNER],
            }
          }
        }
      },
      gym: {
        product: {
          name: `Freemium | GYM`,
          description: 'Access to all freemium features.',
          metadata: {
            role: GYM_OWNER,
            isFreemium: true,
            roleId: roleIds[GYM_OWNER],
            maxUsers: 10,
            minUsers: 1,
            yearlyDiscount: 0,
          }
        },
        price: {
          monthly: {
            nickname: `Freemium | GYM | Monthly`,
            unit_amount: 0, // In cents
            currency: CURRENCY,
            recurring: { interval: 'month' },
            metadata: {
              role: GYM_OWNER,
              roleId: roleIds[GYM_OWNER],
            }
          }
        }
      }
    };
    const freeIndividualProduct = await createStripeProductAndPrice(defaultData.individual.product, defaultData.individual.price.monthly);
    const freeParentProduct = await createStripeProductAndPrice(defaultData.parent.product, defaultData.parent.price.monthly);
    const freeCoachProduct = await createStripeProductAndPrice(defaultData.coach.product, defaultData.coach.price.monthly);
    const freeGymProduct = await createStripeProductAndPrice(defaultData.gym.product, defaultData.gym.price.monthly);
    return res.response(PLANS_DEFAULT_SUCCESS, { freeIndividualProduct, freeParentProduct, freeCoachProduct, freeGymProduct });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Create default freemium products for the first time in databse
 * USE ONLY IF FREEMIUM PRODUCT EXISTS IN STRIPE
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createFreemiumPlanDB = async (req, res, next) => {
  try {
    const userInfo = req.user;
    const freeDBPlans = await db.Plans.findAll({
      attributes: ['id', 'isFreemium'],
      where: {
        isFreemium: true
      }
    });
    if (freeDBPlans?.length) { return res.response('Freemium plans already exists', freeDBPlans, 400, null, false) }
    
    const freemiumProducts = await stripe.products.search({
      query: 'active:\'true\' AND metadata[\'isFreemium\']:\'true\'',
      expand: ['data.price']
    });

    if (!freemiumProducts?.data?.length) { return res.response('First add products in Stripe', {}, 400, null, false); }
    
    const productPrices = await Promise.all(
      freemiumProducts?.data?.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          type: 'recurring',
          recurring: {
            interval: 'month'
          }
        });
        const monthlyPrice = prices?.data?.length ? prices?.data[0]: {};
        return {
          roleId: product?.metadata?.roleId ? parseInt(product?.metadata?.roleId) : null,
          tier: "Freemium",
          name: product?.name,
          description: product?.description,
          minUsers: product?.metadata?.minUsers ? parseInt(product?.metadata?.minUsers) : null,
          maxUsers: product?.metadata?.maxUsers ? parseInt(product?.metadata?.maxUsers) : null,
          monthlyPrice: monthlyPrice?.unit_amount ? parseInt(monthlyPrice?.unit_amount) : 0,
          yearlyPrice: 0,
          yearlyDiscount: 0,
          currency: monthlyPrice?.currency || CURRENCY,
          stripeProductId: product?.id,
          stripePriceIdMonthly: monthlyPrice?.id,
          stripePriceIdYearly: null,
          isActive: product?.active,
          isFreemium: product?.metadata?.isFreemium,
        };
      })
    );
    const result = await db.Plans.bulkCreate(productPrices);

    return res.response(PLANS_DEFAULT_SUCCESS, { result, productPrices, freemiumProducts });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch plan details
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchPlanDetails = async (req, res, next) => {
  try {
    const planId = parseInt(req?.params?.id);
    const plan = await db.Plans.findByPk(planId, {
      attributes: ['id', 'roleId', 'tier', 'name', 'description', 'minUsers', 'maxUsers', 'monthlyPrice', 'yearlyPrice', 'yearlyDiscount', 'currency', 'isActive', 'isFreemium']
    });
    return res.response(PLAN_FETCH_SUCCESS, plan);

  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Activate/Deactivate plan from DB
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const tooglePlan = async (req, res, next) => {
  try {
    const planId = parseInt(req?.params?.id), status = req?.params?.status;
    const planDetails = await db.Plans.findOne({
      attributes: ['id', 'roleId', 'name', 'maxUsers', 'isActive', 'isFreemium'],
      where: { id: planId },
    });
		if (!planDetails?.id) { return res.response(PLAN_DOESNT_EXISTS, {}, 401, PLAN_DOESNT_EXCEPTION, false); }

    const result = await db.sequelize.transaction(async (t) => {
      const { isFreemium, roleId } = planDetails;
      if (status === 'activate') {
        const toDisable = await db.Plans.update(
          { isActive: false },
          { where: { roleId, isActive: true, isFreemium: !isFreemium } },
          { transaction: t }
        );
      }

      return await planDetails.update(
        { isActive: status === 'activate' ? true : false },
        { where: { id: planId } },
        { transaction: t }
      );
    });
    return res.response(status === 'activate' ? PLAN_ACTIVATE_SUCCESS : PLAN_DEACTIVATE_SUCCESS, result);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Update plan and prices in DB and stripe
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updatePlan = async (req, res, next) => {
  try {
    const request = req.body, planId = parseInt(req.params.id);
    const planName = request?.name?.trim();
    const planExists = await planHelper.checkIfPlanExists(planName, undefined, planId);
    if (planExists) { return res.response(PLAN_EXISTS, {}, 409, PLAN_EXISTS_EXCEPTION, false); }

    const roleInfo = await db.Roles.findOne({
      attributes: ['id', 'name'],
      where: { name: request?.role }
    });
    if (!roleInfo?.id) { return res.response(ROLE_NOT_EXISTS, {}, 400, ROLE_NOT_EXISTS_EXCEPTION, false); }

    request.monthlyPrice = parseFloat(request?.monthlyPrice);
    request.yearlyPrice = parseFloat(request?.yearlyPrice);
    request.minUsers = parseInt(request?.minUsers);
    request.maxUsers = parseInt(request?.maxUsers);

    const originalPlan = await db.Plans.findOne({
      where: { id: planId },
    });
		if (!originalPlan?.id) { return res.response(PLAN_DOESNT_EXISTS, {}, 401, PLAN_DOESNT_EXCEPTION, false); }
    const yearlyDiscount = calculatePercentDiscount(request.monthlyPrice, request.yearlyPrice);

    // Evaluate if it's a product change, monthly or yearly price change
    const planChanges = await planHelper.evaluateChanges({ roleId: roleInfo?.id, ...request }, originalPlan);
    const {
      sProduct,
      sMonthlyPrice,
      sYearlyPrice
    } = await planHelper.prepareProdPrice(planChanges, request, roleInfo?.id, yearlyDiscount);

    // return res.json({ sProduct, sMonthlyPrice, sYearlyPrice, planChanges, originalPlan, planId, planExists, request });
    let newMPrice, newYPrice;
    if (sProduct.constructor === Object && Object.keys(sProduct).length) {
      const updatedProd = await stripe.products.update(originalPlan.stripeProductId, sProduct);
    }
    if (planChanges.name && !planChanges.monthlyPrice && sMonthlyPrice.nickname) {
      const updatedMPrice = await stripe.prices.update(originalPlan.stripePriceIdMonthly, sMonthlyPrice);
    }
    if (planChanges.name && !planChanges.yearlyPrice && sYearlyPrice.nickname) {
      const updatedYPrice = await stripe.prices.update(originalPlan.stripePriceIdYearly, sYearlyPrice);
    }
    if (planChanges.monthlyPrice && sMonthlyPrice?.unit_amount)  {
      const disbaledMPrice = await deactivateStripePrice(originalPlan.stripePriceIdMonthly, true, sMonthlyPrice?.nickname);
      newMPrice = await createStripePrice(originalPlan.stripeProductId, sMonthlyPrice);
    }
    if (planChanges.yearlyPrice && sYearlyPrice?.unit_amount)  {
      const disbaledYPrice = await deactivateStripePrice(originalPlan.stripePriceIdYearly, true, sYearlyPrice?.nickname);
      newYPrice = await createStripePrice(originalPlan.stripeProductId, sYearlyPrice);
    }
    const productDetails = {
      roleId: planChanges.role ? roleInfo?.id : undefined,
      tier: planChanges.name ? planName :  undefined,
      name: planChanges.name ? planName :  undefined,
      description: request?.description?.trim(),
      minUsers: request.minUsers,
      maxUsers: request.maxUsers,
      monthlyPrice: request.monthlyPrice,
      yearlyPrice: request.yearlyPrice,
      yearlyDiscount,
      currency: CURRENCY,
      stripePriceIdMonthly: newMPrice?.id ? newMPrice.id : undefined,
      stripePriceIdYearly: newYPrice?.id ? newYPrice.id : undefined,
    };

    const updatedPlan = await db.Plans.update(productDetails, { where: { id: planId } });
    const success = updatedPlan?.length && updatedPlan[0];
    // return res.json({ updatedPlan, productDetails, sProduct, sMonthlyPrice, sYearlyPrice, planChanges, originalPlan, planId, planExists, request });
    return res.response(success ? PLANS_UPDATE_SUCCESS : PLANS_UPDATE_ERROR, success, success ? 200 : 500, null, success);
    
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Sync plans from stripe to DB
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const syncPlansFromStripe = async (req, res, next) => {
  try {
    const results = await planHelper.syncStripeProducts();
    return res.response(PLANS_CREATE_SUCCESS, results);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

module.exports = {
  fetchAllPlans,
  createFreemiumPlansStripe,
  createPlan,
  createFreemiumPlanDB,
  fetchPlanDetails,
  tooglePlan,
  updatePlan,
  syncPlansFromStripe
}
