# Smart Practice

Nền tảng tạo và làm bài thi Listening & Reading, dùng React, TypeScript, Tailwind CSS và Supabase.

## Chạy dự án

```bash
npm install
copy .env.example .env.local
npm run dev
```

Cấu hình `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Không commit `.env.local` hoặc `service_role` key.

## Thiết lập Supabase bắt buộc

Project hiện tại: `xftaluzvnxhizdeckvuu`.

1. Mở Supabase Dashboard → **SQL Editor**.
2. Tạo query mới.
3. Sao chép toàn bộ nội dung file:
   `supabase/migrations/202606250001_initial_schema.sql`.
4. Chọn **Run**.
5. Tiếp tục chạy:
   `supabase/migrations/202606250002_multi_tenant_quizzes.sql`.
6. Trong Authentication → URL Configuration, thêm URL production và URL local.
7. Tạo tài khoản Admin từ giao diện web.

Migration tạo:

- Supabase Auth và bảng `profiles`.
- Phân quyền `admin`/`student`.
- Bảng draft và đề đã xuất bản.
- Bảng kết quả bài thi.
- RLS policies.
- Storage bucket `quiz-assets`.
- RPC xuất bản đề.
- Kho đề riêng theo từng Admin.
- Link học viên riêng cho từng đề.
- Cô lập đề và kết quả bằng `owner_id` + RLS.

## Quy trình Admin

1. Mở `/admin` và đăng nhập.
2. Tạo một hoặc nhiều đề trong kho đề cá nhân.
3. Tạo/sửa câu hỏi; ảnh được upload lên Supabase Storage.
4. Bản nháp tự động đồng bộ lên cloud.
5. Chọn **Lưu & xuất bản**.
6. Hệ thống tạo link dạng `/quiz/ma-de` để gửi học viên.
7. Học viên chỉ thấy trang làm bài và kết quả của link đó.
8. Xem kết quả riêng từng đề trong mục **Kết quả học viên**.

## Cấu trúc đề

Admin có ba chế độ:

- **Chuẩn 175Q:** quy tắc mặc định 1–175.
- **Tùy chỉnh:** thay mốc phần thi, phạm vi chia nhóm, xáo câu/đáp án và passage.
- **Tự do:** cấu hình độc lập từng câu.

## Kiểm tra production

```bash
npm run build
npm run preview
```

Sau khi chạy migration, nên mở Supabase **Security Advisor** để xác nhận RLS và policies.

## Deploy Vercel

1. Import repository GitHub vào Vercel.
2. Thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong Environment Variables.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Thêm domain production vào Supabase Authentication → URL Configuration.

File `vercel.json` đã cấu hình SPA rewrite và các security headers cơ bản.

URL Configuration khuyến nghị:

```text
Site URL: https://smart-practice.vercel.app
Redirect URLs:
https://smart-practice.vercel.app/**
http://localhost:5173/**
```

Email xác nhận Admin sẽ quay về `/admin` trên đúng domain đang sử dụng.
