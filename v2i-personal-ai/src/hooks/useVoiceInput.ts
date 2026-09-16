import { useCallback, useRef, useState } from "react";
import { getSTTProvider, startBrowserRecognition } from "@/services/voice";
import { env } from "@/lib/env";

export type VoiceInputStatus = "idle" | "listening" | "transcribing" | "error";

/**
 * Push-to-talk / hold-to-talk / tap-to-talk mic hook. Uses cloud STT
 * (Whisper) when configured, otherwise falls back to the browser's live
 * SpeechRecognition. Wake-word/always-listening is intentionally NOT
 * implemented here — that requires native background-audio permissions this
 * web/Capacitor build does not claim to provide (see README limitations).
 */
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopBrowserRef = useRef<(() => void) | null>(null);

  const startCloud = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        setStatus("transcribing");
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const stt = getSTTProvider();
          const result = await stt.transcribe(blob, { language: "auto" });
          onTranscript(result.text);
          setStatus("idle");
        } catch (err) {
          setError((err as Error).message);
          setStatus("error");
        } finally {
          stream.getTracks().forEach((t) => t.stop());
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("listening");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  }, [onTranscript]);

  const startBrowser = useCallback(() => {
    setStatus("listening");
    const { stop } = startBrowserRecognition(
      (result) => {
        onTranscript(result.text);
        setStatus("idle");
      },
      (err) => {
        setError(err.message);
        setStatus("error");
      }
    );
    stopBrowserRef.current = stop;
  }, [onTranscript]);

  const start = useCallback(() => {
    setError(null);
    if (env.STT_PROVIDER === "whisper" && env.WHISPER_API_KEY) {
      void startCloud();
    } else {
      startBrowser();
    }
  }, [startCloud, startBrowser]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (stopBrowserRef.current) {
      stopBrowserRef.current();
      stopBrowserRef.current = null;
    }
  }, []);

  return { status, error, start, stop };
}
