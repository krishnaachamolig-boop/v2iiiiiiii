import clsx from "clsx";
import type { VoiceInputStatus } from "@/hooks/useVoiceInput";

interface MicButtonProps {
  status: VoiceInputStatus;
  onPress: () => void;
  onRelease: () => void;
  size?: "lg" | "md";
}

/** Hold-to-talk by default (press and hold, release to send). */
export function MicButton({ status, onPress, onRelease, size = "lg" }: MicButtonProps) {
  const dims = size === "lg" ? "h-24 w-24" : "h-14 w-14";
  const listening = status === "listening";
  const busy = status === "transcribing";

  return (
    <div className="relative flex items-center justify-center">
      {listening && (
        <span className={clsx("absolute rounded-full bg-neon-cyan/40 animate-pulseRing", dims)} />
      )}
      <button
        aria-label="Talk to V2i"
        onPointerDown={onPress}
        onPointerUp={onRelease}
        onPointerLeave={() => listening && onRelease()}
        disabled={busy}
        className={clsx(
          dims,
          "relative z-10 flex items-center justify-center rounded-full border transition-all duration-150",
          listening
            ? "border-neon-cyan bg-neon-cyan/20 shadow-glow-lg scale-105"
            : "border-base-600 bg-base-850 shadow-glow hover:border-neon-cyan/60",
          busy && "opacity-60"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(size === "lg" ? "h-10 w-10" : "h-6 w-6", listening ? "text-neon-glow" : "text-neon-cyan")}
        >
          <path
            d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z"
            fill="currentColor"
          />
          <path
            d="M19 11a1 1 0 00-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07A7 7 0 0019 11z"
            fill="currentColor"
          />
        </svg>
      </button>
      <span className="absolute -bottom-7 text-xs text-slate-400">
        {busy ? "Transcribing…" : listening ? "Listening… release to send" : "Hold to talk"}
      </span>
    </div>
  );
}
