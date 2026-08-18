# 深栈 · Deepstack Notes

一个面向工程、AI 与系统思考的中文技术博客。

## 写新文章

文章位于 `content/posts/`，每篇文章是一个 Markdown 文件。文件名使用英文小写和短横线，例如 `how-i-debug.md`。

可以访问博客的 `/admin/` 管理入口，下载模板并上传文章。管理入口不会出现在公开导航中；发布时必须使用属于 `zorosure`、仅授权本仓库且 Contents 权限为 Read and write 的 GitHub 细粒度令牌。令牌只保存在当前操作的内存中，不会写入网页、仓库或浏览器存储。

Markdown 文件格式：

```markdown
---
title: 文章标题
category: AI 工程实践
excerpt: 文章摘要
date: 2026.08.18
readTime: 6 分钟阅读
---

这里写开篇。

## 小节标题

这里写正文。
```

提交到 `main` 后，GitHub Actions 会自动生成首页和文章页并发布。

## 本地预览

```bash
npm install
npm run dev
```

`lib/posts.ts` 是由 Markdown 自动生成的文件，请勿直接编辑。

## 发布

仓库已包含 `.github/workflows/pages.yml`。将仓库设为公开并把 GitHub Pages 的发布源设为 **GitHub Actions**，之后每次推送到 `main` 都会自动更新博客。
