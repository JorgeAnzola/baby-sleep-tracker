import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, ThemeId, themes } from './themes';

interface ThemeStore {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  getThemeConfig: () => Theme;
  getAllThemes: () => Theme[];
  syncTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: 'default',
      setTheme: (theme) => {
        set({ currentTheme: theme });
        // Sync with backend asynchronously
        fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme }),
        }).catch(err => console.error('Failed to sync theme:', err));
      },
      getThemeConfig: () => {
        const currentTheme = get().currentTheme;
        return themes.find(t => t.id === currentTheme) || themes[0];
      },
      getAllThemes: () => themes,
      syncTheme: async () => {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const data = await response.json();
            if (data.theme) {
              set({ currentTheme: data.theme });
            }
          }
        } catch (error) {
          console.error('Failed to sync theme from server:', error);
        }
      },
    }),
    {
      name: 'theme-storage'
    }
  )
);

// Export for backward compatibility
export const THEMES = themes;
export type { Theme, ThemeId };
