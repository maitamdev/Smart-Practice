import {
  BarChart3,
  Bell,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  FileEdit,
  FolderOpen,
  LayoutDashboard,
  Library,
  Link2,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createAdminQuiz,
  deleteAdminQuiz,
  listAdminQuizzes,
  renameAdminQuiz,
  type AdminQuizSummary,
} from "../services/supabaseService";
import { defaultQuizConfig } from "../data/questions";
import { applyExamStructure } from "../utils/examStructure";

type Props = {
  adminName: string;
  onEditQuiz: (quizId: string) => void;
  onLogout: () => void;
};

type Filter = "all" | "published" | "draft";

export function AdminDashboardPage({ adminName, onEditQuiz, onLogout }: Props) {
  const [quizzes, setQuizzes] = useState<AdminQuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const refresh = () => {
    setLoading(true);
    listAdminQuizzes()
      .then(setQuizzes)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không thể tải danh sách đề."))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const filtered = useMemo(
    () =>
      quizzes.filter((quiz) => {
        const matchText = quiz.title.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
          filter === "all" ||
          (filter === "published" && quiz.is_published) ||
          (filter === "draft" && !quiz.is_published);
        return matchText && matchFilter;
      }),
    [filter, quizzes, search],
  );

  const createQuiz = async (input: CreateQuizInput) => {
    setCreating(true);
    setError("");
    try {
      const base = structuredClone(defaultQuizConfig);
      const structure = {
        ...base.structure,
        enabled: input.mode !== "free",
        preset: input.mode === "standard" ? "standard_175" as const : "custom" as const,
      };
      const config = {
        ...base,
        title: input.title,
        subtitle: input.description,
        durationMinutes: input.duration,
        brandName: adminName || "Smart Practice",
        structure,
        questions:
          input.mode === "standard"
            ? applyExamStructure([], structure)
            : [],
        updatedAt: Date.now(),
      };
      const created = await createAdminQuiz(config);
      onEditQuiz(created.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo đề.");
      setCreating(false);
    }
  };

  const removeQuiz = async (quiz: AdminQuizSummary) => {
    if (!window.confirm(`Xóa vĩnh viễn đề “${quiz.title}”?`)) return;
    await deleteAdminQuiz(quiz.id);
    refresh();
  };

  const renameQuiz = async (quiz: AdminQuizSummary) => {
    const title = window.prompt("Đổi tên đề thi:", quiz.title)?.trim();
    if (!title || title === quiz.title) return;
    await renameAdminQuiz(quiz.id, title);
    refresh();
  };

  const publishedCount = quizzes.filter((quiz) => quiz.is_published).length;
  const draftCount = quizzes.length - publishedCount;

  return (
    <main className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950 lg:pl-64">
      <AdminSidebar adminName={adminName} onLogout={onLogout} />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <span>Workspace</span><span>/</span><strong className="text-slate-800 dark:text-slate-100">Kho đề thi</strong>
          </div>
          <div className="relative max-w-xl flex-1 sm:flex-none sm:w-[420px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm đề thi..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button type="button" className="header-icon relative">
            <Bell size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071d58] via-[#1239a0] to-[#155eef] px-7 py-8 text-white shadow-xl shadow-blue-900/15 sm:px-10">
          <div className="absolute -right-12 -top-32 h-80 w-80 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100">
              <Sparkles size={14} /> Không gian sáng tạo
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Biến ý tưởng thành bài học tương tác</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">Tạo, chia sẻ và theo dõi tiến độ học viên trong một không gian duy nhất.</p>
            <button type="button" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-700 shadow-lg transition hover:-translate-y-0.5" onClick={() => setCreateOpen(true)}>
              <Plus size={18} /> Tạo đề thi mới
            </button>
          </div>
          <div className="absolute bottom-0 right-8 hidden h-44 w-72 lg:block">
            <div className="absolute bottom-5 right-10 h-32 w-48 rotate-6 rounded-2xl border border-white/30 bg-white/15 p-5 shadow-2xl backdrop-blur">
              <div className="h-3 w-24 rounded bg-white/80" /><div className="mt-5 space-y-3">{[80, 60, 72].map((w) => <div key={w} className="h-2 rounded bg-white/30" style={{ width: `${w}%` }} />)}</div>
            </div>
            <div className="absolute bottom-12 left-0 flex h-20 w-24 items-end gap-2 rounded-2xl bg-cyan-400/20 p-4 backdrop-blur">
              {[35, 60, 45, 75].map((h) => <i key={h} className="w-3 rounded-t bg-cyan-300" style={{ height: `${h}%` }} />)}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={BookOpenCheck} label="Tổng số đề" value={quizzes.length} color="blue" />
          <StatCard icon={CheckCircle2} label="Đã xuất bản" value={publishedCount} color="emerald" />
          <StatCard icon={FileEdit} label="Bản nháp" value={draftCount} color="amber" />
          <StatCard icon={UsersRound} label="Lượt làm bài" value="—" color="violet" />
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Đề thi gần đây</h2>
              <div className="mt-3 flex gap-2">
                {([["all", "Tất cả"], ["published", "Đã xuất bản"], ["draft", "Bản nháp"]] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-xs font-bold ${filter === value ? "bg-blue-600 text-white" : "bg-white text-slate-500 shadow-sm dark:bg-slate-900"}`}>{label}</button>
                ))}
              </div>
            </div>
            <button type="button" className="secondary-button">Mới nhất <ChevronDown size={15} /></button>
          </div>

          {error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-500" />
              <p className="font-medium">Đang tải kho đề...</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((quiz, index) => (
                <QuizCard key={quiz.id} quiz={quiz} index={index} onEdit={() => onEditQuiz(quiz.id)} onRename={() => void renameQuiz(quiz)} onDelete={() => void removeQuiz(quiz)} />
              ))}
              <button type="button" onClick={() => setCreateOpen(true)} className="group flex min-h-[330px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/10">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 transition group-hover:scale-110"><Plus size={25} /></span>
                <strong className="mt-4 text-blue-700">Tạo đề thi mới</strong>
                <span className="mt-2 text-xs text-slate-500">Bắt đầu từ preset hoặc tùy chỉnh</span>
              </button>
            </div>
          )}
        </section>
      </div>

      <CreateQuizModal open={createOpen} loading={creating} onClose={() => setCreateOpen(false)} onSubmit={(input) => void createQuiz(input)} />
    </main>
  );
}

function AdminSidebar({ adminName, onLogout }: { adminName: string; onLogout: () => void }) {
  const nav = [
    { icon: LayoutDashboard, label: "Tổng quan" },
    { icon: FolderOpen, label: "Kho đề thi", active: true },
    { icon: BarChart3, label: "Kết quả" },
    { icon: Library, label: "Thư viện" },
    { icon: Settings, label: "Cài đặt" },
  ];
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#061735] p-4 text-white lg:flex">
      <div className="flex items-center gap-3 px-3 py-4 text-xl font-black"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600"><BookOpenCheck size={20} /></span>Smart Practice <b className="rounded-full bg-blue-600/40 px-2 py-1 text-[9px]">ADMIN</b></div>
      <nav className="mt-7 grid gap-2">{nav.map(({ icon: Icon, label, active }) => <button key={label} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${active ? "bg-blue-600 shadow-lg shadow-blue-900/30" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon size={18} />{label}</button>)}</nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4"><p className="truncate text-sm font-bold">{adminName}</p><p className="mt-1 text-xs text-slate-400">Quiz Creator</p></div>
      <button type="button" onClick={onLogout} className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-300 hover:bg-red-500/10 hover:text-red-300"><LogOut size={17} />Đăng xuất</button>
    </aside>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Clock3; label: string; value: string | number; color: "blue" | "emerald" | "amber" | "violet" }) {
  const colors = { blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600" };
  return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[color]}`}><Icon size={22} /></span><div><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p></div></div>;
}

function QuizCard({ quiz, index, onEdit, onRename, onDelete }: { quiz: AdminQuizSummary; index: number; onEdit: () => void; onRename: () => void; onDelete: () => void }) {
  const palettes = ["from-blue-700 via-indigo-600 to-violet-500", "from-orange-500 via-amber-500 to-yellow-400", "from-emerald-600 via-teal-500 to-cyan-400"];
  const shareUrl = `${window.location.origin}/quiz/${quiz.slug}`;
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className={`relative h-40 bg-gradient-to-br ${palettes[index % palettes.length]} p-5 text-white`}>
        <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold backdrop-blur">BÀI KIỂM TRA</span>
        <div className="absolute bottom-5 right-6 flex h-20 w-28 rotate-6 flex-col rounded-xl bg-white/20 p-4 backdrop-blur"><i className="h-2 w-16 rounded bg-white/80" /><i className="mt-3 h-2 w-20 rounded bg-white/40" /><i className="mt-2 h-2 w-12 rounded bg-white/40" /></div>
        <button type="button" className="absolute right-3 top-3 header-icon !border-0 !bg-white/90" onClick={onRename}><MoreHorizontal size={17} /></button>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${quiz.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{quiz.is_published ? "ĐÃ XUẤT BẢN" : "BẢN NHÁP"}</span><span className="text-[10px] text-slate-400">{new Date(quiz.updated_at).toLocaleDateString("vi-VN")}</span></div>
        <h3 className="mt-4 truncate text-lg font-black text-slate-950 dark:text-white">{quiz.title}</h3>
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Clock3 size={14} /> Cập nhật gần đây</p>
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" className="primary-button flex-1" onClick={onEdit}><Pencil size={15} /> Chỉnh sửa</button>
          {quiz.is_published && <button type="button" className="secondary-button !px-3" onClick={() => void navigator.clipboard.writeText(shareUrl)} title="Sao chép link"><Link2 size={16} /></button>}
          <button type="button" className="secondary-button !px-3 !text-red-500" onClick={onDelete}><Trash2 size={16} /></button>
        </div>
      </div>
    </article>
  );
}

type CreateQuizInput = { title: string; description: string; duration: number; mode: "standard" | "custom" | "free" };

function CreateQuizModal({ open, loading, onClose, onSubmit }: { open: boolean; loading: boolean; onClose: () => void; onSubmit: (input: CreateQuizInput) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(45);
  const [mode, setMode] = useState<CreateQuizInput["mode"]>("standard");
  if (!open) return null;
  const submit = (event: FormEvent) => { event.preventDefault(); if (title.trim()) onSubmit({ title: title.trim(), description: description.trim(), duration, mode }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-2xl animate-fade-up rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
        <div className="flex items-start justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">Bắt đầu sáng tạo</p><h2 className="mt-2 text-2xl font-black">Tạo đề thi mới</h2><p className="mt-2 text-sm text-slate-500">Chọn cấu trúc phù hợp, bạn có thể thay đổi sau.</p></div><button type="button" className="header-icon" onClick={onClose}><X size={18} /></button></div>
        <div className="mt-7 grid gap-5">
          <label className="admin-field"><span>Tên đề thi</span><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Đề luyện thi Tiếng Anh 15 phút" /></label>
          <label className="admin-field"><span>Mô tả ngắn</span><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mục tiêu hoặc nội dung của đề..." /></label>
          <div><p className="mb-3 text-sm font-extrabold">Chọn cấu trúc đề</p><div className="grid gap-3 sm:grid-cols-3">{([["standard", "Chuẩn 175Q", "Cấu trúc Listening & Reading chuẩn"], ["custom", "Tùy chỉnh", "Tự chọn mốc và luật xáo"], ["free", "Tự do", "Thiết kế độc lập từng câu"]] as const).map(([value, label, desc]) => <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-xl border p-4 text-left ${mode === value ? "border-blue-500 bg-blue-50 ring-4 ring-blue-500/10" : "border-slate-200"}`}><strong className="text-sm">{label}</strong><span className="mt-1 block text-[11px] leading-5 text-slate-500">{desc}</span></button>)}</div></div>
          <label className="admin-field"><span>Thời gian làm bài (phút)</span><input type="number" min={1} value={duration} onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))} /></label>
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" className="secondary-button px-6" onClick={onClose}>Hủy</button><button type="submit" className="primary-button px-6" disabled={loading || !title.trim()}>{loading ? "Đang tạo..." : "Tạo & thiết kế"} <ExternalLink size={15} /></button></div>
      </form>
    </div>
  );
}
