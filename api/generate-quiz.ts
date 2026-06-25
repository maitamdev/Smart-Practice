const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

type GroqPayload = {
  error?: {
    message?: string;
    failed_generation?: string;
  };
  choices?: Array<{ message?: { content?: string } }>;
};

function parseJsonCandidate(value?: string): {
  questions?: unknown[];
  assistantMessage?: string;
} | null {
  if (!value) return null;
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace
      ? cleaned.slice(firstBrace, lastBrace + 1)
      : cleaned;
  try {
    return JSON.parse(candidate) as {
      questions?: unknown[];
      assistantMessage?: string;
    };
  } catch {
    return null;
  }
}

async function verifyAdmin(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!authorization || !supabaseUrl || !anonKey) return false;

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, authorization },
  });
  if (!userResponse.ok) return false;
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) return false;

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
    {
      headers: { apikey: anonKey, authorization, accept: "application/json" },
    },
  );
  if (!profileResponse.ok) return false;
  const profiles = (await profileResponse.json()) as Array<{ role?: string }>;
  return profiles[0]?.role === "admin";
}

async function consumeQuota(
  request: Request,
  questionCount: number,
): Promise<{ ok: boolean; message?: string }> {
  const authorization = request.headers.get("authorization");
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!authorization || !supabaseUrl || !anonKey) {
    return { ok: false, message: "Thiếu cấu hình Supabase." };
  }
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_ai_quota`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization,
      "content-type": "application/json",
    },
    body: JSON.stringify({ question_count: questionCount }),
  });
  if (response.ok) return { ok: true };
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  };
  return {
    ok: false,
    message:
      payload.message === "Daily AI quota exceeded"
        ? "Bạn đã dùng hết quota AI hôm nay."
        : payload.message || "Không thể kiểm tra quota AI.",
  };
}

function buildSystemPrompt(input: {
  count: number;
  startIndex: number;
  totalCount: number;
  section: string;
  type: string;
  language: string;
  difficulty: string;
  batchNumber: number;
  totalBatches: number;
}): string {
  const endIndex = input.startIndex + input.count - 1;
  return `Bạn là chuyên gia thiết kế đề thi ngoại ngữ và EdTech.
Tạo chính xác ${input.count} câu hỏi có chất lượng cao, không dùng placeholder.
Đây là câu số ${input.startIndex} đến ${endIndex} trong tổng ${input.totalCount} câu.
Phần thi: ${input.section}. Định dạng: ${input.type}.
Ngôn ngữ: ${input.language}. Độ khó: ${input.difficulty}.
Batch ${input.batchNumber}/${input.totalBatches}; tránh lặp ý tưởng.

Quy tắc:
- Nếu section=mixed và type=auto với tổng 175 câu: 1-6 image_fixed/listening; 7 abc_fixed/listening; 8-31 abc_blank_fixed/listening; 32-100 normal/listening; 101-175 normal/reading.
- Nếu section/type cụ thể, tuân thủ giá trị đó.
- normal và image_fixed có đúng 4 options.
- abc_fixed và abc_blank_fixed có đúng 3 options.
- abc_blank_fixed để question và options rỗng.
- abc_fixed giữ question nhưng options rỗng.
- reading tạo passage khi là bài đọc hiểu.
- listening tạo audioScript tự nhiên và passage rỗng.
- image_fixed tạo imagePrompt chi tiết và audioScript.
- correctOptionIndex bắt đầu từ 0 và nằm trong options.
- explanation ngắn gọn, chính xác.

Chỉ trả JSON object theo mẫu:
{"questions":[{"section":"listening","type":"normal","question":"","passage":"","audioScript":"","imagePrompt":"","options":["A","B","C","D"],"correctOptionIndex":0,"explanation":""}],"assistantMessage":""}
Không dùng markdown, code fence hoặc văn bản ngoài JSON.`;
}

async function callGroq(input: {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  jsonMode: boolean;
  retryNote?: string;
}): Promise<{ response: Response; payload: GroqPayload }> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: "system",
          content: `${input.system}\n${input.retryNote ?? ""}`,
        },
        { role: "user", content: input.prompt },
      ],
      temperature: 0.2,
      max_completion_tokens: 3800,
      ...(input.jsonMode
        ? { response_format: { type: "json_object" } }
        : {}),
    }),
  });
  return {
    response,
    payload: (await response.json()) as GroqPayload,
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    if (!(await verifyAdmin(request))) {
      return Response.json(
        { error: "Bạn cần đăng nhập Admin." },
        { status: 401 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Chưa cấu hình GROQ_API_KEY trên Vercel." },
        { status: 503 },
      );
    }

    try {
      const body = (await request.json()) as {
        prompt?: string;
        count?: number;
        section?: "listening" | "reading" | "mixed";
        type?:
          | "image_fixed"
          | "abc_fixed"
          | "abc_blank_fixed"
          | "normal"
          | "auto";
        language?: string;
        difficulty?: string;
        batchNumber?: number;
        totalBatches?: number;
        totalCount?: number;
        startIndex?: number;
      };
      const prompt = body.prompt?.trim();
      const count = Math.min(6, Math.max(1, Number(body.count) || 1));
      if (!prompt) {
        return Response.json(
          { error: "Prompt không được để trống." },
          { status: 400 },
        );
      }
      if (prompt.length > 8000) {
        return Response.json(
          { error: "Prompt quá dài. Tối đa 8.000 ký tự." },
          { status: 400 },
        );
      }

      const quota = await consumeQuota(request, count);
      if (!quota.ok) {
        return Response.json({ error: quota.message }, { status: 429 });
      }

      const system = buildSystemPrompt({
        count,
        startIndex: Math.max(1, Number(body.startIndex) || 1),
        totalCount: Number(body.totalCount) || count,
        section: body.section ?? "mixed",
        type: body.type ?? "auto",
        language: body.language ?? "English",
        difficulty: body.difficulty ?? "Trung bình",
        batchNumber: Number(body.batchNumber) || 1,
        totalBatches: Number(body.totalBatches) || 1,
      });

      const attempts = [
        { model: PRIMARY_MODEL, jsonMode: true, note: "" },
        {
          model: FALLBACK_MODEL,
          jsonMode: true,
          note: "Lượt trước thất bại. Hãy dùng chuỗi ngắn và đảm bảo JSON hợp lệ.",
        },
        {
          model: FALLBACK_MODEL,
          jsonMode: false,
          note: "Chỉ in JSON thuần bắt đầu bằng { và kết thúc bằng }.",
        },
      ];

      let lastError = "Groq không thể tạo JSON hợp lệ.";
      for (const attempt of attempts) {
        const { response, payload } = await callGroq({
          apiKey,
          model: attempt.model,
          system,
          prompt,
          jsonMode: attempt.jsonMode,
          retryNote: attempt.note,
        });
        const parsed =
          parseJsonCandidate(payload.choices?.[0]?.message?.content) ??
          parseJsonCandidate(payload.error?.failed_generation);

        if (
          parsed &&
          Array.isArray(parsed.questions) &&
          parsed.questions.length === count
        ) {
          return Response.json({
            questions: parsed.questions,
            assistantMessage:
              parsed.assistantMessage ?? `Đã tạo ${count} câu hỏi.`,
          });
        }

        lastError =
          payload.error?.message ||
          (parsed
            ? `AI chỉ tạo ${parsed.questions?.length ?? 0}/${count} câu.`
            : "AI trả về JSON không hợp lệ.");
        if (response.status === 401 || response.status === 403) break;
      }

      return Response.json(
        {
          error: `${lastError} Hệ thống đã thử lại 3 lần. Hãy rút ngắn prompt hoặc giảm số câu.`,
        },
        { status: 422 },
      );
    } catch (cause) {
      return Response.json(
        {
          error:
            cause instanceof Error
              ? cause.message
              : "Lỗi tạo đề bằng AI.",
        },
        { status: 500 },
      );
    }
  },
};
