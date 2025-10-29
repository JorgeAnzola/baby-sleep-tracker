import { Theme } from './types';

export const sunsetTheme: Theme = {
  id: 'sunset',
  name: {
    es: 'Atardecer',
    en: 'Sunset'
  },
  colors: {
    primary: 'from-orange-400 to-pink-600',
    secondary: 'from-orange-50 to-pink-100',
    accent: 'from-orange-500 to-pink-600',
    background: 'from-orange-50 via-pink-50 to-purple-50',
    card: 'from-white/80 to-orange-50/50',
    text: 'from-gray-800 to-gray-600',
    // Gradientes cálidos de atardecer
    napButton: 'bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 hover:from-orange-500 hover:via-red-500 hover:to-pink-500',
    nightButton: 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700',
    napBadge: 'bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 text-orange-900 border-2 border-orange-400',
    nightBadge: 'bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 text-purple-900 border-2 border-purple-400',
  }
};
