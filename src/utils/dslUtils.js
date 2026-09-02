export const formatStatValue = (value) => {
  if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
  return value.toString();
};

export const calculateDiscount = (price, discountPercent) => {
  if (discountPercent < 0 || discountPercent > 100) return price;
  return price - (price * (discountPercent / 100));
};

export const truncateDslName = (name, limit = 20) => {
  if (name.length <= limit) return name;
  return name.substring(0, limit) + '...';
};