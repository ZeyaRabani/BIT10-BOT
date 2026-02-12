import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type Metadata } from 'next';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function constructMetadata({
  title = 'BIT10',
  description = 'Diversified crypto index funds. On-chain. Auto-rebalanced. Built for the next wave of investing.',
  // image = '/assets/thumbnails/thumbnail.png',
  icons = '/favicon.ico',
  noIndex = false
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title, description,
      // images: [{url: image}]
    },
    twitter: { card: 'summary_large_image', title, description, creator: '@bit10startup' },
    icons,
    metadataBase: new URL('https://www.bit10.app'),
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

export const formatAddress = (id: string) => {
  if (!id) return '';
  if (id.length <= 7) return id;
  return `${id.slice(0, 9)}.....${id.slice(-9)}`;
};

export const formatCompactNumber = (value: number | string | null | undefined): string => {
  let numValue: number;
  if (typeof value === 'string') numValue = parseFloat(value);
  else numValue = value!;
  if (!numValue || isNaN(numValue)) return '-';
  if (numValue === 0) return '0';

  const absValue = Math.abs(numValue), isNegative = numValue < 0, sign = isNegative ? '-' : '';

  if (absValue < 0.00000001 && absValue > 0) {
    const scientific = absValue.toExponential(4), cleanScientific = scientific.replace('e+', 'e').replace('e-0', 'e-').replace(/e-(\d)$/, 'e-$1');
    return sign + cleanScientific;
  }

  if (absValue < 1) {
    const strValue = absValue.toFixed(20), [, decimalPart = ''] = strValue.split('.'), firstNonZeroIndex = decimalPart.search(/[1-9]/);
    if (firstNonZeroIndex === -1) return '0';
    const significantDecimals = decimalPart.slice(0, firstNonZeroIndex + 4), formatted = parseFloat(`0.${significantDecimals}`);
    let result = formatted.toFixed(Math.min(firstNonZeroIndex + 4, 8)).replace(/\.?0+$/, '');
    if (parseFloat(result) >= 1) result = '1.0000';
    return sign + result;
  }

  if (absValue < 1000) return sign + (Math.round(absValue * 10000) / 10000).toFixed(4).replace(/\.?0+$/, '');
  if (absValue < 1_000_000) {
    const integerPart = Math.floor(absValue), decimalPart = absValue - integerPart, formattedInteger = integerPart.toLocaleString('en-US'), decimalStr = decimalPart.toFixed(6).slice(2).replace(/0+$/, '');
    return sign + formattedInteger + (decimalStr ? '.' + decimalStr : '');
  }

  if (absValue < 1_000_000_000) return sign + (absValue / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (absValue < 1_000_000_000_000) return sign + (absValue / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (absValue < 1e15) return sign + (absValue / 1_000_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'T';

  const scientific = absValue.toExponential(2), cleanScientific = scientific.replace('e+', 'e').replace('e+0', 'e');
  return sign + cleanScientific;
};
