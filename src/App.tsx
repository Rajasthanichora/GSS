import { useState, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { OpeningAnimation } from './components/OpeningAnimation';
import { ThemeSelector } from './components/ThemeSelector';
import { Navigation } from './components/Navigation';
import { MVARCalculator } from './components/MVARCalculator';
import { ConsumptionCalculator } from './components/ConsumptionCalculator';
import { LogsheetCalculator } from './components/LogsheetCalculator';
import { useTheme } from './hooks/useTheme';

function App() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [activeTab, setActiveTab] = useState<'mvar' | 'consumption' | 'logsheet'>('mvar');
  const { theme, setTheme } = useTheme();

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
  }, []);

  return (
    <>
      {showAnimation && <OpeningAnimation onComplete={handleAnimationComplete} />}
      {!showAnimation && (
        <div className="min-h-screen bg-background text-text-primary">
          {/* Header */}
          <header className="bg-surface-primary/50 backdrop-blur-xl border-b border-border sticky top-0 z-10 overflow-x-hidden">
            <div className="w-full px-2 sm:px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-primary/20 rounded-lg sm:rounded-xl border border-primary/30 flex-shrink-0">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent truncate">
                    GSS
                  </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
                  <ThemeSelector theme={theme} onThemeChange={setTheme} />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="w-full px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
            <div className="max-w-4xl mx-auto">
              <div className="bg-surface-primary/30 backdrop-blur-xl border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
                {activeTab === 'mvar' && <MVARCalculator />}
                {activeTab === 'consumption' && <ConsumptionCalculator />}
                {activeTab === 'logsheet' && <LogsheetCalculator />}
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
