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
    return `https://www.google.com.br/search?q=${encodeURIComponent(query)}`
  }
  return null
}

/**
 * Formats the person code by omitting the last 3 digits
 * @param code - The original person code
 * @returns Formatted person code
 */
export function formatPersonCode(code?: string | null): string {
  if (!code) return ''
  const str = String(code).trim()
  return str.length > 3 ? str.slice(0, -3) : str
}
