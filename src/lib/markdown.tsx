import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";

/** Minimální markdown: nadpisy (#, ##, ###), odstavce, odrážky (-), číslované seznamy (1.), tučné (**x**), odkazy [t](u). */
export function readContent(name: string): string {
  const file = path.join(process.cwd(), "content", `${name}.md`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function inline(text: string, key: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={`${key}-b${i++}`}>{m[1]}</strong>);
    else
      parts.push(
        <a key={`${key}-a${i++}`} href={m[3]} className="underline">
          {m[2]}
        </a>
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function renderMarkdown(md: string): ReactNode {
  const blocks = md.replace(/\r\n?/g, "\n").split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split("\n").filter((l) => l.trim().length > 0);
    if (!lines.length) return null;
    const first = lines[0];
    if (/^###\s/.test(first)) return <h3 key={bi} className="mt-6 text-lg font-semibold">{inline(first.replace(/^###\s/, ""), `h${bi}`)}</h3>;
    if (/^##\s/.test(first)) return <h2 key={bi} className="mt-8 text-xl font-semibold">{inline(first.replace(/^##\s/, ""), `h${bi}`)}</h2>;
    if (/^#\s/.test(first)) return <h1 key={bi} className="text-3xl font-bold leading-tight tracking-tight">{inline(first.replace(/^#\s/, ""), `h${bi}`)}</h1>;
    if (lines.every((l) => /^-\s/.test(l)))
      return (
        <ul key={bi} className="list-disc space-y-1 pl-5">
          {lines.map((l, li) => (
            <li key={li}>{inline(l.replace(/^-\s/, ""), `l${bi}-${li}`)}</li>
          ))}
        </ul>
      );
    if (lines.every((l) => /^\d+\.\s/.test(l)))
      return (
        <ol key={bi} className="list-decimal space-y-1 pl-5">
          {lines.map((l, li) => (
            <li key={li}>{inline(l.replace(/^\d+\.\s/, ""), `o${bi}-${li}`)}</li>
          ))}
        </ol>
      );
    if (/^>\s/.test(first))
      return (
        <blockquote key={bi} className="border-l-4 border-accent pl-4 text-muted">
          {inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), `q${bi}`)}
        </blockquote>
      );
    return (
      <p key={bi} className="leading-relaxed">
        {inline(lines.join(" "), `p${bi}`)}
      </p>
    );
  });
}
