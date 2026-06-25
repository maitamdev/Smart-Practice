import { X } from "lucide-react";
import { getReviewStatus } from "../utils/score";
import { useQuizStore } from "../stores/quizStore";

type QuestionNavigatorProps = {
  currentIndex: number;
  onNavigate: (index: number) => void;
  submitted?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  allowNavigation?: boolean;
};

export function QuestionNavigator({
  currentIndex,
  onNavigate,
  submitted = false,
  mobileOpen = false,
  onClose,
  allowNavigation = true,
}: QuestionNavigatorProps) {
  const { attempt: { shuffledQuestions: questions, userAnswers: answers } } = useQuizStore();
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Danh sách câu hỏi</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Chọn số để di chuyển nhanh</p>
        </div>
        {onClose && (
          <button type="button" className="icon-button lg:hidden" onClick={onClose} aria-label="Đóng">
            <X size={19} />
          </button>
        )}
      </div>

      <div className="navigator-scroll grid grid-cols-7 gap-2 overflow-y-auto pr-1 sm:grid-cols-9 lg:max-h-[calc(100vh-265px)] lg:grid-cols-5">
        {questions.map((question, index) => {
          const isCurrent = currentIndex === index;
          const isAnswered = Boolean(answers[question.id]);
          const reviewStatus = getReviewStatus(question, answers);
          let statusClass = isAnswered ? "nav-answered" : "nav-unanswered";

          if (submitted) {
            statusClass =
              reviewStatus === "correct"
                ? "nav-correct"
                : reviewStatus === "incorrect"
                  ? "nav-incorrect"
                  : "nav-unanswered";
          }

          return (
            <button
              type="button"
              disabled={!allowNavigation}
              key={`${question.id}-${index}`}
              onClick={() => {
                onNavigate(index);
                onClose?.();
              }}
              className={`nav-number ${statusClass} ${isCurrent ? "nav-current" : ""} ${allowNavigation ? "" : "cursor-default"}`}
              aria-label={`Đi tới câu ${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500" />Đã làm</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />Chưa làm</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" />Đang làm</span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-3 backdrop-blur-sm lg:hidden" onClick={onClose}>
          <div
            className="absolute inset-x-3 bottom-3 max-h-[82vh] overflow-hidden animate-fade-up"
            onClick={(event) => event.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
}
