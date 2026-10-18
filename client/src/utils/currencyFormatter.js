/**
 * Currency formatter for Indian Rupees (INR)
 * Formats numbers in Indian locale with proper thousand separators
 * Example: 25000 → ₹25,000.00, 150000 → ₹1,50,000.00
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default formatCurrency;
