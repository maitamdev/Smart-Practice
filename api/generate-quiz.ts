const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const questionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          section: { type: "string", enum: ["listening", "reading"] },
          type: {
            type: "string",
            enum: ["image_fixed", "abc_fixed", "abc_blank_fixed", "normal"],
          },
          question: { type: "string" },
          passage: { type: "string" },
          audioScript: { type: "string" },
          imagePrompt: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
          },
          correctOptionIndex: { type: "integer" },
          explanation: { type: "string" },
        },
        required: [
          "section",
          "type",
          "question",
          "passage",
          "audioScript",
          "imagePrompt",
          "options",
          "correctOptionIndex",
          "explanation",
        ],
      },
    },
    assistantMessage: { type: "string" },
  },
  required: ["questions", "assistantMessage"],
} as const;

async function verifyAdmin(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!authorization || !supabaseUrl || !anonKey) return false;

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, authorization },
  });
  if (!userResponse.ok) return false;
  const user = await userResponse.json() as { id?: string };
  if (!user.id) return false;

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
    {
      headers: {
        apikey: anonKey,
        authorization,
        accept: "application/json",
      },
    },
  );
  if (!profileResponse.ok) return false;
  const profiles = await profileResponse.json() as Array<{ role?: string }>;
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
  const payload = await response.json().catch(() => ({})) as { message?: string };
  return {
    ok: false,
    message:
      payload.message === "Daily AI quota exceeded"
        ? "Bạn đã dùng hết quota AI hôm nay."
        : payload.message || "Không thể kiểm tra quota AI.",
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    if (!(await verifyAdmin(request))) {
      return Response.json({ error: "Bạn cần đăng nhập Admin." }, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Chưa cấu hình GROQ_API_KEY trên Vercel." },
        { status: 503 },
      );
    }

    try {
      const body = await request.json() as {
        prompt?: string;
        count?: number;
        section?: "listening" | "reading" | "mixed";
        type?: "image_fixed" | "abc_fixed" | "abc_blank_fixed" | "normal" | "auto";
        language?: string;
        difficulty?: string;
        batchNumber?: number;
        totalBatches?: number;
        totalCount?: number;
        startIndex?: number;
      };
      const prompt = body.prompt?.trim();
      const count = Math.min(20, Math.max(1, Number(body.count) || 1));
      if (!prompt) {
        return Response.json({ error: "Prompt không được để trống." }, { status: 400 });
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

      const startIndex = Math.max(1, Number(body.startIndex) || 1);
      const endIndex = startIndex + count - 1;
      const system = `Bạn là chuyên gia thiết kế đề thi ngoại ngữ và EdTech.
Tạo chính xác ${count} câu hỏi có chất lượng cao, không dùng nội dung placeholder.
Đây là các câu số ${startIndex} đến ${endIndex} trong tổng số ${body.totalCount ?? count} câu.
Phần thi yêu cầu: ${body.section ?? "mixed"}.
Định dạng: ${body.type ?? "auto"}.
Ngôn ngữ nội dung: ${body.language ?? "English"}.
Độ khó: ${body.difficulty ?? "trung bình"}.
Đây là batch ${body.batchNumber ?? 1}/${body.totalBatches ?? 1}; tránh lặp ý tưởng.

Quy tắc:
- Nếu section=mixed và type=auto với tổng 175 câu: số 1-6 là image_fixed/listening; số 7 là abc_fixed/listening; số 8-31 là abc_blank_fixed/listening; số 32-100 là normal/listening; số 101-175 là normal/reading.
- Nếu section hoặc type được chỉ định cụ thể, tuân thủ đúng giá trị đó.
- normal và image_fixed có đúng 4 options.
- abc_fixed và abc_blank_fixed có đúng 3 options.
- abc_blank_fixed để question và text options rỗng.
- abc_fixed giữ question nhưng text options rỗng.
- reading nên có passage có nghĩa khi prompt yêu cầu đọc hiểu.
- listening phải tạo audioScript tự nhiên, đủ thông tin để trả lời; passage để rỗng.
- image_fixed phải tạo imagePrompt mô tả ảnh chi tiết; audioScript có nội dung nghe.
- correctOptionIndex bắt đầu từ 0 và phải nằm trong options.
- explanation giải thích ngắn gọn tại sao đáp án đúng.
- Không tự nhận là AI, không thêm markdown.`;

      const groqResponse = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          temperature: 0.45,
          max_completion_tokens: 12000,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "quiz_generation",
              strict: true,
              schema: questionSchema,
            },
          },
        }),
      });

      const payload = await groqResponse.json() as {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string } }>;
      };
      if (!groqResponse.ok) {
        return Response.json(
          { error: payload.error?.message || "Groq không thể tạo đề." },
          { status: groqResponse.status },
        );
      }

      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("Groq trả về nội dung rỗng.");
      return Response.json(JSON.parse(content));
    } catch (cause) {
      return Response.json(
        { error: cause instanceof Error ? cause.message : "Lỗi tạo đề bằng AI." },
        { status: 500 },
      );
    }
  },
};
