import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAvailableLanguages, getLanguageMetadata, translations, type LanguageCode, type LanguageMetadata, type Translation } from './index';

interface LanguageStore {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Translation;
  getAvailableLanguages: () => LanguageMetadata[];
  getLanguageMetadata: (code: LanguageCode) => LanguageMetadata | undefined;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'es',
      setLanguage: (lang: LanguageCode) => set({ language: lang, t: translations[lang] }),
      t: translations.es,
      getAvailableLanguages,
      getLanguageMetadata,
    }),
    {
      name: 'baby-sleep-language',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Update translations after rehydration
          state.t = translations[state.language];
        }
      },
    }
  )
);
