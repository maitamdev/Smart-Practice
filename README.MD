# Smart Practice

Nền tảng tạo và làm bài thi Listening & Reading bằng React, TypeScript, Tailwind CSS, Supabase và Groq.

## Chạy dự án

```bash
npm install
copy .env.example .env.local
npm run dev
```

Biến môi trường:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
GROQ_API_KEY=your-server-side-groq-key
```

Không commit `.env.local`, `service_role` hoặc Groq API key. `GROQ_API_KEY` chỉ được cấu hình phía server/Vercel, không thêm tiền tố `VITE_`.

## Migration Supabase

Chạy lần lượt trong Supabase SQL Editor:

1. `supabase/migrations/202606250001_initial_schema.sql`
2. `supabase/migrations/202606250002_multi_tenant_quizzes.sql`
3. `supabase/migrations/202606250003_ai_quota.sql`

Các migration tạo Auth, RLS, Storage, kho đề riêng cho từng Admin, link học viên, kết quả và quota AI.

## AI Quiz Copilot

Trong Studio, mở **Tạo bằng prompt**:

- Nhập yêu cầu tự nhiên.
- Chọn 1–175 câu, ngôn ngữ và độ khó.
- Chọn Listening/Reading hoặc để AI tự quyết định.
- Groq tự tạo câu hỏi, đáp án, phương án nhiễu và giải thích.
- Với bộ 175 câu, AI tự chia batch và áp dụng cấu trúc chuẩn khi chọn chế độ tự động.

Listening được tạo thêm kịch bản audio; Admin vẫn cần tải file audio thật trước khi xuất bản.

## Deploy Vercel

Thêm ba biến môi trường trên vào Production, Preview và Development. Build command là `npm run build`, output là `dist`.

Supabase Authentication URL Configuration:

```text
Site URL: https://smart-practice.vercel.app
Redirect URLs:
https://smart-practice.vercel.app/**
http://localhost:5173/**
```

## Kiểm tra

```bash
npm run build
npm audit
```
