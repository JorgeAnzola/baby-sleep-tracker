export type ThemeId = 'default' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'coral';

export interface Theme {
  id: ThemeId;
  name: Record<string, string>; // Multilingual names indexed by language code
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    text: string;
    napButton: string;
    nightButton: string;
    napBadge: string;
    nightBadge: string;
  };
}
