"use client";

import { useSyncExternalStore } from "react";

/**
 * True once the component is rendering on the client. Uses the canonical
 * useSyncExternalStore pattern so the server render, the hydration render,
 * and the post-hydration render never mismatch — no effects involved.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {}, // subscribe — nothing changes; getSnapshot is read once
    () => true,
    () => false,
  );
}
