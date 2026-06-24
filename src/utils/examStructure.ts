import type { QuizOption, QuizQuestion, QuizStructure } from "../types/quiz";
import { createEmptyQuestion } from "./adminQuestions";

const labels = ["A", "B", "C", "D"] as const;

function resizeOptions(question: QuizQuestion, count: 3 | 4): QuizOption[] {
  return labels.slice(0, count).map((label, index) => {
    const existing = question.options[index];
    return existing
      ? { ...existing, label }
      : {
          id: `q${question.id}-${crypto.randomUUID()}-${index}`,
          label,
          text: "",
        };
  });
}

export function applyExamStructure(
  source: QuizQuestion[],
  structure: QuizStructure,
): QuizQuestion[] {
  const byNumber = new Map(source.map((question) => [question.originalNumber, question]));

  return Array.from({ length: structure.totalQuestions }, (_, index) => {
    const number = index + 1;
    const existing = byNumber.get(number) ?? createEmptyQuestion(number);
    const isImage = number <= structure.imageQuestionsEnd;
    const isQuestionSeven = number === structure.abcQuestionNumber;
    const isBlankAbc =
      number > structure.abcQuestionNumber && number <= structure.abcBlankEnd;
    const isListening = number <= structure.listeningEnd;
    const type = isImage
      ? "image_fixed"
      : isQuestionSeven
        ? "abc_fixed"
        : isBlankAbc
          ? "abc_blank_fixed"
          : "normal";
    const optionCount = isQuestionSeven || isBlankAbc ? 3 : 4;
    const options = resizeOptions(existing, optionCount);
    const correctStillExists = options.some(
      (option) => option.id === existing.correctOptionId,
    );

    return {
      ...existing,
      id: existing.id || number,
      originalNumber: number,
      section: isListening ? "listening" : "reading",
      type,
      question: isBlankAbc ? "" : existing.question,
      passage: isListening ? "" : existing.passage,
      image: isImage ? existing.image : "",
      options: isQuestionSeven || isBlankAbc
        ? options.map((option) => ({ ...option, text: "" }))
        : options,
      correctOptionId: correctStillExists ? existing.correctOptionId : options[0].id,
      shuffleQuestion:
        number > structure.abcBlankEnd &&
        ((structure.shuffleListeningNormal &&
          number >= structure.shuffleListeningStart &&
          number <= structure.shuffleListeningEnd) ||
          (structure.shuffleReading &&
            number >= structure.shuffleReadingStart &&
            number <= structure.shuffleReadingEnd)),
      shuffleOptions:
        number > structure.abcBlankEnd &&
        structure.shuffleNormalOptions &&
        number >= structure.shuffleOptionsStart &&
        number <= structure.shuffleOptionsEnd,
    };
  });
}

export function validateExamStructure(
  questions: QuizQuestion[],
  structure: QuizStructure,
): string[] {
  const errors: string[] = [];
  if (questions.length !== structure.totalQuestions) {
    errors.push(`Đề phải có đúng ${structure.totalQuestions} câu`);
  }

  questions.forEach((question, index) => {
    const number = index + 1;
    if (question.originalNumber !== number) errors.push(`Sai thứ tự tại câu ${number}`);
    if (number <= structure.imageQuestionsEnd) {
      if (question.type !== "image_fixed") errors.push(`Câu ${number} phải là câu hình ảnh`);
      if (question.shuffleQuestion || question.shuffleOptions) errors.push(`Câu ${number} không được xáo`);
    } else if (number === structure.abcQuestionNumber) {
      if (question.type !== "abc_fixed" || question.options.length !== 3) {
        errors.push(`Câu ${number} phải là ABC cố định`);
      }
      if (question.shuffleQuestion || question.shuffleOptions) {
        errors.push(`Câu ${number} không được xáo`);
      }
      if (question.options.some((option) => option.text.trim())) {
        errors.push(`Đáp án câu ${number} phải để trống, chỉ hiển thị A/B/C`);
      }
    } else if (number <= structure.abcBlankEnd) {
      if (question.type !== "abc_blank_fixed" || question.options.length !== 3) {
        errors.push(`Câu ${number} phải là ABC để trống`);
      }
      if (question.shuffleQuestion || question.shuffleOptions) {
        errors.push(`Câu ${number} không được xáo`);
      }
      if (question.question.trim()) {
        errors.push(`Nội dung câu ${number} phải để trống`);
      }
      if (question.options.some((option) => option.text.trim())) {
        errors.push(`Đáp án câu ${number} phải để trống, chỉ hiển thị A/B/C`);
      }
    } else if (question.type !== "normal" || question.options.length !== 4) {
      errors.push(`Câu ${number} phải là ABCD bình thường`);
    } else {
      const expectedQuestionShuffle =
        (structure.shuffleListeningNormal &&
          number >= structure.shuffleListeningStart &&
          number <= structure.shuffleListeningEnd) ||
        (structure.shuffleReading &&
          number >= structure.shuffleReadingStart &&
          number <= structure.shuffleReadingEnd);
      if (question.shuffleQuestion !== expectedQuestionShuffle) {
        errors.push(`Câu ${number} có thiết lập xáo câu chưa đúng`);
      }
      const expectedOptionShuffle =
        structure.shuffleNormalOptions &&
        number >= structure.shuffleOptionsStart &&
        number <= structure.shuffleOptionsEnd;
      if (question.shuffleOptions !== expectedOptionShuffle) {
        errors.push(`Câu ${number} có thiết lập xáo đáp án chưa đúng`);
      }
    }
    if (number <= structure.listeningEnd && question.section !== "listening") {
      errors.push(`Câu ${number} phải thuộc Listening`);
    }
    if (number >= structure.readingStart && question.section !== "reading") {
      errors.push(`Câu ${number} phải thuộc Reading`);
    }
    if (
      structure.requireReadingPassage &&
      number >= structure.passageRequiredStart &&
      number <= structure.passageRequiredEnd &&
      !question.passage?.trim()
    ) {
      errors.push(`Câu ${number} chưa có passage bắt buộc`);
    }
  });

  return errors;
}
