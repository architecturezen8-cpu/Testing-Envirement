import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Prices are stored as whole LKR rupees (e.g. 3200 = Rs. 3,200).
 * Formatted without decimals, since Sri Lankan retail prices never use them.
 */
export function formatPrice(amount: number, currency = "LKR", locale = "en-LK") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function averageRating(reviews: { rating: number }[]) {
  if (!reviews.length) return 0;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return Math.round(avg * 10) / 10;
}
