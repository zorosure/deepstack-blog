import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, posts } from "../../../lib/posts";
import { renderInlineMarkdown } from "../../../lib/markdown";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "文章未找到｜深栈" };
  return {
    title: `${post.title}｜深栈`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [] },
    twitter: { card: "summary", title: post.title, description: post.excerpt, images: [] },
  };
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const currentIndex = posts.findIndex((item) => item.slug === post.slug);
  const nextPost = posts[(currentIndex + 1) % posts.length];

  return (
    <main className="article-page">
      <header className="site-header shell article-nav">
        <Link className="brand" href="/" aria-label="返回深栈首页">
          <span className="brand-mark">深</span>
          <span><strong>深栈</strong><small>DEEPSTACK NOTES</small></span>
        </Link>
        <Link className="back-link" href="/">← 返回文章列表</Link>
        <span className="issue">NOTE {post.number}</span>
      </header>

      <article>
        <header className="article-hero shell">
          <div className="article-side">
            <span className="tag">{post.category}</span>
            <div className="article-number">{post.number}</div>
          </div>
          <div className="article-heading">
            <p className="eyebrow"><span /> DEEPSTACK ESSAY</p>
            <h1>{post.title}</h1>
            <p className="article-deck">{post.excerpt}</p>
            <div className="article-meta"><time>{post.date}</time><span>{post.readTime}</span></div>
          </div>
        </header>

        <div className="article-layout shell">
          <aside>
            <span>IN THIS NOTE</span>
            {post.sections.map((section, index) => (
              <a href={`#section-${index + 1}`} key={index}>{String(index + 1).padStart(2, "0")} {section.heading ?? "开篇"}</a>
            ))}
          </aside>
          <div className="article-content">
            {post.sections.map((section, index) => (
              <section id={`section-${index + 1}`} key={index}>
                {section.heading && <h2 dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(section.heading) }} />}
                {section.paragraphs.map((paragraph) => <p key={paragraph} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(paragraph) }} />)}
                {section.points && <ul>{section.points.map((point) => <li key={point} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(point) }} />)}</ul>}
                {section.quote && <blockquote dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(section.quote) }} />}
              </section>
            ))}
          </div>
        </div>
      </article>

      <section className="next-note">
        <div className="shell">
          <p>NEXT NOTE · {nextPost.category}</p>
          <a href={`/posts/${nextPost.slug}`}>{nextPost.title}<span>→</span></a>
        </div>
      </section>
    </main>
  );
}
