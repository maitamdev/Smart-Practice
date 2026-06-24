import { useCallback, useEffect, useState } from "react";
import { defaultQuizConfig } from "../data/questions";
import {
  loadPublishedQuiz,
  publishQuiz,
} from "../services/supabaseService";
import type { QuizConfig } from "../types/quiz";

export function useQuizConfig() {
  const [config, setConfig] = useState<QuizConfig>(defaultQuizConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPublished = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const published = await loadPublishedQuiz();
      setConfig(published ?? defaultQuizConfig);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải đề thi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPublished();
  }, [refreshPublished]);

  const publishConfig = useCallback(async (next: QuizConfig) => {
    const saved = { ...next, published: true, updatedAt: Date.now() };
    await publishQuiz(saved);
    setConfig(saved);
    return saved;
  }, []);

  return { config, loading, error, publishConfig, refreshPublished };
}
