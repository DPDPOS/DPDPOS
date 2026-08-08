"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * UI chrome store (plan §2 — "client state: session + UI chrome only").
 * Sidebar collapse is a desktop preference, persisted; the mobile nav drawer
 * is ephemeral per-session.
 */
interface UiState {
  /** Desktop sidebar collapsed to icons (224 → 64px). */
  sidebarCollapsed: boolean;
  /** Mobile off-canvas nav drawer. */
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
    }),
    {
      name: "dpdpos.ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
