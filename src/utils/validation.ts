import type { QuizConfig, QuizQuestion } from "../types/quiz";
import { validateExamStructure } from "./examStructure";

export function validateConfig(config: QuizConfig): string[] {
  const errors: string[] = [];
  if (!config.title.trim()) errors.push("Chưa nhập tên đề");
  if (!config.questions.length) errors.push("Đề chưa có câu hỏi");
  config.questions.forEach((question, index) => {
    if (!question.question.trim() && question.type !== "abc_blank_fixed") errors.push(`Câu ${index + 1} chưa có nội dung`);
    if (!question.options.some((option) => option.id === question.correctOptionId)) errors.push(`Câu ${index + 1} chưa chọn đáp án đúng`);
    const requiresOptionText = question.type === "normal" || question.type === "image_fixed";
    if (requiresOptionText && question.options.some((option) => !option.text.trim())) {
      errors.push(`Câu ${index + 1} còn phương án trống`);
    }
    if (question.type === "image_fixed" && !question.image?.trim()) errors.push(`Câu ${index + 1} chưa có hình ảnh`);
    if (question.section === "listening" && !question.audio?.trim()) {
      errors.push(`Câu ${index + 1} Listening chưa có audio`);
    }
  });
  if (config.structure.enabled) {
    const structure = config.structure;
    if (structure.listeningEnd >= structure.totalQuestions) {
      errors.push("Mốc kết thúc Listening phải nhỏ hơn tổng số câu");
    }
    if (structure.readingStart !== structure.listeningEnd + 1) {
      errors.push("Reading phải bắt đầu ngay sau phần Listening");
    }
    if (structure.imageQuestionsEnd >= structure.abcQuestionNumber) {
      errors.push("Khoảng câu hình ảnh phải kết thúc trước câu ABC có nội dung");
    }
    if (structure.abcQuestionNumber > structure.abcBlankEnd) {
      errors.push("Câu ABC có nội dung phải nằm trước mốc kết thúc ABC trống");
    }
    if (structure.abcBlankEnd >= structure.listeningEnd) {
      errors.push("Khoảng ABC trống phải kết thúc trước phần Listening thường");
    }
    if (structure.listeningGroupSize < 1 || structure.listeningGroupSize > 6) {
      errors.push("Số câu mỗi nhóm phải từ 1 đến 6");
    }
    if (structure.readingGroupSize < 1 || structure.readingGroupSize > 6) {
      errors.push("Số câu mỗi nhóm Reading phải từ 1 đến 6");
    }
    const ranges: Array<[string, number, number]> = [
      ["chia nhóm Listening", structure.listeningGroupStart, structure.listeningGroupEnd],
      ["xáo câu Listening", structure.shuffleListeningStart, structure.shuffleListeningEnd],
      ["xáo câu Reading", structure.shuffleReadingStart, structure.shuffleReadingEnd],
      ["xáo đáp án", structure.shuffleOptionsStart, structure.shuffleOptionsEnd],
      ["chia nhóm Reading", structure.readingGroupStart, structure.readingGroupEnd],
      ["bắt buộc passage", structure.passageRequiredStart, structure.passageRequiredEnd],
    ];
    ranges.forEach(([label, start, end]) => {
      if (start > end) errors.push(`Phạm vi ${label}: câu bắt đầu phải nhỏ hơn hoặc bằng câu kết thúc`);
      if (start < 1 || end > structure.totalQuestions) {
        errors.push(`Phạm vi ${label} phải nằm trong 1–${structure.totalQuestions}`);
      }
    });
    errors.push(...validateExamStructure(config.questions, config.structure));
  }
  return errors;
}
