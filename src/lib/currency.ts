// Currency formatting utility for FCFA (Francs CFA)
export const CURRENCY_SYMBOL = 'FCFA';
export const CURRENCY_LOCALE = 'fr-FR';

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString(CURRENCY_LOCALE)} ${CURRENCY_SYMBOL}`;
}

// Format number with simple spaces for thousands separator (safe for PDF)
function formatNumberSimple(num: number): string {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(0).split('');
  const result: string[] = [];
  
  for (let i = parts.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      result.unshift(' ');
    }
    result.unshift(parts[i]);
  }
  
  return (isNegative ? '-' : '') + result.join('');
}

// Format for PDF - uses simple ASCII spaces as thousands separator (safer for PDF rendering)
export function formatCurrencyPDF(amount: number): string {
  return `${formatNumberSimple(amount)} ${CURRENCY_SYMBOL}`;
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
