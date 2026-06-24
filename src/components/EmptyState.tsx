import { FileQuestion } from "lucide-react";

export function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
      <FileQuestion className="mx-auto text-slate-400" size={34} />
      <h3 className="mt-4 font-bold text-slate-800 dark:text-white">Không có câu hỏi phù hợp</h3>
      <p className="mt-1 text-sm text-slate-500">Hãy thử chọn một bộ lọc khác.</p>
    </div>
  );
}
