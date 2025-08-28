import React from 'react';
import { Calculator, Activity } from 'lucide-react';

interface NavigationProps {
  activeTab: 'mvar' | 'consumption';
  onTabChange: (tab: 'mvar' | 'consumption') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'mvar' as const, label: 'MVAR Calculator', icon: Calculator },
    { id: 'consumption' as const, label: 'Consumption', icon: Activity },
  ];

  return (
    <nav className="flex gap-2 bg-surface-secondary/50 backdrop-blur-sm rounded-lg p-1 border border-border">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${activeTab === id 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80'
            }
          `}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </nav>
  );
};