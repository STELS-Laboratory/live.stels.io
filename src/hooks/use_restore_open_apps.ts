/**
 * Hook to restore open apps on mount
 * Loads persisted open apps from localStorage and validates them
 */

import { useEffect, useState } from "react";
import { useOpenAppsStore } from "@/stores/modules/open_apps.ts";
import { getAllSchemas } from "@/apps/schemas/db.ts";

/**
 * Restore open apps from localStorage on mount
 * Validates that schemas still exist before restoring
 */
export function useRestoreOpenApps(): {
  isRestoring: boolean;
  restoredCount: number;
} {
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoredCount, setRestoredCount] = useState(0);
  const { apps } = useOpenAppsStore();

  useEffect(() => {
    const restore = async (): Promise<void> => {
      try {
        // Apps are already loaded from localStorage via zustand persist
        if (apps.length === 0) {
          setIsRestoring(false);
          return;
        }

        // Validate that schemas still exist
        const allSchemas = await getAllSchemas();
        const schemaIds = new Set(allSchemas.map((s) => s.id));

        // Filter out apps whose schemas no longer exist
        const validApps = apps.filter((app) => schemaIds.has(app.schemaId));
        const invalidCount = apps.length - validApps.length;

        if (invalidCount > 0) {
          console.log(
            `[RestoreOpenApps] Removed ${invalidCount} apps with missing schemas`,
          );

          // Remove invalid apps
          const invalidIds = apps
            .filter((app) => !schemaIds.has(app.schemaId))
            .map((app) => app.id);

          invalidIds.forEach((id) => {
            useOpenAppsStore.getState().closeApp(id);
          });
        }

        setRestoredCount(validApps.length);
        console.log(
          `[RestoreOpenApps] Restored ${validApps.length} apps from previous session`,
        );
      } catch (error) {
        console.error("[RestoreOpenApps] Failed to restore apps:", error);
      } finally {
        setIsRestoring(false);
      }
    };

    restore();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isRestoring, restoredCount };
}

