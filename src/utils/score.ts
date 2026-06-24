import type {
  QuizQuestion,
  QuizResult,
  ReviewStatus,
  UserAnswers,
} from "../types/quiz";

export function getReviewStatus(
  question: QuizQuestion,
  answers: UserAnswers,
): ReviewStatus {
  const answer = answers[question.id];
  if (!answer) return "unanswered";
  return answer === question.correctOptionId ? "correct" : "incorrect";
}

export function calculateScore(
  questions: readonly QuizQuestion[],
  answers: UserAnswers,
): QuizResult {
  let correct = 0;
  let incorrect = 0;

  questions.forEach((question) => {
    const status = getReviewStatus(question, answers);
    if (status === "correct") correct += 1;
    if (status === "incorrect") incorrect += 1;
  });

  const unanswered = questions.length - correct - incorrect;

  return {
    correct,
    incorrect,
    unanswered,
    percentage: questions.length
      ? Math.round((correct / questions.length) * 100)
      : 0,
    submittedAt: Date.now(),
  };
}
