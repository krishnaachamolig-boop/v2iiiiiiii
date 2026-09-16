import { WhisperSTTProvider } from "./SpeechToText";
import { ElevenLabsTTSProvider, BrowserTTSProvider } from "./TextToSpeech";
import type { SpeechToTextProvider, TextToSpeechProvider } from "./VoiceProvider";
import { env } from "@/lib/env";

export * from "./VoiceProvider";
export * from "./SpeechToText";
export * from "./TextToSpeech";

export function getSTTProvider(): SpeechToTextProvider {
  const whisper = new WhisperSTTProvider();
  if (env.STT_PROVIDER === "whisper" && whisper.isConfigured()) return whisper;
  // Falls back to live browser recognition, handled by useVoiceInput directly.
  return whisper;
}

export function getTTSProvider(): TextToSpeechProvider {
  const eleven = new ElevenLabsTTSProvider();
  if (env.TTS_PROVIDER === "elevenlabs" && eleven.isConfigured()) return eleven;
  console.warn("[Voice] ElevenLabs not configured — falling back to browser TTS.");
  return new BrowserTTSProvider();
}
