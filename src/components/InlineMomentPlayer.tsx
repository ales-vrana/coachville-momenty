"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type Player from "@vimeo/player";
import {
  claimPlayer,
  ensureStart,
  isSilent,
  preloadVimeoSdk,
  releasePlayer,
  unmute,
  vimeoOptions,
  withTimeout,
} from "@/lib/playerRegistry";
import SoundButton from "@/components/SoundButton";
import { useDirectTap } from "@/lib/useDirectTap";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const playTrackedRef = useRef(false);
  // iPhone/Safari: iframe připravený dopředu, klepnutí jde přímo do něj (zvuk povolen).
  const direct = useDirectTap();
  const [armed, setArmed] = useState(false);
  const [sound, setSound] = useState<"ok" | "muted" | "tap">("ok");

  const destroy = useCallback(() => {
    playerRef.current?.destroy().catch(() => undefined);
    playerRef.current = null;
    endedRef.current = false;
    playTrackedRef.current = false;
    setArmed(false);
    setSound("ok");
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

  const ensurePlayer = useCallback(async (autoplay = true): Promise<Player | null> => {
    if (playerRef.current) return playerRef.current;
    const el = containerRef.current;
    if (!el) return null;
    const { default: VimeoPlayer } = await preloadVimeoSdk();
    // start_time / end_time řeší začátek i konec už v iframu; autoplay nese záměr kliknutí do iframu.
    const options = vimeoOptions(vimeoId, vimeoHash, {
      autoplay,
      start_time: Math.floor(start),
      end_time: Math.ceil(end),
    });
    const p = new VimeoPlayer(el, options as ConstructorParameters<typeof VimeoPlayer>[1]);
    playerRef.current = p;
    let startChecked = false;
    const finish = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      p.pause().catch(() => undefined);
      setStatus("ended");
      complete();
    };
    p.on("timeupdate", ({ seconds }: { seconds: number }) => {
      if (seconds >= end - 0.3) finish();
    });
    p.on("ended", finish);
    p.on("play", () => {
      // Při přímém klepnutí do iframu (iPhone) se o startu dozvíme až tady.
      claimPlayer(momentId, stopFromOutside);
      if (!playTrackedRef.current) {
        playTrackedRef.current = true;
        track("moment_play", { moment_id: momentId, placement: "card" });
      }
      setStatus((s) => (s === "ended" ? s : "playing"));
      if (!startChecked) {
        startChecked = true;
        ensureStart(p, start);
      }
      // Hraje bez zvuku? Ukázat viditelné tlačítko „Zapnout zvuk“ (Vimeo ho na úzké kartě schovává do menu).
      setTimeout(() => {
        isSilent(p).then((silent) => setSound((cur) => (silent ? (cur === "tap" ? "tap" : "muted") : "ok")));
      }, 600);
    });
    p.on("volumechange", () => {
      isSilent(p).then((silent) => {
        if (!silent) setSound("ok");
      });
    });
    p.on("pause", () => setStatus((s) => (s === "ended" || s === "idle" ? s : "paused")));
    p.on("error", () => {
      setError("Video se tady nepodařilo načíst.");
      setStatus("error");
    });
    // Nečekat donekonečna: po 6 s se iframe ukáže tak jako tak (Vimeo má vlastní tlačítko play).
    await withTimeout(p.ready(), 6000);
    return p;
  }, [vimeoId, vimeoHash, start, end, complete, momentId, stopFromOutside]);

  const playFrom = useCallback(
    async (t: number, how: "play" | "replay") => {
      claimPlayer(momentId, stopFromOutside);
      if (how === "play" && !playTrackedRef.current) {
        playTrackedRef.current = true;
        track("moment_play", { moment_id: momentId, placement: "card" });
      }
      setStatus("loading");
      setError(null);
      try {
        const existed = playerRef.current !== null;
        const p = await ensurePlayer();
        if (!p) return;
        endedRef.current = false;
        // Iframe ukázat hned; nečekat na seek ani na play (v Safari to trvalo desítky sekund a fasáda zakrývala přehrávač).
        setStatus("playing");
        if (existed || how === "replay") p.setCurrentTime(t).catch(() => undefined);
        p.play().catch(() => undefined);
      } catch {
        setError("Video se tady nepodařilo načíst.");
        setStatus("error");
      }
    },
    [ensurePlayer, momentId, stopFromOutside]
  );

  // SDK načíst dopředu (jeden sdílený import), aby klik na mobilu, kde není hover, nečekal na stažení.
  useEffect(() => {
    const id = setTimeout(() => preloadVimeoSdk(), 1500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    return () => {
      destroy();
      releasePlayer(momentId);
    };
  }, [destroy, momentId]);

  // iPhone/Safari: když je karta na obrazovce, připravit iframe bez autoplay; mimo obrazovku ho uvolnit.
  useEffect(() => {
    if (!direct || status !== "idle") return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let cancelled = false;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !playerRef.current) {
          ensurePlayer(false).then((p) => {
            if (!cancelled && p) setArmed(true);
          });
        } else if (!visible && playerRef.current) {
          destroy();
        }
      },
      { rootMargin: "150px 0px" }
    );
    obs.observe(el);
    return () => {
      cancelled = true;
      obs.disconnect();
    };
  }, [direct, status, ensurePlayer, destroy]);

  const onUnmute = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    const r = await unmute(p);
    setSound(r === "ok" ? "ok" : "tap");
    track("moment_unmute", { moment_id: momentId, placement: "card", result: r });
  }, [momentId]);

  const showFacade = status === "idle" || status === "loading";
  // Připravený iframe leží pod fasádou neprůhledný; fasáda nepřijímá klepnutí, takže trefí přímo Vimeo.
  const passThrough = direct && armed && status === "idle";
  const circle = emphasis ? "h-16 w-16 sm:h-20 sm:w-20" : "h-14 w-14 sm:h-16 sm:w-16";

  return (
    <div ref={rootRef} className="relative aspect-video w-full overflow-hidden bg-navy-deep" data-player="v3">
      <div
        ref={containerRef}
        className={`absolute inset-0 ${(showFacade && !passThrough) || status === "error" ? "opacity-0" : ""}`}
      />

      {showFacade && (
        <button
          type="button"
          onClick={() => playFrom(start, "play")}
          onPointerEnter={() => preloadVimeoSdk()}
          onFocus={() => preloadVimeoSdk()}
          className={`group absolute inset-0 flex items-center justify-center text-left ${passThrough ? "pointer-events-none" : ""}`}
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

      {(status === "playing" || status === "paused") && sound !== "ok" && <SoundButton mode={sound} onUnmute={onUnmute} />}

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
