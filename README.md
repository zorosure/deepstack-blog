# 深栈 · Deepstack Notes

一个面向工程、AI 与系统思考的中文技术博客。

## 写新文章

在 `lib/posts.ts` 的 `posts` 数组中新增文章数据，首页和文章页会自动生成。提交到 `main` 后，GitHub Actions 会自动发布 GitHub Pages。

## 本地预览

```bash
npm install
npm run dev
```

## 发布

仓库已包含 `.github/workflows/pages.yml`。将仓库设为公开并把 GitHub Pages 的发布源设为 **GitHub Actions**，之后每次推送到 `main` 都会自动更新博客。
