import { useCallback, useEffect, useRef, useState } from "react";
import type { QuizConfig, StoredAttempt, UserAnswers } from "../types/quiz";
import { createShuffledAttempt } from "../utils/questionRules";
import { clearAttempt, loadAttempt, saveAttempt } from "../utils/storage";
import { saveAttemptResult } from "../services/supabaseService";

const emptyAttempt: StoredAttempt = {
  quizId: "",
  quizUpdatedAt: 0,
  shuffledQuestions: [],
  userAnswers: {},
  endTime: null,
  quizStatus: "not_started",
  result: null,
};

export function useQuiz(config: QuizConfig) {
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [attempt, setAttempt] = useState<StoredAttempt>(() => {
    const saved = loadAttempt(config.id);
    if (
      saved?.quizId === config.id &&
      saved.quizUpdatedAt === config.updatedAt
    ) {
      return saved;
    }
    if (saved) clearAttempt(config.id);
    return emptyAttempt;
  });

  useEffect(() => {
    if (attempt.quizStatus !== "not_started") saveAttempt(attempt);
  }, [attempt]);

  const startQuiz = useCallback(() => {
    if (!config.published || config.questions.length === 0) return;
    setAttempt({
      quizId: config.id,
      quizUpdatedAt: config.updatedAt,
      shuffledQuestions: createShuffledAttempt(config.questions),
      userAnswers: {},
      endTime: Date.now() + config.durationMinutes * 60 * 1000,
      quizStatus: "in_progress",
      result: null,
    });
  }, [config]);

  const answerQuestion = useCallback((questionId: number, optionId: string) => {
    setAttempt((current) => ({
      ...current,
      userAnswers: {
        ...current.userAnswers,
        [questionId]: optionId,
      },
    }));
  }, []);

  const submitQuiz = useCallback(async () => {
    if (submittingRef.current || attempt.quizStatus !== "in_progress") return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    const startedAt = attempt.endTime
      ? attempt.endTime - config.durationMinutes * 60 * 1000
      : null;

    try {
      const submission = await saveAttemptResult({
        quizId: config.id,
        answers: attempt.userAnswers,
        startedAt,
      });
      setAttempt((current) => ({
        ...current,
        shuffledQuestions: current.shuffledQuestions.map((question) => ({
          ...question,
          correctOptionId:
            submission.answerKey[String(question.id)] ?? "",
          explanation:
            submission.explanations[String(question.id)] ?? "",
        })),
        quizStatus: "submitted",
        endTime: null,
        result: submission.result,
      }));
    } catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? cause.message
          : "Không thể nộp bài. Vui lòng kiểm tra mạng và thử lại.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [attempt, config.durationMinutes, config.id]);

  const restartQuiz = useCallback(() => {
    if (!config.published || config.questions.length === 0) return;
    clearAttempt(config.id);
    setAttempt({
      quizId: config.id,
      quizUpdatedAt: config.updatedAt,
      shuffledQuestions: createShuffledAttempt(config.questions),
      userAnswers: {},
      endTime: Date.now() + config.durationMinutes * 60 * 1000,
      quizStatus: "in_progress",
      result: null,
    });
  }, [config]);

  const updateAnswers = useCallback((answers: UserAnswers) => {
    setAttempt((current) => ({ ...current, userAnswers: answers }));
  }, []);

  const discardAttempt = useCallback(() => {
    clearAttempt(config.id);
    setAttempt(emptyAttempt);
  }, [config.id]);

  return {
    attempt,
    submitting,
    submitError,
    startQuiz,
    answerQuestion,
    updateAnswers,
    submitQuiz,
    restartQuiz,
    discardAttempt,
  };
}
