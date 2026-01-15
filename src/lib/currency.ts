// Currency formatting utility for FCFA (Francs CFA)
export const CURRENCY_SYMBOL = 'FCFA';
export const CURRENCY_LOCALE = 'fr-FR';

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString(CURRENCY_LOCALE)} ${CURRENCY_SYMBOL}`;
}

// Format for PDF - uses spaces as thousands separator (safer for PDF rendering)
export function formatCurrencyPDF(amount: number): string {
  const formatted = amount.toLocaleString(CURRENCY_LOCALE).replace(/\u00A0/g, ' ');
  return `${formatted} ${CURRENCY_SYMBOL}`;
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${CURRENCY_SYMBOL}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${CURRENCY_SYMBOL}`;
  }
  return formatCurrency(amount);
}
