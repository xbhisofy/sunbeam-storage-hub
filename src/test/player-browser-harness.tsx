import { createRoot } from "react-dom/client";
import { VideoPlayer } from "../components/VideoPlayer";
export function mountPlayer() {
  document.body.replaceChildren();
  const host = document.createElement("div");
  document.body.append(host);
  createRoot(host).render(<VideoPlayer src="/player-check.webm" title="Mountain View.webm" />);
}