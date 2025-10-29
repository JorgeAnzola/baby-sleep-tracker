// This file is deprecated. Use individual language files instead.
// Import from './index' to get all translations.
export { translations } from './index';
export type { LanguageCode, Translation } from './types';

// For backward compatibility
export type Language = 'es' | 'en';
export type TranslationKey = import('./types').Translation;

