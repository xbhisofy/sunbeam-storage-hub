import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, RotateCwSquare, Volume2, VolumeX, LockKeyhole, UnlockKeyhole, Repeat2, Sun } from "lucide-react";
import "./video-player.css";
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
  const [locked, setLocked] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    const changed = () => {
      const full = document.fullscreenElement === frame.current;
      setFullscreen(full);
      if (!full) { screen.orientation?.unlock?.(); setRotated(false); }
    };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setExpanded(false); setRotated(false); setLocked(false); } };
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
    if (expanded) { setExpanded(false); setRotated(false); return; }
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
        if (!orientation.lock) throw new Error("Orientation lock unavailable");
        await orientation.lock("landscape");
        setRotated(true);
      } else {
        orientation.unlock?.();
        setRotated(false);
        setExpanded(false);
        if (document.fullscreenElement === container) await document.exitFullscreen();
      }
    } catch {
      if (document.fullscreenElement === container) await document.exitFullscreen().catch(() => {});
      setRotated(!landscape);
      setExpanded(!landscape);
    }
  }

  const iconClass = "h-12 w-12 shrink-0 rounded-full text-player-foreground hover:bg-player-foreground/15 hover:text-player-foreground [&_svg]:size-5";
  const controlsVisible = !locked && (visible || !playing || error);

  return <div ref={frame} role="region" aria-label={`${title} video player`}
    className={`tanyora-player group relative isolate overflow-hidden bg-player-background text-player-foreground ${expanded && rotated && !fullscreen ? "player-rotated fixed z-[100]" : expanded ? "fixed inset-0 z-[100] h-dvh w-screen" : "aspect-video w-full rounded-2xl shadow-lg"}`}
    onPointerMove={() => { if (!locked) setVisible(true); }}
    onFocusCapture={() => { setVisible(true); setActive(true); }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(false); }}>
    <video key={src} ref={video} src={src} aria-label={title} playsInline autoPlay preload="metadata"
      controls={false} controlsList="nodownload noremoteplayback" disablePictureInPicture disableRemotePlayback
      className="absolute inset-0 h-full w-full object-contain" style={{ filter: `brightness(${brightness})` }} loop={repeat}
      onLoadStart={() => { started.current = false; setWaiting(true); setError(false); setTime(0); setDuration(0); setPlaying(false); setSpeed(1); setLocked(false); }}
      onLoadedMetadata={(event) => { setDuration(event.currentTarget.duration); setResolution(`${event.currentTarget.videoWidth} × ${event.currentTarget.videoHeight}`); setWaiting(false); }}
      onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
      onDurationChange={(event) => setDuration(event.currentTarget.duration)}
      onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); setVisible(true); }}
      onEnded={() => { setPlaying(false); setVisible(true); }}
      onWaiting={() => setWaiting(true)} onPlaying={() => { setWaiting(false); setError(false); if (!started.current) { started.current = true; onStart?.(); } }}
      onCanPlay={() => setWaiting(false)} onError={() => { setError(true); setWaiting(false); setPlaying(false); }}
      onVolumeChange={(event) => { setMuted(event.currentTarget.muted); setVolume(event.currentTarget.volume); }}
      onRateChange={(event) => setSpeed(event.currentTarget.playbackRate)} />
    <Button variant="ghost" className="absolute inset-0 h-full w-full rounded-none hover:bg-transparent" aria-label={playing ? "Pause video" : "Play video"}
      onClick={() => { if (locked) return; if (!controlsVisible) setVisible(true); else void togglePlay(); }} tabIndex={-1} />
    <div className={`player-topbar ${controlsVisible ? "" : "player-hidden"}`} inert={!controlsVisible}>
      <div className="player-title"><strong>{title}</strong><small>{resolution || "Video"}</small></div>
      <Button variant="ghost" className={`${iconClass} player-tool`} aria-label="Lock controls" title="Lock controls" onClick={() => { setLocked(true); setSpeedOpen(false); }}><LockKeyhole /><small>Lock</small></Button>
      <div className="relative">
        <Button variant="ghost" className={`${iconClass} player-tool`} aria-label="Playback speed" aria-expanded={speedOpen} title="Playback speed" onClick={() => setSpeedOpen(!speedOpen)}><span>{speed}x</span><small>Speed</small></Button>
        {speedOpen && <div className="player-speed-menu" role="group" aria-label="Playback speeds">{PLAYBACK_SPEEDS.map(value => <Button key={value} variant="ghost" className="h-11 text-player-foreground hover:bg-player-foreground/15 hover:text-player-foreground" aria-pressed={speed === value} onClick={() => { if (video.current) video.current.playbackRate = value; setSpeed(value); setSpeedOpen(false); }}>{value}x</Button>)}</div>}
      </div>
      <Button variant="ghost" className={`${iconClass} player-tool`} aria-label={rotated ? "Rotate to portrait" : "Rotate to landscape"} title="Rotate" onClick={() => void toggleRotate()}><RotateCwSquare /><small>Rotate</small></Button>
    </div>
    {locked && <Button variant="ghost" className={`${iconClass} player-unlock`} aria-label="Unlock controls" title="Unlock controls" onClick={() => { setLocked(false); setVisible(true); }}><UnlockKeyhole /></Button>}
    <div className={`player-side player-side-left ${controlsVisible ? "" : "player-hidden"}`} inert={!controlsVisible}><Sun /><Slider orientation="vertical" aria-label="Video brightness" min={0.4} max={1.4} step={0.05} value={[brightness]} onValueChange={([value]) => { if (value !== undefined) setBrightness(value); }} /><Sun className="opacity-50" /></div>
    <div className={`player-side player-side-right ${controlsVisible ? "" : "player-hidden"}`} inert={!controlsVisible}><Volume2 /><Slider orientation="vertical" aria-label="Volume" min={0} max={1} step={0.05} value={[muted ? 0 : volume]} onValueChange={([value]) => { if (video.current && value !== undefined) { video.current.volume = value; video.current.muted = value === 0; } }} /><VolumeX /></div>
    {error ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-player-background px-4 text-center" role="alert">
      <p className="text-sm">This video could not be loaded.</p>
      <Button variant="secondary" onClick={() => { setError(false); video.current?.load(); }}>Try again</Button>
    </div> : waiting ? <div className="pointer-events-none absolute inset-0 grid place-items-center"><Loader2 aria-label="Loading video" className="size-9 animate-spin" /></div> : null}
    {!error && <div className={`player-center ${controlsVisible ? "" : "player-hidden"}`} aria-hidden={!controlsVisible}>
      <Button variant="ghost" className={`${iconClass} pointer-events-auto size-14 bg-player-background/50 backdrop-blur-sm ring-1 ring-player-foreground/20`} aria-label="Rewind 10 seconds" title="Rewind 10 seconds" disabled={!duration} tabIndex={controlsVisible ? 0 : -1} onClick={() => seek(time - 10)}><span className="relative grid place-items-center"><RotateCcw className="!size-9" strokeWidth={1.75} /><span className="absolute text-[10px] font-bold">10</span></span></Button>
      <Button variant="ghost" className={`${iconClass} player-main-play`} aria-label={playing ? "Pause" : "Play"} title={playing ? "Pause" : "Play"} tabIndex={controlsVisible ? 0 : -1} onClick={() => void togglePlay()}>{playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}</Button>
      <Button variant="ghost" className={`${iconClass} pointer-events-auto size-14 bg-player-background/50 backdrop-blur-sm ring-1 ring-player-foreground/20`} aria-label="Forward 10 seconds" title="Forward 10 seconds" disabled={!duration} tabIndex={controlsVisible ? 0 : -1} onClick={() => seek(time + 10)}><span className="relative grid place-items-center"><RotateCw className="!size-9" strokeWidth={1.75} /><span className="absolute text-[10px] font-bold">10</span></span></Button>
    </div>}
    <div className={`player-controls absolute inset-x-0 bottom-0 px-3 pb-2 pt-10 transition-opacity duration-200 sm:px-5 ${controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`} inert={!controlsVisible}
      onPointerEnter={() => setActive(true)} onPointerLeave={() => setActive(false)}>
      <Slider aria-label="Seek video" className="h-6" min={0} max={Number.isFinite(duration) && duration > 0 ? duration : 1} step={0.1} value={[time]} disabled={!duration || error} onValueChange={([value]) => { if (value !== undefined) seek(value); }} />
      <div className="player-timeline-times"><span>{clock(time)}</span><span>{clock(duration)}</span></div>
      <div className="player-bottom-row">
        <Button variant="ghost" className={iconClass} aria-label={muted || volume === 0 ? "Unmute" : "Mute"} title={muted || volume === 0 ? "Unmute" : "Mute"} onClick={() => { if (video.current) video.current.muted = !video.current.muted; }}>{muted || volume === 0 ? <VolumeX /> : <Volume2 />}</Button>
        <Button variant="ghost" className={`${iconClass} player-tool`} aria-label="Repeat video" aria-pressed={repeat} title="Repeat video" onClick={() => setRepeat(!repeat)}><Repeat2 /><small>{repeat ? "Repeat on" : "Repeat"}</small></Button>
        <Button variant="ghost" className={iconClass} aria-label={fullscreen || expanded ? "Exit fullscreen" : "Fullscreen"} title={fullscreen || expanded ? "Exit fullscreen" : "Fullscreen"} onClick={() => void toggleFullscreen()}>{fullscreen || expanded ? <Minimize /> : <Maximize />}</Button>
      </div>
    </div>
  </div>;
}