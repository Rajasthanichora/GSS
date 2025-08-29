import React from 'react';

interface NumpadProps {
  isVisible: boolean;
  onNumberClick: (value: string) => void;
  onClear: () => void;
}

export const Numpad: React.FC<NumpadProps> = ({ isVisible, onNumberClick, onClear }) => {
  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'C']
  ];

  const handleClick = (value: string) => {
    if (value === 'C') {
      onClear();
    } else {
      onNumberClick(value);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-[9999] mt-2 animate-slide-down">
      <div 
        className="bg-surface-primary border-2 border-border rounded-2xl p-4 shadow-2xl mx-auto max-w-[300px] w-full"
      >
        <div className="grid grid-cols-3 gap-3">
          {numbers.flat().map((value) => (
            <button
              key={value}
              onClick={() => handleClick(value)}
              className={`
                aspect-square rounded-full font-bold text-lg transition-all duration-150 
                active:translate-y-1.5 active:shadow-[0_2px_8px_rgba(0,0,0,0.15)]
                hover:translate-y-[-1px] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)]
                transform-gpu select-none touch-manipulation flex items-center justify-center
                border-2 min-h-[70px] min-w-[70px]
                ${value === 'C' 
                  ? 'text-primary-foreground border-red-500' 
                  : 'text-text-primary border-border'
                }
              `}
              style={{
                background: value === 'C' 
                  ? 'linear-gradient(145deg, #ef4444, #dc2626)'
                  : 'linear-gradient(145deg, var(--color-surface-secondary), var(--color-surface-primary))',
                boxShadow: value === 'C' 
                  ? '0 6px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1), 0 0 0 1px rgba(220,38,38,0.2)'
                  : `0 6px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1), 0 0 0 1px var(--color-border)`,
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};