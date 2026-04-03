import getSymbol from 'currency-symbol-map';

export const useCurrency = (user: { shopCurrency?: string } | null | undefined) => {
  const currencyCode = user?.shopCurrency || 'INR';
  const symbol = getSymbol(currencyCode) || currencyCode;

  const format = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  return { currencyCode, symbol, format };
};
