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
  const fixedListening = source
    .filter((question) => question.section === "listening" && !question.shuffleQuestion)
    .sort((a, b) => a.originalNumber - b.originalNumber);
  const listeningNormal = source.filter(
    (question) => question.section === "listening" && question.shuffleQuestion,
  );
  const fixedReading = source
    .filter((question) => question.section === "reading" && !question.shuffleQuestion)
    .sort((a, b) => a.originalNumber - b.originalNumber);
  const reading = source.filter(
    (question) => question.section === "reading" && question.shuffleQuestion,
  );

  return [
    ...fixedListening,
    ...shuffleArray(listeningNormal),
    ...fixedReading,
    ...shuffleArray(reading),
  ].map(prepareQuestion);
}

export const shouldRenderGroupDivider = (
  question: QuizQuestion,
  indexWithinAttempt: number,
): boolean =>
  question.section === "listening" &&
  question.type === "normal" &&
  indexWithinAttempt >= 33 &&
  (indexWithinAttempt - 30) % 3 === 0;
