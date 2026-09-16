import { env } from "@/lib/env";

/**
 * V2i ID is the intended production auth system for this app. No public
 * V2i ID API exists to integrate against yet, so this adapter defines the
 * expected contract and reports "not_configured" honestly rather than faking
 * a login. Swap the method bodies for real calls once V2i ID exposes an API
 * (likely OAuth2/OIDC — this shape assumes that).
 */
export interface V2iIDUser {
  v2iId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export const V2iIDService = {
  isConfigured(): boolean {
    return Boolean(env.V2I_ID_ENDPOINT && env.V2I_ID_CLIENT_ID);
  },

  /** Redirects to the V2i ID authorization endpoint (OAuth2 authorization-code flow assumed). */
  getAuthorizationUrl(redirectUri: string): string | null {
    if (!this.isConfigured()) return null;
    const params = new URLSearchParams({
      client_id: env.V2I_ID_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "profile email",
    });
    return `${env.V2I_ID_ENDPOINT}/oauth/authorize?${params.toString()}`;
  },

  async exchangeCodeForUser(_code: string): Promise<V2iIDUser | null> {
    if (!this.isConfigured()) {
      console.warn("[V2iID] Not configured — cannot exchange auth code.");
      return null;
    }
    // Real implementation: POST code to `${env.V2I_ID_ENDPOINT}/oauth/token`,
    // then GET the user profile with the returned access token. Left as a
    // clearly-marked stub until the V2i ID API contract is published.
    throw new Error("V2iIDService.exchangeCodeForUser: V2i ID API not yet available.");
  },
};
