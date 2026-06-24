import { Clock3 } from "lucide-react";

type TimerBadgeProps = {
  remainingSeconds: number;
};

export function TimerBadge({ remainingSeconds }: TimerBadgeProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isUrgent = remainingSeconds <= 5 * 60;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-bold tabular-nums sm:px-4 ${
        isUrgent
          ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400"
          : "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
      }`}
      aria-label={`Thời gian còn lại ${minutes} phút ${seconds} giây`}
    >
      <Clock3 size={17} className={isUrgent ? "animate-pulse" : ""} />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
