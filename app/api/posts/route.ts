import { validateMarkdownDocument } from "../../../lib/post-format";
import { authenticatedSession, githubRequest, repositoryName } from "../../../lib/server/github";

function toBase64(source: string) {
  const bytes = new TextEncoder().encode(source);
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000) binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  return btoa(binary);
}

export async function POST(request: Request) {
  const session = await authenticatedSession(request);
  if (!session) return Response.json({ error: "请先使用 GitHub 登录" }, { status: 401 });
  try {
    const payload = await request.json() as { filename?: string; content?: string };
    const filename = payload.filename?.trim() ?? "";
    const content = payload.content ?? "";
    validateMarkdownDocument(content, filename);
    const path = `content/posts/${filename}`;
    const [owner, repository] = repositoryName().split("/");
    if (!owner || !repository) throw new Error("仓库配置无效");
    const endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${path}`;
    const existingResponse = await githubRequest(endpoint, session.token);
    const existing = await existingResponse.json().catch(() => ({})) as { sha?: string; message?: string };
    if (!existingResponse.ok && existingResponse.status !== 404) throw new Error(existing.message ?? "无法检查文章状态");
    const uploaded = await githubRequest(endpoint, session.token, {
      method: "PUT",
      body: JSON.stringify({
        message: `${existingResponse.ok ? "Update" : "Publish"} article: ${filename}`,
        content: toBase64(content),
        branch: "main",
        ...(existingResponse.ok && existing.sha ? { sha: existing.sha } : {}),
      }),
    });
    const result = await uploaded.json().catch(() => ({})) as { message?: string; content?: { html_url?: string } };
    if (!uploaded.ok) throw new Error(result.message ?? "发布失败");
    return Response.json({ ok: true, url: result.content?.html_url ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "发布失败";
    return Response.json({ error: message }, { status: 400 });
  }
}
