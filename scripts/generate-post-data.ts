import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadPosts } from "./content.ts";

const posts = loadPosts();
const source = `// 此文件由 content/posts/*.md 自动生成，请勿直接编辑。\n\nexport type PostSection = {\n  heading?: string;\n  paragraphs: string[];\n  points?: string[];\n  quote?: string;\n};\n\nexport type Post = {\n  slug: string;\n  category: string;\n  title: string;\n  excerpt: string;\n  date: string;\n  readTime: string;\n  number: string;\n  sections: PostSection[];\n};\n\nexport const posts: Post[] = ${JSON.stringify(posts, null, 2)};\n\nexport function getPost(slug: string) {\n  return posts.find((post) => post.slug === slug);\n}\n`;

writeFileSync(join(process.cwd(), "lib/posts.ts"), source);
console.log(`Generated ${posts.length} posts from Markdown`);
