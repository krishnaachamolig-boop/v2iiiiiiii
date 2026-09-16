# V2i Personal AI

A private, JARVIS-style personal AI assistant. Voice- and text-driven, with
tasks, projects, reminders, file management, web research, persistent AI
memory, a permission-gated tool/agent system, and architecture for the wider
V2i ecosystem (V2i ID, V2i AI Voice, Beginning Write, Yuniverse).

## Architecture

```
Voice/Text Input → STT (if voice) → Agent Orchestrator
  → AI Provider (Claude) selects tools → Permission System checks each tool
  → READ/PREPARE/AUTO tools execute immediately, logged to Activity
  → CONFIRM tools are queued as Pending Actions and shown as approval cards
  → Tool results feed back into the model → Final response
  → TTS (voice output) + Memory updates (via the `remember` tool)
```

Key folders:

- `src/services/ai/` — `AIProvider` interface + Anthropic Claude implementation + offline Mock fallback
- `src/services/voice/` — STT (Whisper/browser), TTS (ElevenLabs/browser), `VoiceCloneProvider` interface
- `src/ai/` — `PermissionSystem.ts` (4-tier gate), `AgentOrchestrator.ts` (the full pipeline), `systemPrompt.ts`
- `src/tools/registry.ts` — every tool the AI can call, with its permission level and input schema
- `src/memory/memoryService.ts` — persistent AI memory (Supabase-backed), refuses to store secret-like values
- `src/services/*Service.ts` — tasks, projects, reminders, files, activity log (all Supabase CRUD)
- `src/services/integrations/` — V2i ID, V2i AI Voice, Beginning Write, Yuniverse adapters (honestly report "not configured" until those APIs exist)
- `supabase/migrations/0001_init.sql` — full schema + Row Level Security policies
- `src/pages/`, `src/layouts/`, `src/components/` — mobile-first dark UI

## Environment variables

Copy `.env.example` to `.env` and fill in what you have. Everything is
designed to degrade gracefully — the app runs and clearly reports what's
unconfigured rather than crashing or faking success:

| Variable | Required for |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Auth, database, memory, storage — most features |
| `VITE_ANTHROPIC_API_KEY` | Real AI chat responses (falls back to a labeled mock otherwise) |
| `VITE_WHISPER_API_KEY` | Cloud speech-to-text (falls back to browser SpeechRecognition) |
| `VITE_ELEVENLABS_API_KEY`, `VITE_ELEVENLABS_VOICE_ID` | Cloud text-to-speech (falls back to browser speechSynthesis) |
| `VITE_SEARCH_API_KEY` | Web research tool (reports "unavailable" if unset — never fakes results) |
| `VITE_V2I_ID_ENDPOINT`, `VITE_V2I_VOICE_ENDPOINT`, `VITE_BEGINNING_WRITE_ENDPOINT`, `VITE_YUNIVERSE_ENDPOINT` | V2i ecosystem integrations — no public API exists yet, so these adapters are structurally complete but inert until real endpoints are provided |

## Supabase setup

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql` in full (it
   also creates the `user-files` storage bucket and its RLS policies).
3. Copy your Project URL and anon public key into `.env`.
4. Leave `VITE_DEV_AUTH_BYPASS=true` while developing — it signs in a local
   dev user through Supabase's own auth (RLS still applies normally). Set it
   to `false` once V2i ID is wired up for production.

## Development

```bash
npm install
cp .env.example .env   # then fill in your keys
npm run dev
```

Opens at `http://localhost:5173`. Works immediately even with an empty
`.env` — you'll see "Setup needed" banners telling you exactly what's
missing, and chat runs on a clearly-labeled mock AI provider until you add
`VITE_ANTHROPIC_API_KEY`.

## Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

Before shipping: set `VITE_AI_PROXY=true` and stand up a same-origin
`/api/ai/complete` route (e.g. a Supabase Edge Function) that holds your
Anthropic key server-side. Calling `api.anthropic.com` directly from the
browser (the default, `VITE_AI_PROXY=false`) exposes your key in the client
bundle and is for local development only.

## Android APK generation

Requires Android Studio + the Android SDK installed locally (not included
here — see `android/README.md` for exactly why and what to install).

```bash
npm install
npm run build
npx cap add android      # generates the native Android project (first time only)
npx cap sync android
npx cap open android      # opens Android Studio — build/run/export APK from there
```

Or headless, once the Android SDK + Gradle are installed:

```bash
cd android
./gradlew assembleDebug   # → android/app/build/outputs/apk/debug/app-debug.apk
```

Apply the permissions listed in `android/README.md` to
`android/app/src/main/AndroidManifest.xml` after generation — that file also
documents the Android limitations (no true wake-word listening, OEM
battery-optimization can delay reminders) honestly rather than glossing over
them.

## Security

- No service-role key, password, or OAuth secret ever ships in `VITE_`-prefixed
  env vars or client code.
- Every table has Row Level Security scoped to `auth.uid()`.
- `memoryService.remember()` regex-rejects anything that looks like an API
  key/password/token before it's ever written to the database.
- Every tool declares a permission level; `CONFIRM`-level tools (delete,
  publish, external-service writes) can never execute without an explicit
  approval tap on a confirmation card — this is enforced centrally in
  `AgentOrchestrator.ts`, not per-tool, so it can't be bypassed by adding a
  new tool incorrectly.

## Future integrations

`V2iIDService`, `V2iVoiceService`, `BeginningWriteService`, and
`YuniverseService` in `src/services/integrations/` are complete, typed
adapters with the expected request/response contracts already wired into
the tool registry and UI (Profile page shows live "Connected / Not
configured" status per app). Once each product exposes a real API, only
those four files need real endpoint logic — nothing else in the app changes.

## Genuinely unavoidable limitations (see also `android/README.md`)

1. **V2i ID / V2i AI Voice / Beginning Write / Yuniverse** have no public
   APIs to integrate against today. The adapters are real, structurally
   complete, and gated on `isConfigured()` — but they cannot make live
   calls until those services publish an API.
2. **Wake-word background listening** is not implemented (requires a native
   always-on audio pipeline outside this build's scope). Voice input is
   tap/hold-to-talk, which is fully functional.
3. **Background reminder delivery on Android** depends on the OS and can be
   delayed by OEM battery optimizers — documented, not silently assumed away.
4. **OS-level "computer control"** (clicking/typing outside the app) is not
   implemented, since it requires Android Accessibility Service permissions
   with serious security implications; the tool-registry architecture has a
   slot for it, deliberately left unfilled.
