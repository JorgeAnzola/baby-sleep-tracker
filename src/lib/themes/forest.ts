import { Theme } from './types';

export const forestTheme: Theme = {
  id: 'forest',
  name: {
    es: 'Bosque',
    en: 'Forest'
  },
  colors: {
    primary: 'from-green-400 to-emerald-600',
    secondary: 'from-green-50 to-emerald-100',
    accent: 'from-green-500 to-emerald-600',
    background: 'from-green-50 via-emerald-50 to-teal-50',
    card: 'from-white/80 to-green-50/50',
    text: 'from-gray-800 to-gray-600',
    // Gradientes naturales de bosque
    napButton: 'bg-gradient-to-r from-lime-400 via-yellow-400 to-amber-400 hover:from-lime-500 hover:via-yellow-500 hover:to-amber-500',
    nightButton: 'bg-gradient-to-r from-emerald-600 via-green-700 to-teal-700 hover:from-emerald-700 hover:via-green-800 hover:to-teal-800',
    napBadge: 'bg-gradient-to-r from-lime-100 via-yellow-100 to-amber-100 text-lime-900 border-2 border-lime-400',
    nightBadge: 'bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 text-emerald-900 border-2 border-emerald-400',
  }
};
