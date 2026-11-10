"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Fires one pixel event when the page it sits on is shown. Renders nothing. */
export function TrackEvent({ name, data }: { name: string; data?: Record<string, unknown> }) {
  const payload = JSON.stringify(data ?? {});
  useEffect(() => {
    track(name, JSON.parse(payload) as Record<string, unknown>);
  }, [name, payload]);
  return null;
}
