import { AlertCircle, Send, X } from "lucide-react";

type ConfirmSubmitModalProps = {
  open: boolean;
  answered: number;
  total: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmSubmitModal({
  open,
  answered,
  total,
  onCancel,
  onConfirm,
}: ConfirmSubmitModalProps) {
  if (!open) return null;
  const unanswered = total - answered;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-up rounded-3xl border border-white/20 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <AlertCircle size={24} />
          </span>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Đóng">
            <X size={19} />
          </button>
        </div>
        <h2 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white">Xác nhận nộp bài?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Sau khi nộp, bạn không thể thay đổi đáp án của lần làm bài này.
        </p>
        <div className="my-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950/30">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{answered}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đã hoàn thành</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
            <p className="text-2xl font-black text-slate-700 dark:text-slate-200">{unanswered}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chưa trả lời</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="secondary-button" onClick={onCancel}>Tiếp tục làm</button>
          <button type="button" className="primary-button" onClick={onConfirm}>
            <Send size={17} /> Nộp bài
          </button>
        </div>
      </div>
    </div>
  );
}
