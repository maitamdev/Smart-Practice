import { useState } from "react";
import type { QuestionType, QuizQuestion, Section } from "../../types/quiz";
import { generateQuizWithAi } from "../../services/aiQuizService";
import { Bot, Send, WandSparkles } from "lucide-react";

export function AdminPromptBuilder({ nextId, onGenerate }: { nextId: number; onGenerate: (questions: QuizQuestion[]) => void }) {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(10);
  const [section, setSection] = useState<Section | "mixed">("mixed");
  const [type, setType] = useState<QuestionType | "auto">("auto");
  const [language, setLanguage] = useState("English");
  const [difficulty, setDifficulty] = useState("Trung bình");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>([
    {
      role: "assistant",
      content:
        "Chào bạn! Hãy mô tả chủ đề, trình độ và mục tiêu. Tôi sẽ tự động viết câu hỏi, đáp án đúng, phương án nhiễu và giải thích.",
    },
  ]);

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    const userPrompt = prompt.trim();
    setMessages((current) => [...current, { role: "user", content: userPrompt }]);
    setPrompt("");
    setError("");
    setGenerating(true);
    setProgress({ done: 0, total: count });
    try {
      const result = await generateQuizWithAi(
        { prompt: userPrompt, count, section, type, language, difficulty },
        nextId,
        (done, total) => setProgress({ done, total }),
      );
      onGenerate(result.questions);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            result.message ||
            `Đã tạo ${result.questions.length} câu hỏi và thêm vào đề. Bạn có thể mở từng câu để kiểm tra.`,
        },
      ]);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Không thể tạo đề bằng AI.";
      setError(message);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: `Có lỗi xảy ra: ${message}` },
      ]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Bot size={21} />
          </span>
          <div>
            <h2 className="font-black">AI Quiz Copilot</h2>
            <p className="text-xs text-blue-100">Powered by Groq · Llama 3.3 70B</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-bold text-emerald-100">
          <i className="h-2 w-2 rounded-full bg-emerald-300" /> ONLINE
        </span>
      </div>

      <div className="grid min-h-[560px] lg:grid-cols-[1fr_270px]">
        <div className="flex min-w-0 flex-col">
          <div className="navigator-scroll flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5 dark:bg-slate-950/30">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <Bot size={17} />
                  </span>
                )}
                <p
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {generating && (
              <div className="flex gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <WandSparkles className="animate-pulse" size={17} />
                </span>
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-bold text-slate-700">
                    Đang tạo câu hỏi {progress.done}/{progress.total}...
                  </p>
                  <div className="mt-2 h-1.5 w-52 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                      style={{
                        width: `${progress.total ? (progress.done / progress.total) * 100 : 8}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4">
            {error && (
              <p className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600">
                {error}
              </p>
            )}
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                disabled={generating}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void generate();
                  }
                }}
                placeholder="Ví dụ: Tạo câu hỏi TOEIC Reading về email công sở, đáp án nhiễu tự nhiên, trình độ B1..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-14 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
              <button
                type="button"
                disabled={!prompt.trim() || generating}
                onClick={() => void generate()}
                className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Enter để gửi · Shift + Enter để xuống dòng
            </p>
          </div>
        </div>

        <aside className="border-l border-slate-200 bg-white p-4">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-slate-500">
            Cấu hình đầu ra
          </p>
          <div className="mt-4 grid gap-4">
            <label className="admin-field">
              <span>Số câu</span>
              <input
                type="number"
                min={1}
                max={175}
                value={count}
                onChange={(event) =>
                  setCount(Math.min(175, Math.max(1, Number(event.target.value))))
                }
              />
            </label>
            <label className="admin-field">
              <span>Phần thi</span>
              <select value={section} onChange={(event) => setSection(event.target.value as Section | "mixed")}>
                <option value="mixed">AI tự chọn theo cấu trúc</option>
                <option value="listening">Listening</option>
                <option value="reading">Reading</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Định dạng</span>
              <select value={type} onChange={(event) => setType(event.target.value as QuestionType | "auto")}>
                <option value="auto">AI tự chọn định dạng</option>
                <option value="normal">ABCD thường</option>
                <option value="image_fixed">Có hình ảnh</option>
                <option value="abc_fixed">ABC cố định</option>
                <option value="abc_blank_fixed">ABC để trống</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Ngôn ngữ</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option>English</option>
                <option>Tiếng Việt</option>
                <option>Song ngữ Anh - Việt</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Độ khó</span>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                <option>Cơ bản</option>
                <option>Trung bình</option>
                <option>Nâng cao</option>
                <option>TOEIC 450-650</option>
                <option>TOEIC 650-850</option>
              </select>
            </label>
          </div>
          <div className="mt-5 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
            AI sẽ tự tạo câu hỏi, phương án nhiễu, đáp án đúng và giải thích.
            Listening có thêm kịch bản audio để bạn thu âm hoặc tạo giọng đọc.
          </div>
        </aside>
      </div>
    </div>
  );
}
