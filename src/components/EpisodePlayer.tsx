"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Player from "@vimeo/player";
import { useClientUrl } from "@/lib/useClient";

export interface EpisodeChapter {
  t: number;
  title: string;
}

interface Props {
  vimeoId: string;
  vimeoHash?: string;
  thumbnailUrl?: string;
  title: string;
  chapters: EpisodeChapter[];
  momentStarts: { id: string; start: number }[];
}

function formatTime(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? h + ":" : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

export default function EpisodePlayer({ vimeoId, vimeoHash, thumbnailUrl, title, chapters, momentStarts }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const { search } = useClientUrl();

  // ?t=1234 nebo ?m=<id> z URL (klientsky, stránka zůstává statická)
  const pendingSeek = useMemo<number | null>(() => {
    const t = search.get("t");
    const mId = search.get("m");
    if (t && !Number.isNaN(Number(t))) return Number(t);
    if (mId) {
      const found = momentStarts.find((x) => x.id === mId);
      if (found) return found.start;
    }
    return null;
  }, [search, momentStarts]);

  const ensurePlayer = useCallback(async () => {
    if (playerRef.current) return playerRef.current;
    const el = containerRef.current;
    if (!el) return null;
    setStatus("loading");
    const { default: VimeoPlayer } = await import("@vimeo/player");
    const base = { responsive: true, byline: false, portrait: false, title: false, dnt: true, playsinline: true };
    const options = vimeoHash ? { ...base, url: `https://vimeo.com/${vimeoId}/${vimeoHash}` } : { ...base, id: Number(vimeoId) };
    const p = new VimeoPlayer(el, options as ConstructorParameters<typeof VimeoPlayer>[1]);
    playerRef.current = p;
    await p.ready();
    setStatus("ready");
    return p;
  }, [vimeoId, vimeoHash]);

  const seek = useCallback(
    async (t: number) => {
      const p = await ensurePlayer();
      if (!p) return;
      await p.setCurrentTime(t);
      try {
        await p.play();
      } catch {
        /* uživatel klikne v přehrávači */
      }
    },
    [ensurePlayer]
  );

  const start = useCallback(async () => {
    const p = await ensurePlayer();
    if (!p) return;
    if (pendingSeek !== null) await p.setCurrentTime(pendingSeek);
    try {
      await p.play();
    } catch {
      /* ignore */
    }
  }, [ensurePlayer, pendingSeek]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy().catch(() => undefined);
      playerRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-sm">
        <div ref={containerRef} className={status === "ready" ? "aspect-video" : "aspect-video opacity-0"} />
        {status !== "ready" && (
          <button type="button" onClick={start} className="absolute inset-0 flex items-center justify-center" aria-label={`Přehrát ${title}`}>
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-accent to-accent-deep" />
            )}
            <span className="relative rounded-full bg-white/95 px-5 py-3 text-base font-semibold text-ink shadow-lg">
              {status === "loading" ? "Načítám…" : pendingSeek !== null ? `Přehrát od ${formatTime(pendingSeek)}` : "Přehrát celý rozhovor"}
            </span>
          </button>
        )}
      </div>
      {chapters.length > 0 && (
        <ol className="card divide-y divide-line">
          {chapters.map((c) => (
            <li key={c.t}>
              <button onClick={() => seek(c.t)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-paper-2">
                <span className="w-14 shrink-0 font-mono text-muted">{formatTime(c.t)}</span>
                <span>{c.title}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
