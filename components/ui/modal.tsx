"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onOpenChange, open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "safe-mobile-sheet ios-scroll w-full max-w-2xl border border-white/6 bg-popover p-5 shadow-float",
          "overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] sm:p-6",
          className
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/10 sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 id="modal-title" className="font-display text-[1.55rem] font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-secondary text-muted-foreground transition hover:text-foreground"
            aria-label="Chiudi modale"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
