import { useEffect, useState } from "react";
import { AdminAuthPage } from "./pages/AdminAuthPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { QuizPage } from "./pages/QuizPage";
import { ResultPage } from "./pages/ResultPage";
import { StartPage } from "./pages/StartPage";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useQuiz } from "./hooks/useQuiz";
import { useTheme } from "./hooks/useTheme";
import {
  loadPublishedQuiz,
  loadQuizDraft,
  publishQuiz,
} from "./services/supabaseService";
import type { QuizConfig } from "./types/quiz";

const getPath = () => window.location.pathname.replace(/\/+$/, "") || "/";

export default function App() {
  const [path, setPath] = useState(getPath);

  useEffect(() => {
    const handlePopState = () => setPath(getPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(getPath());
  };

  const publicMatch = path.match(/^\/quiz\/([^/]+)$/);
  if (publicMatch) {
    return <LearnerQuizRoute slug={decodeURIComponent(publicMatch[1])} />;
  }

  return <AdminApp path={path} navigate={navigate} />;
}

function AdminApp({
  path,
  navigate,
}: {
  path: string;
  navigate: (path: string) => void;
}) {
  const adminAuth = useAdminAuth();

  if (path === "/" || path === "/admin") {
    if (adminAuth.loading) return <Loading text="Đang kiểm tra phiên quản trị..." />;
    if (!adminAuth.authenticated) {
      return (
        <AdminAuthPage
          onBack={() => undefined}
          onLogin={adminAuth.login}
          onRegister={adminAuth.register}
          onResendConfirmation={adminAuth.resendConfirmation}
          onResetPassword={adminAuth.resetPassword}
        />
      );
    }
    return (
      <AdminDashboardPage
        adminName={adminAuth.account?.displayName || adminAuth.account?.email || "Quản trị viên"}
        onEditQuiz={(quizId) => navigate(`/admin/quiz/${quizId}`)}
        onLogout={() => void adminAuth.logout()}
      />
    );
  }

  const editorMatch = path.match(/^\/admin\/quiz\/([0-9a-f-]+)$/i);
  if (editorMatch) {
    if (adminAuth.loading) return <Loading text="Đang kiểm tra quyền truy cập..." />;
    if (!adminAuth.authenticated) {
      return (
        <AdminAuthPage
          onBack={() => navigate("/admin")}
          onLogin={adminAuth.login}
          onRegister={adminAuth.register}
          onResendConfirmation={adminAuth.resendConfirmation}
          onResetPassword={adminAuth.resetPassword}
        />
      );
    }
    return (
      <AdminEditorRoute
        quizId={editorMatch[1]}
        adminName={adminAuth.account?.displayName || adminAuth.account?.email || "Quản trị viên"}
        onBack={() => navigate("/admin")}
        onLogout={() => {
          void adminAuth.logout();
          navigate("/admin");
        }}
        onOpenPublic={(slug) => navigate(`/quiz/${slug}`)}
      />
    );
  }

  return <NotFound onHome={() => navigate("/admin")} />;
}

function AdminEditorRoute({
  quizId,
  adminName,
  onBack,
  onLogout,
  onOpenPublic,
}: {
  quizId: string;
  adminName: string;
  onBack: () => void;
  onLogout: () => void;
  onOpenPublic: (slug: string) => void;
}) {
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuizDraft(quizId)
      .then((draft) => {
        if (!draft) setError("Không tìm thấy đề hoặc bạn không có quyền truy cập.");
        else setConfig(draft);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Không thể tải đề."),
      );
  }, [quizId]);

  if (error) return <NotFound message={error} onHome={onBack} />;
  if (!config) return <Loading text="Đang tải trình thiết kế đề..." />;

  return (
    <AdminPage
      quizId={quizId}
      initialConfig={config}
      onExit={onBack}
      onSave={async (next) => {
        const slug = await publishQuiz(quizId, next);
        setConfig({ ...next, id: quizId, published: true });
        await navigator.clipboard?.writeText(`${window.location.origin}/quiz/${slug}`);
        window.alert("Đã xuất bản. Link học viên đã được sao chép.");
      }}
      onPreview={async (next) => {
        const slug = await publishQuiz(quizId, next);
        onOpenPublic(slug);
      }}
      adminName={adminName}
      onLogout={onLogout}
    />
  );
}

function LearnerQuizRoute({ slug }: { slug: string }) {
  const { theme, toggleTheme } = useTheme();
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (!active) return;
      setError("Tải đề thi quá thời gian. Vui lòng kiểm tra mạng và thử lại.");
      setLoading(false);
    }, 12000);

    loadPublishedQuiz(slug)
      .then((published) => {
        if (!active) return;
        if (!published) setError("Link đề thi không tồn tại hoặc đã bị gỡ.");
        else setConfig(published);
      })
      .catch((cause) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Không thể tải đề thi.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
        window.clearTimeout(timeout);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [slug]);

  if (loading) return <Loading text="Đang tải đề thi..." />;
  if (error || !config) return <NotFound message={error} />;

  return (
    <LearnerQuizSession
      config={config}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}

function LearnerQuizSession({
  config,
  theme,
  onToggleTheme,
}: {
  config: QuizConfig;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const { attempt, startQuiz, answerQuestion, submitQuiz, restartQuiz } = useQuiz(config);
  const [quizOpened, setQuizOpened] = useState(false);

  if (attempt.quizStatus === "in_progress" && quizOpened) {
    return (
      <QuizPage
        questions={attempt.shuffledQuestions}
        answers={attempt.userAnswers}
        endTime={attempt.endTime}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onAnswer={answerQuestion}
        onSubmit={submitQuiz}
        brandName={config.brandName}
        brandBadge={config.brandBadge}
        structure={config.structure}
        experience={config.experience}
      />
    );
  }

  if (attempt.quizStatus === "submitted" && attempt.result) {
    return (
      <ResultPage
        questions={attempt.shuffledQuestions}
        answers={attempt.userAnswers}
        result={attempt.result}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onRestart={() => {
          restartQuiz();
          setQuizOpened(true);
        }}
        experience={config.experience}
      />
    );
  }

  return (
    <StartPage
      theme={theme}
      onToggleTheme={onToggleTheme}
      hasSavedAttempt={attempt.quizStatus === "in_progress"}
      config={config}
      onContinue={() => setQuizOpened(true)}
      onStart={() => {
        if (attempt.quizStatus === "in_progress") restartQuiz();
        else startQuiz();
        setQuizOpened(true);
      }}
    />
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-bold text-slate-500 dark:bg-slate-950">
      {text}
    </div>
  );
}

function NotFound({
  message = "Trang bạn yêu cầu không tồn tại.",
  onHome,
}: {
  message?: string;
  onHome?: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-900">
        <h1 className="text-2xl font-black">Không thể truy cập</h1>
        <p className="mt-3 text-sm text-slate-500">{message}</p>
        {onHome && <button type="button" className="primary-button mt-6" onClick={onHome}>Về trang quản trị</button>}
      </div>
    </main>
  );
}
