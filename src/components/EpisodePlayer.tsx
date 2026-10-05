"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Player from "@vimeo/player";
import { isSilent, preloadVimeoSdk, unmute, vimeoOptions, withTimeout } from "@/lib/playerRegistry";
import SoundButton from "@/components/SoundButton";
import { useDirectTap } from "@/lib/useDirectTap";
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
  const [started, setStarted] = useState(false);
  const direct = useDirectTap();
  const [sound, setSound] = useState<"ok" | "muted" | "tap">("ok");
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

  const ensurePlayer = useCallback(async (autoplay = true) => {
    if (playerRef.current) return playerRef.current;
    const el = containerRef.current;
    if (!el) return null;
    if (autoplay) setStatus("loading");
    const { default: VimeoPlayer } = await preloadVimeoSdk();
    const options = vimeoOptions(vimeoId, vimeoHash, {
      autoplay,
      ...(pendingSeek !== null ? { start_time: Math.floor(pendingSeek) } : {}),
    });
    const p = new VimeoPlayer(el, options as ConstructorParameters<typeof VimeoPlayer>[1]);
    playerRef.current = p;
    p.on("play", () => {
      setStarted(true);
      setTimeout(() => {
        isSilent(p).then((silent) => setSound((cur) => (silent ? (cur === "tap" ? "tap" : "muted") : "ok")));
      }, 600);
    });
    p.on("volumechange", () => {
      isSilent(p).then((silent) => {
        if (!silent) setSound("ok");
      });
    });
    await withTimeout(p.ready(), 6000);
    setStatus("ready");
    if (autoplay) setStarted(true);
    return p;
  }, [vimeoId, vimeoHash, pendingSeek]);

  const seek = useCallback(
    async (t: number) => {
      const existed = playerRef.current !== null;
      const p = await ensurePlayer();
      if (!p) return;
      if (existed || pendingSeek === null || Math.abs(pendingSeek - t) > 1) p.setCurrentTime(t).catch(() => undefined);
      p.play().catch(() => undefined);
    },
    [ensurePlayer, pendingSeek]
  );

  const start = useCallback(async () => {
    const p = await ensurePlayer();
    if (!p) return;
    p.play().catch(() => undefined);
  }, [ensurePlayer]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy().catch(() => undefined);
      playerRef.current = null;
    };
  }, []);

  // iPhone/Safari: iframe připravit hned bez autoplay, klepnutí přes fasádu dopadne přímo do Vimea (zvuk povolen).
  useEffect(() => {
    if (!direct) return;
    const id = setTimeout(() => void ensurePlayer(false), 0);
    return () => clearTimeout(id);
  }, [direct, ensurePlayer]);

  const onUnmute = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    const r = await unmute(p);
    setSound(r === "ok" ? "ok" : "tap");
  }, []);

  const showFacade = !started;
  const passThrough = direct && status === "ready" && !started;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-sm">
        <div ref={containerRef} data-player="v3" className={status === "ready" ? "aspect-video" : "aspect-video opacity-0"} />
        {started && sound !== "ok" && <SoundButton mode={sound} onUnmute={onUnmute} />}
        {showFacade && (
          <button
            type="button"
            onClick={start}
            className={`absolute inset-0 flex items-center justify-center ${passThrough ? "pointer-events-none" : ""}`}
            aria-label={`Přehrát ${title}`}
          >
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-deep to-[#1d2747]" />
            )}
            <span className="relative rounded-full bg-white px-5 py-3 text-base font-bold text-navy shadow-lg">
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
