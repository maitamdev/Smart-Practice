import { ChevronLeft, ChevronRight, Menu, Moon, Send, Sun } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ConfirmSubmitModal } from "../components/ConfirmSubmitModal";
import { ProgressSummary } from "../components/ProgressSummary";
import { QuestionCard } from "../components/QuestionCard";
import { QuestionNavigator } from "../components/QuestionNavigator";
import { TimerBadge } from "../components/TimerBadge";
import { useTimer } from "../hooks/useTimer";
import type { QuizExperience, QuizQuestion, QuizStructure, UserAnswers } from "../types/quiz";

type QuizPageProps = {
  questions: QuizQuestion[];
  answers: UserAnswers;
  endTime: number | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onAnswer: (questionId: number, optionId: string) => void;
  onSubmit: () => void;
  brandName: string;
  brandBadge: string;
  structure: QuizStructure;
  experience: QuizExperience;
};

const createDisplayGroups = (
  questions: QuizQuestion[],
  structure: QuizStructure,
): number[][] => {
  const groups: number[][] = [];
  let index = 0;
  while (index < questions.length) {
    const question = questions[index];
    const number = question.originalNumber;
    const inListeningGroupRange =
      number >= structure.listeningGroupStart &&
      number <= structure.listeningGroupEnd;
    const inReadingGroupRange =
      number >= structure.readingGroupStart &&
      number <= structure.readingGroupEnd;
    const canGroupReading =
      question.section === "reading" &&
      structure.showReadingDividers &&
      inReadingGroupRange;
    const canGroupListening =
      question.section === "listening" &&
      question.type === "normal" &&
      structure.showListeningDividers &&
      inListeningGroupRange;
    const size =
      question.type === "image_fixed"
        ? 1
        : question.section === "reading"
          ? canGroupReading
            ? structure.readingGroupSize
            : 1
        : question.type === "abc_fixed" || question.type === "abc_blank_fixed"
          ? 2
          : canGroupListening
            ? structure.listeningGroupSize
            : 1;
    const group: number[] = [];
    for (let offset = 0; offset < size && index + offset < questions.length; offset += 1) {
      const candidate = questions[index + offset];
      const sameType =
        candidate.section === question.section &&
        candidate.type === question.type;
      const candidateInRange =
        canGroupReading
          ? candidate.originalNumber >= structure.readingGroupStart &&
            candidate.originalNumber <= structure.readingGroupEnd
          : canGroupListening
            ? candidate.originalNumber >= structure.listeningGroupStart &&
              candidate.originalNumber <= structure.listeningGroupEnd
            : true;
      const sameMode = sameType && candidateInRange;
      if (!sameMode) break;
      group.push(index + offset);
    }
    // Safety guard: every iteration must consume at least one question.
    if (group.length === 0) group.push(index);
    groups.push(group);
    index += group.length;
  }
  return groups;
};

export function QuizPage({
  questions,
  answers,
  endTime,
  theme,
  onToggleTheme,
  onAnswer,
  onSubmit,
  brandName,
  brandBadge,
  structure,
  experience,
}: QuizPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [mobileNavigatorOpen, setMobileNavigatorOpen] = useState(false);
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const handleExpire = useCallback(() => onSubmit(), [onSubmit]);
  const remainingSeconds = useTimer(endTime, handleExpire);
  const groups = useMemo(
    () => createDisplayGroups(questions, structure),
    [questions, structure],
  );
  const groupIndex = Math.max(0, groups.findIndex((group) => group.includes(currentIndex)));
  const activeGroup = groups[groupIndex] ?? [0];
  const groupStart = activeGroup[0] ?? 0;
  const visibleQuestions = activeGroup.map((index) => questions[index]).filter(Boolean);
  const leadQuestion = visibleQuestions[0];
  const navigateTo = (index: number) => {
    const target = groups.find((group) => group.includes(index));
    setCurrentIndex(target?.[0] ?? index);
  };
  const previousStart = groups[Math.max(0, groupIndex - 1)]?.[0] ?? groupStart;
  const nextStart = groups[Math.min(groups.length - 1, groupIndex + 1)]?.[0] ?? groupStart;
  const canSubmit = experience.allowSubmitWithUnanswered || answered === questions.length;
  const requestSubmit = () => {
    if (!canSubmit) return;
    if (experience.confirmBeforeSubmit) setShowSubmitModal(true);
    else onSubmit();
  };
  const selectAnswer = (questionId: number, optionId: string) => {
    onAnswer(questionId, optionId);
    if (experience.autoAdvance && groupIndex < groups.length - 1) {
      window.setTimeout(() => setCurrentIndex(nextStart), 180);
    }
  };
  const dividerClass =
    structure.dividerStyle === "solid"
      ? "divide-y divide-solid divide-slate-300 dark:divide-slate-700 md:divide-x md:divide-y-0"
      : structure.dividerStyle === "soft"
        ? "divide-y divide-slate-100 dark:divide-slate-800 md:divide-x md:divide-y-0"
        : "divide-y divide-dashed divide-red-300 dark:divide-red-900 md:divide-x md:divide-y-0";

  return (
    <main className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-black text-blue-700 dark:text-blue-400 sm:text-base">
            {brandName}
            <span className="rounded bg-blue-700 px-1.5 py-1 text-xs text-white">{brandBadge}</span>
          </div>
          <TimerBadge remainingSeconds={remainingSeconds} />
          <div className="flex items-center gap-2">
            <button type="button" className="header-icon" onClick={onToggleTheme} aria-label="Đổi giao diện">
              {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
            <button type="button" className="primary-button hidden sm:flex" onClick={requestSubmit} disabled={!canSubmit}>
              <Send size={15} /> Nộp bài
            </button>
            <button type="button" className="header-icon lg:hidden" onClick={() => setMobileNavigatorOpen(true)}>
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-3 sm:p-5">
          {experience.showProgress && <div className="mb-3 lg:hidden">
            <ProgressSummary answered={answered} total={questions.length} />
          </div>}
        <div className={`grid min-h-[calc(100vh-105px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${experience.showQuestionNavigator ? "lg:grid-cols-[minmax(0,1fr)_300px]" : ""}`}>
          <section className="flex min-w-0 flex-col">
            <div className="flex-1 p-4 sm:p-6">
              {experience.showSectionLabel && leadQuestion && (
                <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {leadQuestion.section === "listening" ? "Listening" : "Reading"}
                </div>
              )}
              {structure.dividerLabel && visibleQuestions.length > 1 && (
                <div className="mb-4 text-center text-[10px] font-extrabold uppercase tracking-[.2em] text-slate-400">
                  {structure.dividerLabel}
                </div>
              )}
              {leadQuestion?.type === "image_fixed" && (
                <QuestionCard
                  question={visibleQuestions[0]}
                  displayNumber={groupStart + 1}
                  selectedOptionId={answers[visibleQuestions[0].id]}
                  onSelect={(optionId) => selectAnswer(visibleQuestions[0].id, optionId)}
                  layout="image"
                />
              )}

              {(leadQuestion?.type === "abc_fixed" || leadQuestion?.type === "abc_blank_fixed") && (
                <div className="grid h-full gap-0 divide-y divide-slate-200 dark:divide-slate-700 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {visibleQuestions.map((question, offset) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      displayNumber={groupStart + offset + 1}
                      selectedOptionId={answers[question.id]}
                      onSelect={(optionId) => selectAnswer(question.id, optionId)}
                    />
                  ))}
                </div>
              )}

              {leadQuestion?.type === "normal" && leadQuestion.section === "listening" && (
                <div
                  className={`grid h-full gap-0 ${
                    structure.showListeningDividers
                      ? dividerClass
                      : ""
                  }`}
                  style={{
                    gridTemplateColumns:
                      visibleQuestions.length > 1
                        ? `repeat(${visibleQuestions.length}, minmax(0, 1fr))`
                        : undefined,
                  }}
                >
                  {visibleQuestions.map((question, offset) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      displayNumber={groupStart + offset + 1}
                      selectedOptionId={answers[question.id]}
                      onSelect={(optionId) => selectAnswer(question.id, optionId)}
                    />
                  ))}
                </div>
              )}

              {leadQuestion?.section === "reading" && leadQuestion.type !== "image_fixed" && (
                <div className={`grid gap-4 ${structure.showReadingDividers ? dividerClass : ""}`}>
                  {visibleQuestions.map((question, offset) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      displayNumber={groupStart + offset + 1}
                      selectedOptionId={answers[question.id]}
                      onSelect={(optionId) => selectAnswer(question.id, optionId)}
                      layout="reading"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">
              <button
                type="button"
                className="secondary-button"
                disabled={groupIndex === 0}
                onClick={() => setCurrentIndex(previousStart)}
              >
                <ChevronLeft size={17} /> Trước
              </button>
              {experience.showQuestionCounter && <p className="hidden text-xs font-semibold text-slate-500 sm:block">
                Câu {groupStart + 1}–{activeGroup[activeGroup.length - 1] + 1} / {questions.length}
              </p>}
              <button
                type="button"
                className="primary-button"
                disabled={groupIndex >= groups.length - 1}
                onClick={() => setCurrentIndex(nextStart)}
              >
                Tiếp <ChevronRight size={17} />
              </button>
            </div>
          </section>

          {experience.showQuestionNavigator && <aside className="hidden border-l border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/30 lg:block">
            {experience.showProgress && <div className="mb-4 px-1">
              <ProgressSummary answered={answered} total={questions.length} />
            </div>}
            <QuestionNavigator
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              onNavigate={experience.allowQuestionNavigation ? navigateTo : () => undefined}
              allowNavigation={experience.allowQuestionNavigation}
            />
          </aside>}
        </div>
      </div>

      <button
        type="button"
        className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white shadow-xl sm:hidden"
        onClick={requestSubmit}
        disabled={!canSubmit}
        aria-label="Nộp bài"
      >
        <Send size={18} />
      </button>

      {experience.showQuestionNavigator && <div className="lg:hidden">
        <QuestionNavigator
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          onNavigate={experience.allowQuestionNavigation ? navigateTo : () => undefined}
          allowNavigation={experience.allowQuestionNavigation}
          mobileOpen={mobileNavigatorOpen}
          onClose={() => setMobileNavigatorOpen(false)}
        />
      </div>}
      <ConfirmSubmitModal
        open={showSubmitModal}
        answered={answered}
        total={questions.length}
        onCancel={() => setShowSubmitModal(false)}
        onConfirm={onSubmit}
      />
    </main>
  );
}
