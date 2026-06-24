import { BrainCircuit } from "lucide-react";
import type { ReactNode } from "react";

type AppHeaderProps = {
  children?: ReactNode;
  compact?: boolean;
};

export function AppHeader({ children, compact = false }: AppHeaderProps) {
  return (
    <header className={compact ? "sticky-header" : "relative z-10"}>
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <BrainCircuit size={21} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-base">
              Smart Practice <span className="text-indigo-600 dark:text-indigo-400">175Q</span>
            </p>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Listening & Reading
            </p>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
