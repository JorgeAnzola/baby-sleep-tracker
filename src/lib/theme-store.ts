import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, ThemeId, themes } from './themes';

interface ThemeStore {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  getThemeConfig: () => Theme;
  getAllThemes: () => Theme[];
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: 'default',
      setTheme: (theme) => set({ currentTheme: theme }),
      getThemeConfig: () => {
        const currentTheme = get().currentTheme;
        return themes.find(t => t.id === currentTheme) || themes[0];
      },
      getAllThemes: () => themes,
    }),
    {
      name: 'theme-storage'
    }
  )
);

// Export for backward compatibility
export const THEMES = themes;
export type { Theme, ThemeId };
