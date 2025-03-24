'user strict';


/**
 * Filter out cart as per product types
 * 
 * @param {Object} result 
 * @returns {Object} filteredResult
 */
const filterOutCart = async (result) => {
	const hasAll = ['city_map', 'star_map'];
	let filteredResult = {
		id: result.id,
		user_id: result.user_id,
		discount: result.discount,
		subtotal: result.subtotal,
		tax: result.tax,
		total_price: result.total_price,
		updatedAt: result.updatedAt,
		createdAt: result.createdAt,
		cart_products: []
	}
	result.cart_products.forEach((cartItem, index) => {
		const productData = cartItem.product_data ? JSON.parse(cartItem.product_data) : cartItem.product_data;
		const totalPrice = cartItem.purchaseType === "print" ? cartItem.size.price : cartItem.size.pdf_price;
		if ((hasAll.includes(cartItem.product.label) && cartItem.color && cartItem.layout && cartItem.size && cartItem.shape)
			|| (cartItem.product.label === 'coordinate_poster' && cartItem.color && cartItem.layout && cartItem.size)
			|| (cartItem.product.label === 'family_poster' && cartItem.layout && cartItem.size)
		) {
			cartItem.product_data = productData;
			filteredResult.cart_products = [ ...filteredResult.cart_products, cartItem];
			filteredResult.total_price += totalPrice;
		}
	});
	return filteredResult;
};

/**
 * Padding zeros
 * 
 * @param {*} value 
 * @param {*} paddingNumber 
 * @returns 
 */
const paddZeros = (value, paddingNumber) => {
	if (value === undefined || value === null) { return '00'; }
	paddingNumber = paddingNumber || 2;
	return value.toString().padStart(paddingNumber, '0')
};

const formatUnderscore = (text) => {
	if (!text || text === '') { return text };
	let splitText = text.split('_');
	return splitText.map((word) => word.charAt(0).toUpperCase() +  word.slice(1)).join(' ');
};

const formatCurrency = (value, deciamalPlaces) => {
	if (!value || value === '') { return value };
	deciamalPlaces = deciamalPlaces || 2;
	return value.toFixed(deciamalPlaces);
};


module.exports = {
  filterOutCart,
	paddZeros,
	formatUnderscore,
	formatCurrency,
};