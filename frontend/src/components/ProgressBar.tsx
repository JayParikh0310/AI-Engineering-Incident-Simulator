import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
  label: string;
  value: number; // 0 to 10
  max?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, max = 10 }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  useEffect(() => {
    // Animate the fill on mount
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 150);
    return () => clearTimeout(timer);
  }, [percentage]);

  // Determine bar color based on mastery level (0-10)
  const barColor = value < 3.0 
    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' 
    : value >= 8.0 
    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' 
    : 'bg-zinc-300 shadow-[0_0_8px_rgba(228,228,231,0.2)]';

  return (
    <div className="mb-2 group/bar">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-bold text-zinc-400 group-hover/bar:text-zinc-200 transition-colors duration-200">{label}</span>
        <span className="text-zinc-500 group-hover/bar:text-zinc-300 transition-colors duration-200">{value.toFixed(1)} / {max}</span>
      </div>
      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden relative border border-zinc-800/50">
        <div
          className={`${barColor} h-full transition-all duration-1000 ease-out relative`}
          style={{ width: `${animatedWidth}%` }}
        >
          {/* Subtle moving shimmer highlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
