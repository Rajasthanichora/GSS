import React, { useState, useCallback, useEffect } from 'react';
import { Activity, Info } from 'lucide-react';
import { Numpad } from './Numpad';
import type { ConsumptionInputs, ConsumptionResults, NumpadType, AuditLog } from '../types';

export const ConsumptionCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<ConsumptionInputs>({
    today33: '',
    previous33: '',
    today132: '',
    previous132: '',
    adjustment: 'Auto'
  });
  const [activeNumpad, setActiveNumpad] = useState<NumpadType>(null);
  const [results, setResults] = useState<ConsumptionResults>({
    diff33: 0,
    net33: 0,
    today132_adj: 0,
    diff132: 0,
    net132: 0,
    displayedDifference: 0,
    isValid: false
  });

  const logAudit = useCallback((auditData: Omit<AuditLog, 'timestamp'>) => {
    const log: AuditLog = {
      ...auditData,
      timestamp: new Date().toISOString()
    };
    
    // Store in localStorage for demo purposes
    const existingLogs = JSON.parse(localStorage.getItem('gss-audit-logs') || '[]');
    existingLogs.push(log);
    localStorage.setItem('gss-audit-logs', JSON.stringify(existingLogs));
    
    console.log('Audit Log:', log);
  }, []);

  const calculateConsumption = useCallback((inputs: ConsumptionInputs): ConsumptionResults => {
    const today33 = parseFloat(inputs.today33) || 0;
    const previous33 = parseFloat(inputs.previous33) || 0;
    const today132 = parseFloat(inputs.today132) || 0;
    const previous132 = parseFloat(inputs.previous132) || 0;

    // Validate inputs
    if (today33 < 0 || previous33 < 0 || today132 < 0 || previous132 < 0) {
      return {
        diff33: 0, net33: 0, today132_adj: 0, diff132: 0, net132: 0,
        displayedDifference: 0, isValid: false, error: 'Values must be non-negative'
      };
    }

    // Calculate 33kV values (always use original inputs)
    const diff33 = today33 - previous33;
    const net33 = diff33 * 1000;

    let today132_adj = today132; // Start with original input

    // Handle adjustments - preserve today33, previous33, previous132 unchanged
    // Only modify today132 in backend calculation
    if (inputs.adjustment !== 'Auto') {
      if (inputs.adjustment === 'Equal') {
        // For Equal: net132 should equal net33 exactly
        // net132 = net33, so (today132_adj - previous132) * 4000 = net33
        // Therefore: today132_adj = previous132 + net33 / 4000
        today132_adj = previous132 + net33 / 4000;
      } else {
        // For numeric values: net132 should be less than net33 by the adjustment amount
        // net33 - net132 = adjustment, so net132 = net33 - adjustment
        // (today132_adj - previous132) * 4000 = net33 - adjustment
        // Therefore: today132_adj = previous132 + (net33 - adjustment) / 4000
        const adjustment = parseInt(inputs.adjustment);
        today132_adj = previous132 + (net33 - adjustment) / 4000;
      }

      // Validate adjusted value
      if (today132_adj < 0) {
        return {
          diff33, net33, today132_adj: 0, diff132: 0, net132: 0,
          displayedDifference: 0, isValid: false, 
          error: 'Adjustment results in invalid Today132 value'
        };
      }

      // Log audit when adjustment is applied
      if (inputs.today132 && inputs.previous132) {
        logAudit({
          today132_adj,
          adjustment: inputs.adjustment,
          originalToday132: today132,
          net33,
          net132: (today132_adj - previous132) * 4000
        });
      }
    }

    // Calculate 132kV values
    const diff132 = today132_adj - previous132;
    const net132 = diff132 * 4000;
    const displayedDifference = Math.abs(net33 - net132);

    return {
      diff33,
      net33,
      today132_adj,
      diff132,
      net132,
      displayedDifference,
      isValid: true
    };
  }, [logAudit]);

  useEffect(() => {
    if (inputs.today33 || inputs.previous33 || inputs.today132 || inputs.previous132) {
      setResults(calculateConsumption(inputs));
    } else {
      setResults({
        diff33: 0, net33: 0, today132_adj: 0, diff132: 0, net132: 0,
        displayedDifference: 0, isValid: false
      });
    }
  }, [inputs, calculateConsumption]);

  const handleInputClick = (type: NumpadType) => {
    setActiveNumpad(activeNumpad === type ? null : type);
  };

  const handleNumberClick = (value: string) => {
    if (!activeNumpad || activeNumpad === 'mw' || activeNumpad === 'mva') return;

    setInputs(prev => {
      const currentValue = prev[activeNumpad as keyof ConsumptionInputs];
      
      if (value === '.' && currentValue.includes('.')) {
        return prev;
      }

      if (currentValue.includes('.')) {
        const decimalPlaces = currentValue.split('.')[1]?.length || 0;
        if (decimalPlaces >= 1 && value !== '.') {
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
    if (!activeNumpad || activeNumpad === 'mw' || activeNumpad === 'mva') return;
    setInputs(prev => ({ ...prev, [activeNumpad]: '' }));
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
    <div className="space-y-4 sm:space-y-8 w-full overflow-x-hidden">
      {/* 33 kV Incomer Section */}
      <div className="bg-surface-secondary/30 backdrop-blur-xl border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative z-10" style={{boxShadow: 'rgba(0, 0, 0, 0.25) 0px 21px 28px -38px'}}>
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4 sm:mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          33 kV Incomer
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="numpad-container relative">
            <label htmlFor="today33-input" className="block text-text-primary font-semibold mb-3">Today 33Kv</label>
            <input
              id="today33-input"
              name="today33"
              type="text"
              value={inputs.today33}
              onClick={() => handleInputClick('today33')}
              readOnly
              placeholder="Enter today's reading"
              className={`
                w-full p-4 bg-surface-primary border-2 rounded-xl text-lg text-center font-mono
                cursor-pointer transition-all duration-300 text-text-primary
                ${activeNumpad === 'today33' 
                  ? 'border-primary shadow-primary/50' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            />
            <Numpad
              isVisible={activeNumpad === 'today33'}
              onNumberClick={handleNumberClick}
              onClear={handleClear}
            />
          </div>

          <div className="numpad-container relative">
            <label htmlFor="previous33-input" className="block text-text-primary font-semibold mb-3">Previous 33Kv</label>
            <input
              id="previous33-input"
              name="previous33"
              type="text"
              value={inputs.previous33}
              onClick={() => handleInputClick('previous33')}
              readOnly
              placeholder="Enter previous reading"
              className={`
                w-full p-4 bg-surface-primary border-2 rounded-xl text-lg text-center font-mono
                cursor-pointer transition-all duration-300 text-text-primary
                ${activeNumpad === 'previous33' 
                  ? 'border-primary shadow-primary/50' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            />
            <Numpad
              isVisible={activeNumpad === 'previous33'}
              onNumberClick={handleNumberClick}
              onClear={handleClear}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 bg-surface-primary/50 rounded-xl border border-border">
            <label className="block text-text-secondary text-sm mb-1">Difference 33Kv</label>
            <div className="text-lg sm:text-xl font-mono text-text-primary">{results.diff33.toFixed(2)}</div>
          </div>
          <div className="p-3 sm:p-4 bg-surface-primary/50 rounded-xl border border-border">
            <label className="block text-text-secondary text-sm mb-1">Net Consumpation 33Kv</label>
            <div className="text-lg sm:text-xl font-mono text-primary font-bold">{results.net33.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* 132 kV Transformer Section */}
      <div className="bg-surface-secondary/30 backdrop-blur-xl border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative z-5" style={{boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'}}>
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4 sm:mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          132 kV Transformer
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="numpad-container relative">
            <label htmlFor="today132-input" className="block text-text-primary font-semibold mb-3">Today 132Kv</label>
            <input
              id="today132-input"
              name="today132"
              type="text"
              value={inputs.today132}
              onClick={() => handleInputClick('today132')}
              readOnly
              placeholder="Enter today's reading"
              className={`
                w-full p-4 bg-surface-primary border-2 rounded-xl text-lg text-center font-mono
                cursor-pointer transition-all duration-300 text-text-primary
                ${activeNumpad === 'today132' 
                  ? 'border-primary shadow-primary/50' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            />
            <Numpad
              isVisible={activeNumpad === 'today132'}
              onNumberClick={handleNumberClick}
              onClear={handleClear}
            />
          </div>

          <div className="numpad-container relative">
            <label htmlFor="previous132-input" className="block text-text-primary font-semibold mb-3">Previous 132Kv</label>
            <input
              id="previous132-input"
              name="previous132"
              type="text"
              value={inputs.previous132}
              onClick={() => handleInputClick('previous132')}
              readOnly
              placeholder="Enter previous reading"
              className={`
                w-full p-4 bg-surface-primary border-2 rounded-xl text-lg text-center font-mono
                cursor-pointer transition-all duration-300 text-text-primary
                ${activeNumpad === 'previous132' 
                  ? 'border-primary shadow-primary/50' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            />
            <Numpad
              isVisible={activeNumpad === 'previous132'}
              onNumberClick={handleNumberClick}
              onClear={handleClear}
            />
          </div>

          <div className="adjustment-dropdown">
            <label htmlFor="adjustment-select" className="block text-text-primary font-semibold mb-3 flex items-center gap-2">
              Adjustment
              <div className="relative group">
                <Info className="w-4 h-4 text-text-secondary cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface-primary border border-border rounded-lg text-sm text-text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Made By Ravi
                </div>
              </div>
            </label>
            <select
              id="adjustment-select"
              name="adjustment"
              value={inputs.adjustment}
              onChange={(e) => setInputs(prev => ({ ...prev, adjustment: e.target.value as ConsumptionInputs['adjustment'] }))}
              className="w-full p-4 bg-surface-primary border-2 border-border rounded-xl text-lg text-text-primary focus:border-primary focus:outline-none transition-all duration-300"
            >
              <option value="Auto">Auto</option>
              <option value="Equal">Equal</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>

        {inputs.adjustment !== 'Auto' && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl">
            <div className="text-base font-mono text-primary font-bold">
              Change Today = {results.today132_adj.toFixed(2)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 bg-surface-primary/50 rounded-xl border border-border">
            <label className="block text-text-secondary text-sm mb-1">Difference 132Kv</label>
            <div className="text-lg sm:text-xl font-mono text-text-primary">{results.diff132.toFixed(2)}</div>
          </div>
          <div className="p-3 sm:p-4 bg-surface-primary/50 rounded-xl border border-border">
            <label className="block text-text-secondary text-sm mb-1">Net Consumpation 132Kv</label>
            <div className="text-lg sm:text-xl font-mono text-primary font-bold">{results.net132.toFixed(2)}</div>
          </div>
          <div className="p-3 sm:p-4 bg-surface-primary/50 rounded-xl border border-border">
            <label className="block text-text-secondary text-sm mb-1">Overall Consumpation Difference</label>
            <div className="text-lg sm:text-xl font-mono text-text-primary font-bold">{results.displayedDifference.toFixed(2)}</div>
          </div>
        </div>

        {results.error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {results.error}
          </div>
        )}
      </div>
    </div>
  );
};