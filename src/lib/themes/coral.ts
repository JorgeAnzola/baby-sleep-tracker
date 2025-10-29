import { Theme } from './types';

export const coralTheme: Theme = {
  id: 'coral',
  name: {
    es: 'Coral',
    en: 'Coral'
  },
  colors: {
    primary: 'from-rose-400 to-red-600',
    secondary: 'from-rose-50 to-red-100',
    accent: 'from-pink-500 to-rose-600',
    background: 'from-rose-50 via-red-50 to-pink-50',
    card: 'from-white/80 to-rose-50/50',
    text: 'from-gray-800 to-gray-600',
    // Gradientes cálidos de coral
    napButton: 'bg-gradient-to-r from-rose-400 via-pink-400 to-red-400 hover:from-rose-500 hover:via-pink-500 hover:to-red-500',
    nightButton: 'bg-gradient-to-r from-red-700 via-rose-700 to-pink-700 hover:from-red-800 hover:via-rose-800 hover:to-pink-800',
    napBadge: 'bg-gradient-to-r from-rose-100 via-pink-100 to-red-100 text-rose-900 border-2 border-rose-400',
    nightBadge: 'bg-gradient-to-r from-red-100 via-rose-100 to-pink-100 text-red-900 border-2 border-red-400',
  }
};
