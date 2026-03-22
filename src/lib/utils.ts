/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates the appropriate URL for a knowledge quote
 * If link exists, returns the link.
 * If no link but theory exists, returns a Google search query.
 */
export function generateQuoteUrl(link?: string | null, theory?: string | null): string | null {
  if (link && link.trim() !== '') return link
  if (theory && theory.trim() !== '') {
    const query = `explique para mim os conceitos de ${theory.trim()} num contexto de Setor de Cobrança?`
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`
  }
  return null
}
