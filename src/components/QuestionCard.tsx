import { ImageOff } from "lucide-react";
import type { QuizQuestion } from "../types/quiz";

type QuestionCardProps = {
  question: QuizQuestion;
  displayNumber: number;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  layout?: "image" | "compact" | "reading";
};

export function QuestionCard({
  question,
  displayNumber,
  selectedOptionId,
  onSelect,
  layout = "compact",
}: QuestionCardProps) {
  if (layout === "image") {
    return (
      <article className="quiz-panel">
        <p className="mb-3 text-sm font-extrabold text-slate-900 dark:text-white">Câu {displayNumber}</p>
        <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 via-blue-100 to-cyan-100 dark:from-slate-800 dark:via-blue-950 dark:to-slate-900">
              {question.image ? (
                <img src={question.image} alt={question.question || `Câu ${displayNumber}`} className="h-full min-h-[300px] w-full object-cover" />
              ) : (
                <div className="text-center text-slate-500">
                  <ImageOff className="mx-auto" size={34} />
                  <p className="mt-2 text-sm font-semibold">Không có hình ảnh</p>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Chọn đáp án đúng nhất.</p>
          </div>
          <Options question={question} selectedOptionId={selectedOptionId} onSelect={onSelect} roomy />
        </div>
      </article>
    );
  }

  if (layout === "reading") {
    return (
      <article className="quiz-panel">
        <p className="mb-5 text-sm font-extrabold text-slate-900 dark:text-white">Câu {displayNumber}</p>
        <div className="grid gap-7 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            {question.passage}
          </div>
          <div>
            <h2 className="mb-5 text-sm font-bold leading-6 text-slate-950 dark:text-white">
              {question.question}
            </h2>
            <Options question={question} selectedOptionId={selectedOptionId} onSelect={onSelect} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="min-w-0 px-1 py-2 sm:px-5">
      <p className="mb-5 text-sm font-extrabold text-slate-900 dark:text-white">Câu {displayNumber}</p>
      {question.question ? (
        <h2 className="mb-5 min-h-10 text-sm font-bold leading-6 text-slate-950 dark:text-white">
          {question.question}
        </h2>
      ) : (
        <div className="mb-5 min-h-10" />
      )}
      <Options question={question} selectedOptionId={selectedOptionId} onSelect={onSelect} />
    </article>
  );
}

function Options({
  question,
  selectedOptionId,
  onSelect,
  roomy = false,
}: {
  question: QuizQuestion;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  roomy?: boolean;
}) {
  return (
    <div className={`grid ${roomy ? "gap-3" : "gap-2.5"}`}>
      {question.options.map((option) => {
        const selected = selectedOptionId === option.id;
        return (
          <button
            type="button"
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`reference-option ${selected ? "reference-option-selected" : ""}`}
          >
            <span className={`reference-radio ${selected ? "reference-radio-selected" : ""}`}>{option.label}</span>
            <span className="text-left">{option.text || ""}</span>
          </button>
        );
      })}
    </div>
  );
}
