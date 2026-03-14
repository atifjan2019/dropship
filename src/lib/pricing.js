/**
 * Dynamic Pricing Utility
 * Applies markup tiers based on the raw CJ base cost.
 *
 * Tiers:
 *   $0 – $5     → 3.0x
 *   $5.01 – $10 → 2.5x
 *   $10.01+     → 2.0x
 */

/**
 * @param {number} baseCost - Raw CJ sell price (their cost to us)
 * @returns {number} - Marked-up sell price, rounded to 2 decimal places
 */
export function calculatePrice(baseCost) {
    const cost = parseFloat(baseCost) || 0;
    if (cost <= 0) return 0;
    if (cost <= 5)  return parseFloat((cost * 3).toFixed(2));
    if (cost <= 10) return parseFloat((cost * 2.5).toFixed(2));
    return parseFloat((cost * 2).toFixed(2));
}

/**
 * Returns the markup rate applied for a given base cost.
 * @param {number} baseCost
 * @returns {number} - e.g. 3, 2.5, or 2
 */
export function getMarkupRate(baseCost) {
    const cost = parseFloat(baseCost) || 0;
    if (cost <= 5)  return 3;
    if (cost <= 10) return 2.5;
    return 2;
}

/**
 * Calculates the profit from a given base cost.
 * @param {number} baseCost
 * @returns {number}
 */
export function calculateProfit(baseCost) {
    const cost = parseFloat(baseCost) || 0;
    return parseFloat((calculatePrice(cost) - cost).toFixed(2));
}
