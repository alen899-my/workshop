import getSymbol from 'currency-symbol-map';

export const useCurrency = (user) => {
  const currencyCode = user?.shopCurrency || user?.shop_currency || 'INR';
  const symbol = getSymbol(currencyCode) || currencyCode;

  const format = (amount) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount || 0);
    } catch (e) {
      // Fallback if Intl fails or currency code is invalid for the platform
      return `${symbol}${Number(amount || 0).toFixed(2)}`;
    }
  };

  return { currencyCode, symbol, format };
};
