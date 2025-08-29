import React, { useState, useCallback, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { Numpad } from './Numpad';
import type { InputValues, NumpadType, CalculationResult } from '../types';

export const Calculator: React.FC = () => {
  const [values, setValues] = useState<InputValues>({ mw: '', mva: '' });
  const [activeNumpad, setActiveNumpad] = useState<NumpadType>(null);
  const [result, setResult] = useState<CalculationResult>({ mvar: 0, isValid: false });

  const calculateMVAR = useCallback((mw: number, mva: number): CalculationResult => {
    if (mw < 0 || mva < 0) {
      return { mvar: 0, isValid: false, error: 'Values must be positive' };
    }

    if (mw > mva) {
      return { mvar: 0, isValid: false, error: 'MW cannot exceed MVA' };
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
    if (!activeNumpad) return;

    setValues(prev => {
      const currentValue = prev[activeNumpad] || '';
      
      // Prevent multiple decimal points
      if (value === '.' && currentValue.includes('.')) {
        return prev;
      }

      // Limit decimal places to 3
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

  // Close numpad when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.numpad-container')) {
        closeNumpad();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-cyan-500/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-400/30">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              MVAR Calculator
            </h1>
          </div>
        </div>
      </header>

      {/* Main Calculator */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 shadow-2xl">
          {/* Input Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* MW Input */}
            <div className="numpad-container relative">
              <label className="block text-cyan-300 text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">⚡</span>
                MW (Megawatts)
              </label>
              <input
                type="text"
                value={values.mw}
                onClick={() => handleInputClick('mw')}
                readOnly
                placeholder="Tap to enter MW"
                className={`
                  w-full p-4 bg-slate-900/50 border-2 rounded-2xl text-xl text-center font-mono
                  cursor-pointer transition-all duration-300 backdrop-blur-sm
                  ${activeNumpad === 'mw' 
                    ? 'border-cyan-400 shadow-cyan-500/50 bg-slate-900/70' 
                    : 'border-slate-600 hover:border-cyan-500/50'
                  }
                  shadow-lg hover:shadow-xl
                `}
                style={{
                  textShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
                }}
              />
              <Numpad
                isVisible={activeNumpad === 'mw'}
                onNumberClick={handleNumberClick}
                onClear={handleClear}
              />
            </div>

            {/* MVA Input */}
            <div className="numpad-container relative">
              <label className="block text-cyan-300 text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">🔌</span>
                MVA (Megavolt-Amperes)
              </label>
              <input
                type="text"
                value={values.mva}
                onClick={() => handleInputClick('mva')}
                readOnly
                placeholder="Tap to enter MVA"
                className={`
                  w-full p-4 bg-slate-900/50 border-2 rounded-2xl text-xl text-center font-mono
                  cursor-pointer transition-all duration-300 backdrop-blur-sm
                  ${activeNumpad === 'mva' 
                    ? 'border-cyan-400 shadow-cyan-500/50 bg-slate-900/70' 
                    : 'border-slate-600 hover:border-cyan-500/50'
                  }
                  shadow-lg hover:shadow-xl
                `}
                style={{
                  textShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
                }}
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
            p-6 rounded-2xl border-2 text-center transition-all duration-500
            ${result.isValid 
              ? 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-400/50 shadow-cyan-500/20' 
              : 'bg-slate-900/30 border-slate-600/50'
            }
            backdrop-blur-sm shadow-2xl
          `}>
            <div className="text-lg text-cyan-300 mb-2 flex items-center justify-center gap-2">
              <span className="text-2xl">⚡</span>
              MVAR Reading
            </div>
            
            {result.error ? (
              <div className="text-red-400 text-lg font-semibold">
                {result.error}
              </div>
            ) : (
              <div 
                className={`
                  text-4xl font-bold font-mono transition-all duration-300
                  ${result.isValid ? 'text-cyan-400' : 'text-slate-400'}
                `}
                style={{
                  textShadow: result.isValid ? '0 0 20px rgba(6, 182, 212, 0.7)' : 'none'
                }}
              >
                {result.mvar.toFixed(3)}
              </div>
            )}
            
            <div className="text-sm text-slate-400 mt-2">
              MVAR = √(MVA² - MW²)
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-slate-900/30 backdrop-blur-sm border border-slate-600/30 rounded-xl">
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">How it works:</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              MVAR (Megavolt-Ampere Reactive) represents reactive power in electrical systems. 
              It's calculated using the relationship between apparent power (MVA) and real power (MW). 
              The formula: MVAR = √(MVA² - MW²)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};