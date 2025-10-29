import { coralTheme } from './coral';
import { defaultTheme } from './default';
import { forestTheme } from './forest';
import { lavenderTheme } from './lavender';
import { oceanTheme } from './ocean';
import { sunsetTheme } from './sunset';
import { Theme } from './types';

export const themes: Theme[] = [
  defaultTheme,
  oceanTheme,
  sunsetTheme,
  forestTheme,
  lavenderTheme,
  coralTheme,
];

export * from './types';
