(() => {
  const ADMIN = "zorosure";
  const REPOSITORY = "zorosure/deepstack-blog";
  const form = document.querySelector("#publish-form");
  if (!form) return;

  const tokenInput = document.querySelector("#admin-token");
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

  function toBase64(source) {
    const bytes = new TextEncoder().encode(source);
    let binary = "";
    for (let start = 0; start < bytes.length; start += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
    }
    return btoa(binary);
  }

  async function github(path, token, options = {}) {
    const response = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2026-03-10",
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = fileInput.files[0];
    const token = tokenInput.value.trim();
    tokenInput.value = "";
    if (!file || !token) return setStatus("请填写令牌并选择 Markdown 文件", "error");

    publishButton.disabled = true;
    setStatus("正在验证管理员身份…", "working");
    try {
      const source = await file.text();
      parseMarkdown(source, file.name);

      const identity = await github("/user", token);
      if (!identity.response.ok) throw new Error("令牌无效或已过期");
      if (identity.data.login !== ADMIN) throw new Error(`当前令牌属于 ${identity.data.login}，只有管理员 ${ADMIN} 可以发布`);

      const path = `content/posts/${file.name}`;
      setStatus("身份验证通过，正在发布文章…", "working");
      const existing = await github(`/repos/${REPOSITORY}/contents/${path}`, token);
      if (!existing.response.ok && existing.response.status !== 404) throw new Error(existing.data.message || "无法检查文章状态");

      const uploaded = await github(`/repos/${REPOSITORY}/contents/${path}`, token, {
        method: "PUT",
        body: JSON.stringify({
          message: `${existing.response.ok ? "Update" : "Publish"} article: ${file.name}`,
          content: toBase64(source),
          branch: "main",
          ...(existing.response.ok ? { sha: existing.data.sha } : {}),
        }),
      });
      if (!uploaded.response.ok) throw new Error(uploaded.data.message || "发布失败");

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
})();
