import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { renderInlineMarkdown } from "../lib/markdown.ts";
import { loadPosts } from "./content.ts";

const output = join(process.cwd(), "pages-dist");
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const inferredBase = repository.endsWith(".github.io") ? "" : repository ? `/${repository}` : "";
const base = (process.env.PAGES_BASE_PATH ?? inferredBase).replace(/\/$/, "");
const adminBackendUrl = (process.env.ADMIN_BACKEND_URL ?? "https://deepstack-publisher-zoro.zys007089.chatgpt.site").replace(/\/$/, "");
const posts = loadPosts();

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function page(title: string, description: string, body: string, extraHead = "") {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8").replace('@import "tailwindcss";', "");
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${base}/og.jpg">
<meta name="twitter:card" content="summary_large_image">${extraHead}<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23151817%22/><text x=%2250%22 y=%2268%22 text-anchor=%22middle%22 font-size=%2260%22 fill=%22%23d7ff3f%22>深</text></svg>">
<style>${css}</style></head><body>${body}</body></html>`;
}

function siteHeader(extra = "") {
  return `<header class="site-header shell ${extra}">
  <a class="brand" href="${base}/" aria-label="深栈首页"><span class="brand-mark">深</span><span><strong>深栈</strong><small>DEEPSTACK NOTES</small></span></a>
  <nav aria-label="主导航"><a href="${base}/#writing">文章</a><a href="${base}/#topics">专题</a><a href="${base}/#about">关于</a></nav>
  <span class="site-note">独立技术写作</span>
</header>`;
}

function homeHtml() {
  const [featured, ...notes] = posts;
  return page("深栈｜工程、AI 与系统思考", "记录真实工程问题、源码阅读与 AI 编程实践。", `<main>
${siteHeader()}
<section class="hero shell" id="top"><div class="hero-cover"><img src="${base}/og.jpg" alt="深栈奇幻技术编年史：奥术典籍与远方浮空城堡"></div><div class="hero-copy"><p class="eyebrow"><span></span> THE ENGINEER'S CHRONICLE</p><h1>把复杂技术，<br>写成清晰判断。</h1><p class="hero-intro">记录真实工程问题、源码阅读与 AI 编程实践。<br>不贩卖捷径，只沉淀经过验证的经验。</p></div><div class="hero-aside"><span class="issue">CHRONICLE 001</span><div class="rune-seal" aria-hidden="true">✦</div><p>深度不是知道更多，<br>而是多问一层为什么。</p></div></section>
<section class="featured shell" id="writing"><div class="section-label"><span>本期精选</span><b>FEATURED STORY</b></div><article class="featured-card"><div class="feature-visual"><div class="code-lines"><span>ASK</span><span>TRACE</span><span>VERIFY</span><span>WRITE</span></div><div class="feature-number">01</div></div><div class="feature-content"><span class="tag">${escapeHtml(featured.category)}</span><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.excerpt)}</p><div class="meta"><time>${escapeHtml(featured.date)}</time><span>${escapeHtml(featured.readTime)}</span></div><a href="${base}/posts/${featured.slug}/" class="read-more">阅读全文 <span>→</span></a></div></article></section>
<section class="latest shell" id="notes"><div class="latest-head"><div><p class="eyebrow"><span></span> LATEST NOTES</p><h2>最近记录</h2></div><a href="#notes">查看全部 ${String(posts.length).padStart(2, "0")} 篇 <span>→</span></a></div><div class="note-list">${notes.map((note) => `<article class="note"><span class="note-index">${note.number}</span><div class="note-body"><span class="tag">${escapeHtml(note.category)}</span><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.excerpt)}</p></div><time>${escapeHtml(note.date)}</time><a href="${base}/posts/${note.slug}/" aria-label="阅读：${escapeHtml(note.title)}">↗</a></article>`).join("")}</div></section>
<section class="topics shell" id="topics"><p class="eyebrow"><span></span> TOPICS</p><div class="topic-row"><span>AI 工程</span><span>系统设计</span><span>源码阅读</span><span>成长方法</span></div></section>
<footer id="about"><div class="shell footer-inner"><div><span class="brand-mark">深</span><p>持续写，持续验证，持续修正。</p></div><p class="footer-note">由真实问题驱动的技术笔记。<br>© 2026 DEEPSTACK NOTES</p></div></footer></main>`);
}

function postHtml(slug: string) {
  const post = posts.find((item) => item.slug === slug)!;
  const currentIndex = posts.findIndex((item) => item.slug === slug);
  const nextPost = posts[(currentIndex + 1) % posts.length];
  return page(`${post.title}｜深栈`, post.excerpt, `<main class="article-page">
<header class="site-header shell article-nav"><a class="brand" href="${base}/"><span class="brand-mark">深</span><span><strong>深栈</strong><small>DEEPSTACK NOTES</small></span></a><a class="back-link" href="${base}/">← 返回文章列表</a><span class="issue">NOTE ${post.number}</span></header>
<article><header class="article-hero shell"><div class="article-side"><span class="tag">${escapeHtml(post.category)}</span><div class="article-number">${post.number}</div></div><div class="article-heading"><p class="eyebrow"><span></span> DEEPSTACK ESSAY</p><h1>${escapeHtml(post.title)}</h1><p class="article-deck">${escapeHtml(post.excerpt)}</p><div class="article-meta"><time>${escapeHtml(post.date)}</time><span>${escapeHtml(post.readTime)}</span></div></div></header>
<div class="article-layout shell"><aside><span>IN THIS NOTE</span>${post.sections.map((section, index) => `<a href="#section-${index + 1}">${String(index + 1).padStart(2, "0")} ${renderInlineMarkdown(section.heading ?? "开篇")}</a>`).join("")}</aside><div class="article-content">${post.sections.map((section, index) => `<section id="section-${index + 1}">${section.heading ? `<h2>${renderInlineMarkdown(section.heading)}</h2>` : ""}${section.paragraphs.map((paragraph) => `<p>${renderInlineMarkdown(paragraph)}</p>`).join("")}${section.points ? `<ul>${section.points.map((point) => `<li>${renderInlineMarkdown(point)}</li>`).join("")}</ul>` : ""}${section.quote ? `<blockquote>${renderInlineMarkdown(section.quote)}</blockquote>` : ""}</section>`).join("")}</div></div></article>
<section class="next-note"><div class="shell"><p>NEXT NOTE · ${escapeHtml(nextPost.category)}</p><a href="${base}/posts/${nextPost.slug}/">${escapeHtml(nextPost.title)}<span>→</span></a></div></section></main>`);
}

function adminHtml() {
  const destination = adminBackendUrl ? `${adminBackendUrl}/admin` : "";
  const redirect = destination ? `<meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}"><script>location.replace(${JSON.stringify(destination)})</script>` : "";
  return page("发布文章｜深栈", "深栈管理员 Markdown 发布入口", `<main class="admin-page">
<header class="site-header shell article-nav"><a class="brand" href="${base}/" aria-label="返回深栈首页"><span class="brand-mark">深</span><span><strong>深栈</strong><small>DEEPSTACK NOTES</small></span></a><a class="back-link" href="${base}/">← 返回博客</a><span class="issue">ADMIN ONLY</span></header>
<section class="admin-shell shell"><div class="admin-intro"><p class="eyebrow"><span></span> SECURE PUBLISHING DESK</p><h1>正在前往<br>发布后台</h1><p>Markdown 发布已经迁移到带服务端鉴权的安全入口，不再要求在浏览器中粘贴令牌。</p></div>
<div class="publish-panel"><div class="admin-step"><span>01</span><div><strong>${destination ? "即将自动跳转" : "后台正在初始化"}</strong><p>${destination ? "如果没有自动打开，请点击下面的按钮。" : "部署完成后，这里会自动连接新的发布后台。"}</p></div></div>${destination ? `<a class="publish-button setup-button" href="${escapeHtml(destination)}">进入发布后台 <span>→</span></a>` : ""}</div></section>
${redirect}</main>`, '<meta name="robots" content="noindex,nofollow">');
}

function emit(path: string, content: string) {
  const target = join(output, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
emit("index.html", homeHtml());
for (const post of posts) emit(`posts/${post.slug}/index.html`, postHtml(post.slug));
emit("admin/index.html", adminHtml());
emit("404.html", page("页面未找到｜深栈", "页面未找到", `<main class="shell" style="padding:12vh 0"><a class="brand" href="${base}/"><span class="brand-mark">深</span><span><strong>深栈</strong></span></a><h1 style="margin-top:12vh">404</h1><p class="hero-intro">这篇笔记还不存在。<br><a href="${base}/" class="read-more">返回首页 →</a></p></main>`));
emit(".nojekyll", "");
cpSync(join(process.cwd(), "public/og.jpg"), join(output, "og.jpg"));
console.log(`GitHub Pages site generated at ${output}${base ? ` with base ${base}` : ""}`);
