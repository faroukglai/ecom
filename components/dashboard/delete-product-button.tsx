"use client";

import { deleteProduct } from "@/app/actions/catalog";

export function DeleteProductButton({
  id,
  label,
  confirmLabel,
  className = "dash-btn danger",
}: {
  id: string;
  label: string;
  confirmLabel: string;
  className?: string;
}) {
  return (
    <form
      action={deleteProduct.bind(null, id)}
      onSubmit={(event) => {
        if (!window.confirm(confirmLabel)) event.preventDefault();
      }}
    >
      <button className={className} type="submit">{label}</button>
    </form>
  );
}
