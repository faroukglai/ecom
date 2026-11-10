type Fbq = (command: string, event: string, data?: Record<string, unknown>) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/** Sends a Meta Pixel event. Does nothing when the pixel is not installed (no NEXT_PUBLIC_META_PIXEL_ID). */
export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("track", event, data);
  } catch {
    // Analytics must never break ordering.
  }
}
