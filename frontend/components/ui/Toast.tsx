"use client";

/**
 * Themed toast utilities.
 *
 * Exposes a single toast instance plus the shared viewport that wires in our
 * theme-aware styling. Consumers should always import from this module so we
 * maintain a single source of truth for toast behaviour and appearance.
 */

import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from "lucide-react";

const baseStyle: React.CSSProperties = {
  background: "var(--toast-bg)",
  color: "var(--toast-foreground)",
  border: "1px solid var(--toast-border)",
  boxShadow: "var(--toast-shadow)",
  borderRadius: "calc(var(--radius) + 2px)",
  padding: "0.75rem 1rem",
  gap: "0.75rem",
  backdropFilter: "blur(18px) saturate(130%)",
  WebkitBackdropFilter: "blur(18px) saturate(130%)",
  maxWidth: "min(calc(100vw - 2rem), 420px)",
  fontSize: "0.95rem",
  fontWeight: 500,
};

const iconWrapper = (icon: React.ReactNode) => (
  <span className="themed-toast__icon" aria-hidden>
    {icon}
  </span>
);

export function ToastViewport() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      toastOptions={{
        duration: 2600,
        className: "themed-toast",
        style: baseStyle,
        success: {
          className: "themed-toast themed-toast--success",
          icon: iconWrapper(<CheckCircle2 className="h-4 w-4" />),
        },
        error: {
          className: "themed-toast themed-toast--error",
          icon: iconWrapper(<AlertOctagon className="h-4 w-4" />),
        },
        warning: {
          className: "themed-toast themed-toast--warning",
          icon: iconWrapper(<AlertTriangle className="h-4 w-4" />),
        },
        info: {
          className: "themed-toast themed-toast--info",
          icon: iconWrapper(<Info className="h-4 w-4" />),
        },
        loading: {
          className: "themed-toast themed-toast--loading",
        },
      }}
    />
  );
}

export { toast };
export type { Toast } from "react-hot-toast";
