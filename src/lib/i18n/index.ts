import { en } from './en';
import { es } from './es';
import { pt } from './pt';
import { LanguageCode, LanguageMetadata, Translation } from './types';

export const translations: Record<LanguageCode, Translation> = {
  es,
  en,
  pt,
};

// Get all available languages dynamically
export function getAvailableLanguages(): LanguageMetadata[] {
  return Object.values(translations).map(t => t._metadata);
}

// Get language metadata by code
export function getLanguageMetadata(code: LanguageCode): LanguageMetadata | undefined {
  return translations[code]?._metadata;
}

export * from './types';
