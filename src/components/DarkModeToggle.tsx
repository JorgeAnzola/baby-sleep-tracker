'use client';

import { Button } from '@/components/ui/button';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
        <Monitor className="h-5 w-5" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'light') {
      return <Sun className="h-5 w-5 text-amber-500" />;
    } else if (theme === 'dark') {
      return <Moon className="h-5 w-5 text-indigo-400" />;
    } else {
      return <Monitor className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLabel = () => {
    if (theme === 'light') return 'Modo claro';
    if (theme === 'dark') return 'Modo oscuro';
    return 'Automático';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="gap-2 transition-colors"
      title={getLabel()}
    >
      {getIcon()}
      <span className="text-xs font-medium hidden sm:inline">{getLabel()}</span>
    </Button>
  );
}
