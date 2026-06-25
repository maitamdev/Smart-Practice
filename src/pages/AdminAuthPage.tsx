import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
  onResetPassword: (email: string) => Promise<void>;
};

export function AdminAuthPage({
  onBack,
  onLogin,
  onRegister,
  onResendConfirmation,
  onResetPassword,
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
    if (!email.includes("@")) return setError("Email không hợp lệ.");
    if (password.length < 8) return setError("Mật khẩu phải có ít nhất 8 ký tự.");
    if (isRegister && password !== confirmPassword) return setError("Mật khẩu xác nhận không khớp.");

    setLoading(true);
    try {
      if (isRegister) {
        if (!displayName.trim()) return setError("Vui lòng nhập tên quản trị viên.");
        const result = await onRegister(email, displayName, password);
        if (result.requiresEmailConfirmation) {
          setNotice("Đã gửi email xác nhận. Kiểm tra cả Spam/Quảng cáo.");
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
    try {
      await onResendConfirmation(email);
      setNotice("Đã gửi lại email xác nhận.");
      setAwaitingConfirmation(true);
      setResendSeconds(60);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gửi lại email.");
    }
  };

  const resetPassword = async () => {
    if (!email.includes("@")) return setError("Nhập email trước khi yêu cầu đặt lại mật khẩu.");
    setError("");
    try {
      await onResetPassword(email);
      setNotice("Đã gửi email đặt lại mật khẩu.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gửi email đặt lại mật khẩu.");
    }
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timeout = window.setTimeout(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [resendSeconds]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-admin-auth p-4 sm:p-8">
      <button type="button" onClick={onBack} className="absolute left-5 top-5 z-20 secondary-button">
        <ArrowLeft size={17} /> Về trang chủ
      </button>

      <section className="relative z-10 grid w-full max-w-[1230px] overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_35px_100px_-45px_rgba(15,45,110,.45)] lg:grid-cols-[.96fr_1.04fr]">
        <aside className="relative hidden min-h-[700px] overflow-hidden bg-gradient-to-br from-[#071b3a] via-[#073b91] to-[#075ff0] p-12 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:80px_80px]" />
          <div className="relative">
            <div className="flex items-center gap-3 text-3xl font-black tracking-tight">
              Smart <span className="text-blue-300">Practice</span>
              <span className="rounded-full bg-blue-500/40 px-3 py-1 text-[10px] tracking-wider">ADMIN</span>
            </div>
            <h1 className="mt-10 text-5xl font-black leading-[1.15] tracking-[-.03em]">
              Thiết kế bài học.
              <br />
              Chia sẻ tri thức.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-blue-100">
              Tạo đề thi chuyên nghiệp, xuất bản bằng một liên kết và theo dõi kết quả học viên.
            </p>
          </div>

          <img
            src="/images/admin-auth-illustration.png"
            alt="Minh họa nền tảng tạo đề thi"
            className="relative mx-auto mt-5 w-full max-w-[540px] mix-blend-screen"
          />

          <div className="relative mt-auto flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <ShieldCheck size={25} />
            <p className="text-sm font-semibold text-blue-50">Dữ liệu của bạn được bảo vệ bởi Supabase Auth.</p>
          </div>
        </aside>

        <div className="flex min-h-[700px] flex-col justify-center bg-white p-7 sm:p-12 lg:p-16">
          <p className="text-right text-xs font-semibold text-slate-500">Nền tảng dành cho nhà sáng tạo</p>
          <div className="mt-12">
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-blue-600">Smart Practice Admin</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.025em] text-slate-950 dark:text-white">
              {isRegister ? "Bắt đầu sáng tạo" : "Chào mừng trở lại"}
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              {isRegister ? "Tạo tài khoản để xây dựng kho đề thi của riêng bạn." : "Đăng nhập để tiếp tục quản lý kho đề thi của bạn."}
            </p>
          </div>

          <form className="mt-9 space-y-5" onSubmit={submit}>
            {isRegister && (
              <AuthField label="Tên quản trị viên" icon={UserRound}>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tên hiển thị của bạn" autoComplete="name" />
              </AuthField>
            )}
            <AuthField label="Email" icon={Mail}>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Nhập email của bạn" autoComplete="email" />
            </AuthField>
            <AuthField label="Mật khẩu" icon={LockKeyhole}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu của bạn" autoComplete={isRegister ? "new-password" : "current-password"} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </AuthField>
            {isRegister && (
              <AuthField label="Xác nhận mật khẩu" icon={LockKeyhole}>
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" />
              </AuthField>
            )}

            {!isRegister && (
              <button type="button" onClick={() => void resetPassword()} className="ml-auto block text-sm font-bold text-blue-600 hover:text-blue-800">
                Quên mật khẩu?
              </button>
            )}

            {notice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{notice}</p>}
            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}

            {awaitingConfirmation && (
              <button type="button" disabled={resendSeconds > 0} onClick={() => void resend()} className="w-full text-sm font-bold text-blue-600 disabled:opacity-50">
                {resendSeconds > 0 ? `Gửi lại email sau ${resendSeconds}s` : "Gửi lại email xác nhận"}
              </button>
            )}

            <button type="submit" disabled={loading} className="primary-button w-full !rounded-xl py-4 text-base">
              {loading ? "Đang xử lý..." : isRegister ? "Tạo tài khoản quản trị" : "Đăng nhập"}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4 text-xs text-slate-400 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
            hoặc
          </div>
          <button
            type="button"
            className="h-13 rounded-xl border-2 border-blue-600 px-4 py-3.5 text-sm font-extrabold text-blue-600 transition hover:bg-blue-50"
            onClick={() => {
              setIsRegister((value) => !value);
              setError("");
              setNotice("");
            }}
          >
            {isRegister ? "Đã có tài khoản? Đăng nhập" : "Tạo tài khoản quản trị"}
          </button>
          <p className="mt-7 text-center text-[11px] text-slate-400">
            Bằng cách tiếp tục, bạn đồng ý với Điều khoản và Chính sách bảo mật.
          </p>
        </div>
      </section>
    </main>
  );
}

export function AdminPasswordRecoveryPage({
  onSubmit,
}: {
  onSubmit: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(password);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể cập nhật mật khẩu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-admin-auth p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-[28px] border border-white bg-white p-7 shadow-2xl sm:p-10"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <LockKeyhole size={25} />
        </span>
        <p className="mt-7 text-xs font-extrabold uppercase tracking-[.2em] text-blue-600">
          Smart Practice Admin
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          Tạo mật khẩu mới
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Nhập mật khẩu mới để hoàn tất khôi phục tài khoản quản trị.
        </p>

        <div className="mt-7 space-y-5">
          <AuthField label="Mật khẩu mới" icon={LockKeyhole}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </AuthField>
          <AuthField label="Xác nhận mật khẩu" icon={LockKeyhole}>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu mới"
            />
          </AuthField>
        </div>

        {error && (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="primary-button mt-6 w-full !rounded-xl py-4"
        >
          {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
      </form>
    </main>
  );
}

function AuthField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-slate-800 dark:text-slate-100">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={19} />
        <span className="admin-auth-input">{children}</span>
      </span>
    </label>
  );
}
