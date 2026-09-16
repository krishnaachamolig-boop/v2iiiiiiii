/** Centralized, typed access to import.meta.env. Never read import.meta.env elsewhere. */
function readBool(v: string | undefined, fallback = false): boolean {
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",

  DEV_AUTH_BYPASS: readBool(import.meta.env.VITE_DEV_AUTH_BYPASS, false),
  DEV_USER_EMAIL: import.meta.env.VITE_DEV_USER_EMAIL ?? "dev@v2i.local",

  AI_PROVIDER: (import.meta.env.VITE_AI_PROVIDER ?? "anthropic") as "anthropic" | "openai" | "mock",
  ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY ?? "",
  ANTHROPIC_MODEL: import.meta.env.VITE_ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  AI_PROXY: readBool(import.meta.env.VITE_AI_PROXY, false),

  STT_PROVIDER: (import.meta.env.VITE_STT_PROVIDER ?? "whisper") as "whisper" | "browser" | "mock",
  WHISPER_API_KEY: import.meta.env.VITE_WHISPER_API_KEY ?? "",
  WHISPER_API_URL:
    import.meta.env.VITE_WHISPER_API_URL ?? "https://api.openai.com/v1/audio/transcriptions",

  TTS_PROVIDER: (import.meta.env.VITE_TTS_PROVIDER ?? "elevenlabs") as "elevenlabs" | "browser" | "mock",
  ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY ?? "",
  ELEVENLABS_VOICE_ID: import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? "",
  ELEVENLABS_API_URL: import.meta.env.VITE_ELEVENLABS_API_URL ?? "https://api.elevenlabs.io/v1",

  SEARCH_PROVIDER: (import.meta.env.VITE_SEARCH_PROVIDER ?? "brave") as "brave" | "serpapi" | "none",
  SEARCH_API_KEY: import.meta.env.VITE_SEARCH_API_KEY ?? "",
  SEARCH_API_URL:
    import.meta.env.VITE_SEARCH_API_URL ?? "https://api.search.brave.com/res/v1/web/search",

  V2I_ID_ENDPOINT: import.meta.env.VITE_V2I_ID_ENDPOINT ?? "",
  V2I_ID_CLIENT_ID: import.meta.env.VITE_V2I_ID_CLIENT_ID ?? "",
  V2I_VOICE_ENDPOINT: import.meta.env.VITE_V2I_VOICE_ENDPOINT ?? "",
  V2I_VOICE_API_KEY: import.meta.env.VITE_V2I_VOICE_API_KEY ?? "",
  BEGINNING_WRITE_ENDPOINT: import.meta.env.VITE_BEGINNING_WRITE_ENDPOINT ?? "",
  BEGINNING_WRITE_API_KEY: import.meta.env.VITE_BEGINNING_WRITE_API_KEY ?? "",
  YUNIVERSE_ENDPOINT: import.meta.env.VITE_YUNIVERSE_ENDPOINT ?? "",
  YUNIVERSE_API_KEY: import.meta.env.VITE_YUNIVERSE_API_KEY ?? "",

  APP_NAME: import.meta.env.VITE_APP_NAME ?? "V2i Personal AI",
  DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE ?? "hinglish",
};
