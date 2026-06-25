import type { QuizConfig } from "../../types/quiz";
import { applyExamStructure } from "../../utils/examStructure";
import { Settings } from "lucide-react";

export function AdminQuizSettings({ draft, onChange }: { draft: QuizConfig; onChange: (config: QuizConfig) => void }) {
  const patch = (value: Partial<QuizConfig>) => onChange({ ...draft, ...value });
  const patchStructure = (value: Partial<QuizConfig["structure"]>) =>
    patch({ structure: { ...draft.structure, ...value } });
  const useStandardPreset = () =>
    patchStructure({
      enabled: true,
      preset: "standard_175",
      totalQuestions: 175,
      listeningEnd: 100,
      imageQuestionsEnd: 6,
      abcQuestionNumber: 7,
      abcBlankEnd: 31,
      listeningGroupSize: 3,
      listeningGroupStart: 32,
      listeningGroupEnd: 100,
      readingStart: 101,
      showListeningDividers: true,
      dividerStyle: "dashed",
      dividerLabel: "",
      shuffleListeningNormal: true,
      shuffleListeningStart: 32,
      shuffleListeningEnd: 100,
      shuffleReading: true,
      shuffleReadingStart: 101,
      shuffleReadingEnd: 175,
      shuffleNormalOptions: true,
      shuffleOptionsStart: 32,
      shuffleOptionsEnd: 175,
      readingGroupSize: 1,
      showReadingDividers: false,
      readingGroupStart: 101,
      readingGroupEnd: 175,
      requireReadingPassage: false,
      passageRequiredStart: 101,
      passageRequiredEnd: 175,
    });

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">Cấu hình</p><h2 className="mt-1 text-2xl font-black">Cài đặt đề thi</h2></div>
      <label className="admin-field"><span>Tên đề</span><input value={draft.title} onChange={(e) => patch({ title: e.target.value })} /></label>
      <label className="admin-field"><span>Mô tả ngắn</span><input value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} /></label>
      <label className="admin-field"><span>Hướng dẫn</span><textarea rows={4} value={draft.description} onChange={(e) => patch({ description: e.target.value })} /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="admin-field"><span>Thời gian (phút)</span><input type="number" min={1} value={draft.durationMinutes} onChange={(e) => patch({ durationMinutes: Math.max(1, Number(e.target.value)) })} /></label>
        <label className="admin-field"><span>Tên thương hiệu</span><input value={draft.brandName} onChange={(e) => patch({ brandName: e.target.value })} /></label>
        <label className="admin-field"><span>Badge</span><input value={draft.brandBadge} onChange={(e) => patch({ brandBadge: e.target.value })} /></label>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">Cấu trúc đề thi</p>
            <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
              Chuẩn 175Q hoặc tùy chỉnh hoàn toàn
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Chọn preset có sẵn, tự thay đổi từng mốc hoặc tắt cấu trúc để thiết kế
              từng câu độc lập.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ModeCard
            active={draft.structure.enabled && draft.structure.preset === "standard_175"}
            title="Chuẩn 175Q"
            description="Khôi phục toàn bộ mốc và luật chuẩn."
            onClick={useStandardPreset}
          />
          <ModeCard
            active={draft.structure.enabled && draft.structure.preset === "custom"}
            title="Tùy chỉnh"
            description="Tự đặt số câu, mốc phần thi và luật xáo."
            onClick={() => patchStructure({ enabled: true, preset: "custom" })}
          />
          <ModeCard
            active={!draft.structure.enabled}
            title="Tự do"
            description="Không ép cấu trúc; chỉnh từng câu độc lập."
            onClick={() => patchStructure({ enabled: false, preset: "custom" })}
          />
        </div>

        {draft.structure.enabled ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StructureInput label="Tổng số câu" value={draft.structure.totalQuestions} onChange={(value) => patchStructure({ totalQuestions: value, preset: "custom" })} />
              <StructureInput label="Listening kết thúc" value={draft.structure.listeningEnd} onChange={(value) => patchStructure({ listeningEnd: value, readingStart: value + 1, preset: "custom" })} />
              <StructureInput label="Câu ảnh kết thúc" value={draft.structure.imageQuestionsEnd} onChange={(value) => patchStructure({ imageQuestionsEnd: value, preset: "custom" })} />
              <StructureInput label="Câu ABC có nội dung" value={draft.structure.abcQuestionNumber} onChange={(value) => patchStructure({ abcQuestionNumber: value, preset: "custom" })} />
              <StructureInput label="ABC trống kết thúc" value={draft.structure.abcBlankEnd} onChange={(value) => patchStructure({ abcBlankEnd: value, preset: "custom" })} />
              <StructureInput label="Số câu mỗi nhóm" value={draft.structure.listeningGroupSize} onChange={(value) => patchStructure({ listeningGroupSize: value, preset: "custom" })} />
              <StructureInput label="Reading bắt đầu" value={draft.structure.readingStart} onChange={(value) => patchStructure({ readingStart: value, listeningEnd: value - 1, preset: "custom" })} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SettingToggle
                label="Hiện vạch chia nhóm Listening"
                description={`Câu ${draft.structure.listeningGroupStart}–${draft.structure.listeningGroupEnd}, mỗi ${draft.structure.listeningGroupSize} câu.`}
                checked={draft.structure.showListeningDividers}
                onChange={(value) => patchStructure({ showListeningDividers: value, preset: "custom" })}
              />
              <SettingToggle
                label="Xáo câu Listening thường"
                description={`Áp dụng từ câu ${draft.structure.shuffleListeningStart} đến ${draft.structure.shuffleListeningEnd}.`}
                checked={draft.structure.shuffleListeningNormal}
                onChange={(value) => patchStructure({ shuffleListeningNormal: value, preset: "custom" })}
              />
              <SettingToggle
                label="Xáo câu Reading"
                description={`Áp dụng từ câu ${draft.structure.shuffleReadingStart} đến ${draft.structure.shuffleReadingEnd}.`}
                checked={draft.structure.shuffleReading}
                onChange={(value) => patchStructure({ shuffleReading: value, preset: "custom" })}
              />
              <SettingToggle
                label="Xáo đáp án câu thường"
                description={`Áp dụng từ câu ${draft.structure.shuffleOptionsStart} đến ${draft.structure.shuffleOptionsEnd}.`}
                checked={draft.structure.shuffleNormalOptions}
                onChange={(value) => patchStructure({ shuffleNormalOptions: value, preset: "custom" })}
              />
              <SettingToggle
                label="Chia nhóm câu Reading"
                description={`Câu ${draft.structure.readingGroupStart}–${draft.structure.readingGroupEnd}, mỗi ${draft.structure.readingGroupSize} câu.`}
                checked={draft.structure.showReadingDividers}
                onChange={(value) => patchStructure({ showReadingDividers: value, preset: "custom" })}
              />
              <SettingToggle
                label="Bắt buộc passage cho Reading"
                description={`Bắt buộc từ câu ${draft.structure.passageRequiredStart} đến ${draft.structure.passageRequiredEnd}.`}
                checked={draft.structure.requireReadingPassage}
                onChange={(value) => patchStructure({ requireReadingPassage: value, preset: "custom" })}
              />
            </div>

            <div className="mt-5 space-y-3">
              <RangeSetting
                title="Phạm vi chia nhóm Listening"
                start={draft.structure.listeningGroupStart}
                end={draft.structure.listeningGroupEnd}
                onChange={(start, end) => patchStructure({ listeningGroupStart: start, listeningGroupEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi xáo câu Listening"
                start={draft.structure.shuffleListeningStart}
                end={draft.structure.shuffleListeningEnd}
                onChange={(start, end) => patchStructure({ shuffleListeningStart: start, shuffleListeningEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi xáo câu Reading"
                start={draft.structure.shuffleReadingStart}
                end={draft.structure.shuffleReadingEnd}
                onChange={(start, end) => patchStructure({ shuffleReadingStart: start, shuffleReadingEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi xáo đáp án"
                start={draft.structure.shuffleOptionsStart}
                end={draft.structure.shuffleOptionsEnd}
                onChange={(start, end) => patchStructure({ shuffleOptionsStart: start, shuffleOptionsEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi chia nhóm Reading"
                start={draft.structure.readingGroupStart}
                end={draft.structure.readingGroupEnd}
                onChange={(start, end) => patchStructure({ readingGroupStart: start, readingGroupEnd: end, preset: "custom" })}
              />
              <RangeSetting
                title="Phạm vi bắt buộc passage"
                start={draft.structure.passageRequiredStart}
                end={draft.structure.passageRequiredEnd}
                onChange={(start, end) => patchStructure({ passageRequiredStart: start, passageRequiredEnd: end, preset: "custom" })}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <label className="admin-field">
                <span>Kiểu vạch ngăn</span>
                <select
                  value={draft.structure.dividerStyle}
                  onChange={(event) => patchStructure({
                    dividerStyle: event.target.value as QuizConfig["structure"]["dividerStyle"],
                    preset: "custom",
                  })}
                >
                  <option value="dashed">Nét đứt</option>
                  <option value="solid">Nét liền</option>
                  <option value="soft">Mờ nhẹ</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Nhãn vạch ngăn</span>
                <input
                  value={draft.structure.dividerLabel}
                  placeholder="Ví dụ: Nhóm tiếp theo"
                  onChange={(event) => patchStructure({ dividerLabel: event.target.value, preset: "custom" })}
                />
              </label>
              <StructureInput
                label="Số câu mỗi nhóm Reading"
                value={draft.structure.readingGroupSize}
                onChange={(value) => patchStructure({ readingGroupSize: value, preset: "custom" })}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-white p-4 dark:border-blue-900 dark:bg-slate-900">
              <div className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                <p>Ảnh: 1–{draft.structure.imageQuestionsEnd} · ABC cố định: {draft.structure.abcQuestionNumber}–{draft.structure.abcBlankEnd}</p>
                <p>Listening: 1–{draft.structure.listeningEnd} · Reading: {draft.structure.readingStart}–{draft.structure.totalQuestions}</p>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => patch({ questions: applyExamStructure(draft.questions, draft.structure) })}
              >
                <Settings size={16} /> Áp dụng vào câu hỏi
              </button>
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            Chế độ tự do đang bật. Admin có thể chọn loại, phần thi, xáo câu và
            xáo đáp án riêng trên từng câu. Hệ thống không ép đủ 175 câu.
          </div>
        )}
      </div>

      <ExperienceSettings
        experience={draft.experience}
        onChange={(experience) => patch({ experience })}
      />
    </div>
  );
}

function ExperienceSettings({
  experience,
  onChange,
}: {
  experience: QuizConfig["experience"];
  onChange: (experience: QuizConfig["experience"]) => void;
}) {
  const patch = (value: Partial<QuizConfig["experience"]>) =>
    onChange({ ...experience, ...value });
  return (
    <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-violet-600">Trải nghiệm làm bài</p>
      <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Điều hướng, nộp bài và kết quả</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SettingToggle label="Hiển thị thanh tiến độ" description="Cho thí sinh biết đã làm bao nhiêu câu." checked={experience.showProgress} onChange={(value) => patch({ showProgress: value })} />
        <SettingToggle label="Hiển thị bảng số câu" description="Bật sidebar danh sách câu hỏi." checked={experience.showQuestionNavigator} onChange={(value) => patch({ showQuestionNavigator: value })} />
        <SettingToggle label="Cho phép nhảy câu" description="Có thể bấm số câu để di chuyển tự do." checked={experience.allowQuestionNavigation} onChange={(value) => patch({ allowQuestionNavigation: value })} />
        <SettingToggle label="Tự chuyển sau khi chọn" description="Chuyển sang nhóm tiếp theo sau khi trả lời." checked={experience.autoAdvance} onChange={(value) => patch({ autoAdvance: value })} />
        <SettingToggle label="Cho nộp khi còn câu trống" description="Nếu tắt, phải trả lời đủ mới được nộp." checked={experience.allowSubmitWithUnanswered} onChange={(value) => patch({ allowSubmitWithUnanswered: value })} />
        <SettingToggle label="Xác nhận trước khi nộp" description="Hiện modal kiểm tra số câu chưa làm." checked={experience.confirmBeforeSubmit} onChange={(value) => patch({ confirmBeforeSubmit: value })} />
        <SettingToggle label="Hiển thị tên phần thi" description="Hiện nhãn Listening hoặc Reading." checked={experience.showSectionLabel} onChange={(value) => patch({ showSectionLabel: value })} />
        <SettingToggle label="Hiển thị số thứ tự câu" description="Hiện Câu x / tổng số câu." checked={experience.showQuestionCounter} onChange={(value) => patch({ showQuestionCounter: value })} />
        <SettingToggle label="Cho xem chi tiết kết quả" description="Bật màn review đáp án sau khi nộp." checked={experience.showResultDetails} onChange={(value) => patch({ showResultDetails: value })} />
        <SettingToggle label="Hiển thị giải thích" description="Hiện explanation trong phần review." checked={experience.showExplanations} onChange={(value) => patch({ showExplanations: value })} />
      </div>
    </div>
  );
}

function ModeCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-blue-500 bg-white ring-4 ring-blue-500/10 dark:bg-slate-900"
          : "border-slate-200 bg-white/60 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900/50"
      }`}
    >
      <span className="font-extrabold text-slate-900 dark:text-white">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
    </button>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <span>
        <span className="block text-sm font-extrabold text-slate-800 dark:text-slate-100">{label}</span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-blue-600"
      />
    </label>
  );
}

function RangeSetting({
  title,
  start,
  end,
  onChange,
}: {
  title: string;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}) {
  return (
    <div className="grid items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[1fr_130px_130px]">
      <div>
        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-xs text-slate-500">Có thể đặt phạm vi riêng, không phụ thuộc mốc mặc định.</p>
      </div>
      <label className="admin-field">
        <span>Từ câu</span>
        <input type="number" min={1} value={start} onChange={(event) => onChange(Math.max(1, Number(event.target.value)), end)} />
      </label>
      <label className="admin-field">
        <span>Đến câu</span>
        <input type="number" min={1} value={end} onChange={(event) => onChange(start, Math.max(1, Number(event.target.value)))} />
      </label>
    </div>
  );
}

function StructureInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value)))}
      />
    </label>
  );
}
