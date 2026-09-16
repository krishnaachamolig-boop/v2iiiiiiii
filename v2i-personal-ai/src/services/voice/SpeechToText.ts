import type { SpeechToTextProvider, TranscriptionResult } from "./VoiceProvider";
import { env } from "@/lib/env";

/** Cloud Whisper-compatible STT (OpenAI /v1/audio/transcriptions or compatible). */
export class WhisperSTTProvider implements SpeechToTextProvider {
  readonly name = "whisper";

  isConfigured(): boolean {
    return Boolean(env.WHISPER_API_KEY && env.WHISPER_API_URL);
  }

  async transcribe(
    audio: Blob,
    opts?: { language?: "hi" | "en" | "auto" }
  ): Promise<TranscriptionResult> {
    if (!this.isConfigured()) {
      throw new Error("Whisper STT not configured: set VITE_WHISPER_API_KEY.");
    }

    const form = new FormData();
    form.append("file", audio, "audio.webm");
    form.append("model", "whisper-1");
    if (opts?.language && opts.language !== "auto") {
      form.append("language", opts.language);
    }

    const res = await fetch(env.WHISPER_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.WHISPER_API_KEY}` },
      body: form,
    });

    if (!res.ok) {
      throw new Error(`Whisper STT error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return { text: data.text as string, language: data.language };
  }
}

/**
 * Browser-native SpeechRecognition fallback. Zero cost, zero API key, but
 * quality/availability varies by browser (best on Chrome/Edge desktop and
 * Android Chrome). Used automatically if no cloud STT key is configured.
 */
export class BrowserSTTProvider implements SpeechToTextProvider {
  readonly name = "browser";

  isConfigured(): boolean {
    return typeof window !== "undefined" && "webkitSpeechRecognition" in window;
  }

  async transcribe(
    _audio: Blob,
    opts?: { language?: "hi" | "en" | "auto" }
  ): Promise<TranscriptionResult> {
    // Browser SpeechRecognition works on a live mic stream, not a recorded
    // Blob. The live-capture flow lives in src/hooks/useVoiceInput.ts, which
    // calls startBrowserRecognition() below directly during recording rather
    // than routing through this method. This method exists to satisfy the
    // shared interface for callers that already have a Blob (e.g. replays).
    throw new Error(
      "BrowserSTTProvider does not support blob transcription — use startBrowserRecognition() for live capture."
    );
  }
}

/** Starts a live browser SpeechRecognition session. Returns a stop() function. */
export function startBrowserRecognition(
  onResult: (result: TranscriptionResult) => void,
  onError: (err: Error) => void,
  language: "hi-IN" | "en-IN" = "hi-IN"
): { stop: () => void } {
  const SpeechRecognitionCtor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) {
    onError(new Error("SpeechRecognition not supported in this browser."));
    return { stop: () => {} };
  }

  const recognition = new SpeechRecognitionCtor();
  recognition.lang = language;
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult({ text: transcript, confidence: event.results[0][0].confidence });
  };
  recognition.onerror = (event: any) => onError(new Error(`SpeechRecognition: ${event.error}`));

  recognition.start();
  return { stop: () => recognition.stop() };
}
