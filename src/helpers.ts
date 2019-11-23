import { MarkdownString } from "vscode";

export function buildBlurb(title = "", text = "", sourceUrls = []) {
  const header = title && `## 💡 ${title}\n`;
  const sources = `\n\nMore info: ${sourceUrls
    .map(url => `[${url}](${url})`)
    .join("\n")}`;
  const entry = `${header}${text}${sources}`;
  const markdown = new MarkdownString(entry);

  markdown.isTrusted = true;

  return markdown;
}
