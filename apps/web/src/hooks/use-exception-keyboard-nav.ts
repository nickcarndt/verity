"use client";

import { useCallback, useEffect, useRef } from "react";

import type { ExceptionFlag } from "@/lib/agent";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

interface UseExceptionKeyboardNavOptions {
  rows: ExceptionFlag[];
  focusedId: string | null;
  drawerOpen: boolean;
  enabled: boolean;
  onFocusChange: (exception: ExceptionFlag) => void;
  onOpen: (exception: ExceptionFlag) => void;
  onCloseDrawer: () => void;
  scrollToRow: (id: string) => void;
}

/** ↑↓ focus rows, Enter opens drawer, Esc closes — power-user table workflow. */
export function useExceptionKeyboardNav({
  rows,
  focusedId,
  drawerOpen,
  enabled,
  onFocusChange,
  onOpen,
  onCloseDrawer,
  scrollToRow,
}: UseExceptionKeyboardNavOptions) {
  const rowsRef = useRef(rows);
  const focusedIdRef = useRef(focusedId);
  const drawerOpenRef = useRef(drawerOpen);

  rowsRef.current = rows;
  focusedIdRef.current = focusedId;
  drawerOpenRef.current = drawerOpen;

  const moveFocus = useCallback(
    (delta: number) => {
      const currentRows = rowsRef.current;
      if (currentRows.length === 0) return;

      const currentIndex = currentRows.findIndex((row) => row.id === focusedIdRef.current);
      const startIndex = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = Math.max(0, Math.min(startIndex + delta, currentRows.length - 1));
      const next = currentRows[nextIndex];

      onFocusChange(next);
      scrollToRow(next.id);
    },
    [onFocusChange, scrollToRow],
  );

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      const currentRows = rowsRef.current;
      if (currentRows.length === 0) return;

      if (event.key === "Escape" && drawerOpenRef.current) {
        event.preventDefault();
        onCloseDrawer();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveFocus(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(-1);
        return;
      }

      if (event.key === "Enter") {
        const focused =
          currentRows.find((row) => row.id === focusedIdRef.current) ?? currentRows[0];
        if (!focused) return;
        event.preventDefault();
        onOpen(focused);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, moveFocus, onCloseDrawer, onOpen]);
}
