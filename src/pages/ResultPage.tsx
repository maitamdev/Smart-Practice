import { Eye, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/EmptyState";
import { QuestionNavigator } from "../components/QuestionNavigator";
import { ResultOverview } from "../components/ResultOverview";
import { ResultReview } from "../components/ResultReview";
import { ThemeToggle } from "../components/ThemeToggle";
import type { QuizExperience, QuizQuestion, QuizResult, ReviewStatus, UserAnswers } from "../types/quiz";
import { getReviewStatus } from "../utils/score";

type Filter = "all" | ReviewStatus;

type ResultPageProps = {
  questions: QuizQuestion[];
  answers: UserAnswers;
  result: QuizResult;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onRestart: () => void;
  experience: QuizExperience;
};

export function ResultPage({
  questions,
  answers,
  result,
  theme,
  onToggleTheme,
  onRestart,
  experience,
}: ResultPageProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showDetails, setShowDetails] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const filteredIndexes = useMemo(
    () =>
      questions
        .map((question, index) => ({ question, index }))
        .filter(({ question }) => filter === "all" || getReviewStatus(question, answers) === filter)
        .map(({ index }) => index),
    [answers, filter, questions],
  );
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Tất cả", count: questions.length },
    { value: "correct", label: "Câu đúng", count: result.correct },
    { value: "incorrect", label: "Câu sai", count: result.incorrect },
    { value: "unanswered", label: "Chưa làm", count: result.unanswered },
  ];

  const openDetails = () => {
    setShowDetails(true);
    setCurrentIndex(filteredIndexes[0] ?? 0);
  };

  const changeFilter = (value: Filter) => {
    setFilter(value);
    const first = questions.findIndex((question) => value === "all" || getReviewStatus(question, answers) === value);
    if (first >= 0) setCurrentIndex(first);
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950">
      <AppHeader>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </AppHeader>
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {!showDetails ? (
          <div className="animate-fade-up">
            <ResultOverview result={result} total={questions.length} />
            <div className="mx-auto mt-5 grid max-w-2xl gap-3 sm:grid-cols-2">
              {experience.showResultDetails && <button type="button" className="secondary-button border-slate-300 py-3" onClick={openDetails}>
                <Eye size={18} /> Xem chi tiết
              </button>}
              <button type="button" className="primary-button py-3" onClick={onRestart}>
                <RotateCcw size={18} /> Làm lại từ đầu
              </button>
            </div>
          </div>
        ) : (
          <section className="animate-fade-up overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 pt-2 dark:border-slate-800 sm:px-6">
              {filters.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => changeFilter(item.value)}
                  className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition ${
                    filter === item.value
                      ? item.value === "incorrect"
                        ? "border-red-500 text-red-600"
                        : "border-blue-600 text-blue-700 dark:text-blue-400"
                      : "border-transparent text-slate-600 hover:text-blue-600 dark:text-slate-300"
                  }`}
                >
                  {item.label} ({item.count})
                </button>
              ))}
            </div>

            <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="p-4 sm:p-6">
                {filteredIndexes.includes(currentIndex) ? (
                  <ResultReview
                    question={questions[currentIndex]}
                    answers={answers}
                    displayNumber={currentIndex + 1}
                    showExplanation={experience.showExplanations}
                  />
                ) : (
                  <EmptyState />
                )}
                <div className="mt-5 flex justify-between gap-3">
                  <button type="button" className="secondary-button" onClick={() => setShowDetails(false)}>
                    Quay lại tổng quan
                  </button>
                  <button type="button" className="primary-button" onClick={onRestart}>
                    <RotateCcw size={16} /> Làm lại
                  </button>
                </div>
              </div>
              <aside className="hidden border-l border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/30 lg:block">
                <QuestionNavigator
                  currentIndex={currentIndex}
                  onNavigate={setCurrentIndex}
                  submitted
                />
              </aside>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
