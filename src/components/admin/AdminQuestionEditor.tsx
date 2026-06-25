import { Headphones, ImagePlus, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { uploadQuizAsset } from "../../services/supabaseService";
import type { QuestionType, QuizQuestion, Section } from "../../types/quiz";
import { createEmptyQuestion } from "../../utils/adminQuestions";

type Props = {
  question: QuizQuestion;
  onChange: (question: QuizQuestion) => void;
  onDelete: () => void;
};

const typeLabels: Record<QuestionType, string> = {
  normal: "Trắc nghiệm ABCD",
  image_fixed: "Câu hỏi có hình ảnh",
  abc_fixed: "Listening ABC",
  abc_blank_fixed: "Listening ABC để trống",
};

export function AdminQuestionEditor({ question, onChange, onDelete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const patch = (value: Partial<QuizQuestion>) => onChange({ ...question, ...value });

  const changeType = (type: QuestionType) => {
    const template = createEmptyQuestion(question.id, type, question.section);
    patch({
      type,
      options: template.options,
      correctOptionId: template.correctOptionId,
      shuffleQuestion: template.shuffleQuestion,
      shuffleOptions: template.shuffleOptions,
    });
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const publicUrl = await uploadQuizAsset(file);
      patch({ image: publicUrl });
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Không thể tải ảnh.");
    } finally {
      setUploading(false);
    }
  };

  const uploadAudio = async (file?: File) => {
    if (!file) return;
    setUploadingAudio(true);
    setUploadError("");
    try {
      const publicUrl = await uploadQuizAsset(file);
      patch({ audio: publicUrl });
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Không thể tải audio.");
    } finally {
      setUploadingAudio(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-600">Question Composer</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Câu {question.originalNumber}
          </h2>
        </div>
        <button type="button" onClick={onDelete} className="admin-danger-button">
          <Trash2 size={16} /> Xóa câu
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="admin-field">
          <span>Phần thi</span>
          <select value={question.section} onChange={(event) => patch({ section: event.target.value as Section })}>
            <option value="listening">Listening</option>
            <option value="reading">Reading</option>
          </select>
        </label>
        <label className="admin-field">
          <span>Loại câu hỏi</span>
          <select value={question.type} onChange={(event) => changeType(event.target.value as QuestionType)}>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="admin-field">
        <span>Nội dung câu hỏi</span>
        <textarea
          rows={3}
          value={question.question}
          placeholder="Nhập câu hỏi..."
          onChange={(event) => patch({ question: event.target.value })}
        />
      </label>

      {question.section === "reading" && (
        <label className="admin-field">
          <span>Đoạn văn / Passage</span>
          <textarea
            rows={6}
            value={question.passage ?? ""}
            placeholder="Nhập đoạn văn dùng chung cho câu hỏi..."
            onChange={(event) => patch({ passage: event.target.value })}
          />
        </label>
      )}

      {question.section === "listening" && (
        <div className="admin-field">
          <div className="flex items-center justify-between gap-3">
            <span>Audio Listening <strong className="text-red-500">*</strong></span>
            {question.audio && (
              <button type="button" className="text-xs font-bold text-red-500 hover:text-red-700" onClick={() => patch({ audio: "" })}>
                Xóa audio
              </button>
            )}
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
            {question.audio ? (
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-300">
                  <Headphones size={18} /> Audio đã tải lên
                </div>
                <audio controls preload="metadata" src={question.audio} className="w-full" />
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-800">
                  <UploadCloud size={21} />
                </span>
                <span>Chưa có audio cho câu Listening này.</span>
              </div>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={question.audio ?? ""}
                placeholder="Dán URL audio MP3/WAV/OGG"
                onChange={(event) => patch({ audio: event.target.value })}
              />
              <label className="secondary-button cursor-pointer">
                {uploadingAudio ? <LoaderCircle className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                {uploadingAudio ? "Đang tải..." : "Tải audio"}
                <input
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
                  hidden
                  disabled={uploadingAudio}
                  onChange={(event) => void uploadAudio(event.target.files?.[0])}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">Hỗ trợ MP3, WAV, OGG. Tối đa 10 MB.</p>
          </div>
          {uploadError && <p className="text-xs font-semibold text-red-600">{uploadError}</p>}
          {question.audioScript && (
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-blue-700">
                Kịch bản audio do AI tạo
              </span>
              <textarea
                rows={5}
                value={question.audioScript}
                onChange={(event) => patch({ audioScript: event.target.value })}
                className="w-full rounded-xl border border-blue-200 bg-white p-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
          )}
        </div>
      )}

      {question.type === "image_fixed" && (
        <div className="admin-field">
          <span>Hình ảnh câu hỏi</span>
          <div className="grid gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:grid-cols-[180px_1fr]">
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-slate-800">
              {question.image ? (
                <img src={question.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="text-slate-400" size={30} />
              )}
            </div>
            <div className="space-y-3">
              <input
                value={question.image ?? ""}
                placeholder="Dán URL ảnh hoặc tải ảnh lên"
                onChange={(event) => patch({ image: event.target.value })}
              />
              <input type="file" accept="image/*" disabled={uploading} onChange={(event) => void uploadImage(event.target.files?.[0])} />
              <p className="flex items-center gap-2 text-xs text-slate-500">
                {uploading && <LoaderCircle className="animate-spin" size={14} />}
                {uploading ? "Đang tải lên Supabase Storage..." : "Ảnh được lưu trên Supabase Storage."}
              </p>
              {uploadError && <p className="text-xs font-semibold text-red-600">{uploadError}</p>}
            </div>
          </div>
          {question.imagePrompt && (
            <label className="mt-3 block">
              <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-blue-700">
                Mô tả ảnh do AI tạo
              </span>
              <textarea
                rows={3}
                value={question.imagePrompt}
                onChange={(event) => patch({ imagePrompt: event.target.value })}
                className="w-full rounded-xl border border-blue-200 bg-white p-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
          )}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white">Các phương án</h3>
          <span className="text-xs text-slate-500">Chọn nút tròn để đặt đáp án đúng</span>
        </div>
        <div className="grid gap-3">
          {question.options.map((option, index) => (
            <div key={option.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctOptionId === option.id}
                onChange={() => patch({ correctOptionId: option.id })}
                className="mt-2.5 h-5 w-5 shrink-0 accent-blue-600"
              />
              <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-blue-700 dark:bg-blue-950">
                {option.label}
              </span>
              <textarea
                rows={2}
                value={option.text}
                placeholder={question.type.includes("blank") || question.type === "abc_fixed" ? "Có thể để trống" : `Nhập phương án ${option.label}`}
                onChange={(event) => {
                  const options = question.options.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, text: event.target.value } : item,
                  );
                  patch({ options });
                }}
                className="min-h-[58px] flex-1 resize-y rounded-xl border-0 bg-transparent px-2 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
            </div>
          ))}
        </div>
      </div>

      <label className="admin-field">
        <span>Giải thích đáp án</span>
        <textarea
          rows={3}
          value={question.explanation ?? ""}
          placeholder="Giải thích sẽ hiển thị sau khi nộp bài..."
          onChange={(event) => patch({ explanation: event.target.value })}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          label="Xáo thứ tự câu hỏi"
          checked={question.shuffleQuestion}
          onChange={(checked) => patch({ shuffleQuestion: checked })}
        />
        <Toggle
          label="Xáo thứ tự đáp án"
          checked={question.shuffleOptions}
          onChange={(checked) => patch({ shuffleOptions: checked })}
        />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-blue-600" />
    </label>
  );
}
