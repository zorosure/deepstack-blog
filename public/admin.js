(() => {
  const form = document.querySelector("#publish-form");
  if (!form) return;

  const authTitle = document.querySelector("#auth-title");
  const authDescription = document.querySelector("#auth-description");
  const loginButton = document.querySelector("#github-login");
  const logoutButton = document.querySelector("#logout-button");
  const fileInput = document.querySelector("#markdown-file");
  const fileName = document.querySelector("#file-name");
  const preview = document.querySelector("#article-preview");
  const previewTitle = document.querySelector("#preview-title");
  const previewMeta = document.querySelector("#preview-meta");
  const previewExcerpt = document.querySelector("#preview-excerpt");
  const status = document.querySelector("#publish-status");
  const publishButton = document.querySelector("#publish-button");

  const template = `---
title: 文章标题
category: AI 工程实践
excerpt: 用一两句话说明这篇文章解决什么问题。
date: ${new Date().toISOString().slice(0, 10).replaceAll("-", ".")}
readTime: 6 分钟阅读
---

这里写文章开篇。段落之间保留一个空行。

## 第一个小节

这里写正文，支持 **加粗**、\`行内代码\` 和 [外部链接](https://example.com)。

- 列表项目一
- 列表项目二

> 这里可以放一句值得强调的话。
`;

  function parseMarkdown(source, name) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(name)) throw new Error("文件名必须使用英文小写、数字和短横线，并以 .md 结尾");
    if (source.length > 1024 * 1024) throw new Error("文章不能超过 1 MB");
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) throw new Error("文章开头缺少模板中的元数据区域");
    const metadata = {};
    for (const line of match[1].split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator > 0) metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    }
    for (const field of ["title", "category", "excerpt", "date", "readTime"]) {
      if (!metadata[field]) throw new Error(`缺少文章字段：${field}`);
    }
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(metadata.date)) throw new Error("date 必须使用 YYYY.MM.DD 格式");
    if (!match[2].trim()) throw new Error("文章正文不能为空");
    return metadata;
  }

  function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  async function loadSession() {
    try {
      const response = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
      const session = await response.json();
      if (!session.configured) {
        authTitle.textContent = "发布后台尚未初始化";
        authDescription.textContent = "请使用部署时生成的一次性初始化链接，创建并安装私有 GitHub App。";
        return;
      }
      if (!session.authenticated) {
        authTitle.textContent = "等待管理员登录";
        authDescription.textContent = "GitHub 只会授权已安装此私有应用的仓库；登录完成后即可发布。";
        loginButton.hidden = false;
        return;
      }
      authTitle.textContent = `已登录：${session.login}`;
      authDescription.textContent = "安全会话已建立，可以上传 Markdown。";
      logoutButton.hidden = false;
      form.hidden = false;
    } catch {
      authTitle.textContent = "无法连接发布服务";
      authDescription.textContent = "请刷新页面后重试。";
    }
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    preview.hidden = true;
    setStatus("");
    if (!file) {
      fileName.textContent = "尚未选择文件";
      return;
    }
    fileName.textContent = file.name;
    try {
      const metadata = parseMarkdown(await file.text(), file.name);
      previewTitle.textContent = metadata.title;
      previewMeta.textContent = `${metadata.category} · ${metadata.date} · ${metadata.readTime}`;
      previewExcerpt.textContent = metadata.excerpt;
      preview.hidden = false;
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  document.querySelector("#download-template").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([template], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "new-article.md";
    link.click();
    URL.revokeObjectURL(url);
  });

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.reload();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) return setStatus("请选择 Markdown 文件", "error");

    publishButton.disabled = true;
    setStatus("正在验证文章并发布…", "working");
    try {
      const source = await file.text();
      parseMarkdown(source, file.name);
      const uploaded = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ filename: file.name, content: source }),
      });
      const result = await uploaded.json().catch(() => ({}));
      if (uploaded.status === 401) {
        form.hidden = true;
        loginButton.hidden = false;
        throw new Error("登录会话已过期，请重新使用 GitHub 登录");
      }
      if (!uploaded.ok) throw new Error(result.error || "发布失败");

      form.reset();
      preview.hidden = true;
      fileName.textContent = "尚未选择文件";
      setStatus("发布成功。博客正在自动更新，通常 1–2 分钟后可见。", "success");
    } catch (error) {
      setStatus(error.message || "发布失败，请稍后重试", "error");
    } finally {
      publishButton.disabled = false;
    }
  });

  loadSession();
})();
