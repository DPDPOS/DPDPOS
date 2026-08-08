"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Minimal focus management for modals (plan §4.2): move focus into the panel
 * on open, trap Tab inside it, close on Escape, and restore focus to the
 * trigger on close. Shared by Dialog and Drawer so both honour aria-modal.
 */
export function useFocusTrap(
  active: boolean,
  panelRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
) {
  // Keep the latest onClose in a ref so the trap binds once per open/close
  // instead of re-binding whenever the parent recreates the callback.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusableElements = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Move focus into the dialog when it opens.
    panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      // Stacked modals (e.g. a drawer opened from a drawer): only the topmost
      // open dialog traps Tab. Closed Drawers stay mounted (aria-hidden), so
      // filter those out before picking the top one.
      const openModals = Array.from(
        document.querySelectorAll('[role="dialog"]'),
      ).filter((modal) => !modal.closest('[aria-hidden="true"]'));
      const topModal = openModals[openModals.length - 1];
      if (topModal && topModal !== panel) return;

      const items = focusableElements();
      if (items.length === 0) return;
      const active = document.activeElement;
      const first = items[0];
      const last = items[items.length - 1];
      if (!panel?.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onCloseRef is stable.
  }, [active]);
}
