import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eye,
  FileJson,
  GripVertical,
  Plus,
  Save,
  Settings,
  Sparkles,
  Upload,
  LogOut,
  UserRound,
  BarChart3,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AdminQuestionEditor } from "../components/admin/AdminQuestionEditor";
import { AdminQuizSettings } from "../components/admin/AdminQuizSettings";
import { AdminPromptBuilder } from "../components/admin/AdminPromptBuilder";
import { AdminResultsDashboard } from "../components/admin/AdminResultsDashboard";
import type { QuestionType, QuizConfig, QuizQuestion, Section } from "../types/quiz";
import {
  createEmptyQuestion,
  normalizeQuestionNumbers,
} from "../utils/adminQuestions";
import { validateConfig } from "../utils/validation";
import {
  loadQuizDraft,
  saveQuizDraft,
} from "../services/supabaseService";

type Props = {
  quizId: string;
  initialConfig: QuizConfig;
  onSave: (config: QuizConfig) => Promise<void>;
  onExit: () => void;
  onPreview: (config: QuizConfig) => Promise<void>;
  adminName: string;
  onLogout: () => void;
};

type Tab = "questions" | "settings" | "prompt" | "results";

export function AdminPage({ quizId, initialConfig, onSave, onExit, onPreview, adminName, onLogout }: Props) {
  const [draft, setDraft] = useState<QuizConfig>(() => structuredClone(initialConfig));
  const [selectedId, setSelectedId] = useState<number | null>(draft.questions[0]?.id ?? null);
  const [tab, setTab] = useState<Tab>("questions");
  const [saved, setSaved] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const selected = draft.questions.find((question) => question.id === selectedId);
  const listeningCount = draft.questions.filter((question) => question.section === "listening").length;
  const readingCount = draft.questions.length - listeningCount;
  const validationErrors = useMemo(() => validateConfig(draft), [draft]);

  useEffect(() => {
    let active = true;
    loadQuizDraft(quizId)
      .then((cloudDraft) => {
        if (!active) return;
        if (cloudDraft) {
          setDraft(cloudDraft);
          setSelectedId(cloudDraft.questions[0]?.id ?? null);
        }
        setDraftReady(true);
      })
      .catch((cause) => {
        if (!active) return;
        setSaveError(cause instanceof Error ? cause.message : "Không thể tải bản nháp.");
        setDraftReady(true);
      });
    return () => {
      active = false;
    };
  }, [quizId]);

  useEffect(() => {
    if (!draftReady) return;
    const timeout = window.setTimeout(() => {
      setSavingDraft(true);
      setSaveError("");
      saveQuizDraft(quizId, draft)
        .catch((cause) =>
          setSaveError(cause instanceof Error ? cause.message : "Không thể lưu bản nháp."),
        )
        .finally(() => setSavingDraft(false));
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [draft, draftReady, quizId]);

  const updateQuestions = (questions: QuizQuestion[]) =>
    setDraft((current) => ({ ...current, questions: normalizeQuestionNumbers(questions) }));

  const addQuestion = (type: QuestionType = "normal", section: Section = "listening") => {
    const id = Math.max(0, ...draft.questions.map((question) => question.id)) + 1;
    const question = createEmptyQuestion(id, type, section);
    updateQuestions([...draft.questions, question]);
    setSelectedId(id);
    setTab("questions");
  };

  const save = async () => {
    const publishedDraft = {
      ...draft,
      published: true,
      updatedAt: Date.now(),
    };
    setDraft(publishedDraft);
    setSaveError("");
    try {
      await onSave(publishedDraft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
      toast.success("Đã lưu và xuất bản đề thi.");
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Không thể xuất bản đề.");
      toast.error("Không thể xuất bản đề.");
    }
  };

  const preview = async () => {
    const publishedDraft = {
      ...draft,
      published: true,
      updatedAt: Date.now(),
    };
    setDraft(publishedDraft);
    setSaveError("");
    try {
      await onPreview(publishedDraft);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Không thể xem trước.");
    }
  };

  const saveDraftNow = async () => {
    setSavingDraft(true);
    setSaveError("");
    try {
      await saveQuizDraft(quizId, draft);
      setDraftSaved(true);
      window.setTimeout(() => setDraftSaved(false), 1600);
    } catch (cause) {
      setSaveError(
        cause instanceof Error ? cause.message : "Không thể lưu bản nháp.",
      );
    } finally {
      setSavingDraft(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${draft.id || "quiz"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as QuizConfig;
        if (!Array.isArray(imported.questions)) throw new Error();
        setDraft(imported);
        setSelectedId(imported.questions[0]?.id ?? null);
        toast.success("Nhập đề thi thành công.");
      } catch {
        toast.error("File JSON không đúng định dạng đề thi.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="header-icon" onClick={onExit}><ArrowLeft size={19} /></button>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-black text-slate-950 dark:text-white">Smart Practice <span className="text-blue-600">Studio</span></p>
              <p className="truncate text-xs font-semibold text-slate-500">{draft.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden text-[11px] font-semibold lg:inline ${saveError ? "text-red-600" : "text-emerald-600"}`}>
              {saveError ? "Lỗi đồng bộ" : savingDraft ? "Đang lưu..." : "Đã lưu lên cloud"}
            </span>
            <div className="mr-2 hidden items-center gap-2 border-r border-slate-200 pr-4 dark:border-slate-700 md:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <UserRound size={17} />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{adminName}</p>
                <button type="button" onClick={onLogout} className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-red-600">
                  <LogOut size={11} /> Đăng xuất
                </button>
              </div>
            </div>
            <button
              type="button"
              className="secondary-button hidden sm:flex"
              onClick={preview}
              disabled={validationErrors.length > 0}
            >
              <Eye size={16} /> Xem trước
            </button>
            <button
              type="button"
              className="secondary-button hidden sm:flex"
              onClick={() => void saveDraftNow()}
              disabled={savingDraft}
            >
              {draftSaved ? <Check size={16} /> : <Save size={16} />}
              {draftSaved
                ? "Đã lưu nháp"
                : savingDraft
                  ? "Đang lưu..."
                  : "Lưu bản nháp"}
            </button>
            <button type="button" className="primary-button" onClick={save} disabled={validationErrors.length > 0}>
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? "Đã lưu" : "Lưu & xuất bản"}
            </button>
          </div>
        </div>
      </header>
      {saveError && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-center text-xs font-semibold text-red-700">
          {saveError}
        </div>
      )}

      <div className="grid min-h-[calc(100vh-72px)] xl:grid-cols-[300px_minmax(0,1fr)_290px]">
        <aside className="border-r border-slate-200 bg-white shadow-[8px_0_30px_-28px_rgba(15,23,42,.4)] dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <button type="button" className="primary-button w-full" onClick={() => addQuestion()}>
              <Plus size={17} /> Thêm câu hỏi
            </button>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" className="admin-quick-add" onClick={() => addQuestion("image_fixed", "listening")}>+ Hình ảnh</button>
              <button type="button" className="admin-quick-add" onClick={() => addQuestion("abc_fixed", "listening")}>+ ABC</button>
              <button type="button" className="admin-quick-add" onClick={() => addQuestion("normal", "listening")}>+ Listening</button>
              <button type="button" className="admin-quick-add" onClick={() => addQuestion("normal", "reading")}>+ Reading</button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/40">Listening <strong>{listeningCount}</strong></div>
              <div className="rounded-lg bg-violet-50 p-2 text-violet-700 dark:bg-violet-950/40">Reading <strong>{readingCount}</strong></div>
            </div>
          </div>
          <div className="navigator-scroll max-h-[calc(100vh-205px)] space-y-2 overflow-y-auto p-3">
            {draft.questions.map((question, index) => (
              <button
                type="button"
                key={question.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", index.toString());
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
                  const toIndex = index;
                  if (fromIndex === toIndex || isNaN(fromIndex)) return;
                  const newQuestions = [...draft.questions];
                  const [moved] = newQuestions.splice(fromIndex, 1);
                  newQuestions.splice(toIndex, 0, moved);
                  updateQuestions(newQuestions);
                }}
                onClick={() => { setSelectedId(question.id); setTab("questions"); }}
                className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  selectedId === question.id && tab === "questions"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <GripVertical size={15} className="shrink-0 cursor-grab text-slate-300 transition group-hover:text-slate-500 active:cursor-grabbing" />
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${selectedId === question.id && tab === "questions" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800"}`}>
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {question.question || "Câu hỏi chưa có nội dung"}
                  </span>
                  <span className="text-[10px] uppercase text-slate-400">{question.section} · {question.type}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,.08),transparent_34%)] p-4 sm:p-7 lg:p-10">
          <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-36px_rgba(15,23,42,.35)] dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            {tab === "questions" && selected && (
              <AdminQuestionEditor
                question={selected}
                onChange={(question) =>
                  updateQuestions(draft.questions.map((item) => item.id === question.id ? question : item))
                }
                onDelete={() => {
                  const next = draft.questions.filter((item) => item.id !== selected.id);
                  updateQuestions(next);
                  setSelectedId(next[0]?.id ?? null);
                }}
              />
            )}
            {tab === "settings" && <AdminQuizSettings draft={draft} onChange={setDraft} />}
            {tab === "prompt" && (
              <AdminPromptBuilder
                nextId={Math.max(0, ...draft.questions.map((question) => question.id)) + 1}
                onGenerate={(questions) => {
                  updateQuestions([...draft.questions, ...questions]);
                  setSelectedId(questions[0]?.id ?? null);
                }}
              />
            )}
            {tab === "results" && <AdminResultsDashboard quizId={quizId} />}
            {tab === "questions" && !selected && (
              <div className="py-20 text-center">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Đề thi chưa có câu hỏi</h2>
                <p className="mt-2 text-sm text-slate-500">Thêm thủ công hoặc tạo nhanh bằng prompt.</p>
                <button type="button" className="primary-button mt-5" onClick={() => setTab("prompt")}>
                  <Sparkles size={17} /> Tạo bằng prompt
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="border-l border-slate-200 bg-white p-4 shadow-[-8px_0_30px_-28px_rgba(15,23,42,.4)] dark:border-slate-800 dark:bg-slate-900">
          <nav className="grid gap-2">
            <AdminNav active={tab === "questions"} icon={Copy} label="Câu hỏi" onClick={() => setTab("questions")} />
            <AdminNav active={tab === "prompt"} icon={Sparkles} label="Tạo bằng prompt" onClick={() => setTab("prompt")} />
            <AdminNav active={tab === "settings"} icon={Settings} label="Cài đặt đề" onClick={() => setTab("settings")} />
            <AdminNav active={tab === "results"} icon={BarChart3} label="Kết quả học viên" onClick={() => setTab("results")} />
          </nav>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Trạng thái đề</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{draft.questions.length} câu</p>
            <p className="mt-1 text-xs text-slate-500">{draft.durationMinutes} phút · {validationErrors.length ? `${validationErrors.length} lỗi` : "Sẵn sàng xuất bản"}</p>
          </div>

          {validationErrors.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              <p className="font-extrabold">Cần hoàn thiện</p>
              <ul className="mt-2 space-y-1">{validationErrors.slice(0, 5).map((error) => <li key={error}>• {error}</li>)}</ul>
            </div>
          )}

          <div className="mt-6 grid gap-2">
            <button type="button" className="secondary-button w-full" onClick={exportJson}><Download size={16} /> Xuất JSON</button>
            <button type="button" className="secondary-button w-full" onClick={() => fileInput.current?.click()}><Upload size={16} /> Nhập JSON</button>
            <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={(event) => importJson(event.target.files?.[0])} />
          </div>
        </aside>
      </div>
    </main>
  );
}

function AdminNav({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof FileJson; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
      <Icon size={17} /> {label}
    </button>
  );
}
