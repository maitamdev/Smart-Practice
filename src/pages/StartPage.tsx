import {
  BookOpen,
  ClipboardCheck,
  Clock3,
  Headphones,
  Moon,
  Sun,
  Settings,
} from "lucide-react";
import type { QuizConfig } from "../types/quiz";

type StartPageProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onStart: () => void;
  hasSavedAttempt?: boolean;
  onContinue?: () => void;
  onAdmin: () => void;
  config: QuizConfig;
  loadError?: string | null;
};

export function StartPage({
  theme,
  onToggleTheme,
  onStart,
  hasSavedAttempt = false,
  onContinue,
  onAdmin,
  config,
  loadError,
}: StartPageProps) {
  const listeningCount = config.questions.filter((question) => question.section === "listening").length;
  const readingCount = config.questions.length - listeningCount;
  const quizAvailable = config.published && config.questions.length > 0;
  const details = [
    { icon: ClipboardCheck, text: `Tổng số câu hỏi: ${config.questions.length} câu` },
    { icon: Clock3, text: `Thời gian làm bài: ${config.durationMinutes} phút` },
    { icon: Headphones, text: `Listening: ${listeningCount} câu` },
    { icon: BookOpen, text: `Reading: ${readingCount} câu` },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-start-mockup p-4 sm:p-8">
      <section className="relative w-full max-w-[1386px] overflow-hidden rounded-[26px] border border-white bg-white shadow-[0_32px_80px_-36px_rgba(30,64,175,.32)] dark:border-slate-800 dark:bg-slate-900">
        <div className="grid min-h-[680px] lg:grid-cols-[40%_34%_26%]">
          <div className="relative flex min-w-0 flex-col px-8 pb-8 pt-12 sm:px-12 lg:px-[68px] lg:pb-10 lg:pt-[66px]">
            <div className="flex items-center gap-4 whitespace-nowrap text-[30px] font-black tracking-[-0.04em] text-[#0958dc] sm:text-[38px]">
              {config.brandName}
              <span className="rounded-xl bg-gradient-to-b from-[#1471ee] to-[#0758e4] px-4 py-2 text-[22px] tracking-[-0.02em] text-white shadow-sm sm:text-[28px]">
                {config.brandBadge}
              </span>
            </div>

            <h1 className="mt-10 text-[31px] font-black leading-[1.28] tracking-[-0.025em] text-[#071a3c] dark:text-white sm:text-[38px]">
              {config.title}
            </h1>

            <div className="mt-auto flex min-h-0 items-end justify-center pt-7">
              <img
                src="/images/study-illustration.png"
                alt="Người học đang luyện bài trên máy tính"
                className="h-auto w-full max-w-[500px] object-contain"
              />
            </div>
          </div>

          <div className="relative flex flex-col justify-center border-slate-200 px-8 py-10 dark:border-slate-700 lg:border-l lg:px-9 lg:pb-14 lg:pt-32">
            <div className="space-y-7">
              {details.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#0961e8] shadow-sm dark:border-blue-900 dark:bg-slate-800 dark:text-blue-400">
                    <Icon size={29} strokeWidth={1.8} />
                  </span>
                  <span className="text-[17px] font-semibold text-[#0b1834] dark:text-slate-100">
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={hasSavedAttempt ? onContinue : quizAvailable ? onStart : onAdmin}
              className="mt-12 h-[78px] w-full rounded-xl bg-gradient-to-b from-[#116cf0] to-[#0755e1] text-[22px] font-extrabold text-white shadow-[0_14px_25px_-10px_rgba(7,85,225,.55)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              {hasSavedAttempt
                ? "Tiếp tục làm bài"
                : quizAvailable
                  ? "Bắt đầu làm bài"
                  : "Thiết lập đề thi"}
            </button>
            {!quizAvailable && !hasSavedAttempt && (
              <p className="mt-3 text-center text-sm font-medium text-amber-600 dark:text-amber-400">
                Chưa có đề thi thật được xuất bản.
              </p>
            )}
            {loadError && (
              <p className="mt-3 text-center text-xs font-semibold text-red-600">
                Chưa kết nối được dữ liệu Supabase. Hãy chạy migration trước khi sử dụng.
              </p>
            )}
            {hasSavedAttempt && (
              <button
                type="button"
                onClick={onStart}
                className="mt-3 text-sm font-semibold text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
              >
                Làm bài mới từ đầu
              </button>
            )}
          </div>

          <aside className="relative flex items-center px-7 pb-10 pt-36 lg:px-10">
            <div className="w-full rounded-[28px] bg-gradient-to-br from-[#edf7ff] to-[#e0f0ff] px-8 py-10 text-[#0b326d] dark:from-blue-950/70 dark:to-slate-900 dark:text-blue-100">
              <h2 className="text-[27px] font-black text-[#075adf] dark:text-blue-400">Lưu ý:</h2>
              <ul className="mt-8 space-y-7 text-[16px] font-medium leading-7">
                <li className="flex gap-3"><span className="font-black text-blue-700">•</span><span>Đồng hồ đếm ngược theo thời gian thực.</span></li>
                <li className="flex gap-3"><span className="font-black text-blue-700">•</span><span>Đổi tab vẫn tiếp tục tính giờ.</span></li>
                <li className="flex gap-3"><span className="font-black text-blue-700">•</span><span>Bài làm được tự động lưu.</span></li>
                <li className="flex gap-3"><span className="font-black text-blue-700">•</span><span>Chúc bạn ôn tập hiệu quả!</span></li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="absolute right-8 top-9 hidden text-center sm:block lg:right-[5.5%]">
          <p className="mb-3 text-[16px] font-medium text-[#0b1834] dark:text-slate-200">Chọn giao diện</p>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={theme === "dark" ? onToggleTheme : undefined}
              className={`flex h-14 items-center gap-3 px-7 text-[17px] font-bold transition ${
                theme === "light" ? "bg-white text-slate-900" : "text-slate-400"
              }`}
            >
              <Sun size={24} /> Sáng
            </button>
            <button
              type="button"
              onClick={theme === "light" ? onToggleTheme : undefined}
              className={`flex h-14 items-center gap-3 px-7 text-[17px] font-bold transition ${
                theme === "dark" ? "bg-[#061632] text-white" : "bg-[#061632] text-white"
              }`}
            >
              <Moon size={23} /> Tối
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow sm:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          aria-label="Đổi giao diện"
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button
          type="button"
          onClick={onAdmin}
          className="absolute bottom-5 right-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <Settings size={15} /> Quản trị đề thi
        </button>
      </section>
    </main>
  );
}
