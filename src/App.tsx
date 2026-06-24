import { useState } from "react";
import { AdminPage } from "./pages/AdminPage";
import { AdminAuthPage } from "./pages/AdminAuthPage";
import { QuizPage } from "./pages/QuizPage";
import { ResultPage } from "./pages/ResultPage";
import { StartPage } from "./pages/StartPage";
import { useQuiz } from "./hooks/useQuiz";
import { useQuizConfig } from "./hooks/useQuizConfig";
import { useTheme } from "./hooks/useTheme";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { clearAttempt } from "./utils/storage";

type AppView = "home" | "quiz" | "admin";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { config, loading: configLoading, error: configError, publishConfig } = useQuizConfig();
  const adminAuth = useAdminAuth();
  const { attempt, startQuiz, answerQuestion, submitQuiz, restartQuiz, discardAttempt } = useQuiz(config);
  const [quizOpened, setQuizOpened] = useState(false);
  const [view, setView] = useState<AppView>("home");

  if (view === "admin") {
    if (adminAuth.loading) {
      return <div className="flex min-h-screen items-center justify-center bg-slate-50 font-bold text-slate-500">Đang kiểm tra phiên quản trị...</div>;
    }
    if (!adminAuth.authenticated) {
      return (
        <AdminAuthPage
          onBack={() => setView("home")}
          onLogin={adminAuth.login}
          onRegister={adminAuth.register}
        />
      );
    }
    return (
      <AdminPage
        initialConfig={config}
        onExit={() => setView("home")}
        onSave={async (next) => {
          await publishConfig(next);
          clearAttempt();
          discardAttempt();
        }}
        onPreview={async (next) => {
          await publishConfig(next);
          clearAttempt();
          discardAttempt();
          setView("home");
        }}
        adminName={adminAuth.account?.displayName || adminAuth.account?.email || "Quản trị viên"}
        onLogout={() => {
          void adminAuth.logout();
          setView("home");
        }}
      />
    );
  }

  if (configLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 font-bold text-slate-500">Đang tải đề thi...</div>;
  }

  if (attempt.quizStatus === "in_progress" && quizOpened && view === "quiz") {
    return (
      <QuizPage
        questions={attempt.shuffledQuestions}
        answers={attempt.userAnswers}
        endTime={attempt.endTime}
        theme={theme}
        onToggleTheme={toggleTheme}
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
        onToggleTheme={toggleTheme}
        onRestart={restartQuiz}
        experience={config.experience}
      />
    );
  }

  return (
    <StartPage
      theme={theme}
      onToggleTheme={toggleTheme}
      hasSavedAttempt={attempt.quizStatus === "in_progress"}
      config={config}
      loadError={configError}
      onAdmin={() => setView("admin")}
      onContinue={() => {
        setQuizOpened(true);
        setView("quiz");
      }}
      onStart={() => {
        if (!config.published || config.questions.length === 0) {
          setView("admin");
          return;
        }
        if (attempt.quizStatus === "in_progress") {
          restartQuiz();
        } else {
          startQuiz();
        }
        setQuizOpened(true);
        setView("quiz");
      }}
    />
  );
}
