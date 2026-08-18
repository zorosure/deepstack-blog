import { getGithubAppCredentials, requireSetupToken } from "../../../../lib/server/github";
import { seal } from "../../../../lib/server/crypto";

function htmlEscape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export async function POST(request: Request) {
  const form = await request.formData();
  const key = String(form.get("key") ?? "");
  try {
    if (!requireSetupToken(key)) return Response.redirect(new URL(`/setup?error=${encodeURIComponent("初始化链接无效")}`, request.url), 303);
    if (await getGithubAppCredentials()) return Response.redirect(new URL("/admin?configured=1", request.url), 303);

    const origin = new URL(request.url).origin;
    const manifest = {
      name: `Deepstack Publisher ${crypto.randomUUID().slice(0, 8)}`,
      url: `${origin}/admin`,
      description: "Private Markdown publisher for Deepstack Notes",
      callback_urls: [`${origin}/api/auth/github/callback`],
      redirect_url: `${origin}/api/setup/github-app`,
      setup_url: `${origin}/admin?installed=1`,
      setup_on_update: true,
      public: false,
      request_oauth_on_install: false,
      default_permissions: { contents: "write", metadata: "read" },
      default_events: [],
      hook_attributes: { url: `${origin}/api/github/webhook`, active: false },
    };
    const setupCookie = await seal({ purpose: "github-app-setup", expiresAt: Date.now() + 10 * 60 * 1000 });
    const body = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>正在前往 GitHub…</title></head><body><form id="manifest" method="post" action="https://github.com/settings/apps/new"><input type="hidden" name="manifest" value="${htmlEscape(JSON.stringify(manifest))}"></form><script>document.getElementById('manifest').submit()</script></body></html>`;
    return new Response(body, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "set-cookie": `deepstack_setup=${encodeURIComponent(setupCookie)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
        "content-security-policy": "default-src 'none'; form-action https://github.com; script-src 'unsafe-inline'",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.redirect(new URL(`/setup?key=${encodeURIComponent(key)}&error=${encodeURIComponent(message)}`, request.url), 303);
  }
}
