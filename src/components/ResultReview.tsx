import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { QuizQuestion, UserAnswers } from "../types/quiz";
import { getReviewStatus } from "../utils/score";
import { AudioPlayer } from "./AudioPlayer";

type ResultReviewProps = {
  question: QuizQuestion;
  answers: UserAnswers;
  displayNumber: number;
  showExplanation?: boolean;
};

export function ResultReview({ question, answers, displayNumber, showExplanation = true }: ResultReviewProps) {
  const status = getReviewStatus(question, answers);
  const userAnswer = answers[question.id];
  const StatusIcon =
    status === "correct" ? CheckCircle2 : status === "incorrect" ? XCircle : CircleDashed;
  const statusStyle =
    status === "correct"
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
      : status === "incorrect"
        ? "text-red-600 bg-red-50 dark:bg-red-950/30"
        : "text-slate-500 bg-slate-100 dark:bg-slate-800";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-extrabold text-slate-900 dark:text-white">Câu {displayNumber}</p>
          <p className="text-xs uppercase tracking-wider text-slate-500">{question.section}</p>
        </div>
        <span className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${statusStyle}`}>
          <StatusIcon size={16} />
          {status === "correct" ? "Chính xác" : status === "incorrect" ? "Chưa đúng" : "Chưa trả lời"}
        </span>
      </div>

      {question.passage && (
        <div className="mb-5 rounded-xl bg-cyan-50 p-4 text-sm leading-6 text-slate-700 dark:bg-cyan-950/20 dark:text-slate-300">
          {question.passage}
        </div>
      )}
      {question.audio && (
        <div className="mb-5">
          <AudioPlayer src={question.audio} compact />
        </div>
      )}
      <h3 className="mb-4 font-bold leading-7 text-slate-900 dark:text-white">
        {question.question || "Nghe nội dung và chọn đáp án phù hợp."}
      </h3>
      <div className="grid gap-2">
        {question.options.map((option) => {
          const isCorrect = option.id === question.correctOptionId;
          const isWrongChoice = option.id === userAnswer && !isCorrect;
          return (
            <div
              key={option.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                isCorrect
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : isWrongChoice
                    ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                    : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400"
              }`}
            >
              <span className="font-extrabold">{option.label}</span>
              <span>{option.text || `Đáp án ${option.label}`}</span>
              {isCorrect && <CheckCircle2 className="ml-auto shrink-0" size={17} />}
              {isWrongChoice && <XCircle className="ml-auto shrink-0" size={17} />}
            </div>
          );
        })}
      </div>
      {showExplanation && question.explanation && (
        <div className="mt-4 rounded-xl bg-indigo-50/80 p-4 text-sm leading-6 text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
          <strong>Giải thích:</strong> {question.explanation}
        </div>
      )}
    </article>
  );
}
