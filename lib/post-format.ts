export function validateMarkdownDocument(source: string, filename: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(filename)) throw new Error("文件名必须使用英文小写、数字和短横线，并以 .md 结尾");
  if (source.length > 1024 * 1024) throw new Error("文章不能超过 1 MB");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("文章开头缺少 Markdown 元数据区域");
  const metadata: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator > 0) metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  for (const field of ["title", "category", "excerpt", "date", "readTime"]) {
    if (!metadata[field]) throw new Error(`缺少文章字段：${field}`);
  }
  if (!/^\d{4}\.\d{2}\.\d{2}$/.test(metadata.date)) throw new Error("date 必须使用 YYYY.MM.DD 格式");
  if (!match[2].trim()) throw new Error("文章正文不能为空");
  return metadata;
}
