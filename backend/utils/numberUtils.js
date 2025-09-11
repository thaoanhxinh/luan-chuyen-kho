/**
 * Utility functions for handling decimal numbers with precision
 */

/**
 * Rounds a number to specified decimal places
 * @param {number} num - The number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} - Rounded number
 */
const roundToDecimals = (num, decimals = 2) => {
  if (isNaN(num) || num === null || num === undefined) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(parseFloat(num) * factor) / factor;
};

/**
 * Safely parses a number and rounds to 2 decimal places
 * @param {any} value - The value to parse
 * @returns {number} - Parsed and rounded number
 */
const parseAndRound = (value) => {
  return roundToDecimals(parseFloat(value || 0), 2);
};

/**
 * Calculates total amount with proper rounding
 * @param {number} quantity - Quantity
 * @param {number} price - Unit price
 * @returns {number} - Total amount rounded to 2 decimal places
 */
const calculateTotal = (quantity, price) => {
  const qty = parseAndRound(quantity);
  const prc = parseAndRound(price);
  return roundToDecimals(qty * prc, 2);
};

/**
 * Validates if a number is a valid price
 * @param {any} value - Value to validate
 * @returns {boolean} - True if valid price
 */
const isValidPrice = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && num <= 999999999999.99; // Max 12 digits with 2 decimals
};

module.exports = {
  roundToDecimals,
  parseAndRound,
  calculateTotal,
  isValidPrice,
};
