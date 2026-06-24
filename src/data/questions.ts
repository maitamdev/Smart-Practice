import type { QuizConfig, QuizQuestion } from "../types/quiz";

/**
 * PRODUCTION DATA
 *
 * Ứng dụng không còn chứa câu hỏi hoặc đáp án mẫu.
 * Dữ liệu thật được tạo trong khu Admin hoặc nhập bằng file JSON.
 */
export const questions: QuizQuestion[] = [];

export const defaultQuizConfig: QuizConfig = {
  id: "smart-practice-production",
  title: "Smart Practice",
  subtitle: "",
  description: "",
  durationMinutes: 45,
  brandName: "Smart Practice",
  brandBadge: "",
  published: false,
  updatedAt: 0,
  questions,
  structure: {
    enabled: true,
    preset: "standard_175",
    totalQuestions: 175,
    listeningEnd: 100,
    imageQuestionsEnd: 6,
    abcQuestionNumber: 7,
    abcBlankEnd: 31,
    listeningGroupSize: 3,
    listeningGroupStart: 32,
    listeningGroupEnd: 100,
    readingStart: 101,
    showListeningDividers: true,
    dividerStyle: "dashed",
    dividerLabel: "",
    shuffleListeningNormal: true,
    shuffleListeningStart: 32,
    shuffleListeningEnd: 100,
    shuffleReading: true,
    shuffleReadingStart: 101,
    shuffleReadingEnd: 175,
    shuffleNormalOptions: true,
    shuffleOptionsStart: 32,
    shuffleOptionsEnd: 175,
    readingGroupSize: 1,
    showReadingDividers: false,
    readingGroupStart: 101,
    readingGroupEnd: 175,
    requireReadingPassage: false,
    passageRequiredStart: 101,
    passageRequiredEnd: 175,
  },
  experience: {
    showProgress: true,
    showQuestionNavigator: true,
    allowQuestionNavigation: true,
    autoAdvance: false,
    allowSubmitWithUnanswered: true,
    confirmBeforeSubmit: true,
    showSectionLabel: true,
    showQuestionCounter: true,
    showResultDetails: true,
    showExplanations: true,
  },
};
