"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type Player from "@vimeo/player";
import { markCompleted } from "@/lib/session";
import { track } from "@/lib/track";

export interface PlayerUtterance {
  i: number;
  t: number;
  speaker: string;
  text: string;
}

export interface NextMomentInfo {
  id: string;
  guestName: string;
  durationLabel: string;
  summary: string;
}

interface Props {
  momentId: string;
  vimeoId: string;
  vimeoHash?: string;
  thumbnailUrl?: string;
  guestName: string;
  initialsText: string;
  start: number;
  end: number;
  startLabel: string; // "30:34"
  utterances: PlayerUtterance[];
  next: NextMomentInfo | null;
  fullUrl: string;
}

type Status = "idle" | "loading" | "playing" | "paused" | "ended";

export default function MomentPlayer({
  momentId,
  vimeoId,
  vimeoHash,
  thumbnailUrl,
  guestName,
  initialsText,
  start,
  end,
  startLabel,
  utterances,
  next,
  fullUrl,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [currentTime, setCurrentTime] = useState<number>(start);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const completedRef = useRef(false);
  const readSentinelRef = useRef<HTMLDivElement>(null);
  const startMutedRef = useRef(false);

  // Z e-mailu (?ref=email) startuje video ztlumené, aby v MHD nikoho nepřekvapilo.
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      startMutedRef.current = ref === "email";
    } catch {
      /* ignore */
    }
  }, []);

  const complete = useCallback(
    (how: "video" | "read") => {
      if (completedRef.current) return;
      completedRef.current = true;
      markCompleted(momentId, how);
      track(how === "video" ? "moment_complete" : "moment_read", { moment_id: momentId });
    },
    [momentId]
  );

  // Dočtení přepisu = dokončení momentu (F8 zadání).
  useEffect(() => {
    const el = readSentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          complete("read");
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [complete]);

  const ensurePlayer = useCallback(async (): Promise<Player | null> => {
    if (playerRef.current) return playerRef.current;
    const el = containerRef.current;
    if (!el) return null;
    setStatus("loading");
    try {
      const { default: VimeoPlayer } = await import("@vimeo/player");
      const startMuted = startMutedRef.current;
      setMuted(startMuted);
      const base = {
        autoplay: true,
        muted: startMuted,
        responsive: true,
        byline: false,
        portrait: false,
        title: false,
        dnt: true,
        playsinline: true,
        pip: false,
      };
      const options = vimeoHash
        ? { ...base, url: `https://vimeo.com/${vimeoId}/${vimeoHash}` }
        : { ...base, id: Number(vimeoId) };
      const p = new VimeoPlayer(el, options as ConstructorParameters<typeof VimeoPlayer>[1]);
      playerRef.current = p;
      p.on("timeupdate", ({ seconds }: { seconds: number }) => {
        setCurrentTime(seconds);
        if (seconds >= end - 0.3) {
          p.pause().catch(() => undefined);
          setStatus("ended");
          complete("video");
        }
      });
      p.on("play", () => setStatus((s) => (s === "ended" ? s : "playing")));
      p.on("pause", () => setStatus((s) => (s === "ended" ? s : "paused")));
      p.on("error", (e: { message?: string }) => setError(e?.message ?? "Video se nepodařilo načíst."));
      await p.ready();
      await p.setCurrentTime(start);
      return p;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Video se nepodařilo načíst.");
      setStatus("idle");
      return null;
    }
  }, [vimeoId, vimeoHash, start, end, complete]);

  const play = useCallback(async () => {
    track("moment_play", { moment_id: momentId });
    const p = await ensurePlayer();
    if (!p) return;
    setStatus("playing");
    try {
      await p.setCurrentTime(start);
      await p.play();
    } catch {
      /* autoplay může být blokován, uživatel klikne v přehrávači */
    }
  }, [ensurePlayer, momentId, start]);

  const replay = useCallback(async () => {
    const p = await ensurePlayer();
    if (!p) return;
    setStatus("playing");
    await p.setCurrentTime(start);
    await p.play();
  }, [ensurePlayer, start]);

  const seekTo = useCallback(
    async (t: number) => {
      const p = await ensurePlayer();
      if (!p) return;
      setStatus("playing");
      await p.setCurrentTime(t);
      await p.play();
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [ensurePlayer]
  );

  const unmute = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    await p.setMuted(false);
    await p.setVolume(1);
    setMuted(false);
  }, []);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy().catch(() => undefined);
      playerRef.current = null;
    };
  }, []);

  const activeIndex = utterances.findIndex((u, idx) => {
    const nextT = utterances[idx + 1]?.t ?? end;
    return currentTime >= u.t && currentTime < nextT;
  });
  const showFacade = status === "idle" || status === "loading";

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-sm">
        <div ref={containerRef} className={showFacade ? "aspect-video opacity-0" : "aspect-video"} />
        {showFacade && (
          <button
            type="button"
            onClick={play}
            className="absolute inset-0 flex items-center justify-center"
            aria-label={`Přehrát moment od ${startLabel}`}
          >
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy via-navy-deep to-[#1d2747]">
                <span className="text-6xl font-semibold text-white/80">{initialsText}</span>
              </div>
            )}
            <span className="relative flex items-center gap-3 rounded-full bg-white px-5 py-3 text-base font-bold text-navy shadow-lg">
              <PlayIcon />
              {status === "loading" ? "Načítám…" : `Přehrát od ${startLabel}`}
            </span>
          </button>
        )}
        {status === "ended" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Konec momentu</p>
            {next ? (
              <Link
                href={`/m/${next.id}`}
                className="max-w-md rounded-2xl bg-white px-5 py-4 text-left text-ink shadow-lg transition hover:bg-paper-2"
              >
                <span className="block text-xs uppercase tracking-wide text-muted">Další moment k tomuto tématu</span>
                <span className="mt-1 block font-semibold">
                  {next.guestName}, {next.durationLabel}
                </span>
                <span className="mt-1 block text-sm text-muted">{next.summary}</span>
              </Link>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <button onClick={replay} className="rounded-full border border-white/40 px-4 py-2 hover:bg-white/10">
                Přehrát znovu
              </button>
              <Link href={fullUrl} className="rounded-full border border-white/40 px-4 py-2 hover:bg-white/10">
                Celý rozhovor od této minuty
              </Link>
            </div>
          </div>
        )}
      </div>
      {muted && (status === "playing" || status === "paused") && (
        <button
          onClick={unmute}
          className="btn-primary w-full"
        >
          Zapnout zvuk
        </button>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="card p-4 sm:p-6">
        <p className="eyebrow mb-3">
          Přepis momentu · klepnutím na odstavec přeskočíte na to místo ve videu
        </p>
        <div className="space-y-3 text-[17px] leading-relaxed">
          {utterances.map((u, idx) => {
            const active = idx === activeIndex && !showFacade;
            return (
              <p
                key={u.i}
                onClick={() => seekTo(u.t)}
                className={`cursor-pointer rounded-lg px-2 py-1 transition ${
                  active ? "bg-accent-soft" : "hover:bg-paper-2"
                }`}
              >
                <span className="mr-2 text-xs text-muted">{u.speaker}</span>
                {u.text}
              </p>
            );
          })}
        </div>
        <div ref={readSentinelRef} className="h-1" aria-hidden="true" />
        <p className="mt-4 text-sm text-muted">
          Řekl(a) to {guestName}. Přepis je upravený jen pro čitelnost (bez slovní vaty), význam a čísla jsou beze změny.{" "}
          <Link href={fullUrl} className="underline">
            Celý nesestříhaný rozhovor od {startLabel}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
