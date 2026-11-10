"use client";

import { deleteProduct } from "@/app/actions/catalog";
import { DashActionForm } from "@/components/dashboard/action-form";
import { Icon } from "@/components/dashboard/icons";

export function DeleteProductButton({
  id,
  label,
  confirmLabel,
  className = "dash-btn danger",
  iconOnly = false,
}: {
  id: string;
  label: string;
  confirmLabel: string;
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <DashActionForm
      action={deleteProduct.bind(null, id)}
      submitLabel={iconOnly ? <Icon name="trash" size={16}/> : <><Icon name="trash" size={16}/> {label}</>}
      submitTitle={label}
      submitClassName={className}
      confirmMessage={confirmLabel}
    />
  );
}
