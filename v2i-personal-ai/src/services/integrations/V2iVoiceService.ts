import { env } from "@/lib/env";
import type { VoiceProfile } from "@/services/voice/VoiceProvider";

/**
 * Adapter for the future V2i AI Voice product (voice profiles/cloning/conversion).
 * No public API exists yet — every method checks configuration and reports
 * "not_configured" rather than fabricating a voice model or success response.
 * Access requires the requesting user to own the target voice profile;
 * `requireOwnership` is a placeholder enforcement point wired into every
 * mutating call below.
 */
export const V2iVoiceService = {
  isConfigured(): boolean {
    return Boolean(env.V2I_VOICE_ENDPOINT && env.V2I_VOICE_API_KEY);
  },

  async listVoiceProfiles(userId: string): Promise<{ available: boolean; profiles: VoiceProfile[]; reason?: string }> {
    if (!this.isConfigured()) {
      return { available: false, profiles: [], reason: "V2i AI Voice endpoint not configured." };
    }
    const res = await fetch(`${env.V2I_VOICE_ENDPOINT}/voices?owner=${userId}`, {
      headers: { Authorization: `Bearer ${env.V2I_VOICE_API_KEY}` },
    });
    if (!res.ok) return { available: false, profiles: [], reason: `V2i Voice API error ${res.status}` };
    const data = await res.json();
    return { available: true, profiles: data.voices ?? [] };
  },

  async requestVoiceConversion(
    userId: string,
    voiceProfileId: string,
    sourceAudioUrl: string
  ): Promise<{ available: boolean; resultUrl?: string; reason?: string }> {
    if (!this.isConfigured()) {
      return { available: false, reason: "V2i AI Voice endpoint not configured." };
    }
    this.requireOwnership(userId, voiceProfileId);
    const res = await fetch(`${env.V2I_VOICE_ENDPOINT}/convert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.V2I_VOICE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ voiceProfileId, sourceAudioUrl, requestedBy: userId }),
    });
    if (!res.ok) return { available: false, reason: `V2i Voice conversion error ${res.status}` };
    const data = await res.json();
    return { available: true, resultUrl: data.resultUrl };
  },

  /** Ownership/authorization guard — real implementation should verify server-side. */
  requireOwnership(_userId: string, _voiceProfileId: string): void {
    // Enforced authoritatively on the V2i Voice backend once it exists;
    // this client-side check is a defense-in-depth placeholder only.
  },
};
