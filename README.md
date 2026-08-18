# 深栈 · Deepstack Notes

一个面向工程、AI 与系统思考的中文技术博客。

## 写新文章

文章位于 `content/posts/`，每篇文章是一个 Markdown 文件。文件名使用英文小写和短横线，例如 `how-i-debug.md`。

可以访问博客的 `/admin/` 管理入口（会跳转到[安全发布后台](https://deepstack-publisher-zoro.zys007089.chatgpt.site/admin)），使用 GitHub 登录后下载模板并上传文章。管理入口不会出现在公开导航中。浏览器不再要求粘贴 GitHub 令牌；服务端通过一个仅安装到 `deepstack-blog`、只有 Contents 写权限的私有 GitHub App 发布文章，并使用 HttpOnly Cookie 保存管理员会话。

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

## 发布后台配置

发布后台需要 D1 数据库以及以下运行时环境变量：

- `APP_ENCRYPTION_KEY`：用于加密 GitHub App 凭据和登录令牌。
- `SETUP_TOKEN`：保护一次性初始化页面。
- `ADMIN_GITHUB_LOGIN`：允许登录的 GitHub 用户名，当前为 `zorosure`。
- `GITHUB_REPOSITORY`：文章仓库，当前为 `zorosure/deepstack-blog`。
- `PUBLIC_BLOG_URL`：公开博客地址。

首次部署后访问 `/setup?key=<SETUP_TOKEN>`，确认创建私有 GitHub App，并在安装页面选择 **Only select repositories → deepstack-blog**。完成这一步后，日常发布只需要 GitHub 登录，不需要再次创建或粘贴令牌。

## 本地预览

```bash
npm install
npm run dev
```

`lib/posts.ts` 是由 Markdown 自动生成的文件，请勿直接编辑。

## 发布

仓库已包含 `.github/workflows/pages.yml`。将仓库设为公开并把 GitHub Pages 的发布源设为 **GitHub Actions**，之后每次推送到 `main` 都会自动更新博客。
