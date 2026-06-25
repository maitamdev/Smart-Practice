import type { QuizOption, QuizQuestion } from "../types/quiz";
import { shuffleArray } from "./shuffle";

const relabelOptions = (options: QuizOption[]): QuizOption[] =>
  options.map((option, index) => ({
    ...option,
    label: ["A", "B", "C", "D"][index] as QuizOption["label"],
  }));

const prepareQuestion = (question: QuizQuestion): QuizQuestion => ({
  ...question,
  options: question.shuffleOptions
    ? relabelOptions(shuffleArray(question.options))
    : question.options.map((option) => ({ ...option })),
});

export function createShuffledAttempt(source: readonly QuizQuestion[]): QuizQuestion[] {
  const ordered = [...source].sort(
    (a, b) => a.originalNumber - b.originalNumber,
  );
  const pools: Record<QuizQuestion["section"], QuizQuestion[]> = {
    listening: shuffleArray(
      ordered.filter(
        (question) =>
          question.section === "listening" && question.shuffleQuestion,
      ),
    ),
    reading: shuffleArray(
      ordered.filter(
        (question) =>
          question.section === "reading" && question.shuffleQuestion,
      ),
    ),
  };
  const poolIndexes: Record<QuizQuestion["section"], number> = {
    listening: 0,
    reading: 0,
  };

  return ordered.map((question) => {
    const selected = question.shuffleQuestion
      ? pools[question.section][poolIndexes[question.section]++]
      : question;
    return prepareQuestion(selected);
  });
}

export const shouldRenderGroupDivider = (
  question: QuizQuestion,
  indexWithinAttempt: number,
): boolean =>
  question.section === "listening" &&
  question.type === "normal" &&
  indexWithinAttempt >= 33 &&
  (indexWithinAttempt - 30) % 3 === 0;
