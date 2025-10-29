import { Theme } from './types';

export const lavenderTheme: Theme = {
  id: 'lavender',
  name: {
    es: 'Lavanda',
    en: 'Lavender'
  },
  colors: {
    primary: 'from-purple-400 to-violet-600',
    secondary: 'from-purple-50 to-violet-100',
    accent: 'from-fuchsia-500 to-purple-600',
    background: 'from-purple-50 via-violet-50 to-fuchsia-50',
    card: 'from-white/80 to-purple-50/50',
    text: 'from-gray-800 to-gray-600',
    // Gradientes místicos
    napButton: 'bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500',
    nightButton: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700',
    napBadge: 'bg-gradient-to-r from-pink-100 via-rose-100 to-fuchsia-100 text-pink-900 border-2 border-pink-400',
    nightBadge: 'bg-gradient-to-r from-violet-100 via-purple-100 to-indigo-100 text-violet-900 border-2 border-violet-400',
  }
};
