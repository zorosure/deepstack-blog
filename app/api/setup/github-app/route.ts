import { getGithubAppCredentials, type GithubAppCredentials } from "../../../../lib/server/github";
import { seal, unseal } from "../../../../lib/server/crypto";
import { setEncryptedConfig } from "../../../../lib/server/auth-db";

function cookieValue(request: Request, name: string) {
  const item = (request.headers.get("cookie") ?? "").split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    if (await getGithubAppCredentials()) return Response.redirect(new URL("/admin?configured=1", request.url), 303);
    const cookie = cookieValue(request, "deepstack_setup");
    if (!cookie) throw new Error("初始化会话已失效");
    const setup = await unseal<{ purpose: string; expiresAt: number }>(cookie);
    if (setup.purpose !== "github-app-setup" || setup.expiresAt < Date.now()) throw new Error("初始化会话已过期");
    const code = url.searchParams.get("code");
    if (!code) throw new Error("GitHub 未返回注册码");

    const converted = await fetch(`https://api.github.com/app-manifests/${encodeURIComponent(code)}/conversions`, {
      method: "POST",
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10", "User-Agent": "deepstack-publisher" },
    });
    const payload = await converted.json() as Record<string, unknown>;
    if (!converted.ok) throw new Error(String(payload.message ?? "无法创建 GitHub App"));

    const credentials: GithubAppCredentials = {
      appId: Number(payload.id),
      slug: String(payload.slug),
      clientId: String(payload.client_id),
      clientSecret: String(payload.client_secret),
    };
    await setEncryptedConfig("github_app", await seal(credentials));
    return new Response(null, { status: 303, headers: { location: `https://github.com/apps/${encodeURIComponent(credentials.slug)}/installations/new`, "set-cookie": "deepstack_setup=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.redirect(new URL(`/setup?error=${encodeURIComponent(message)}`, request.url), 303);
  }
}
