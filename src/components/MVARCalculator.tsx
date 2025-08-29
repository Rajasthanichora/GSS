import React, { useState, useCallback, useEffect } from 'react';
import { Calculator, Info } from 'lucide-react';
import { Numpad } from './Numpad';
import type { InputValues, NumpadType, CalculationResult } from '../types';

export const MVARCalculator: React.FC = () => {
  const [values, setValues] = useState<InputValues>({ mw: '', mva: '' });
  const [activeNumpad, setActiveNumpad] = useState<NumpadType>(null);
  const [result, setResult] = useState<CalculationResult>({ mvar: 0, isValid: false });

  const calculateMVAR = useCallback((mw: number, mva: number): CalculationResult => {
    if (mw < 0 || mva < 0) {
      return { mvar: 0, isValid: false, error: 'Values must be non-negative' };
    }

    if (mw > mva) {
      return { mvar: 0, isValid: false, error: 'MVA must be greater than or equal to MW' };
    }

    const mvarSquared = Math.pow(mva, 2) - Math.pow(mw, 2);
    const mvar = Math.sqrt(Math.max(0, mvarSquared));

    return { mvar, isValid: true };
  }, []);

  useEffect(() => {
    const mw = parseFloat(values.mw) || 0;
    const mva = parseFloat(values.mva) || 0;
    
    if (values.mw && values.mva) {
      setResult(calculateMVAR(mw, mva));
    } else {
      setResult({ mvar: 0, isValid: false });
    }
  }, [values, calculateMVAR]);

  const handleInputClick = (type: NumpadType) => {
    setActiveNumpad(activeNumpad === type ? null : type);
  };

  const handleNumberClick = (value: string) => {
    if (!activeNumpad || (activeNumpad !== 'mw' && activeNumpad !== 'mva')) return;

    setValues(prev => {
      const currentValue = prev[activeNumpad as keyof InputValues] || '';
      
      if (value === '.' && currentValue.includes('.')) {
        return prev;
      }

      if (currentValue.includes('.')) {
        const decimalPlaces = currentValue.split('.')[1]?.length || 0;
        if (decimalPlaces >= 3 && value !== '.') {
          return prev;
        }
      }

      return {
        ...prev,
        [activeNumpad]: currentValue + value
      };
    });
  };

  const handleClear = () => {
    if (!activeNumpad) return;
    setValues(prev => ({ ...prev, [activeNumpad]: '' }));
  };

  const closeNumpad = () => setActiveNumpad(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.numpad-container') && !target.closest('.adjustment-dropdown')) {
        closeNumpad();
      }
    };

    if (activeNumpad) {
      document.addEventListener('click', handleClickOutside, true);
      return () => document.removeEventListener('click', handleClickOutside, true);
    }
  }, [activeNumpad]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden relative min-h-[625px] pb-20">
      {/* Input Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* MW Input */}
        <div className="numpad-container relative">
          <label htmlFor="mw-input" className="block text-text-primary text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            MW (Megawatts)
          </label>
          <input
            id="mw-input"
            name="mw"
            type="text"
            value={values.mw}
            onClick={() => handleInputClick('mw')}
            readOnly
            placeholder="Tap to enter MW"
            className={`
              w-full p-4 bg-surface-secondary border-2 rounded-2xl text-xl text-center font-mono
              cursor-pointer transition-all duration-300 backdrop-blur-sm text-text-primary
              ${activeNumpad === 'mw' 
                ? 'border-primary shadow-primary/50 bg-surface-secondary/70' 
                : 'border-border hover:border-primary/50'
              }
              shadow-lg hover:shadow-xl
            `}
          />
          <Numpad
            isVisible={activeNumpad === 'mw'}
            onNumberClick={handleNumberClick}
            onClear={handleClear}
          />
        </div>

        {/* MVA Input */}
        <div className="numpad-container relative">
          <label htmlFor="mva-input" className="block text-text-primary text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="text-xl">🔌</span>
            MVA (Megavolt-Amperes)
          </label>
          <input
            id="mva-input"
            name="mva"
            type="text"
            value={values.mva}
            onClick={() => handleInputClick('mva')}
            readOnly
            placeholder="Tap to enter MVA"
            className={`
              w-full p-4 bg-surface-secondary border-2 rounded-2xl text-xl text-center font-mono
              cursor-pointer transition-all duration-300 backdrop-blur-sm text-text-primary
              ${activeNumpad === 'mva' 
                ? 'border-primary shadow-primary/50 bg-surface-secondary/70' 
                : 'border-border hover:border-primary/50'
              }
              shadow-lg hover:shadow-xl
            `}
          />
          <Numpad
            isVisible={activeNumpad === 'mva'}
            onNumberClick={handleNumberClick}
            onClear={handleClear}
          />
        </div>
      </div>

      {/* Result Section */}
      <div className={`
        p-6 rounded-2xl border-2 text-center transition-all duration-500 backdrop-blur-sm shadow-2xl
        ${result.isValid 
          ? 'bg-primary/10 border-primary/50' 
          : 'bg-surface-secondary border-border'
        }
      `}>
        <div className="text-lg text-text-primary mb-2 flex items-center justify-center gap-2">
          <Calculator className="w-5 h-5" />
          <span>MVAR Reading</span>
          <div className="relative group">
            <Info className="w-4 h-4 text-text-secondary cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface-primary border border-border rounded-lg text-sm text-text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              MVAR = √(MVA² - MW²)
            </div>
          </div>
        </div>
        
        {result.error ? (
          <div className="text-red-400 text-lg font-semibold">
            {result.error}
          </div>
        ) : (
          <div className={`
            text-4xl font-bold font-mono transition-all duration-300
            ${result.isValid ? 'text-primary' : 'text-text-secondary'}
          `}>
            {result.mvar.toFixed(3)}
          </div>
        )}
      </div>
    </div>
  );
};