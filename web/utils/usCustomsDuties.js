/**
 * US Customs Duties Calculator
 * Calculates duties and tariffs for US shipments starting August 29th, 2025
 * Based on new regulations eliminating the $800 de minimis threshold
 */

// UK to US baseline tariff rate (effective August 29, 2025)
const UK_BASELINE_TARIFF_RATE = 10; // 10% on all UK goods to US

// HTS Code for jigsaw puzzles (classified as toys)
const PUZZLE_HTS_CODE = {
  code: '9503.00.00', // Toys - includes jigsaw puzzles
  dutyRate: UK_BASELINE_TARIFF_RATE,
  description: 'Jigsaw puzzles and educational toys'
};

// Admin fee for duties processing (£0.50)
const ADMIN_FEE_GBP = 0.50;

// Effective date for new tariffs
const TARIFF_EFFECTIVE_DATE = new Date('2025-08-29');

/**
 * Calculates US customs duties for a given order
 * @param {Array} items - Array of line items from the order
 * @param {number} totalValue - Total value of the order in original currency
 * @param {string} currency - Order currency (GBP, USD, etc.)
 * @returns {Object} Duties calculation result
 */
export function calculateUSCustomsDuties(items, totalValue, currency = 'GBP') {
  try {
    // ALL shipments to US now require duties (de minimis threshold eliminated)
    let totalDuties = 0;
    const breakdown = [];

    // Calculate duties for each item
    items.forEach(item => {
      const dutyInfo = calculateItemDuty(item, currency);
      totalDuties += dutyInfo.duty;
      breakdown.push(dutyInfo);
    });

    // Add admin fee (always applied when duties are calculated)
    const adminFeeInOrderCurrency = convertFromGBP(ADMIN_FEE_GBP, currency);
    const totalCharges = totalDuties + adminFeeInOrderCurrency;

    return {
      dutyRequired: true,
      totalDuties: Math.round(totalDuties * 100) / 100,
      adminFee: Math.round(adminFeeInOrderCurrency * 100) / 100,
      totalCharges: Math.round(totalCharges * 100) / 100,
      tariffRate: UK_BASELINE_TARIFF_RATE,
      breakdown,
      currency,
      effectiveDate: '2025-08-29',
      htsCode: PUZZLE_HTS_CODE.code,
      explanation: 'New US regulations eliminate the $800 duty-free threshold. All shipments from UK now subject to 10% tariff.'
    };

  } catch (error) {
    console.error('Error calculating US customs duties:', error);
    return {
      error: true,
      message: 'Unable to calculate duties at this time',
      dutyRequired: false,
      totalDuties: 0,
      adminFee: 0,
      totalCharges: 0
    };
  }
}

/**
 * Calculates duty for a single item
 * @param {Object} item - Line item object
 * @param {string} currency - Order currency
 * @returns {Object} Item duty calculation
 */
function calculateItemDuty(item, currency) {
  const itemTotalValue = (item.price || 0) * (item.quantity || 1);
  
  // Calculate 10% duty on item value
  const dutyAmount = (itemTotalValue * UK_BASELINE_TARIFF_RATE) / 100;

  return {
    productTitle: item.title || item.name || 'Unknown Product',
    quantity: item.quantity || 1,
    unitPrice: item.price || 0,
    totalValue: itemTotalValue,
    htsCode: PUZZLE_HTS_CODE.code,
    dutyRate: UK_BASELINE_TARIFF_RATE,
    duty: Math.round(dutyAmount * 100) / 100,
    currency
  };
}

/**
 * Currency conversion utilities
 * Note: In production, you should use real-time exchange rates from a reliable API
 */
const EXCHANGE_RATES = {
  'GBP_TO_USD': 1.27,
  'EUR_TO_USD': 1.09,
  'CAD_TO_USD': 0.74,
  'AUD_TO_USD': 0.67
};

function convertFromGBP(amount, toCurrency) {
  if (toCurrency === 'GBP') return amount;
  
  // Convert GBP to USD first, then to target currency if needed
  const usdAmount = amount * EXCHANGE_RATES.GBP_TO_USD;
  
  if (toCurrency === 'USD') return usdAmount;
  
  const rate = EXCHANGE_RATES[`${toCurrency}_TO_USD`];
  if (!rate) {
    console.warn(`Exchange rate not found for ${toCurrency}, using GBP amount`);
    return amount;
  }
  
  return usdAmount / rate;
}

/**
 * Formats currency for display
 * @param {number} amount 
 * @param {string} currency 
 * @returns {string}
 */
function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Checks if duties are required for a US shipment
 * @param {Date} shipDate - Intended ship date
 * @returns {boolean}
 */
export function isDutiesRequired(shipDate = new Date()) {
  return shipDate >= TARIFF_EFFECTIVE_DATE;
}

/**
 * Gets a user-friendly explanation of duties for customers
 * @param {Object} dutiesCalculation - Result from calculateUSCustomsDuties
 * @returns {string}
 */
export function getDutiesExplanation(dutiesCalculation) {
  if (!dutiesCalculation.dutyRequired) {
    return dutiesCalculation.reason || "No duties required for this shipment.";
  }

  let explanation = `Due to new US import regulations effective August 29, 2025, all shipments from the UK to the US are now subject to a 10% customs duty. `;
  
  explanation += `Your order includes:
• Customs duty: ${formatCurrency(dutiesCalculation.totalDuties, dutiesCalculation.currency)} (10% of order value)
• Processing fee: ${formatCurrency(dutiesCalculation.adminFee, dutiesCalculation.currency)}
• Total additional charges: ${formatCurrency(dutiesCalculation.totalCharges, dutiesCalculation.currency)}`;
  
  explanation += `\n\nWe're switching to Royal Mail PDDP (Postage Duties Delivery Paid) to handle this automatically - no surprises or additional payments on delivery!`;

  return explanation;
}

/**
 * Creates a line item for duties to be added to Shopify order
 * @param {Object} dutiesCalculation - Result from calculateUSCustomsDuties
 * @returns {Object} Line item object for Shopify
 */
export function createDutiesLineItem(dutiesCalculation) {
  if (!dutiesCalculation.dutyRequired || dutiesCalculation.totalCharges <= 0) {
    return null;
  }

  return {
    title: 'US Customs Duties & Processing Fee',
    price: dutiesCalculation.totalCharges,
    quantity: 1,
    taxable: false, // Duties themselves are not typically subject to additional tax
    requires_shipping: false,
    properties: {
      'Duty Rate': `${UK_BASELINE_TARIFF_RATE}%`,
      'HTS Code': PUZZLE_HTS_CODE.code,
      'Effective Date': '2025-08-29',
      'Customs Duty': formatCurrency(dutiesCalculation.totalDuties, dutiesCalculation.currency),
      'Processing Fee': formatCurrency(dutiesCalculation.adminFee, dutiesCalculation.currency)
    }
  };
}

/**
 * Validates if a shipping address is in the US
 * @param {Object} shippingAddress - Shopify shipping address object
 * @returns {boolean}
 */
export function isUSAddress(shippingAddress) {
  if (!shippingAddress) return false;
  
  const countryCode = (shippingAddress.country_code || shippingAddress.country || '').toUpperCase();
  return countryCode === 'US' || countryCode === 'USA' || countryCode === 'UNITED STATES';
}

export default {
  calculateUSCustomsDuties,
  isDutiesRequired,
  getDutiesExplanation,
  createDutiesLineItem,
  isUSAddress,
  UK_BASELINE_TARIFF_RATE,
  ADMIN_FEE_GBP,
  TARIFF_EFFECTIVE_DATE
};