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
5. Trong Authentication → URL Configuration, thêm URL production và URL local.
6. Tạo tài khoản Admin đầu tiên từ giao diện web.

Migration tạo:

- Supabase Auth và bảng `profiles`.
- Phân quyền `admin`/`student`.
- Bảng draft và đề đã xuất bản.
- Bảng kết quả bài thi.
- RLS policies.
- Storage bucket `quiz-assets`.
- RPC xuất bản đề.

## Quy trình Admin

1. Chọn **Quản trị đề thi**.
2. Đăng nhập hoặc tạo Admin đầu tiên.
3. Tạo/sửa câu hỏi; ảnh được upload lên Supabase Storage.
4. Bản nháp tự động đồng bộ lên cloud.
5. Chọn **Lưu & xuất bản** để cập nhật đề cho mọi thiết bị.
6. Xem kết quả học viên trong mục **Kết quả học viên**.

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
