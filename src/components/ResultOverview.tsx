import { Trophy } from "lucide-react";
import type { QuizResult } from "../types/quiz";

type ResultOverviewProps = {
  result: QuizResult;
  total: number;
};

export function ResultOverview({ result, total }: ResultOverviewProps) {
  return (
    <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-900/60 bg-gradient-to-br from-[#06223e] to-[#07172b] p-6 text-white shadow-2xl shadow-blue-950/20 sm:p-8">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
          <Trophy size={34} />
        </span>
        <div>
          <h1 className="text-xl font-black">Kết quả bài làm</h1>
          <p className="mt-1 text-xs text-slate-300">
            Hoàn thành lúc {new Date(result.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 divide-x divide-slate-600">
        <Stat value={result.correct} label="Câu đúng" color="text-emerald-400" />
        <Stat value={result.incorrect} label="Câu sai" color="text-red-400" />
        <Stat value={result.unanswered} label="Chưa làm" color="text-amber-400" />
      </div>

      <div className="mt-8 rounded-xl border border-slate-600/70 bg-white/[.03] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Tổng số câu: {total}</span>
          <strong className="text-lg">{result.percentage}%</strong>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
            style={{ width: `${result.percentage}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-300">{label}</p>
    </div>
  );
}
