// ============================================================
// Voice abstraction layer. UI code only talks to these
// interfaces — never to a specific vendor SDK directly.
// ============================================================

export interface TranscriptionResult {
  text: string;
  language?: string;
  confidence?: number;
}

export interface SpeechToTextProvider {
  readonly name: string;
  isConfigured(): boolean;
  /** Transcribe a recorded audio blob (e.g. webm/wav) into text. */
  transcribe(audio: Blob, opts?: { language?: "hi" | "en" | "auto" }): Promise<TranscriptionResult>;
}

export interface TextToSpeechProvider {
  readonly name: string;
  isConfigured(): boolean;
  /** Synthesize speech audio for the given text. Returns a playable audio URL. */
  synthesize(text: string, opts?: { voiceId?: string }): Promise<{ audioUrl: string }>;
}

export interface VoiceProfile {
  id: string;
  name: string;
  providerVoiceId: string;
  ownerId: string;
}

export interface VoiceCloneProvider {
  readonly name: string;
  isConfigured(): boolean;
  listVoices(ownerId: string): Promise<VoiceProfile[]>;
  /** Requires explicit ownership/consent check upstream before calling. */
  cloneVoice(ownerId: string, sampleAudio: Blob[], label: string): Promise<VoiceProfile>;
}
