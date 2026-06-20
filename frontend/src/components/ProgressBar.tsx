import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number; // 0 to 10
  max?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, max = 10 }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-bold text-zinc-400">{label}</span>
        <span className="text-zinc-500">{value.toFixed(1)} / {max}</span>
      </div>
      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-zinc-100 h-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
