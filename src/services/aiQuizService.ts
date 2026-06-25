import { supabase } from "../lib/supabase";
import type { QuestionType, QuizOption, QuizQuestion, Section } from "../types/quiz";

export type AiGenerationRequest = {
  prompt: string;
  count: number;
  section: Section | "mixed";
  type: QuestionType | "auto";
  language: string;
  difficulty: string;
};

type AiQuestion = {
  section: Section;
  type: QuestionType;
  question: string;
  passage: string;
  audioScript: string;
  imagePrompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

type AiResponse = {
  questions: AiQuestion[];
  assistantMessage: string;
};

export type AiGeneratedQuestion = QuizQuestion & {
  audioScript?: string;
  imagePrompt?: string;
};

function toQuizQuestion(question: AiQuestion, id: number): AiGeneratedQuestion {
  const validSections: Section[] = ["listening", "reading"];
  const validTypes: QuestionType[] = [
    "image_fixed",
    "abc_fixed",
    "abc_blank_fixed",
    "normal",
  ];
  const section = validSections.includes(question.section)
    ? question.section
    : "reading";
  const type = validTypes.includes(question.type) ? question.type : "normal";
  const labels = ["A", "B", "C", "D"] as const;
  const expectedCount =
    type === "abc_fixed" || type === "abc_blank_fixed" ? 3 : 4;
  const sourceOptions = Array.isArray(question.options)
    ? question.options.slice(0, expectedCount).map(String)
    : [];
  while (sourceOptions.length < expectedCount) sourceOptions.push("");
  const options: QuizOption[] = sourceOptions.map((text, index) => ({
    id: `q${id}-${crypto.randomUUID()}-${index}`,
    label: labels[index],
    text,
  }));
  const correctIndex = Math.min(
    options.length - 1,
    Math.max(0, question.correctOptionIndex),
  );
  return {
    id,
    originalNumber: id,
    section,
    type,
    question: String(question.question ?? ""),
    passage: String(question.passage ?? ""),
    image: "",
    audio: "",
    audioScript: String(question.audioScript ?? ""),
    imagePrompt: String(question.imagePrompt ?? ""),
    options,
    correctOptionId: options[correctIndex].id,
    explanation: String(question.explanation ?? ""),
    shuffleQuestion:
      type === "normal" && section !== "listening",
    shuffleOptions: type === "normal",
  };
}

async function generateBatch(
  request: AiGenerationRequest,
  count: number,
  batchNumber: number,
  totalBatches: number,
  startIndex: number,
): Promise<AiResponse> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Phiên Admin đã hết hạn. Vui lòng đăng nhập lại.");

  const response = await fetch("/api/generate-quiz", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...request,
      count,
      batchNumber,
      totalBatches,
      totalCount: request.count,
      startIndex,
    }),
  });
  const payload = await response.json() as AiResponse & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Không thể tạo đề bằng AI.");
  return payload;
}

export async function generateQuizWithAi(
  request: AiGenerationRequest,
  startingId: number,
  onProgress?: (done: number, total: number) => void,
): Promise<{ questions: AiGeneratedQuestion[]; message: string }> {
  // Small batches keep each request below free/on-demand Groq token limits.
  const batchSize = 6;
  const totalBatches = Math.ceil(request.count / batchSize);
  const generated: AiGeneratedQuestion[] = [];
  let message = "";

  for (let batch = 0; batch < totalBatches; batch += 1) {
    const count = Math.min(batchSize, request.count - batch * batchSize);
    const result = await generateBatch(
      request,
      count,
      batch + 1,
      totalBatches,
      batch * batchSize + 1,
    );
    result.questions.forEach((question) => {
      generated.push(toQuizQuestion(question, startingId + generated.length));
    });
    message = result.assistantMessage;
    onProgress?.(generated.length, request.count);
  }

  return { questions: generated, message };
}
