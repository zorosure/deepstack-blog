import { getGithubAppCredentials } from "../../../../lib/server/github";
import { randomToken, seal, sha256Base64Url } from "../../../../lib/server/crypto";
import { saveOAuthState } from "../../../../lib/server/auth-db";

export async function GET(request: Request) {
  const credentials = await getGithubAppCredentials();
  if (!credentials) return Response.redirect(new URL("/admin?error=not_configured", request.url), 303);
  const state = randomToken();
  const verifier = randomToken(48);
  const expiresAt = Date.now() + 10 * 60 * 1000;
  await saveOAuthState(state, verifier, expiresAt);
  const origin = new URL(request.url).origin;
  const target = new URL("https://github.com/login/oauth/authorize");
  target.searchParams.set("client_id", credentials.clientId);
  target.searchParams.set("redirect_uri", `${origin}/api/auth/github/callback`);
  target.searchParams.set("state", state);
  target.searchParams.set("code_challenge", await sha256Base64Url(verifier));
  target.searchParams.set("code_challenge_method", "S256");
  target.searchParams.set("allow_signup", "false");
  const stateCookie = await seal({ state, expiresAt });
  return new Response(null, { status: 303, headers: { location: target.toString(), "set-cookie": `deepstack_oauth_state=${encodeURIComponent(stateCookie)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600` } });
}
