import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAvailableLanguages, getLanguageMetadata, translations, type LanguageCode, type LanguageMetadata, type Translation } from './index';

interface LanguageStore {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Translation;
  getAvailableLanguages: () => LanguageMetadata[];
  getLanguageMetadata: (code: LanguageCode) => LanguageMetadata | undefined;
  syncLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'es',
      setLanguage: (lang: LanguageCode) => {
        set({ language: lang, t: translations[lang] });
        // Sync with backend asynchronously
        fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang }),
        }).catch(err => console.error('Failed to sync language:', err));
      },
      t: translations.es,
      getAvailableLanguages,
      getLanguageMetadata,
      syncLanguage: async () => {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const data = await response.json();
            if (data.language && translations[data.language]) {
              set({ language: data.language, t: translations[data.language] });
            }
          }
        } catch (error) {
          console.error('Failed to sync language from server:', error);
        }
      },
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
