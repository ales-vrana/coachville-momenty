"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type Player from "@vimeo/player";
import { claimPlayer, preloadVimeoSdk, releasePlayer } from "@/lib/playerRegistry";
import { markCompleted } from "@/lib/session";
import { track } from "@/lib/track";

interface Props {
  momentId: string;
  vimeoId: string;
  vimeoHash?: string;
  thumbnailUrl?: string;
  guestName: string;
  durationLabel: string; // "2:35"
  startLabel: string; // "12:40"
  start: number;
  end: number;
  momentHref: string;
  fullHref: string;
  badge?: string; // např. „Začněte tady“
  emphasis?: boolean; // větší tlačítko u první karty
}

type Status = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

/**
 * Přehrávač momentu přímo v kartě výpisu: jeden klik = video hraje od startu momentu a zastaví na jeho konci.
 * Iframe vzniká až po kliknutí; v jednu chvíli hraje jen jeden moment (playerRegistry).
 */
export default function InlineMomentPlayer({
  momentId,
  vimeoId,
  vimeoHash,
  thumbnailUrl,
  guestName,
  durationLabel,
  startLabel,
  start,
  end,
  momentHref,
  fullHref,
  badge,
  emphasis = false,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const endedRef = useRef(false);
  const completedRef = useRef(false);

  const destroy = useCallback(() => {
    playerRef.current?.destroy().catch(() => undefined);
    playerRef.current = null;
    endedRef.current = false;
  }, []);

  // Jiná karta začala hrát: tuhle zastavit a vrátit na fasádu (iframe se uvolní).
  const stopFromOutside = useCallback(() => {
    destroy();
    setStatus("idle");
  }, [destroy]);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    markCompleted(momentId, "video");
    track("moment_complete", { moment_id: momentId, placement: "card" });
  }, [momentId]);

  const ensurePlayer = useCallback(async (): Promise<Player | null> => {
    if (playerRef.current) return playerRef.current;
    const el = containerRef.current;
    if (!el) return null;
    const { default: VimeoPlayer } = await preloadVimeoSdk();
    const base = {
      autoplay: false,
      responsive: true,
      byline: false,
      portrait: false,
      title: false,
      dnt: true,
      playsinline: true,
      pip: false,
    };
    const options = vimeoHash ? { ...base, url: `https://vimeo.com/${vimeoId}/${vimeoHash}` } : { ...base, id: Number(vimeoId) };
    const p = new VimeoPlayer(el, options as ConstructorParameters<typeof VimeoPlayer>[1]);
    playerRef.current = p;
    p.on("timeupdate", ({ seconds }: { seconds: number }) => {
      if (endedRef.current) return;
      if (seconds >= end - 0.3) {
        endedRef.current = true;
        p.pause().catch(() => undefined);
        setStatus("ended");
        complete();
      }
    });
    p.on("play", () => setStatus((s) => (s === "ended" ? s : "playing")));
    p.on("pause", () => setStatus((s) => (s === "ended" || s === "idle" ? s : "paused")));
    p.on("error", () => {
      setError("Video se tady nepodařilo načíst.");
      setStatus("error");
    });
    await p.ready();
    return p;
  }, [vimeoId, vimeoHash, end, complete]);

  const playFrom = useCallback(
    async (t: number, how: "play" | "replay") => {
      claimPlayer(momentId, stopFromOutside);
      if (how === "play") track("moment_play", { moment_id: momentId, placement: "card" });
      setStatus("loading");
      setError(null);
      try {
        const p = await ensurePlayer();
        if (!p) return;
        endedRef.current = false;
        await p.setCurrentTime(t);
        setStatus("playing");
        await p.play();
      } catch {
        setError("Video se tady nepodařilo načíst.");
        setStatus("error");
      }
    },
    [ensurePlayer, momentId, stopFromOutside]
  );

  useEffect(() => {
    return () => {
      destroy();
      releasePlayer(momentId);
    };
  }, [destroy, momentId]);

  const showFacade = status === "idle" || status === "loading";
  const circle = emphasis ? "h-16 w-16 sm:h-20 sm:w-20" : "h-14 w-14 sm:h-16 sm:w-16";

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-navy-deep">
      <div ref={containerRef} className={`absolute inset-0 ${showFacade || status === "error" ? "opacity-0" : ""}`} />

      {showFacade && (
        <button
          type="button"
          onClick={() => playFrom(start, "play")}
          onPointerEnter={() => preloadVimeoSdk()}
          onFocus={() => preloadVimeoSdk()}
          className="group absolute inset-0 flex items-center justify-center text-left"
          aria-label={`Přehrát moment ${guestName}, ${durationLabel}, od ${startLabel}`}
        >
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          ) : null}
          {/* Navy overlay podle brandu (rgba(36,48,86,0.8)); bez thumbnailu navy gradient jako zastavený záběr. */}
          <div
            className={`absolute inset-0 ${
              thumbnailUrl ? "bg-navy-overlay" : "bg-gradient-to-br from-navy via-navy-deep to-[#1d2747]"
            }`}
          />
          {badge && (
            <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
              {badge}
            </span>
          )}
          <span
            className={`relative flex ${circle} items-center justify-center rounded-full bg-white text-teal shadow-lg transition group-hover:scale-105 group-hover:bg-teal group-hover:text-white`}
          >
            {status === "loading" ? <Spinner /> : <PlayIcon large={emphasis} />}
          </span>
          <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/50 to-transparent px-3 pb-2.5 pt-8 text-white">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{guestName}</span>
              <span className="block text-xs text-white/75">
                {status === "loading" ? "Načítám…" : `${durationLabel} · od ${startLabel}`}
              </span>
            </span>
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white/60">Video</span>
          </span>
        </button>
      )}

      {status === "ended" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-navy-overlay p-4 text-center text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Konec momentu</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
            <Link href={momentHref} className="rounded-full bg-white px-4 py-2 font-bold text-navy hover:bg-teal hover:text-white">
              Číst přepis
            </Link>
            <button onClick={() => playFrom(start, "replay")} className="rounded-full border border-white/50 px-4 py-2 font-medium hover:bg-white/10">
              Znovu
            </button>
            <Link href={fullHref} className="rounded-full border border-white/50 px-4 py-2 font-medium hover:bg-white/10">
              Celý rozhovor od {startLabel}
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy p-4 text-center text-sm text-white">
          <p>{error ?? "Video se tady nepodařilo načíst."}</p>
          <Link href={momentHref} className="rounded-full bg-white px-4 py-2 font-bold text-navy">
            Otevřít stránku momentu
          </Link>
        </div>
      )}
    </div>
  );
}

function PlayIcon({ large }: { large?: boolean }) {
  const s = large ? 34 : 28;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-1">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-7 w-7 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
