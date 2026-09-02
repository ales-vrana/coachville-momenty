import type { Metadata } from "next";
import { readContent, renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Otázky, které dostává každý host",
  description: "Veřejná a pro každého stejná sada otázek, včetně těch nepříjemných.",
};

export default function Page() {
  return <article className="max-w-3xl space-y-4">{renderMarkdown(readContent("otazky-pro-hosty"))}</article>;
}
