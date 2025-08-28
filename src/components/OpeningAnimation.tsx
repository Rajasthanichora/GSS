import React, { useState, useEffect } from 'react';

export const OpeningAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1400),
    ];

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Electrical Symbol */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`text-8xl transition-all duration-700 ${
            phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
          style={{
            filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.8))',
            animation: phase >= 1 ? 'electricPulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          ⚡
        </div>
        
        {/* GSS Text */}
        <div
          className={`mt-6 text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent transition-all duration-700 ${
            phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          style={{
            textShadow: '0 0 30px rgba(6, 182, 212, 0.5)',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.1em',
          }}
        >
          GSS
        </div>

        {/* Loading indicator */}
        <div
          className={`mt-4 w-16 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-700 ${
            phase >= 3 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            animation: phase >= 3 ? 'loadingBar 0.6s ease-out' : 'none',
          }}
        />
      </div>

      <style>{`
        @keyframes electricPulse {
          0%, 100% { 
            filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.8));
            transform: scale(1);
          }
          50% { 
            filter: drop-shadow(0 0 40px rgba(6, 182, 212, 1)) drop-shadow(0 0 60px rgba(59, 130, 246, 0.6));
            transform: scale(1.05);
          }
        }
        
        @keyframes loadingBar {
          0% { width: 0; }
          100% { width: 4rem; }
        }
      `}</style>
    </div>
  );
};