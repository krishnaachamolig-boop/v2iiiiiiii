import { useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import { V2iIDService } from "@/services/integrations/V2iIDService";
import { ConfigWarning } from "@/components/common/ConfigWarning";

export default function Login() {
  const { init, loading, error } = useAuthStore();

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authUrl = V2iIDService.getAuthorizationUrl(window.location.origin + "/auth/callback");

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neon-cyan/50 bg-neon-cyan/10 shadow-glow-lg">
        <span className="text-2xl">✦</span>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-slate-100">V2i Personal AI</h1>
        <p className="mt-1 text-sm text-slate-500">Your private JARVIS-style assistant</p>
      </div>

      {loading && <p className="text-sm text-slate-400">Connecting…</p>}

      {!loading && error && (
        <div className="w-full max-w-sm space-y-3">
          <ConfigWarning message={error} />
          {!isSupabaseConfigured() && (
            <p className="text-xs text-slate-500">
              Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file, then reload.
            </p>
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="w-full max-w-sm space-y-3">
          {authUrl ? (
            <a
              href={authUrl}
              className="block w-full rounded-full bg-neon-cyan/20 py-3 text-sm font-medium text-neon-cyan"
            >
              Sign in with V2i ID
            </a>
          ) : (
            <p className="text-xs text-slate-500">
              V2i ID is not yet configured (VITE_V2I_ID_ENDPOINT). Using development sign-in instead.
            </p>
          )}
          <button
            onClick={() => init()}
            className="w-full rounded-full border border-base-600 py-3 text-sm text-slate-300"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
