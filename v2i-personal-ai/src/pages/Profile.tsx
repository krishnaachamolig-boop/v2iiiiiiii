import { useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import { env } from "@/lib/env";
import { V2iIDService } from "@/services/integrations/V2iIDService";
import { V2iVoiceService } from "@/services/integrations/V2iVoiceService";
import { BeginningWriteService } from "@/services/integrations/BeginningWriteService";
import { YuniverseService } from "@/services/integrations/YuniverseService";

const connectedApps = [
  { key: "v2i_id", label: "V2i ID", svc: V2iIDService },
  { key: "v2i_voice", label: "V2i AI Voice", svc: V2iVoiceService },
  { key: "beginning_write", label: "Beginning Write", svc: BeginningWriteService },
  { key: "yuniverse", label: "Yuniverse", svc: YuniverseService },
];

export default function Profile() {
  const { profile, signOut } = useAuthStore();
  const [language, setLanguage] = useState(profile?.preferred_language ?? "hinglish");

  const saveLanguage = async (lang: "hindi" | "english" | "hinglish") => {
    if (!profile) return;
    setLanguage(lang);
    await supabase.from("profiles").update({ preferred_language: lang }).eq("id", profile.id);
  };

  return (
    <div className="space-y-6 pt-6 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neon-cyan/15 text-lg font-semibold text-neon-cyan">
          {profile?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-base font-medium text-slate-100">{profile?.name}</p>
          <p className="text-xs text-slate-500">{profile?.v2i_id ?? "No V2i ID linked"}</p>
        </div>
      </div>

      <Section title="Language">
        <div className="flex gap-2">
          {(["hindi", "english", "hinglish"] as const).map((l) => (
            <button
              key={l}
              onClick={() => saveLanguage(l)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                language === l ? "border-neon-cyan text-neon-cyan" : "border-base-700 text-slate-400"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Connected V2i apps">
        <ul className="space-y-2">
          {connectedApps.map((app) => {
            const configured = app.svc.isConfigured();
            return (
              <li key={app.key} className="glass-card flex items-center justify-between rounded-xl px-3 py-2 text-sm">
                <span>{app.label}</span>
                <span className={configured ? "text-neon-cyan text-xs" : "text-slate-500 text-xs"}>
                  {configured ? "Connected" : "Not configured"}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Providers">
        <ul className="space-y-1 text-xs text-slate-400">
          <li>AI: {env.AI_PROVIDER}</li>
          <li>Speech-to-text: {env.STT_PROVIDER}</li>
          <li>Text-to-speech: {env.TTS_PROVIDER}</li>
          <li>Web search: {env.SEARCH_PROVIDER}</li>
        </ul>
      </Section>

      <button
        onClick={() => signOut()}
        className="w-full rounded-full border border-red-500/30 py-2.5 text-sm text-red-300"
      >
        Sign out
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
  );
}
