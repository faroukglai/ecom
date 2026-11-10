"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProductVisibility } from "@/app/actions/catalog";
import { useDashLocale } from "@/components/dashboard/locale";
import { dashboardErrorMessage, visibilityLabel } from "@/lib/dashboard-i18n";

export function VisibilityToggle({ id, visibility }: { id: string; visibility: string }) {
  const { t, showError } = useDashLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(visibility);
  const on = current === "published";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={on ? t.hideProduct : t.showProduct}
        title={on ? t.hideProduct : t.showProduct}
        className="dash-switch"
        disabled={pending}
        onClick={() => {
          const next = on ? "hidden" : "published";
          startTransition(async () => {
            setCurrent(next);
            const result = await setProductVisibility(id, next);
            if (result?.error) showError(dashboardErrorMessage(t, result.error));
            router.refresh();
          });
        }}
      />
      <span className={`dash-status ${current}`}>{visibilityLabel(t, current)}</span>
    </span>
  );
}
