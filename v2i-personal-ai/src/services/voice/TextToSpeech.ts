import type { TextToSpeechProvider } from "./VoiceProvider";
import { env } from "@/lib/env";

export class ElevenLabsTTSProvider implements TextToSpeechProvider {
  readonly name = "elevenlabs";

  isConfigured(): boolean {
    return Boolean(env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID);
  }

  async synthesize(text: string, opts?: { voiceId?: string }): Promise<{ audioUrl: string }> {
    if (!this.isConfigured()) {
      throw new Error("ElevenLabs TTS not configured: set VITE_ELEVENLABS_API_KEY and VITE_ELEVENLABS_VOICE_ID.");
    }

    const voiceId = opts?.voiceId || env.ELEVENLABS_VOICE_ID;
    const res = await fetch(`${env.ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2", // supports Hindi + English
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs TTS error ${res.status}: ${await res.text()}`);
    }

    const blob = await res.blob();
    return { audioUrl: URL.createObjectURL(blob) };
  }
}

/** Zero-config browser TTS fallback (quality varies by OS/browser voice packs). */
export class BrowserTTSProvider implements TextToSpeechProvider {
  readonly name = "browser";

  isConfigured(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  async synthesize(text: string): Promise<{ audioUrl: string }> {
    // speechSynthesis plays directly rather than returning a URL; we wrap it
    // so callers can still `await` a consistent-looking result.
    return new Promise((resolve, reject) => {
      if (!this.isConfigured()) {
        reject(new Error("Browser speechSynthesis not supported."));
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve({ audioUrl: "" }); // played in-place, no URL
      utterance.onerror = (e) => reject(new Error(`speechSynthesis error: ${e.error}`));
      window.speechSynthesis.speak(utterance);
    });
  }
}
