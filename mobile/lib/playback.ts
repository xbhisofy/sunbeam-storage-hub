export function seekTime(current: number, delta: number, duration: number) {
  return Math.max(0, Math.min(Math.max(0, duration), current + delta));
}
export function timelineTime(position: number, width: number, duration: number) {
  return width > 0 ? seekTime(0, position / width * duration, duration) : 0;
}