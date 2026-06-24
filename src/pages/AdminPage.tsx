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
import { AdminQuestionEditor } from "../components/admin/AdminQuestionEditor";
import type { QuestionType, QuizConfig, QuizQuestion, Section } from "../types/quiz";
import {
  createEmptyQuestion,
  generateQuestionsFromPrompt,
  normalizeQuestionNumbers,
} from "../utils/adminQuestions";
import { applyExamStructure, validateExamStructure } from "../utils/examStructure";
import {
  listAttemptsForQuiz,
  loadQuizDraft,
  saveQuizDraft,
  type AttemptRecord,
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
    const publishedDraft = { ...draft, published: true };
    setDraft(publishedDraft);
    setSaveError("");
    try {
      await onSave(publishedDraft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Không thể xuất bản đề.");
    }
  };

  const preview = async () => {
    const publishedDraft = { ...draft, published: true };
    setDraft(publishedDraft);
    setSaveError("");
    try {
      await onPreview(publishedDraft);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Không thể xem trước.");
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
      } catch {
        window.alert("File JSON không đúng định dạng đề thi.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="header-icon" onClick={onExit}><ArrowLeft size={19} /></button>
            <div className="min-w-0">
              <p className="truncate font-black text-slate-950 dark:text-white">Smart Practice Admin</p>
              <p className="truncate text-xs text-slate-500">{draft.title}</p>
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

      <div className="grid min-h-[calc(100vh-64px)] xl:grid-cols-[280px_minmax(0,1fr)_270px]">
        <aside className="border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
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
          <div className="navigator-scroll max-h-[calc(100vh-190px)] space-y-2 overflow-y-auto p-3">
            {draft.questions.map((question, index) => (
              <button
                type="button"
                key={question.id}
                onClick={() => { setSelectedId(question.id); setTab("questions"); }}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  selectedId === question.id && tab === "questions"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <GripVertical size={15} className="shrink-0 text-slate-400" />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black dark:bg-slate-800">
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

        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
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
            {tab === "settings" && <QuizSettings draft={draft} onChange={setDraft} />}
            {tab === "prompt" && (
              <PromptBuilder
                nextId={Math.max(0, ...draft.questions.map((question) => question.id)) + 1}
                onGenerate={(questions) => {
                  updateQuestions([...draft.questions, ...questions]);
                  setSelectedId(questions[0]?.id ?? null);
                  setTab("questions");
                }}
              />
            )}
            {tab === "results" && <ResultsDashboard quizId={quizId} />}
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

        <aside className="border-l border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
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

function ResultsDashboard({ quizId }: { quizId: string }) {
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

  if (loading) return <div className="py-20 text-center font-semibold text-slate-500">Đang tải kết quả...</div>;
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

function AdminNav({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof FileJson; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
      <Icon size={17} /> {label}
    </button>
  );
}

function QuizSettings({ draft, onChange }: { draft: QuizConfig; onChange: (config: QuizConfig) => void }) {
  const patch = (value: Partial<QuizConfig>) => onChange({ ...draft, ...value });
  const patchStructure = (value: Partial<QuizConfig["structure"]>) =>
    patch({ structure: { ...draft.structure, ...value } });
  const useStandardPreset = () =>
    patchStructure({
      enabled: true,
      preset: "standard_175",
      totalQuestions: 175,
      listeningEnd: 100,
      imageQuestionsEnd: 6,
      abcQuestionNumber: 7,
      abcBlankEnd: 31,
      listeningGroupSize: 3,
      listeningGroupStart: 32,
      listeningGroupEnd: 100,
      readingStart: 101,
      showListeningDividers: true,
      dividerStyle: "dashed",
      dividerLabel: "",
      shuffleListeningNormal: true,
      shuffleListeningStart: 32,
      shuffleListeningEnd: 100,
      shuffleReading: true,
      shuffleReadingStart: 101,
      shuffleReadingEnd: 175,
      shuffleNormalOptions: true,
      shuffleOptionsStart: 32,
      shuffleOptionsEnd: 175,
      readingGroupSize: 1,
      showReadingDividers: false,
      readingGroupStart: 101,
      readingGroupEnd: 175,
      requireReadingPassage: false,
      passageRequiredStart: 101,
      passageRequiredEnd: 175,
    });

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">Cấu hình</p><h2 className="mt-1 text-2xl font-black">Cài đặt đề thi</h2></div>
      <label className="admin-field"><span>Tên đề</span><input value={draft.title} onChange={(e) => patch({ title: e.target.value })} /></label>
      <label className="admin-field"><span>Mô tả ngắn</span><input value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} /></label>
      <label className="admin-field"><span>Hướng dẫn</span><textarea rows={4} value={draft.description} onChange={(e) => patch({ description: e.target.value })} /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="admin-field"><span>Thời gian (phút)</span><input type="number" min={1} value={draft.durationMinutes} onChange={(e) => patch({ durationMinutes: Math.max(1, Number(e.target.value)) })} /></label>
        <label className="admin-field"><span>Tên thương hiệu</span><input value={draft.brandName} onChange={(e) => patch({ brandName: e.target.value })} /></label>
        <label className="admin-field"><span>Badge</span><input value={draft.brandBadge} onChange={(e) => patch({ brandBadge: e.target.value })} /></label>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">Cấu trúc đề thi</p>
            <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
              Chuẩn 175Q hoặc tùy chỉnh hoàn toàn
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Chọn preset có sẵn, tự thay đổi từng mốc hoặc tắt cấu trúc để thiết kế
              từng câu độc lập.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ModeCard
            active={draft.structure.enabled && draft.structure.preset === "standard_175"}
            title="Chuẩn 175Q"
            description="Khôi phục toàn bộ mốc và luật chuẩn."
            onClick={useStandardPreset}
          />
          <ModeCard
            active={draft.structure.enabled && draft.structure.preset === "custom"}
            title="Tùy chỉnh"
            description="Tự đặt số câu, mốc phần thi và luật xáo."
            onClick={() => patchStructure({ enabled: true, preset: "custom" })}
          />
          <ModeCard
            active={!draft.structure.enabled}
            title="Tự do"
            description="Không ép cấu trúc; chỉnh từng câu độc lập."
            onClick={() => patchStructure({ enabled: false, preset: "custom" })}
          />
        </div>

        {draft.structure.enabled ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StructureInput label="Tổng số câu" value={draft.structure.totalQuestions} onChange={(value) => patchStructure({ totalQuestions: value, preset: "custom" })} />
              <StructureInput label="Listening kết thúc" value={draft.structure.listeningEnd} onChange={(value) => patchStructure({ listeningEnd: value, readingStart: value + 1, preset: "custom" })} />
              <StructureInput label="Câu ảnh kết thúc" value={draft.structure.imageQuestionsEnd} onChange={(value) => patchStructure({ imageQuestionsEnd: value, preset: "custom" })} />
              <StructureInput label="Câu ABC có nội dung" value={draft.structure.abcQuestionNumber} onChange={(value) => patchStructure({ abcQuestionNumber: value, preset: "custom" })} />
              <StructureInput label="ABC trống kết thúc" value={draft.structure.abcBlankEnd} onChange={(value) => patchStructure({ abcBlankEnd: value, preset: "custom" })} />
              <StructureInput label="Số câu mỗi nhóm" value={draft.structure.listeningGroupSize} onChange={(value) => patchStructure({ listeningGroupSize: value, preset: "custom" })} />
              <StructureInput label="Reading bắt đầu" value={draft.structure.readingStart} onChange={(value) => patchStructure({ readingStart: value, listeningEnd: value - 1, preset: "custom" })} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SettingToggle
                label="Hiện vạch chia nhóm Listening"
                description={`Câu ${draft.structure.listeningGroupStart}–${draft.structure.listeningGroupEnd}, mỗi ${draft.structure.listeningGroupSize} câu.`}
                checked={draft.structure.showListeningDividers}
                onChange={(value) => patchStructure({ showListeningDividers: value, preset: "custom" })}
              />
              <SettingToggle
                label="Xáo câu Listening thường"
                description={`Áp dụng từ câu ${draft.structure.shuffleListeningStart} đến ${draft.structure.shuffleListeningEnd}.`}
                checked={draft.structure.shuffleListeningNormal}
                onChange={(value) => patchStructure({ shuffleListeningNormal: value, preset: "custom" })}
              />
              <SettingToggle
                label="Xáo câu Reading"
                description={`Áp dụng từ câu ${draft.structure.shuffleReadingStart} đến ${draft.structure.shuffleReadingEnd}.`}
                checked={draft.structure.shuffleReading}
                onChange={(value) => patchStructure({ shuffleReading: value, preset: "custom" })}
              />
              <SettingToggle
                label="Xáo đáp án câu thường"
                description={`Áp dụng từ câu ${draft.structure.shuffleOptionsStart} đến ${draft.structure.shuffleOptionsEnd}.`}
                checked={draft.structure.shuffleNormalOptions}
                onChange={(value) => patchStructure({ shuffleNormalOptions: value, preset: "custom" })}
              />
              <SettingToggle
                label="Chia nhóm câu Reading"
                description={`Câu ${draft.structure.readingGroupStart}–${draft.structure.readingGroupEnd}, mỗi ${draft.structure.readingGroupSize} câu.`}
                checked={draft.structure.showReadingDividers}
                onChange={(value) => patchStructure({ showReadingDividers: value, preset: "custom" })}
              />
              <SettingToggle
                label="Bắt buộc passage cho Reading"
                description={`Bắt buộc từ câu ${draft.structure.passageRequiredStart} đến ${draft.structure.passageRequiredEnd}.`}
                checked={draft.structure.requireReadingPassage}
                onChange={(value) => patchStructure({ requireReadingPassage: value, preset: "custom" })}
              />
            </div>

            <div className="mt-5 space-y-3">
              <RangeSetting
                title="Phạm vi chia nhóm Listening"
                start={draft.structure.listeningGroupStart}
                end={draft.structure.listeningGroupEnd}
                onChange={(start, end) => patchStructure({ listeningGroupStart: start, listeningGroupEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi xáo câu Listening"
                start={draft.structure.shuffleListeningStart}
                end={draft.structure.shuffleListeningEnd}
                onChange={(start, end) => patchStructure({ shuffleListeningStart: start, shuffleListeningEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi xáo câu Reading"
                start={draft.structure.shuffleReadingStart}
                end={draft.structure.shuffleReadingEnd}
                onChange={(start, end) => patchStructure({ shuffleReadingStart: start, shuffleReadingEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi xáo đáp án"
                start={draft.structure.shuffleOptionsStart}
                end={draft.structure.shuffleOptionsEnd}
                onChange={(start, end) => patchStructure({ shuffleOptionsStart: start, shuffleOptionsEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi chia nhóm Reading"
                start={draft.structure.readingGroupStart}
                end={draft.structure.readingGroupEnd}
                onChange={(start, end) => patchStructure({ readingGroupStart: start, readingGroupEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi bắt buộc passage"
                start={draft.structure.passageRequiredStart}
                end={draft.structure.passageRequiredEnd}
                onChange={(start, end) => patchStructure({ passageRequiredStart: start, passageRequiredEnd: end, preset: "custom" })}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <label className="admin-field">
                <span>Kiểu vạch ngăn</span>
                <select
                  value={draft.structure.dividerStyle}
                  onChange={(event) => patchStructure({
                    dividerStyle: event.target.value as QuizConfig["structure"]["dividerStyle"],
                    preset: "custom",
                  })}
                >
                  <option value="dashed">Nét đứt</option>
                  <option value="solid">Nét liền</option>
                  <option value="soft">Mờ nhẹ</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Nhãn vạch ngăn</span>
                <input
                  value={draft.structure.dividerLabel}
                  placeholder="Ví dụ: Nhóm tiếp theo"
                  onChange={(event) => patchStructure({ dividerLabel: event.target.value, preset: "custom" })}
                />
              </label>
              <StructureInput
                label="Số câu mỗi nhóm Reading"
                value={draft.structure.readingGroupSize}
                onChange={(value) => patchStructure({ readingGroupSize: value, preset: "custom" })}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-white p-4 dark:border-blue-900 dark:bg-slate-900">
              <div className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                <p>Ảnh: 1–{draft.structure.imageQuestionsEnd} · ABC cố định: {draft.structure.abcQuestionNumber}–{draft.structure.abcBlankEnd}</p>
                <p>Listening: 1–{draft.structure.listeningEnd} · Reading: {draft.structure.readingStart}–{draft.structure.totalQuestions}</p>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => patch({ questions: applyExamStructure(draft.questions, draft.structure) })}
              >
                <Settings size={16} /> Áp dụng vào câu hỏi
              </button>
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            Chế độ tự do đang bật. Admin có thể chọn loại, phần thi, xáo câu và
            xáo đáp án riêng trên từng câu. Hệ thống không ép đủ 175 câu.
          </div>
        )}
      </div>

      <ExperienceSettings
        experience={draft.experience}
        onChange={(experience) => patch({ experience })}
      />
    </div>
  );
}

function ExperienceSettings({
  experience,
  onChange,
}: {
  experience: QuizConfig["experience"];
  onChange: (experience: QuizConfig["experience"]) => void;
}) {
  const patch = (value: Partial<QuizConfig["experience"]>) =>
    onChange({ ...experience, ...value });
  return (
    <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-violet-600">Trải nghiệm làm bài</p>
      <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Điều hướng, nộp bài và kết quả</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SettingToggle label="Hiển thị thanh tiến độ" description="Cho thí sinh biết đã làm bao nhiêu câu." checked={experience.showProgress} onChange={(value) => patch({ showProgress: value })} />
        <SettingToggle label="Hiển thị bảng số câu" description="Bật sidebar danh sách câu hỏi." checked={experience.showQuestionNavigator} onChange={(value) => patch({ showQuestionNavigator: value })} />
        <SettingToggle label="Cho phép nhảy câu" description="Có thể bấm số câu để di chuyển tự do." checked={experience.allowQuestionNavigation} onChange={(value) => patch({ allowQuestionNavigation: value })} />
        <SettingToggle label="Tự chuyển sau khi chọn" description="Chuyển sang nhóm tiếp theo sau khi trả lời." checked={experience.autoAdvance} onChange={(value) => patch({ autoAdvance: value })} />
        <SettingToggle label="Cho nộp khi còn câu trống" description="Nếu tắt, phải trả lời đủ mới được nộp." checked={experience.allowSubmitWithUnanswered} onChange={(value) => patch({ allowSubmitWithUnanswered: value })} />
        <SettingToggle label="Xác nhận trước khi nộp" description="Hiện modal kiểm tra số câu chưa làm." checked={experience.confirmBeforeSubmit} onChange={(value) => patch({ confirmBeforeSubmit: value })} />
        <SettingToggle label="Hiển thị tên phần thi" description="Hiện nhãn Listening hoặc Reading." checked={experience.showSectionLabel} onChange={(value) => patch({ showSectionLabel: value })} />
        <SettingToggle label="Hiển thị số thứ tự câu" description="Hiện Câu x / tổng số câu." checked={experience.showQuestionCounter} onChange={(value) => patch({ showQuestionCounter: value })} />
        <SettingToggle label="Cho xem chi tiết kết quả" description="Bật màn review đáp án sau khi nộp." checked={experience.showResultDetails} onChange={(value) => patch({ showResultDetails: value })} />
        <SettingToggle label="Hiển thị giải thích" description="Hiện explanation trong phần review." checked={experience.showExplanations} onChange={(value) => patch({ showExplanations: value })} />
      </div>
    </div>
  );
}

function ModeCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-blue-500 bg-white ring-4 ring-blue-500/10 dark:bg-slate-900"
          : "border-slate-200 bg-white/60 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900/50"
      }`}
    >
      <span className="font-extrabold text-slate-900 dark:text-white">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
    </button>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <span>
        <span className="block text-sm font-extrabold text-slate-800 dark:text-slate-100">{label}</span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-blue-600"
      />
    </label>
  );
}

function RangeSetting({
  title,
  start,
  end,
  onChange,
}: {
  title: string;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}) {
  return (
    <div className="grid items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[1fr_130px_130px]">
      <div>
        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-xs text-slate-500">Có thể đặt phạm vi riêng, không phụ thuộc mốc mặc định.</p>
      </div>
      <label className="admin-field">
        <span>Từ câu</span>
        <input type="number" min={1} value={start} onChange={(event) => onChange(Math.max(1, Number(event.target.value)), end)} />
      </label>
      <label className="admin-field">
        <span>Đến câu</span>
        <input type="number" min={1} value={end} onChange={(event) => onChange(start, Math.max(1, Number(event.target.value)))} />
      </label>
    </div>
  );
}

function StructureInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value)))}
      />
    </label>
  );
}

function PromptBuilder({ nextId, onGenerate }: { nextId: number; onGenerate: (questions: QuizQuestion[]) => void }) {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(5);
  const [section, setSection] = useState<Section>("listening");
  const [type, setType] = useState<QuestionType>("normal");
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-violet-600">Tạo cấu trúc</p>
        <h2 className="mt-1 text-2xl font-black">Chuẩn bị câu hỏi theo prompt</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Bản production không tự sinh nội dung giả. Công cụ này chỉ tạo các block rỗng đúng định dạng để bạn nhập dữ liệu thật. Muốn AI viết nội dung thực sự cần kết nối API ở backend.
        </p>
      </div>
      <label className="admin-field">
        <span>Ghi chú / prompt biên soạn</span>
        <textarea rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ghi chú chủ đề, trình độ, mục tiêu để dùng trong quá trình biên soạn..." />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="admin-field"><span>Số câu</span><input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))} /></label>
        <label className="admin-field"><span>Phần thi</span><select value={section} onChange={(e) => setSection(e.target.value as Section)}><option value="listening">Listening</option><option value="reading">Reading</option></select></label>
        <label className="admin-field"><span>Định dạng</span><select value={type} onChange={(e) => setType(e.target.value as QuestionType)}><option value="normal">ABCD thường</option><option value="image_fixed">Có hình ảnh</option><option value="abc_fixed">ABC</option><option value="abc_blank_fixed">ABC để trống</option></select></label>
      </div>
      <button type="button" className="primary-button px-6 py-3" onClick={() => onGenerate(generateQuestionsFromPrompt(prompt, count, section, type, nextId))}><Sparkles size={18} /> Tạo {count} block rỗng</button>
    </div>
  );
}

function validateConfig(config: QuizConfig): string[] {
  const errors: string[] = [];
  if (!config.title.trim()) errors.push("Chưa nhập tên đề");
  if (!config.questions.length) errors.push("Đề chưa có câu hỏi");
  config.questions.forEach((question, index) => {
    if (!question.question.trim() && question.type !== "abc_blank_fixed") errors.push(`Câu ${index + 1} chưa có nội dung`);
    if (!question.options.some((option) => option.id === question.correctOptionId)) errors.push(`Câu ${index + 1} chưa chọn đáp án đúng`);
    const requiresOptionText = question.type === "normal" || question.type === "image_fixed";
    if (requiresOptionText && question.options.some((option) => !option.text.trim())) {
      errors.push(`Câu ${index + 1} còn phương án trống`);
    }
    if (question.type === "image_fixed" && !question.image?.trim()) errors.push(`Câu ${index + 1} chưa có hình ảnh`);
  });
  if (config.structure.enabled) {
    const structure = config.structure;
    if (structure.listeningEnd >= structure.totalQuestions) {
      errors.push("Mốc kết thúc Listening phải nhỏ hơn tổng số câu");
    }
    if (structure.readingStart !== structure.listeningEnd + 1) {
      errors.push("Reading phải bắt đầu ngay sau phần Listening");
    }
    if (structure.imageQuestionsEnd >= structure.abcQuestionNumber) {
      errors.push("Khoảng câu hình ảnh phải kết thúc trước câu ABC có nội dung");
    }
    if (structure.abcQuestionNumber > structure.abcBlankEnd) {
      errors.push("Câu ABC có nội dung phải nằm trước mốc kết thúc ABC trống");
    }
    if (structure.abcBlankEnd >= structure.listeningEnd) {
      errors.push("Khoảng ABC trống phải kết thúc trước phần Listening thường");
    }
    if (structure.listeningGroupSize < 1 || structure.listeningGroupSize > 6) {
      errors.push("Số câu mỗi nhóm phải từ 1 đến 6");
    }
    if (structure.readingGroupSize < 1 || structure.readingGroupSize > 6) {
      errors.push("Số câu mỗi nhóm Reading phải từ 1 đến 6");
    }
    const ranges: Array<[string, number, number]> = [
      ["chia nhóm Listening", structure.listeningGroupStart, structure.listeningGroupEnd],
      ["xáo câu Listening", structure.shuffleListeningStart, structure.shuffleListeningEnd],
      ["xáo câu Reading", structure.shuffleReadingStart, structure.shuffleReadingEnd],
      ["xáo đáp án", structure.shuffleOptionsStart, structure.shuffleOptionsEnd],
      ["chia nhóm Reading", structure.readingGroupStart, structure.readingGroupEnd],
      ["bắt buộc passage", structure.passageRequiredStart, structure.passageRequiredEnd],
    ];
    ranges.forEach(([label, start, end]) => {
      if (start > end) errors.push(`Phạm vi ${label}: câu bắt đầu phải nhỏ hơn hoặc bằng câu kết thúc`);
      if (start < 1 || end > structure.totalQuestions) {
        errors.push(`Phạm vi ${label} phải nằm trong 1–${structure.totalQuestions}`);
      }
    });
    errors.push(...validateExamStructure(config.questions, config.structure));
  }
  return errors;
}
