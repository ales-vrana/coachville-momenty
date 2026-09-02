"use client";

import { useState } from "react";
import { track } from "@/lib/track";

interface Props {
  momentId: string;
  baseUrl: string;
  guestName: string;
  summary: string;
}

export default function ShareMenu({ momentId, baseUrl, guestName, summary }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const url = `${baseUrl}/m/${momentId}`;
  const partnerUrl = `${url}?ref=partner`;
  const partnerText = `Podívej se prosím na tyhle dvě minuty. Není to reklama, je to ${guestName}, jak mluví o tom, co mě trápí: „${summary}“ ${partnerUrl}`;

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Zkopírujte odkaz:", text);
    }
    track("share_click", { moment_id: momentId, channel: what });
  }

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <button onClick={() => copy(url, "copy")} className="rounded-full border border-line bg-white px-4 py-2 hover:bg-paper-2">
        {copied === "copy" ? "Zkopírováno" : "Kopírovat odkaz"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${summary} (${guestName}) ${url}`)}`}
        target="_blank"
        rel="noopener"
        onClick={() => track("share_click", { moment_id: momentId, channel: "whatsapp" })}
        className="rounded-full border border-line bg-white px-4 py-2 hover:bg-paper-2"
      >
        WhatsApp
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(`${guestName}: ${summary}`)}&body=${encodeURIComponent(`${summary}\n\n${url}`)}`}
        onClick={() => track("share_click", { moment_id: momentId, channel: "email" })}
        className="rounded-full border border-line bg-white px-4 py-2 hover:bg-paper-2"
      >
        E-mail
      </a>
      <button
        onClick={() => copy(partnerText, "partner")}
        className="rounded-full border border-accent/40 bg-accent-soft px-4 py-2 font-medium text-accent-deep hover:bg-accent/20"
        title="Zkopíruje zprávu pro partnera s odkazem bez nabídky workshopu"
      >
        {copied === "partner" ? "Zpráva zkopírována" : "Poslat partnerovi"}
      </button>
    </div>
  );
}
