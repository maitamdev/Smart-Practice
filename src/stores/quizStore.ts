import { create } from "zustand";
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

interface QuizState {
  config: QuizConfig | null;
  attempt: StoredAttempt;
  submitting: boolean;
  submitError: string;

  initialize: (config: QuizConfig) => void;
  startQuiz: () => void;
  answerQuestion: (questionId: number, optionId: string) => void;
  submitQuiz: () => Promise<void>;
  restartQuiz: () => void;
  updateAnswers: (answers: UserAnswers) => void;
  discardAttempt: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  config: null,
  attempt: emptyAttempt,
  submitting: false,
  submitError: "",

  initialize: (config: QuizConfig) => {
    set((state) => {
      if (state.config?.id === config.id && state.config?.updatedAt === config.updatedAt) {
        return state;
      }
      const saved = loadAttempt(config.id);
      let attempt = emptyAttempt;
      if (saved?.quizId === config.id && saved.quizUpdatedAt === config.updatedAt) {
        attempt = saved;
      } else if (saved) {
        clearAttempt(config.id);
      }
      return { config, attempt, submitError: "", submitting: false };
    });
  },

  startQuiz: () => {
    const { config } = get();
    if (!config || !config.published || config.questions.length === 0) return;
    const attempt: StoredAttempt = {
      quizId: config.id,
      quizUpdatedAt: config.updatedAt,
      shuffledQuestions: createShuffledAttempt(config.questions),
      userAnswers: {},
      endTime: Date.now() + config.durationMinutes * 60 * 1000,
      quizStatus: "in_progress",
      result: null,
    };
    saveAttempt(attempt);
    set({ attempt });
  },

  answerQuestion: (questionId: number, optionId: string) => {
    set((state) => {
      const attempt = {
        ...state.attempt,
        userAnswers: { ...state.attempt.userAnswers, [questionId]: optionId },
      };
      if (attempt.quizStatus !== "not_started") saveAttempt(attempt);
      return { attempt };
    });
  },

  submitQuiz: async () => {
    const { attempt, config, submitting } = get();
    if (submitting || attempt.quizStatus !== "in_progress" || !config) return;

    set({ submitting: true, submitError: "" });
    const startedAt = attempt.endTime
      ? attempt.endTime - config.durationMinutes * 60 * 1000
      : null;

    try {
      const submission = await saveAttemptResult({
        quizId: config.id,
        answers: attempt.userAnswers,
        startedAt,
      });

      const newAttempt = {
        ...attempt,
        shuffledQuestions: attempt.shuffledQuestions.map((question) => ({
          ...question,
          correctOptionId: submission.answerKey[String(question.id)] ?? "",
          explanation: submission.explanations[String(question.id)] ?? "",
        })),
        quizStatus: "submitted" as const,
        endTime: null,
        result: submission.result,
      };
      
      saveAttempt(newAttempt);
      set({ attempt: newAttempt, submitting: false });
    } catch (cause) {
      set({
        submitError: cause instanceof Error ? cause.message : "Không thể nộp bài. Vui lòng thử lại.",
        submitting: false,
      });
    }
  },

  restartQuiz: () => {
    const { config } = get();
    if (!config || !config.published || config.questions.length === 0) return;
    clearAttempt(config.id);
    const attempt: StoredAttempt = {
      quizId: config.id,
      quizUpdatedAt: config.updatedAt,
      shuffledQuestions: createShuffledAttempt(config.questions),
      userAnswers: {},
      endTime: Date.now() + config.durationMinutes * 60 * 1000,
      quizStatus: "in_progress",
      result: null,
    };
    saveAttempt(attempt);
    set({ attempt });
  },

  updateAnswers: (answers: UserAnswers) => {
    set((state) => {
      const attempt = { ...state.attempt, userAnswers: answers };
      if (attempt.quizStatus !== "not_started") saveAttempt(attempt);
      return { attempt };
    });
  },

  discardAttempt: () => {
    const { config } = get();
    if (config) clearAttempt(config.id);
    set({ attempt: emptyAttempt });
  },
}));
