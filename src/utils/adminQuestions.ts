import type { QuestionType, QuizOption, QuizQuestion, Section } from "../types/quiz";

const labels = ["A", "B", "C", "D"] as const;

export function createEmptyQuestion(
  id: number,
  type: QuestionType = "normal",
  section: Section = "listening",
): QuizQuestion {
  const optionCount = type === "abc_fixed" || type === "abc_blank_fixed" ? 3 : 4;
  const options: QuizOption[] = labels.slice(0, optionCount).map((label, index) => ({
    id: `q${id}-${crypto.randomUUID()}-${index}`,
    label,
    text: "",
  }));

  return {
    id,
    originalNumber: id,
    section,
    type,
    question: "",
    passage: "",
    image: "",
    audio: "",
    options,
    correctOptionId: options[0].id,
    explanation: "",
    shuffleQuestion: type === "normal",
    shuffleOptions: type === "normal",
  };
}

export function normalizeQuestionNumbers(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((question, index) => ({
    ...question,
    originalNumber: index + 1,
  }));
}

export function generateQuestionsFromPrompt(
  _prompt: string,
  count: number,
  section: Section,
  type: QuestionType,
  startingId: number,
): QuizQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    return createEmptyQuestion(startingId + index, type, section);
  });
}
