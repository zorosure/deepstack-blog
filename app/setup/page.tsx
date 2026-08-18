import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "初始化发布后台｜深栈", robots: { index: false, follow: false } };

type SetupPageProps = { searchParams: Promise<{ key?: string; error?: string }> };

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const { key = "", error } = await searchParams;
  return (
    <main className="admin-page">
      <header className="site-header shell article-nav">
        <Link className="brand" href="/" aria-label="深栈首页"><span className="brand-mark">深</span><span><strong>深栈</strong><small>DEEPSTACK NOTES</small></span></Link>
        <span className="back-link">一次性初始化</span><span className="issue">SETUP</span>
      </header>
      <section className="admin-shell shell">
        <div className="admin-intro"><p className="eyebrow"><span /> GITHUB APP SETUP</p><h1>建立安全的<br />发布通道</h1><p>这一步会在你的 GitHub 账户下创建一个私有 GitHub App，并把写入范围限制到你安装时选择的仓库。</p></div>
        <form className="publish-panel setup-panel" action="/api/setup/start" method="post">
          <input type="hidden" name="key" value={key} />
          <div className="admin-step"><span>01</span><div><strong>创建 GitHub App</strong><p>GitHub 将展示应用名称、回调地址与 Contents 写权限，确认后再继续。</p></div></div>
          <div className="admin-step"><span>02</span><div><strong>仅安装到博客仓库</strong><p>安装时选择 Only select repositories，然后只选择 deepstack-blog。</p></div></div>
          {error && <p className="publish-status" data-kind="error">初始化失败：{error}</p>}
          <button className="publish-button setup-button" type="submit">开始安全初始化 <span>→</span></button>
        </form>
      </section>
    </main>
  );
}
