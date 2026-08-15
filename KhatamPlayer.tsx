import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Upload, Volume2 } from "lucide-react";
const defaultAudioUrl = "/khatm-sharif.m4a"; // put khatm-sharif.m4a in the /public folder
const logoUrl = "/logo.png"; // put logo.png in the /public folder
import { SECTIONS, WORDS, findWordIndexAt } from "@/data/khatam";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function KhatamPlayer() {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const wordRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [src, setSrc] = useState<string>(defaultAudioUrl);
  const [isVideo, setIsVideo] = useState(false);
  const [fileName, setFileName] = useState("Khatam Sharif (default)");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);

  const activeIndex = useMemo(() => findWordIndexAt(time), [time]);
  const lastPassed = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < WORDS.length; i++) {
      if (WORDS[i]!.start <= time) idx = i;
      else break;
    }
    return idx;
  }, [time]);
  const highlighted = activeIndex >= 0 ? activeIndex : lastPassed;

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      setTime(el.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [src]);

  useEffect(() => {
    if (mediaRef.current) mediaRef.current.playbackRate = speed;
  }, [speed, src]);

  useEffect(() => {
    if (!autoScroll || activeIndex < 0) return;
    const node = wordRefs.current[activeIndex];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex, autoScroll]);

  const seek = useCallback((t: number, play = true) => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = t;
    setTime(t);
    if (play) void el.play();
  }, []);

  const toggle = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }, []);

  const currentSectionIdx = useMemo(() => {
    let idx = 0;
    SECTIONS.forEach((s, i) => {
      if (time >= s.start) idx = i;
    });
    return idx;
  }, [time]);

  const jumpSection = (delta: number) => {
    const target = SECTIONS[Math.min(SECTIONS.length - 1, Math.max(0, currentSectionIdx + delta))];
    if (target) seek(target.start);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setSrc(URL.createObjectURL(file));
    setIsVideo(file.type.startsWith("video/"));
    setFileName(file.name);
    setTime(0);
    setPlaying(false);
  };

  return (
    <div className="min-h-screen pb-40">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <img src={logoUrl} alt="Khatam Sharif logo" className="size-12 shrink-0" />
          <div className="me-auto">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Khatam Sharif</h1>
            <p className="text-xs text-muted-foreground">Word-synced Quran recitation</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary">
            <Upload className="size-4" />
            <span className="max-w-[10rem] truncate">{fileName}</span>
            <input
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-8">
        {isVideo && (
          <video
            ref={mediaRef}
            src={src}
            controls={false}
            className="mb-8 w-full rounded-2xl surface-card"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
        )}
        {!isVideo && (
          <video
            ref={mediaRef}
            src={src}
            className="hidden"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
        )}

        {SECTIONS.map((section) => (
          <section key={section.title} className="mb-10">
            <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <button
                onClick={() => seek(section.start)}
                className="font-urdu text-xl leading-loose text-primary transition-opacity hover:opacity-70"
                dir="rtl"
              >
                {section.title}
              </button>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {section.subtitle}
              </span>
            </div>
            <p
              dir="rtl"
              lang="ar"
              className="font-arabic text-3xl leading-[2.4] text-foreground sm:text-4xl sm:leading-[2.5]"
            >
              {section.words.map(({ word, index }) => (
                <button
                  key={index}
                  ref={(el) => {
                    wordRefs.current[index] = el;
                  }}
                  onClick={() => seek(word.start)}
                  className={`word-chip ${
                    index === highlighted
                      ? "word-active"
                      : index < highlighted
                        ? "word-past"
                        : ""
                  }`}
                >
                  {word.text}
                </button>
              ))}
            </p>
          </section>
        ))}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-11 text-xs tabular-nums text-muted-foreground">
              {formatTime(time)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || WORDS[WORDS.length - 1]!.end}
              step={0.01}
              value={time}
              onChange={(e) => seek(Number(e.target.value), playing)}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
              aria-label="Seek"
            />
            <span className="w-11 text-end text-xs tabular-nums text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => jumpSection(-1)}
                className="rounded-full border border-border p-2 text-secondary-foreground transition-colors hover:bg-secondary"
                aria-label="Previous section"
              >
                <SkipBack className="size-4" />
              </button>
              <button
                onClick={toggle}
                className="gradient-primary rounded-full p-3 text-primary-foreground shadow-[var(--shadow-lift)] transition-transform hover:scale-105"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
              </button>
              <button
                onClick={() => jumpSection(1)}
                className="rounded-full border border-border p-2 text-secondary-foreground transition-colors hover:bg-secondary"
                aria-label="Next section"
              >
                <SkipForward className="size-4" />
              </button>
              <span className="ms-1 hidden font-urdu text-sm text-primary sm:inline" dir="rtl">
                {SECTIONS[currentSectionIdx]?.title}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    speed === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {s}x
                </button>
              ))}
              <button
                onClick={() => setAutoScroll((v) => !v)}
                className={`ms-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  autoScroll
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Volume2 className="size-3.5" />
                Auto-scroll {autoScroll ? "on" : "off"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
