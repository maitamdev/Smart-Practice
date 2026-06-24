import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
type Props = {
  onBack: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (
    email: string,
    displayName: string,
    password: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  onResendConfirmation: (email: string) => Promise<void>;
};

export function AdminAuthPage({
  onBack,
  onLogin,
  onRegister,
  onResendConfirmation,
}: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!email.includes("@")) {
      setError("Email không hợp lệ.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!displayName.trim()) {
          setError("Vui lòng nhập tên quản trị viên.");
          return;
        }
        const result = await onRegister(email, displayName, password);
        if (result.requiresEmailConfirmation) {
          setNotice("Đã gửi email xác nhận. Kiểm tra cả hộp thư Spam/Quảng cáo.");
          setAwaitingConfirmation(true);
          setResendSeconds(60);
          setIsRegister(false);
        }
      } else {
        const valid = await onLogin(email, password);
        if (!valid) setError("Email, mật khẩu hoặc quyền quản trị không đúng.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email.includes("@") || resendSeconds > 0) return;
    setError("");
    setNotice("");
    try {
      await onResendConfirmation(email);
      setNotice("Đã gửi lại email xác nhận. Link mới sẽ mở đúng trang /admin.");
      setAwaitingConfirmation(true);
      setResendSeconds(60);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gửi lại email xác nhận.");
    }
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timeout = window.setTimeout(
      () => setResendSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timeout);
  }, [resendSeconds]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <button type="button" onClick={onBack} className="absolute left-5 top-5 secondary-button">
        <ArrowLeft size={17} /> Trang chủ
      </button>

      <section className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none md:grid-cols-[.85fr_1.15fr]">
        <aside className="hidden bg-gradient-to-br from-blue-700 to-indigo-800 p-10 text-white md:flex md:flex-col">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck size={30} />
          </span>
          <h1 className="mt-8 text-3xl font-black leading-tight">Khu vực quản trị đề thi</h1>
          <p className="mt-4 text-sm leading-7 text-blue-100">
            Chỉ tài khoản quản trị mới có quyền tạo, chỉnh sửa và xuất bản nội dung bài thi.
          </p>
          <div className="mt-auto rounded-2xl border border-white/15 bg-white/10 p-5 text-sm leading-6 text-blue-50">
            Phiên đăng nhập tự động kết thúc khi đóng tab trình duyệt.
          </div>
        </aside>

        <div className="p-7 sm:p-10">
          <div className="md:hidden">
            <LockKeyhole className="text-blue-600" size={30} />
          </div>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[.2em] text-blue-600">
            Smart Practice Admin
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {isRegister ? "Tạo tài khoản quản trị" : "Đăng nhập"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isRegister
              ? "Thiết lập tài khoản đầu tiên để bảo vệ trình thiết kế đề."
              : "Nhập thông tin tài khoản để tiếp tục quản lý đề thi."}
          </p>

          <form className="mt-8 space-y-4" onSubmit={submit}>
            {isRegister && (
              <label className="admin-field">
                <span>Tên quản trị viên</span>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input className="!pl-11" value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" />
                </div>
              </label>
            )}
            <label className="admin-field">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <label className="admin-field">
              <span>Mật khẩu</span>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  className="!pl-11 !pr-12"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {isRegister && (
              <label className="admin-field">
                <span>Xác nhận mật khẩu</span>
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
              </label>
            )}

            {notice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                {notice}
              </div>
            )}
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</p>}

            {(awaitingConfirmation || !isRegister) && (
              <button
                type="button"
                disabled={!email.includes("@") || resendSeconds > 0}
                onClick={() => void resend()}
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
              >
                {resendSeconds > 0
                  ? `Gửi lại sau ${resendSeconds}s`
                  : "Gửi lại email xác nhận"}
              </button>
            )}

            <button type="submit" disabled={loading} className="primary-button !mt-6 w-full py-3.5">
              <LockKeyhole size={17} />
              {loading ? "Đang xử lý..." : isRegister ? "Tạo tài khoản & tiếp tục" : "Đăng nhập quản trị"}
            </button>
            <button
              type="button"
              className="w-full text-sm font-semibold text-slate-500 hover:text-blue-700"
              onClick={() => {
                setIsRegister((value) => !value);
                setError("");
              }}
            >
              {isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có Admin? Tạo tài khoản đầu tiên"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
