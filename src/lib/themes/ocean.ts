import { Theme } from './types';

export const oceanTheme: Theme = {
  id: 'ocean',
  name: {
    es: 'Océano',
    en: 'Ocean'
  },
  colors: {
    primary: 'from-cyan-400 to-blue-600',
    secondary: 'from-cyan-50 to-blue-100',
    accent: 'from-blue-500 to-cyan-600',
    background: 'from-cyan-50 via-blue-50 to-indigo-50',
    card: 'from-white/80 to-cyan-50/50',
    text: 'from-gray-800 to-gray-600',
    // Gradientes frescos de océano
    napButton: 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 hover:from-yellow-500 hover:via-amber-500 hover:to-orange-500',
    nightButton: 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700',
    napBadge: 'bg-gradient-to-r from-yellow-100 via-amber-100 to-orange-100 text-amber-900 border-2 border-amber-400',
    nightBadge: 'bg-gradient-to-r from-blue-100 via-cyan-100 to-teal-100 text-blue-900 border-2 border-cyan-400',
  }
};
