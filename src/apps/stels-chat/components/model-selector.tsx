/**
 * Model Selector Component
 * Select and manage Stels models
 */

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useMobile } from "@/hooks/use_mobile";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStelsChatStore } from "../store";
import { useAuthStore } from "@/stores/modules/auth.store";
import { CheckCircle2 } from "lucide-react";

interface ModelSelectorProps {
  tabId: string;
  inSettings?: boolean;
}

/**
 * Model Selector Component
 */
export function ModelSelector({
  tabId,
  inSettings = false,
}: ModelSelectorProps): React.ReactElement {
  const isMobile = useMobile();
  const {
    models,
    registeredModels,
    tabs,
    fetchModels,
    selectModel,
    isLoading,
    testConnection,
  } = useStelsChatStore();
  const { connectionSession } = useAuthStore();
  const isDeveloper = connectionSession?.developer || false;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tab = tabs.find((t) => t.id === tabId);
  const selectedModel = tab?.model || "";

  useEffect(() => {
    const init = async (): Promise<void> => {
      // Only test connection if we have a session and models are not loaded
      if (connectionSession?.session && models.length === 0) {

        const connected = await testConnection();
        // testConnection will automatically fetch models if connected
        // Also load registered models to show status (only for developers)
        if (connected && isDeveloper) {
          const { listRegisteredModels } = useStelsChatStore.getState();
          await listRegisteredModels();
        }
      } else if (!connectionSession?.session) {
        // No session available
      }
    };
    init();
  }, [
    testConnection,
    connectionSession?.session,
    connectionSession?.api,
    isDeveloper,
    models.length,
  ]);

  // Auto-select first model if tab has no model and models are available
  useEffect(() => {
    if (tab && !tab.model && models.length > 0) {
      const firstModel = models[0];
      if (firstModel) {

        selectModel(tabId, firstModel.name);
      }
    }
  }, [tab, models, tabId, selectModel]);

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await fetchModels();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      className={`flex items-center ${
        inSettings
          ? "gap-2 p-0"
          : `border-b border-border bg-card/30 ${
              isMobile ? "gap-0.5 p-1 h-7" : "gap-2 p-2"
            }`
      }`}
    >
      <Select
        value={selectedModel}
        onValueChange={(value) => selectModel(tabId, value)}
        disabled={isLoading || models.length === 0}
      >
        <SelectTrigger
          className={
            inSettings
              ? "w-full"
              : isMobile
              ? "w-[100px] h-6 text-[10px] px-1.5"
              : "w-[200px]"
          }
        >
          <SelectValue placeholder={isMobile ? "Model" : "Select model"} />
        </SelectTrigger>
        <SelectContent>
          {models.length === 0
            ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No models available
              </div>
            )
            : (
              models.map((model) => {
                const isRegistered = registeredModels.some(
                  (rm) => rm.name === model.name,
                );
                const registeredModel = registeredModels.find(
                  (rm) => rm.name === model.name,
                );

                return (
                  <SelectItem key={model.name} value={model.name}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="truncate">{model.name}</span>
                        {isRegistered && (
                          <CheckCircle2
                            className={cn(
                              "icon-xs shrink-0",
                              registeredModel?.status === "ready"
                                ? "text-green-600 dark:text-green-400"
                                : "text-amber-600 dark:text-amber-400",
                            )}
                            title={`Registered (${registeredModel?.status})`}
                          />
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs shrink-0">
                        {formatSize(model.size)}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })
            )}
        </SelectContent>
      </Select>

      {(!isMobile || inSettings) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          title="Refresh models"
          className={inSettings ? "h-8 w-8" : ""}
        >
          <RefreshCw
            className={cn(
              inSettings ? "icon-sm" : "icon-md",
              isRefreshing && "animate-spin",
            )}
          />
        </Button>
      )}
    </div>
  );
}

/**
 * Format bytes to human readable size
 */
function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
