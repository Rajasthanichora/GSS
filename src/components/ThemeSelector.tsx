import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import type { Theme } from '../types';

interface ThemeSelectorProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, onThemeChange }) => {
  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'default', label: 'Default', icon: <Monitor className="w-4 h-4" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 bg-surface-secondary/50 backdrop-blur-sm rounded-lg p-1 border border-border">
      {themes.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onThemeChange(value)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
            ${theme === value 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80'
            }
          `}
          title={`Switch to ${label} theme`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};