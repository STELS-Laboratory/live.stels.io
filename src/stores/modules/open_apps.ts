/**
 * Open Apps Store
 * Manages opened applications with tabs and persistence
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { SchemaProject } from "@/apps/schemas/types.ts";

export interface OpenApp {
  id: string; // Unique instance ID
  schemaId: string; // Schema project ID
  widgetKey: string; // Widget key
  name: string;
  displayName?: string; // Optional display name (for tokens)
  type: "static" | "dynamic";
  openedAt: number;
  lastActiveAt: number;
  channelKey?: string; // For virtual schemas (tokens)
  state?: {
    scrollPosition?: number;
    selectedTab?: string;
    [key: string]: unknown;
  };
}

interface OpenAppsState {
  // State
  apps: OpenApp[];
  activeAppId: string | null;

  // Actions
  openApp: (schema: SchemaProject) => string;
  closeApp: (id: string) => void;
  setActiveApp: (id: string) => void;
  updateAppState: (id: string, state: OpenApp["state"]) => void;
  closeAllApps: () => void;
  getApp: (id: string) => OpenApp | undefined;
}

export const useOpenAppsStore = create<OpenAppsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        apps: [],
        activeAppId: null,

        // Open new app or switch to existing
        openApp: (schema: SchemaProject): string => {
          // For virtual schemas (tokens), check by channelKey instead of schemaId
          const isVirtualSchema = schema.id.startsWith("virtual-");
          const channelKey = isVirtualSchema && schema.channelKeys?.[0] 
            ? schema.channelKeys[0] 
            : null;

          // Find existing app by schemaId or channelKey
          const existing = get().apps.find((app) => {
            if (channelKey && app.channelKey) {
              // For virtual schemas, match by channelKey
              return app.channelKey === channelKey;
            }
            // For regular schemas, match by schemaId
            return app.schemaId === schema.id;
          });

          if (existing) {
            // Already open - just switch to it

            set({ activeAppId: existing.id });
            return existing.id;
          }

          // Create new app instance
          const newApp: OpenApp = {
            id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            schemaId: schema.id,
            widgetKey: schema.widgetKey,
            name: schema.name,
            displayName: schema.displayName, // Use displayName if provided
            type: schema.type,
            openedAt: Date.now(),
            lastActiveAt: Date.now(),
            channelKey: channelKey || undefined,
          };

          set((state) => ({
            apps: [...state.apps, newApp],
            activeAppId: newApp.id,
          }));

          return newApp.id;
        },

        // Close app
        closeApp: (id: string): void => {
          set((state) => {
            const newApps = state.apps.filter((app) => app.id !== id);
            let newActiveId = state.activeAppId;

            // If closing active app, switch to another
            if (state.activeAppId === id) {
              if (newApps.length > 0) {
                // Switch to most recently active app
                const sorted = [...newApps].sort(
                  (a, b) => b.lastActiveAt - a.lastActiveAt,
                );
                newActiveId = sorted[0]?.id || null;
              } else {
                newActiveId = null;
              }
            }

            return {
              apps: newApps,
              activeAppId: newActiveId,
            };
          });
        },

        // Switch to app
        setActiveApp: (id: string): void => {
          set((state) => ({
            activeAppId: id,
            apps: state.apps.map((app) =>
              app.id === id ? { ...app, lastActiveAt: Date.now() } : app
            ),
          }));
        },

        // Update app state
        updateAppState: (id: string, state: OpenApp["state"]): void => {
          set((prevState) => ({
            apps: prevState.apps.map((app) =>
              app.id === id ? { ...app, state: { ...app.state, ...state } } : app
            ),
          }));
        },

        // Close all apps
        closeAllApps: (): void => {
          set({ apps: [], activeAppId: null });
        },

        // Get app by id
        getApp: (id: string): OpenApp | undefined => {
          return get().apps.find((app) => app.id === id);
        },
      }),
      {
        name: "open-apps-storage",
        version: 1,
      },
    ),
    { name: "OpenAppsStore" },
  ),
);

export type { OpenAppsState };
