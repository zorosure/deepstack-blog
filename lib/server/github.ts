import { deleteSession, getEncryptedConfig, getSession, updateSessionTokens } from "./auth-db";
import { seal, timingSafeTextEqual, unseal } from "./crypto";
import { optionalRuntimeValue, runtimeValue } from "./runtime";

export type GithubAppCredentials = {
  clientId: string;
  clientSecret: string;
  slug: string;
  appId: number;
};

export async function getGithubAppCredentials() {
  const encrypted = await getEncryptedConfig("github_app");
  return encrypted ? unseal<GithubAppCredentials>(encrypted) : undefined;
}

export function adminLogin() {
  return optionalRuntimeValue("ADMIN_GITHUB_LOGIN") ?? "zorosure";
}

export function repositoryName() {
  return optionalRuntimeValue("GITHUB_REPOSITORY") ?? "zorosure/deepstack-blog";
}

export function publicBlogUrl() {
  return optionalRuntimeValue("PUBLIC_BLOG_URL") ?? "https://zorosure.github.io/deepstack-blog/";
}

export async function githubRequest(path: string, token: string, init: RequestInit = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "deepstack-publisher",
      ...init.headers,
    },
  });
}

export function sessionIdFromRequest(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith("deepstack_session="));
  return value ? decodeURIComponent(value.slice("deepstack_session=".length)) : undefined;
}

export async function authenticatedSession(request: Request) {
  const id = sessionIdFromRequest(request);
  if (!id) return undefined;
  const session = await getSession(id);
  if (!session || session.github_login !== adminLogin()) return undefined;
  let token = await unseal<string>(session.encrypted_token);
  if (session.access_token_expires_at <= Date.now() + 60_000) {
    if (!session.encrypted_refresh_token || (session.refresh_token_expires_at && session.refresh_token_expires_at <= Date.now())) {
      await deleteSession(id);
      return undefined;
    }
    const credentials = await getGithubAppCredentials();
    if (!credentials) return undefined;
    const refreshToken = await unseal<string>(session.encrypted_refresh_token);
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "content-type": "application/json", "User-Agent": "deepstack-publisher" },
      body: JSON.stringify({ client_id: credentials.clientId, client_secret: credentials.clientSecret, grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    const payload = await response.json() as Record<string, unknown>;
    token = String(payload.access_token ?? "");
    if (!response.ok || !token) {
      await deleteSession(id);
      return undefined;
    }
    const nextRefreshToken = String(payload.refresh_token ?? refreshToken);
    const accessTokenExpiresAt = Date.now() + Number(payload.expires_in ?? 8 * 60 * 60) * 1000;
    const refreshTokenExpiresAt = payload.refresh_token_expires_in
      ? Date.now() + Number(payload.refresh_token_expires_in) * 1000
      : session.refresh_token_expires_at ?? undefined;
    await updateSessionTokens(id, {
      encryptedToken: await seal(token),
      encryptedRefreshToken: await seal(nextRefreshToken),
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    });
  }
  return { id, login: session.github_login, token, expiresAt: session.expires_at };
}

export function requireSetupToken(value: string) {
  return timingSafeTextEqual(runtimeValue("SETUP_TOKEN"), value);
}
