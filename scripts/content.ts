import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

export type PostSection = {
  heading?: string;
  paragraphs: string[];
  points?: string[];
  quote?: string;
};

export type Post = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  number: string;
  sections: PostSection[];
};

type Metadata = Omit<Post, "slug" | "number" | "sections">;

function unquote(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(source: string, file: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: 缺少 YAML frontmatter`);
  const values: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`${file}: 无法解析元数据 ${line}`);
    values[line.slice(0, separator).trim()] = unquote(line.slice(separator + 1));
  }
  const required = ["title", "category", "excerpt", "date", "readTime"] as const;
  for (const key of required) {
    if (!values[key]) throw new Error(`${file}: 缺少 ${key}`);
  }
  return { metadata: values as Metadata, body: match[2].trim() };
}

function parseSections(body: string): PostSection[] {
  const sections: PostSection[] = [];
  let current: PostSection = { paragraphs: [] };
  let paragraph: string[] = [];
  let points: string[] = [];
  let quotes: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) current.paragraphs.push(paragraph.join(" ").trim());
    paragraph = [];
  };
  const flushPoints = () => {
    if (points.length) current.points = [...(current.points ?? []), ...points];
    points = [];
  };
  const flushQuote = () => {
    if (quotes.length) current.quote = quotes.join(" ").trim();
    quotes = [];
  };
  const flushBlocks = () => {
    flushParagraph();
    flushPoints();
    flushQuote();
  };
  const flushSection = () => {
    flushBlocks();
    if (current.heading || current.paragraphs.length || current.points?.length || current.quote) sections.push(current);
  };

  for (const rawLine of `${body}\n`.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      flushSection();
      current = { heading: line.slice(3).trim(), paragraphs: [] };
    } else if (line.startsWith("# ")) {
      continue;
    } else if (line.startsWith("- ")) {
      flushParagraph();
      flushQuote();
      points.push(line.slice(2).trim());
    } else if (line.startsWith("> ")) {
      flushParagraph();
      flushPoints();
      quotes.push(line.slice(2).trim());
    } else if (!line) {
      flushBlocks();
    } else {
      flushPoints();
      flushQuote();
      paragraph.push(line);
    }
  }

  flushSection();
  if (!sections.length) throw new Error("文章正文不能为空");
  return sections;
}

export function loadPosts(directory = join(process.cwd(), "content/posts")): Post[] {
  const posts = readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = basename(file, ".md");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${file}: 文件名必须是英文小写短横线格式`);
      const { metadata, body } = parseFrontmatter(readFileSync(join(directory, file), "utf8"), file);
      if (!/^\d{4}\.\d{2}\.\d{2}$/.test(metadata.date)) throw new Error(`${file}: date 必须是 YYYY.MM.DD`);
      return { ...metadata, slug, number: "", sections: parseSections(body) };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return posts.map((post, index) => ({ ...post, number: String(index + 1).padStart(2, "0") }));
}
