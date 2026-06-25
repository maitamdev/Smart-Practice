import { Headphones, Volume2 } from "lucide-react";

type AudioPlayerProps = {
  src: string;
  compact?: boolean;
};

export function AudioPlayer({ src, compact = false }: AudioPlayerProps) {
  return (
    <div className={`rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-cyan-950/20 ${compact ? "p-3" : "p-4"}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-blue-700 dark:text-blue-300">
        {compact ? <Volume2 size={15} /> : <Headphones size={16} />}
        Listening audio
      </div>
      <audio controls preload="metadata" src={src} className="h-10 w-full" controlsList="nodownload">
        Trình duyệt của bạn không hỗ trợ phát audio.
      </audio>
    </div>
  );
}
