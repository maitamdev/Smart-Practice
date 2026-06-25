export type Section = "listening" | "reading";

export type QuestionType =
  | "image_fixed"
  | "abc_fixed"
  | "abc_blank_fixed"
  | "normal";

export type QuizOption = {
  id: string;
  label: "A" | "B" | "C" | "D";
  text: string;
};

export type QuizQuestion = {
  id: number;
  originalNumber: number;
  section: Section;
  type: QuestionType;
  question: string;
  passage?: string;
  image?: string;
  audio?: string;
  audioScript?: string;
  imagePrompt?: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation?: string;
  shuffleQuestion: boolean;
  shuffleOptions: boolean;
};

export type QuizStatus = "not_started" | "in_progress" | "submitted";
export type UserAnswers = Record<number, string>;
export type ReviewStatus = "correct" | "incorrect" | "unanswered";

export type QuizResult = {
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  submittedAt: number;
};

export type StoredAttempt = {
  quizId: string;
  shuffledQuestions: QuizQuestion[];
  userAnswers: UserAnswers;
  endTime: number | null;
  quizStatus: QuizStatus;
  result: QuizResult | null;
};

export type QuizConfig = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  durationMinutes: number;
  brandName: string;
  brandBadge: string;
  published: boolean;
  updatedAt: number;
  questions: QuizQuestion[];
  structure: QuizStructure;
  experience: QuizExperience;
};

export type QuizStructure = {
  enabled: boolean;
  preset: "standard_175" | "custom";
  totalQuestions: number;
  listeningEnd: number;
  imageQuestionsEnd: number;
  abcQuestionNumber: number;
  abcBlankEnd: number;
  listeningGroupSize: number;
  listeningGroupStart: number;
  listeningGroupEnd: number;
  readingStart: number;
  showListeningDividers: boolean;
  dividerStyle: "dashed" | "solid" | "soft";
  dividerLabel: string;
  shuffleListeningNormal: boolean;
  shuffleListeningStart: number;
  shuffleListeningEnd: number;
  shuffleReading: boolean;
  shuffleReadingStart: number;
  shuffleReadingEnd: number;
  shuffleNormalOptions: boolean;
  shuffleOptionsStart: number;
  shuffleOptionsEnd: number;
  readingGroupSize: number;
  showReadingDividers: boolean;
  readingGroupStart: number;
  readingGroupEnd: number;
  requireReadingPassage: boolean;
  passageRequiredStart: number;
  passageRequiredEnd: number;
};

export type QuizExperience = {
  showProgress: boolean;
  showQuestionNavigator: boolean;
  allowQuestionNavigation: boolean;
  autoAdvance: boolean;
  allowSubmitWithUnanswered: boolean;
  confirmBeforeSubmit: boolean;
  showSectionLabel: boolean;
  showQuestionCounter: boolean;
  showResultDetails: boolean;
  showExplanations: boolean;
};
