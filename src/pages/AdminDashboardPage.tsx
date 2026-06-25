import {
  BookOpenCheck,
  Copy,
  ExternalLink,
  Pencil,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  createAdminQuiz,
  deleteAdminQuiz,
  listAdminQuizzes,
  renameAdminQuiz,
  type AdminQuizSummary,
} from "../services/supabaseService";
import { defaultQuizConfig } from "../data/questions";

type Props = {
  adminName: string;
  onEditQuiz: (quizId: string) => void;
  onLogout: () => void;
};

export function AdminDashboardPage({ adminName, onEditQuiz, onLogout }: Props) {
  const [quizzes, setQuizzes] = useState<AdminQuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => {
    setLoading(true);
    listAdminQuizzes()
      .then(setQuizzes)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Không thể tải danh sách đề."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const createQuiz = async () => {
    const title = window.prompt("Nhập tên đề thi:", "Đề thi mới")?.trim();
    if (!title) return;
    setCreating(true);
    setError("");
    try {
      const created = await createAdminQuiz({
        ...structuredClone(defaultQuizConfig),
        title,
        brandName: adminName || "Smart Practice",
        updatedAt: Date.now(),
      });
      onEditQuiz(created.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo đề.");
    } finally {
      setCreating(false);
    }
  };

  const renameQuiz = async (quiz: AdminQuizSummary) => {
    const title = window.prompt("Đổi tên đề thi:", quiz.title)?.trim();
    if (!title || title === quiz.title) return;
    try {
      await renameAdminQuiz(quiz.id, title);
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đổi tên đề.");
    }
  };

  const removeQuiz = async (quiz: AdminQuizSummary) => {
    if (!window.confirm(`Xóa vĩnh viễn đề “${quiz.title}”?`)) return;
    await deleteAdminQuiz(quiz.id);
    refresh();
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="font-black text-slate-950 dark:text-white">Smart Practice Admin</p>
            <p className="text-xs text-slate-500">{adminName}</p>
          </div>
          <button type="button" className="secondary-button" onClick={onLogout}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">Kho đề của bạn</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Quản lý đề thi</h1>
            <p className="mt-2 text-sm text-slate-500">Mỗi đề xuất bản có một link riêng cho học viên.</p>
          </div>
          <button type="button" className="primary-button px-5 py-3" onClick={createQuiz} disabled={creating}>
            <Plus size={18} /> {creating ? "Đang tạo..." : "Tạo đề mới"}
          </button>
        </div>

        {error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}

        {loading ? (
          <p className="py-20 text-center font-semibold text-slate-500">Đang tải kho đề...</p>
        ) : quizzes.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((quiz) => {
              const shareUrl = `${window.location.origin}/quiz/${quiz.slug}`;
              return (
                <article key={quiz.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950">
                      <BookOpenCheck size={21} />
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${quiz.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {quiz.is_published ? "ĐÃ XUẤT BẢN" : "BẢN NHÁP"}
                    </span>
                  </div>
                  <h2 className="mt-4 truncate text-lg font-black text-slate-950 dark:text-white">{quiz.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">Cập nhật {new Date(quiz.updated_at).toLocaleString("vi-VN")}</p>

                  {quiz.is_published && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                      <input readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
                      <button type="button" className="header-icon" onClick={() => void navigator.clipboard.writeText(shareUrl)} title="Sao chép link"><Copy size={15} /></button>
                      <a className="header-icon" href={shareUrl} target="_blank" rel="noreferrer" title="Mở link"><ExternalLink size={15} /></a>
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                    <button type="button" className="primary-button" onClick={() => onEditQuiz(quiz.id)}>Thiết kế đề</button>
                    <div className="flex gap-2">
                      <button type="button" className="secondary-button !px-3" onClick={() => void renameQuiz(quiz)} title="Đổi tên đề"><Pencil size={16} /></button>
                      <button type="button" className="admin-danger-button !px-3" onClick={() => void removeQuiz(quiz)} title="Xóa đề"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <BookOpenCheck className="mx-auto text-slate-400" size={38} />
            <h2 className="mt-4 text-xl font-black">Chưa có đề thi</h2>
            <p className="mt-2 text-sm text-slate-500">Tạo đề đầu tiên rồi xuất bản để nhận link học viên.</p>
          </div>
        )}
      </div>
    </main>
  );
}
