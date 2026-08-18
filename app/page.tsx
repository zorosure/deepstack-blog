import { posts } from "../lib/posts";

const [featured, ...notes] = posts;

export default function Home() {
  return (
    <main>
      <header className="site-header shell">
        <a className="brand" href="#top" aria-label="深栈首页">
          <span className="brand-mark">深</span>
          <span><strong>深栈</strong><small>DEEPSTACK NOTES</small></span>
        </a>
        <nav aria-label="主导航"><a href="#writing">文章</a><a href="#topics">专题</a><a href="#about">关于</a></nav>
        <span className="site-note">独立技术写作</span>
      </header>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> ENGINEERING · AI · SYSTEMS</p>
          <h1>把复杂技术，<br />写成清晰判断。</h1>
          <p className="hero-intro">记录真实工程问题、源码阅读与 AI 编程实践。<br />不贩卖捷径，只沉淀经过验证的经验。</p>
        </div>
        <div className="hero-aside" aria-label="博客理念">
          <span className="issue">ISSUE 001</span>
          <div className="orbit" aria-hidden="true"><i /><i /><i /></div>
          <p>深度不是知道更多，<br />而是多问一层为什么。</p>
        </div>
      </section>

      <section className="featured shell" id="writing">
        <div className="section-label"><span>本期精选</span><b>FEATURED STORY</b></div>
        <article className="featured-card">
          <div className="feature-visual">
            <div className="code-lines" aria-hidden="true"><span>ASK</span><span>TRACE</span><span>VERIFY</span><span>WRITE</span></div>
            <div className="feature-number">01</div>
          </div>
          <div className="feature-content">
            <span className="tag">{featured.category}</span>
            <h2>{featured.title}</h2>
            <p>{featured.excerpt}</p>
            <div className="meta"><time>{featured.date}</time><span>{featured.readTime}</span></div>
            <a href={`/posts/${featured.slug}`} className="read-more">阅读全文 <span aria-hidden="true">→</span></a>
          </div>
        </article>
      </section>

      <section className="latest shell" id="notes">
        <div className="latest-head">
          <div><p className="eyebrow"><span /> LATEST NOTES</p><h2>最近记录</h2></div>
          <a href="#notes">查看全部 03 篇 <span>→</span></a>
        </div>
        <div className="note-list">
          {notes.map((note) => (
            <article className="note" key={note.slug}>
              <span className="note-index">{note.number}</span>
              <div className="note-body"><span className="tag">{note.category}</span><h3>{note.title}</h3><p>{note.excerpt}</p></div>
              <time>{note.date}</time>
              <a href={`/posts/${note.slug}`} aria-label={`阅读：${note.title}`}>↗</a>
            </article>
          ))}
        </div>
      </section>

      <section className="topics shell" id="topics">
        <p className="eyebrow"><span /> TOPICS</p>
        <div className="topic-row"><span>AI 工程</span><span>系统设计</span><span>源码阅读</span><span>成长方法</span></div>
      </section>

      <footer id="about">
        <div className="shell footer-inner">
          <div><span className="brand-mark">深</span><p>持续写，持续验证，持续修正。</p></div>
          <p className="footer-note">由真实问题驱动的技术笔记。<br />© 2026 DEEPSTACK NOTES</p>
        </div>
      </footer>
    </main>
  );
}
