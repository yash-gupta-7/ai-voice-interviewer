import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS classes cleanly.
 * Useful for conditional classes and overriding default component styles.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
