import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { AdminAccount } from "../types/auth";
import type { QuizConfig, QuizResult, UserAnswers } from "../types/quiz";
import { defaultQuizConfig } from "../data/questions";

const ASSET_BUCKET = "quiz-assets";

export type AdminQuizSummary = {
  id: string;
  title: string;
  slug: string;
  updated_at: string;
  is_published: boolean;
};

export async function getCurrentProfile(user: User): Promise<AdminAccount | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", user.id)
    .single();
  if (error) return null;
  return {
    id: data.id,
    email: user.email ?? "",
    displayName: data.display_name || user.email || "Quản trị viên",
    role: data.role,
  };
}

export async function signInAdmin(email: string, password: string): Promise<AdminAccount> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await getCurrentProfile(data.user);
  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    throw new Error("Tài khoản không có quyền quản trị.");
  }
  return profile;
}

export async function signUpFirstAdmin(
  email: string,
  displayName: string,
  password: string,
): Promise<{ account: AdminAccount | null; requiresEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${window.location.origin}/admin`,
    },
  });
  if (error) throw error;
  if (!data.session || !data.user) {
    return { account: null, requiresEmailConfirmation: true };
  }
  const { error: bootstrapError } = await supabase.rpc("bootstrap_first_admin");
  if (bootstrapError) throw bootstrapError;
  return {
    account: await getCurrentProfile(data.user),
    requiresEmailConfirmation: false,
  };
}

export async function bootstrapCurrentUserAsFirstAdmin(): Promise<void> {
  const { error } = await supabase.rpc("bootstrap_first_admin");
  if (error) throw error;
}

export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut({ scope: "global" });
}

export async function resendAdminConfirmation(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/admin`,
    },
  });
  if (error) throw error;
}

export async function sendAdminPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin`,
  });
  if (error) throw error;
}

export async function loadPublishedQuiz(slug: string): Promise<QuizConfig | null> {
  const { data, error } = await supabase
    .from("shared_quizzes")
    .select("id, config")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const saved = data.config as Partial<QuizConfig>;
  return {
    ...defaultQuizConfig,
    ...saved,
    id: data.id,
    published: true,
    questions: saved.questions ?? [],
    structure: {
      ...defaultQuizConfig.structure,
      ...(saved.structure ?? {}),
    },
    experience: {
      ...defaultQuizConfig.experience,
      ...(saved.experience ?? {}),
    },
  };
}

export async function listAdminQuizzes(): Promise<AdminQuizSummary[]> {
  const { data, error } = await supabase
    .from("admin_quizzes")
    .select("id, title, slug, updated_at, shared_quizzes(id)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    updated_at: item.updated_at,
    is_published: Array.isArray(item.shared_quizzes)
      ? item.shared_quizzes.length > 0
      : Boolean(item.shared_quizzes),
  }));
}

function createSlug(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42) || "quiz";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createAdminQuiz(config: QuizConfig): Promise<AdminQuizSummary> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Phiên đăng nhập đã hết hạn.");
  const slug = createSlug(config.title);
  const { data, error } = await supabase.from("admin_quizzes").insert({
    owner_id: authData.user.id,
    title: config.title,
    slug,
    draft_config: config,
    updated_at: new Date().toISOString(),
  }).select("id, title, slug, updated_at").single();
  if (error) throw error;
  return { ...data, is_published: false };
}

export async function loadQuizDraft(quizId: string): Promise<QuizConfig | null> {
  const { data, error } = await supabase
    .from("admin_quizzes")
    .select("id, draft_config")
    .eq("id", quizId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...(data.draft_config as QuizConfig), id: data.id };
}

export async function saveQuizDraft(quizId: string, config: QuizConfig): Promise<void> {
  const { error } = await supabase
    .from("admin_quizzes")
    .update({
      title: config.title,
      draft_config: { ...config, id: quizId },
      updated_at: new Date().toISOString(),
    })
    .eq("id", quizId);
  if (error) throw error;
}

export async function publishQuiz(quizId: string, config: QuizConfig): Promise<string> {
  await saveQuizDraft(quizId, { ...config, published: true });
  const { data, error } = await supabase.rpc("publish_owned_quiz", {
    target_quiz_id: quizId,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteAdminQuiz(quizId: string): Promise<void> {
  const { error } = await supabase.from("admin_quizzes").delete().eq("id", quizId);
  if (error) throw error;
}

export async function renameAdminQuiz(
  quizId: string,
  title: string,
): Promise<void> {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) throw new Error("Tên đề không được để trống.");

  const { data, error } = await supabase
    .from("admin_quizzes")
    .select("draft_config")
    .eq("id", quizId)
    .single();
  if (error) throw error;

  const draft = data.draft_config as QuizConfig;
  const { error: updateError } = await supabase
    .from("admin_quizzes")
    .update({
      title: normalizedTitle,
      draft_config: {
        ...draft,
        title: normalizedTitle,
        updatedAt: Date.now(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", quizId);
  if (updateError) throw updateError;
}

export async function uploadQuizAsset(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from(ASSET_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function saveAttemptResult(input: {
  quizId: string;
  answers: UserAnswers;
  result: QuizResult;
  startedAt?: number | null;
}): Promise<void> {
  const { error } = await supabase.from("shared_quiz_attempts").insert({
    quiz_id: input.quizId,
    answers: input.answers,
    result: input.result,
    started_at: input.startedAt ? new Date(input.startedAt).toISOString() : null,
    submitted_at: new Date(input.result.submittedAt).toISOString(),
  });
  if (error) throw error;
}

export type AttemptRecord = {
  id: string;
  quiz_id: string;
  result: QuizResult;
  submitted_at: string;
};

export async function listAttemptsForQuiz(quizId: string): Promise<AttemptRecord[]> {
  const { data, error } = await supabase
    .from("shared_quiz_attempts")
    .select("id, quiz_id, result, submitted_at")
    .eq("quiz_id", quizId)
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AttemptRecord[];
}
