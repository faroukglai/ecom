"use client";

import { useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import { useDashLocale } from "@/components/dashboard/locale";

export function CopyButton({ value }: { value: string }) {
  const { t } = useDashLocale();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="dash-btn ghost dash-btn-compact dash-btn-icon"
      aria-label={done ? t.copied : t.copy}
      title={done ? t.copied : t.copy}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {
          setDone(false);
        }
      }}
    >
      <Icon name={done ? "check" : "copy"} size={15}/>
    </button>
  );
}

export function PrintButton() {
  const { t } = useDashLocale();
  return (
    <button type="button" className="dash-btn ghost" onClick={() => window.print()}>
      <Icon name="printer" size={17}/> {t.printSlip}
    </button>
  );
}
