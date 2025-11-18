/**
 * Model Selector Component
 * Select and manage Stels models
 */

import React, { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useMobile } from "@/hooks/use_mobile";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStelsChatStore } from "../store";
import { useAuthStore } from "@/stores/modules/auth.store";
import { ModelCreator } from "./model-creator";
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
    deleteModel,
    isLoading,
    testConnection,
  } = useStelsChatStore();
  const { connectionSession } = useAuthStore();
  const isDeveloper = connectionSession?.developer || false;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  const tab = tabs.find((t) => t.id === tabId);
  const selectedModel = tab?.model || "";

  useEffect(() => {
    const init = async (): Promise<void> => {
      // Only test connection if we have a session
      if (connectionSession?.session) {
        console.log("[ModelSelector] Initializing with session:", {
          hasSession: !!connectionSession.session,
          apiUrl: connectionSession.api,
        });
        const connected = await testConnection();
        if (connected) {
          await fetchModels();
          // Also load registered models to show status (only for developers)
          if (isDeveloper) {
            const { listRegisteredModels } = useStelsChatStore.getState();
            await listRegisteredModels();
          }
        }
      } else {
        console.warn(
          "[ModelSelector] No connectionSession available, skipping initialization",
        );
      }
    };
    init();
  }, [
    fetchModels,
    testConnection,
    connectionSession?.session,
    connectionSession?.api,
    isDeveloper,
  ]);

  // Auto-select first model if tab has no model and models are available
  useEffect(() => {
    if (tab && !tab.model && models.length > 0) {
      const firstModel = models[0];
      if (firstModel) {
        console.log(
          "[ModelSelector] Auto-selecting first model:",
          firstModel.name,
        );
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

  const handleDelete = async (modelName: string): Promise<void> => {
    if (
      !confirm(
        `Are you sure you want to delete model "${modelName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteModel(modelName);
    } catch (error) {
      console.error("Failed to delete model:", error);
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

      {isDeveloper && (!isMobile || inSettings) && (
        <>
          <Dialog open={showCreator} onOpenChange={setShowCreator}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Create model"
                className={inSettings ? "h-8 w-8" : ""}
              >
                <Plus className={inSettings ? "icon-sm" : "icon-md"} />
              </Button>
            </DialogTrigger>
            <DialogContent
              className={`overflow-y-auto ${
                isMobile
                  ? "max-w-full max-h-[95vh] rounded-t-2xl"
                  : "max-w-2xl max-h-[90vh]"
              }`}
            >
              <DialogHeader>
                <DialogTitle className={isMobile ? "text-base" : ""}>
                  Create New Model
                </DialogTitle>
                <DialogDescription
                  className={isMobile ? "text-xs" : ""}
                >
                  Create a custom Stels model with your own configuration and
                  parameters.
                </DialogDescription>
              </DialogHeader>
              <ModelCreator onClose={() => setShowCreator(false)} />
            </DialogContent>
          </Dialog>

          {selectedModel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(selectedModel)}
              disabled={isLoading}
              title="Delete model"
              className={inSettings ? "h-8 w-8" : ""}
            >
              <Trash2
                className={`text-destructive ${
                  inSettings ? "icon-sm" : "icon-md"
                }`}
              />
            </Button>
          )}
        </>
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
