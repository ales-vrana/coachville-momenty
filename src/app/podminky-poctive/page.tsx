import type { Metadata } from "next";
import { readContent, renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Podmínky poctivě",
  description: "Co se stane, když zpomalím, dám si pauzu nebo skončím. Splátky, celá cesta, pro koho to není.",
};

export default function Page() {
  return <article className="max-w-3xl space-y-4">{renderMarkdown(readContent("podminky-poctive"))}</article>;
}
