type ProgressSummaryProps = {
  answered: number;
  total: number;
  compact?: boolean;
};

export function ProgressSummary({ answered, total, compact = false }: ProgressSummaryProps) {
  const percentage = total ? (answered / total) * 100 : 0;

  return (
    <div className={compact ? "w-28 sm:w-48" : "w-full"}>
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span>Đã làm</span>
        <span>{answered}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
