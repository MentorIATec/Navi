import { cn } from '../../utils/cn';

export function ProgressBar({ current, total, className }) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex justify-between text-sm font-medium text-[var(--ink-700)]">
        <span className="font-display">Progreso</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[rgba(15,76,129,0.10)]">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, var(--coral-500) 0%, var(--navy-500) 100%)'
          }}
        />
      </div>
    </div>
  );
}
