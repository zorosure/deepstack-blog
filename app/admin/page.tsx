import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "发布文章｜深栈",
  description: "深栈管理员 Markdown 发布入口",
  robots: { index: false, follow: false },
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default function AdminPage() {
  return (
    <main className="admin-page">
      <header className="site-header shell article-nav">
        <a className="brand" href="/" aria-label="返回深栈首页">
          <span className="brand-mark">深</span>
          <span><strong>深栈</strong><small>DEEPSTACK NOTES</small></span>
        </a>
        <a className="back-link" href="/">← 返回博客</a>
        <span className="issue">ADMIN ONLY</span>
      </header>

      <section className="admin-shell shell">
        <div className="admin-intro">
          <p className="eyebrow"><span /> PUBLISHING DESK</p>
          <h1>上传一篇<br />Markdown</h1>
          <p>选择文章、确认信息，然后直接发布。这个入口不出现在公开导航中，写入操作只允许管理员账号完成。</p>
        </div>

        <form className="publish-panel" id="publish-form">
          <div className="admin-step"><span>01</span><div><strong>准备令牌</strong><p>使用仅授权本仓库、Contents 为 Read and write 的 GitHub 细粒度令牌。令牌只在本次发布时使用，不会保存。</p></div></div>
          <label className="field-label" htmlFor="admin-token">细粒度令牌</label>
          <input className="admin-input" id="admin-token" type="password" autoComplete="off" spellCheck={false} placeholder="github_pat_…" required />

          <div className="admin-step"><span>02</span><div><strong>选择文章</strong><p>文件名使用英文小写和短横线，例如 <code>how-i-debug.md</code>。</p></div></div>
          <label className="file-drop" htmlFor="markdown-file">
            <input id="markdown-file" type="file" accept=".md,text/markdown,text/plain" required />
            <b>选择 Markdown 文件</b><small id="file-name">尚未选择文件</small>
          </label>

          <div className="article-preview" id="article-preview" hidden>
            <span>READY TO PUBLISH</span><h2 id="preview-title" /><p id="preview-meta" /><p id="preview-excerpt" />
          </div>

          <div className="publish-actions">
            <button type="button" className="secondary-button" id="download-template">下载文章模板</button>
            <button type="submit" className="publish-button" id="publish-button">验证并发布 <span>→</span></button>
          </div>
          <p className="publish-status" id="publish-status" role="status" aria-live="polite" />
        </form>
      </section>
      <script src="/admin.js" defer />
    </main>
  );
}
