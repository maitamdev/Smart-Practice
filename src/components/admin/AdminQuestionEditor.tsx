import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">Trình soạn câu hỏi</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
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
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white">Các phương án</h3>
          <span className="text-xs text-slate-500">Chọn nút tròn để đặt đáp án đúng</span>
        </div>
        <div className="grid gap-3">
          {question.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctOptionId === option.id}
                onChange={() => patch({ correctOptionId: option.id })}
                className="h-5 w-5 accent-blue-600"
              />
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-blue-700 dark:bg-blue-950">
                {option.label}
              </span>
              <input
                value={option.text}
                placeholder={question.type.includes("blank") || question.type === "abc_fixed" ? "Có thể để trống" : `Nhập phương án ${option.label}`}
                onChange={(event) => {
                  const options = question.options.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, text: event.target.value } : item,
                  );
                  patch({ options });
                }}
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
