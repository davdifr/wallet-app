"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
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

const DRAG_CLOSE_THRESHOLD = 120;
const BACKDROP_OPACITY = 0.55;
const BACKDROP_MIN_OPACITY = 0.18;

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const dragStartYRef = useRef(0);

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

  useEffect(() => {
    if (open) {
      return;
    }

    activePointerIdRef.current = null;
    dragOffsetRef.current = 0;
    dragStartYRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  }, [open]);

  function resetDrag() {
    activePointerIdRef.current = null;
    dragOffsetRef.current = 0;
    dragStartYRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  }

  function handleDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    dragStartYRef.current = event.clientY;
    dragOffsetRef.current = 0;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  }

  function handleDragEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const shouldClose = dragOffsetRef.current >= DRAG_CLOSE_THRESHOLD;
    resetDrag();

    if (shouldClose) {
      onOpenChange(false);
    }
  }

  if (!mounted || !open) {
    return null;
  }

  const dragProgress = Math.min(dragOffset / DRAG_CLOSE_THRESHOLD, 1);
  const backdropOpacity = BACKDROP_OPACITY - (BACKDROP_OPACITY - BACKDROP_MIN_OPACITY) * dragProgress;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-end justify-center p-0 transition-[background-color] duration-200 ease-out sm:items-center sm:p-6",
        isDragging ? "transition-none" : null
      )}
      style={{
        backgroundColor: `rgb(0 0 0 / ${Math.max(BACKDROP_MIN_OPACITY, backdropOpacity)})`
      }}
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
          "safe-mobile-sheet w-full max-w-2xl border border-white/6 bg-popover px-5 pt-5 shadow-float",
          "flex flex-col overflow-hidden rounded-t-[2rem] transition-transform duration-200 ease-out will-change-transform sm:rounded-[2rem] sm:p-6",
          isDragging ? "transition-none" : null,
          className
        )}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        <div
          aria-hidden="true"
          className="modal-drag-handle mx-auto mb-4 flex w-full cursor-grab touch-none select-none justify-center py-1 active:cursor-grabbing sm:hidden"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-white/10" />
        </div>
        <div className="ios-scroll modal-sheet min-h-0 flex-1 overflow-y-auto pb-[calc(var(--safe-area-bottom)+1.25rem)] sm:pb-0">
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
              className="sr-only h-11 w-11 items-center justify-center rounded-[1rem] bg-secondary text-muted-foreground transition hover:text-foreground sm:not-sr-only sm:flex"
              aria-label="Chiudi modale"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
