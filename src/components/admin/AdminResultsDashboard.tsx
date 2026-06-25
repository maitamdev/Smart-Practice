import { useEffect, useState } from "react";
import { listAttemptsForQuiz, type AttemptRecord } from "../../services/supabaseService";

export function AdminResultsDashboard({ quizId }: { quizId: string }) {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listAttemptsForQuiz(quizId)
      .then(setAttempts)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Không thể tải kết quả."),
      )
      .finally(() => setLoading(false));
  }, [quizId]);

  const average = attempts.length
    ? Math.round(
        attempts.reduce((sum, attempt) => sum + attempt.result.percentage, 0) /
          attempts.length,
      )
    : 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-500" />
      <p className="font-medium">Đang tải kết quả...</p>
    </div>
  );
  if (error) return <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>;

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">Thống kê</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Kết quả học viên</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ResultMetric label="Lượt nộp bài" value={attempts.length} />
        <ResultMetric label="Điểm trung bình" value={`${average}%`} />
        <ResultMetric label="Điểm cao nhất" value={`${Math.max(0, ...attempts.map((item) => item.result.percentage))}%`} />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-[1fr_90px_90px_90px] bg-slate-50 px-4 py-3 text-xs font-extrabold text-slate-500 dark:bg-slate-800">
          <span>Thời gian nộp</span><span>Đúng</span><span>Sai</span><span>Điểm</span>
        </div>
        {attempts.length ? attempts.map((attempt) => (
          <div key={attempt.id} className="grid grid-cols-[1fr_90px_90px_90px] border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
            <span>{new Date(attempt.submitted_at).toLocaleString("vi-VN")}</span>
            <span className="font-bold text-emerald-600">{attempt.result.correct}</span>
            <span className="font-bold text-red-600">{attempt.result.incorrect}</span>
            <span className="font-black text-blue-700">{attempt.result.percentage}%</span>
          </div>
        )) : (
          <p className="border-t border-slate-200 p-8 text-center text-sm text-slate-500">Chưa có lượt làm bài.</p>
        )}
      </div>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
      <p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}
