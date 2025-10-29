import { Theme } from './types';

export const defaultTheme: Theme = {
  id: 'default',
  name: {
    es: 'Azul Clásico',
    en: 'Classic Blue'
  },
  colors: {
    primary: 'from-blue-400 to-blue-600',
    secondary: 'from-blue-50 to-indigo-100',
    accent: 'from-blue-500 to-indigo-600',
    background: 'from-blue-50 via-indigo-50 to-purple-50',
    card: 'from-white/80 to-blue-50/50',
    text: 'from-gray-800 to-gray-600',
    // Botones con gradientes de múltiples colores
    napButton: 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-500 hover:via-orange-500 hover:to-amber-600',
    nightButton: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700',
    // Badges más distintivos con gradientes
    napBadge: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border-2 border-amber-300',
    nightBadge: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-900 border-2 border-indigo-300',
  }
};
