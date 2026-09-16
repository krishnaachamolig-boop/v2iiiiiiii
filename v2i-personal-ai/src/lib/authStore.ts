import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "./supabase";
import { env } from "./env";
import type { Profile } from "@/types";

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  error: null,

  async init() {
    set({ loading: true, error: null });

    if (!isSupabaseConfigured()) {
      set({ loading: false, error: "Supabase is not configured. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY." });
      return;
    }

    if (env.DEV_AUTH_BYPASS) {
      // Development-only path: signs in (or creates) a local dev user via
      // Supabase's own auth so RLS policies still apply normally. This is
      // NOT V2i ID — it exists purely so the app is usable before V2i ID's
      // API is available. Disable via VITE_DEV_AUTH_BYPASS=false for prod.
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: env.DEV_USER_EMAIL,
        password: "dev-local-only-password-change-me",
      });
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: env.DEV_USER_EMAIL,
          password: "dev-local-only-password-change-me",
        });
        if (signUpError) {
          set({ loading: false, error: `Dev auth failed: ${signUpError.message}` });
          return;
        }
      }
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      set({ loading: false, profile: null });
      return;
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      set({ loading: false, error: profileError.message });
      return;
    }

    if (!profileRow) {
      const { data: created, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userData.user.id,
          name: userData.user.email?.split("@")[0] ?? "User",
          preferred_language: env.DEFAULT_LANGUAGE,
        })
        .select()
        .single();
      if (createError) {
        set({ loading: false, error: createError.message });
        return;
      }
      set({ profile: created as Profile, loading: false });
      return;
    }

    set({ profile: profileRow as Profile, loading: false });
  },

  async signOut() {
    await supabase.auth.signOut();
    set({ profile: null });
  },
}));
