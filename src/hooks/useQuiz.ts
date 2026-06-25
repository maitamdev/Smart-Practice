import { useCallback, useEffect, useState } from "react";
import type { QuizConfig, StoredAttempt, UserAnswers } from "../types/quiz";
import { createShuffledAttempt } from "../utils/questionRules";
import { calculateScore } from "../utils/score";
import { clearAttempt, loadAttempt, saveAttempt } from "../utils/storage";
import { saveAttemptResult } from "../services/supabaseService";

const emptyAttempt: StoredAttempt = {
  quizId: "",
  shuffledQuestions: [],
  userAnswers: {},
  endTime: null,
  quizStatus: "not_started",
  result: null,
};

export function useQuiz(config: QuizConfig) {
  const [attempt, setAttempt] = useState<StoredAttempt>(() => {
    const saved = loadAttempt();
    if (saved?.quizId === config.id) return saved;
    if (saved) clearAttempt();
    return emptyAttempt;
  });

  useEffect(() => {
    if (attempt.quizStatus !== "not_started") saveAttempt(attempt);
  }, [attempt]);

  const startQuiz = useCallback(() => {
    if (!config.published || config.questions.length === 0) return;
    setAttempt({
      quizId: config.id,
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

  const submitQuiz = useCallback(() => {
    setAttempt((current) => {
      if (current.quizStatus !== "in_progress") return current;
      const result = calculateScore(current.shuffledQuestions, current.userAnswers);
      const startedAt = current.endTime
        ? current.endTime - config.durationMinutes * 60 * 1000
        : null;
      void saveAttemptResult({
        quizId: config.id,
        answers: current.userAnswers,
        result,
        startedAt,
      }).catch(() => {
        // The local result remains available and can still be reviewed offline.
      });
      return {
        ...current,
        quizStatus: "submitted",
        endTime: null,
        result,
      };
    });
  }, [config.durationMinutes, config.id]);

  const restartQuiz = useCallback(() => {
    if (!config.published || config.questions.length === 0) return;
    clearAttempt();
    setAttempt({
      quizId: config.id,
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
    clearAttempt();
    setAttempt(emptyAttempt);
  }, []);

  return {
    attempt,
    startQuiz,
    answerQuestion,
    updateAnswers,
    submitQuiz,
    restartQuiz,
    discardAttempt,
  };
}
