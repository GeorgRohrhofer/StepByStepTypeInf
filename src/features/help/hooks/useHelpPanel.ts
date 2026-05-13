// Controller layer for the `help` feature.
//
// Owns the help panel's open/closed state and the two side effects that
// dismiss it: an outside-pointer-down listener and an Escape-key listener.
//
// The view is responsible only for rendering the button + panel and
// attaching the ref to its outer wrapper; the rest of the orchestration
// lives here.

import { useCallback, useEffect, useRef, useState } from "react";

export type UseHelpPanelReturn = {
  /** Whether the help panel is currently open. */
  isOpen: boolean;
  /** Ref to attach to the wrapper element so outside-clicks are detected. */
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  /** Toggle open ↔ closed. Bound to the FAB button. */
  toggle: () => void;
  /** Force-close the panel. Bound to the in-panel "Close" button. */
  close: () => void;
};

export function useHelpPanel(): UseHelpPanelReturn {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Functional updater form keeps the callback identity stable.
  const toggle = useCallback(() => {
    setIsOpen((v) => !v);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Outside-pointer + Escape dismissal. Two separate effects would also be
  // valid (AGENTS.md "Split Combined Hook Computations"); here they share
  // the same `isOpen` guard and identical lifetimes, so combining them is
  // simpler and avoids two mount/cleanup cycles for the same condition.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onPointerDown(e: PointerEvent) {
      const node = wrapperRef.current;
      if (node && !node.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return { isOpen, wrapperRef, toggle, close };
}
