export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('ms-MY').format(number);
};