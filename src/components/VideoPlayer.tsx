import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, RotateCwSquare, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const;

function clock(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const rest = String(value % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

export function VideoPlayer({ src, title, onStart }: { src: string; title: string; onStart?: () => void }) {
  const started = useRef(false);
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(false);
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    const changed = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", escape); };
  }, [expanded]);

  useEffect(() => {
    if (!playing || waiting || speedOpen || active || !visible) return;
    const timer = window.setTimeout(() => setVisible(false), 3500);
    return () => window.clearTimeout(timer);
  }, [playing, waiting, speedOpen, active, visible]);

  async function togglePlay() {
    const media = video.current;
    if (!media) return;
    setVisible(true);
    if (!media.paused) { media.pause(); return; }
    try { await media.play(); } catch { setPlaying(false); setWaiting(false); }
  }

  function seek(value: number) {
    const media = video.current;
    if (!media || !Number.isFinite(media.duration)) return;
    media.currentTime = Math.min(media.duration, Math.max(0, value));
    setTime(media.currentTime);
    setVisible(true);
  }

  async function toggleFullscreen() {
    const container = frame.current;
    if (!container) return;
    setVisible(true);
    if (expanded) { setExpanded(false); return; }
    try {
      if (document.fullscreenElement === container) await document.exitFullscreen();
      else if (container.requestFullscreen) await container.requestFullscreen();
      else setExpanded(true);
    } catch { setExpanded(true); }
  }

  async function toggleRotate() {
    const container = frame.current;
    if (!container) return;
    setVisible(true);
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    const landscape = rotated || (orientation?.type ?? "").startsWith("landscape");
    try {
      if (!landscape) {
        if (document.fullscreenElement !== container && container.requestFullscreen) await container.requestFullscreen();
        await orientation.lock?.("landscape");
        setRotated(true);
      } else {
        orientation.unlock?.();
        setRotated(false);
      }
    } catch {
      setRotated(!rotated);
      setExpanded(!rotated);
    }
  }

  const iconClass = "h-12 w-12 shrink-0 rounded-full text-player-foreground hover:bg-player-foreground/15 hover:text-player-foreground [&_svg]:size-5";
  const controlsVisible = visible || !playing || error;

  return <div ref={frame} role="region" aria-label={`${title} video player`}
    className={`tanyora-player group relative isolate overflow-hidden bg-player-background text-player-foreground ${expanded && rotated && !fullscreen ? "player-rotated fixed z-[100]" : expanded ? "fixed inset-0 z-[100] h-dvh w-screen" : "aspect-video w-full rounded-2xl shadow-lg"}`}
    onPointerMove={() => setVisible(true)}
    onFocusCapture={() => { setVisible(true); setActive(true); }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(false); }}>
    <video key={src} ref={video} src={src} aria-label={title} playsInline autoPlay preload="metadata"
      controls={false} controlsList="nodownload noremoteplayback" disablePictureInPicture disableRemotePlayback
      className="absolute inset-0 h-full w-full object-contain"
      onLoadStart={() => { setWaiting(true); setError(false); setTime(0); setDuration(0); setPlaying(false); setSpeed(1); }}
      onLoadedMetadata={(event) => { setDuration(event.currentTarget.duration); setWaiting(false); }}
      onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
      onDurationChange={(event) => setDuration(event.currentTarget.duration)}
      onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); setVisible(true); }}
      onEnded={() => { setPlaying(false); setVisible(true); }}
      onWaiting={() => setWaiting(true)} onPlaying={() => { setWaiting(false); setError(false); if (!started.current) { started.current = true; onStart?.(); } }}
      onCanPlay={() => setWaiting(false)} onError={() => { setError(true); setWaiting(false); setPlaying(false); }}
      onVolumeChange={(event) => { setMuted(event.currentTarget.muted); setVolume(event.currentTarget.volume); }}
      onRateChange={(event) => setSpeed(event.currentTarget.playbackRate)} />
    <Button variant="ghost" className="absolute inset-0 h-full w-full rounded-none hover:bg-transparent" aria-label={playing ? "Pause video" : "Play video"}
      onClick={() => { if (!controlsVisible) setVisible(true); else void togglePlay(); }} tabIndex={-1} />
    {error ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-player-background px-4 text-center" role="alert">
      <p className="text-sm">This video could not be loaded.</p>
      <Button variant="secondary" onClick={() => { setError(false); video.current?.load(); }}>Try again</Button>
    </div> : waiting ? <div className="pointer-events-none absolute inset-0 grid place-items-center"><Loader2 aria-label="Loading video" className="size-9 animate-spin" /></div> : null}
    {!error && <div className={`pointer-events-none absolute inset-x-0 bottom-24 top-0 flex items-center justify-center gap-6 transition-opacity duration-200 sm:bottom-0 ${controlsVisible ? "opacity-100" : "opacity-0"}`} aria-hidden={!controlsVisible}>
      <Button variant="ghost" className={`${iconClass} pointer-events-auto size-14 bg-player-background/50 backdrop-blur-sm ring-1 ring-player-foreground/20`} aria-label="Rewind 10 seconds" title="Rewind 10 seconds" disabled={!duration} tabIndex={controlsVisible ? 0 : -1} onClick={() => seek(time - 10)}><span className="relative grid place-items-center"><RotateCcw className="!size-9" strokeWidth={1.75} /><span className="absolute text-[10px] font-bold">10</span></span></Button>
      <Button variant="ghost" className="pointer-events-auto size-12 rounded-full bg-player-foreground/95 text-player-background hover:bg-player-foreground hover:text-player-background sm:size-16 [&_svg]:size-6 sm:[&_svg]:size-7" aria-label={playing ? "Pause" : "Play"} title={playing ? "Pause" : "Play"} tabIndex={controlsVisible ? 0 : -1} onClick={() => void togglePlay()}>{playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}</Button>
      <Button variant="ghost" className={`${iconClass} pointer-events-auto size-14 bg-player-background/50 backdrop-blur-sm ring-1 ring-player-foreground/20`} aria-label="Forward 10 seconds" title="Forward 10 seconds" disabled={!duration} tabIndex={controlsVisible ? 0 : -1} onClick={() => seek(time + 10)}><span className="relative grid place-items-center"><RotateCw className="!size-9" strokeWidth={1.75} /><span className="absolute text-[10px] font-bold">10</span></span></Button>
    </div>}
    <div className={`player-controls absolute inset-x-0 bottom-0 px-3 pb-2 pt-10 transition-opacity duration-200 sm:px-5 ${controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`} inert={!controlsVisible}
      onPointerEnter={() => setActive(true)} onPointerLeave={() => setActive(false)}>
      <Slider aria-label="Seek video" className="h-6" min={0} max={Number.isFinite(duration) && duration > 0 ? duration : 1} step={0.1} value={[time]} disabled={!duration || error} onValueChange={([value]) => { if (value !== undefined) seek(value); }} />
      <div className="flex items-center gap-2">
        <Button variant="ghost" className={iconClass} aria-label={muted || volume === 0 ? "Unmute" : "Mute"} title={muted || volume === 0 ? "Unmute" : "Mute"} onClick={() => { if (video.current) video.current.muted = !video.current.muted; }}>{muted || volume === 0 ? <VolumeX /> : <Volume2 />}</Button>
        <Slider aria-label="Volume" className="hidden h-6 max-w-20 sm:flex" value={[muted ? 0 : volume]} max={1} step={0.05} onValueChange={([value]) => { if (video.current && value !== undefined) { video.current.volume = value; video.current.muted = value === 0; } }} />
        <span className="min-w-0 text-xs tabular-nums sm:text-sm">{clock(time)} <span className="text-player-muted">/ {clock(duration)}</span></span>
        <div className="relative ml-auto shrink-0">
          {speedOpen && <div className="absolute bottom-full -right-14 mb-2 grid w-[min(280px,calc(100vw-56px))] grid-cols-4 gap-1 rounded-lg border border-player-foreground/20 bg-player-panel p-1" role="group" aria-label="Playback speeds">
            {PLAYBACK_SPEEDS.map((value) => <Button key={value} variant="ghost" className="h-11 w-full justify-between text-player-foreground hover:bg-player-foreground/15 hover:text-player-foreground" aria-pressed={speed === value} onClick={() => { if (video.current) video.current.playbackRate = value; setSpeed(value); setSpeedOpen(false); }}>{value}x{speed === value && <span aria-hidden="true">✓</span>}</Button>)}
          </div>}
          <Button variant="ghost" className="h-12 min-w-12 text-player-foreground hover:bg-player-foreground/15 hover:text-player-foreground" aria-label="Playback speed" aria-expanded={speedOpen} title="Playback speed" onClick={() => setSpeedOpen(!speedOpen)}>{speed}x</Button>
        </div>
        <Button variant="ghost" className={iconClass} aria-label={rotated ? "Rotate to portrait" : "Rotate to landscape"} title="Rotate" onClick={() => void toggleRotate()}><RotateCwSquare /></Button>
        <Button variant="ghost" className={iconClass} aria-label={fullscreen || expanded ? "Exit fullscreen" : "Fullscreen"} title={fullscreen || expanded ? "Exit fullscreen" : "Fullscreen"} onClick={() => void toggleFullscreen()}>{fullscreen || expanded ? <Minimize /> : <Maximize />}</Button>
      </div>
    </div>
  </div>;
}