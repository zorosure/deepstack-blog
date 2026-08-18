import { consumeOAuthState, createSession } from "../../../../../lib/server/auth-db";
import { randomToken, seal, unseal } from "../../../../../lib/server/crypto";
import { adminLogin, getGithubAppCredentials, githubRequest } from "../../../../../lib/server/github";

function cookieValue(request: Request, name: string) {
  const item = (request.headers.get("cookie") ?? "").split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
}

function adminRedirect(request: Request, error?: string) {
  return new URL(error ? `/admin?error=${encodeURIComponent(error)}` : "/admin?login=success", request.url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const state = url.searchParams.get("state") ?? "";
    const code = url.searchParams.get("code") ?? "";
    const encryptedState = cookieValue(request, "deepstack_oauth_state");
    if (!state || !code || !encryptedState) throw new Error("登录状态无效");
    const cookieState = await unseal<{ state: string; expiresAt: number }>(encryptedState);
    if (cookieState.state !== state || cookieState.expiresAt < Date.now()) throw new Error("登录状态已过期");
    const verifier = await consumeOAuthState(state);
    if (!verifier) throw new Error("登录请求不存在或已使用");
    const credentials = await getGithubAppCredentials();
    if (!credentials) throw new Error("GitHub App 尚未配置");
    const origin = new URL(request.url).origin;
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "content-type": "application/json", "User-Agent": "deepstack-publisher" },
      body: JSON.stringify({ client_id: credentials.clientId, client_secret: credentials.clientSecret, code, redirect_uri: `${origin}/api/auth/github/callback`, code_verifier: verifier }),
    });
    const tokenData = await tokenResponse.json() as Record<string, unknown>;
    const accessToken = String(tokenData.access_token ?? "");
    if (!tokenResponse.ok || !accessToken) throw new Error(String(tokenData.error_description ?? "GitHub 登录失败"));
    const userResponse = await githubRequest("/user", accessToken);
    const user = await userResponse.json() as { login?: string };
    if (!userResponse.ok || user.login !== adminLogin()) throw new Error(`只有管理员 ${adminLogin()} 可以登录`);

    const id = randomToken();
    const now = Date.now();
    const tokenLifetime = Number(tokenData.expires_in ?? 30 * 24 * 60 * 60);
    const refreshLifetime = Number(tokenData.refresh_token_expires_in ?? tokenLifetime);
    const accessTokenExpiresAt = now + tokenLifetime * 1000;
    const refreshTokenExpiresAt = tokenData.refresh_token ? now + refreshLifetime * 1000 : undefined;
    const expiresAt = now + Math.min(refreshLifetime, 30 * 24 * 60 * 60) * 1000;
    await createSession({
      id,
      githubLogin: user.login,
      encryptedToken: await seal(accessToken),
      encryptedRefreshToken: tokenData.refresh_token ? await seal(String(tokenData.refresh_token)) : undefined,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      expiresAt,
    });
    const headers = new Headers({ location: adminRedirect(request).toString() });
    headers.append("set-cookie", `deepstack_session=${encodeURIComponent(id)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor((expiresAt - Date.now()) / 1000)}`);
    headers.append("set-cookie", "deepstack_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
    return new Response(null, { status: 303, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败";
    return Response.redirect(adminRedirect(request, message), 303);
  }
}
