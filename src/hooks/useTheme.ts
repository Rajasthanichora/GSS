import { useState, useEffect } from 'react';
import type { Theme } from '../types';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('gss-theme');
    return (saved as Theme) || 'default';
  });

  useEffect(() => {
    localStorage.setItem('gss-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
};