/**
 * Assistant Selector Component
 * Select and manage AI assistants
 */

import React, { useEffect, useState } from "react";
import { RefreshCw, Plus, Trash2 } from "lucide-react";
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
import { AssistantCreator } from "./assistant-creator";

interface AssistantSelectorProps {
  tabId: string;
  inSettings?: boolean;
}

/**
 * Assistant Selector Component
 */
export function AssistantSelector({
  tabId,
  inSettings = false,
}: AssistantSelectorProps): React.ReactElement {
  const isMobile = useMobile();
  const {
    assistants,
    tabs,
    fetchAssistants,
    selectAssistant,
    deleteAssistant,
    isLoading,
    testConnection,
  } = useStelsChatStore();
  const { connectionSession } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  const tab = tabs.find((t) => t.id === tabId);
  const selectedAssistant = tab?.assistantId
    ? assistants.find((a) => a.id === tab.assistantId)
    : null;

  useEffect(() => {
    const init = async (): Promise<void> => {
      // Only fetch assistants if we have a session
      if (connectionSession?.session) {
        console.log("[AssistantSelector] Initializing with session:", {
          hasSession: !!connectionSession.session,
          apiUrl: connectionSession.api,
        });
        const connected = await testConnection();
        if (connected) {
          await fetchAssistants();
        }
      } else {
        console.warn(
          "[AssistantSelector] No connectionSession available, skipping initialization",
        );
      }
    };
    init();
  }, [fetchAssistants, testConnection, connectionSession?.session, connectionSession?.api]);

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await fetchAssistants();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (assistantId: string): Promise<void> => {
    if (
      !confirm(
        `Are you sure you want to delete this assistant? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteAssistant(assistantId);
    } catch (error) {
      console.error("Failed to delete assistant:", error);
    }
  };

  const handleSelect = (assistantId: string): void => {
    selectAssistant(tabId, assistantId);
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
        value={selectedAssistant?.id || ""}
        onValueChange={handleSelect}
        disabled={isLoading || assistants.length === 0}
      >
        <SelectTrigger
          className={
            inSettings
              ? "w-full"
              : isMobile
              ? "w-[100px] h-6 text-[10px] px-1.5"
              : "w-[250px]"
          }
        >
          <SelectValue placeholder={isMobile ? "Assistant" : "Select assistant"} />
        </SelectTrigger>
        <SelectContent>
          {assistants.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No assistants available
            </div>
          ) : (
            assistants.map((assistant) => (
              <SelectItem key={assistant.id} value={assistant.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span>{assistant.name}</span>
                    {assistant.description && (
                      <span className="text-xs text-muted-foreground">
                        {assistant.description}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {assistant.model}
                  </Badge>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {(!isMobile || inSettings) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          title="Refresh assistants"
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

      {(!isMobile || inSettings) && (
        <Dialog open={showCreator} onOpenChange={setShowCreator}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              title="Create assistant"
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
              Create New Assistant
            </DialogTitle>
            <DialogDescription className={isMobile ? "text-xs" : ""}>
              Create a custom AI assistant with your own configuration, system
              prompt, and model parameters.
            </DialogDescription>
          </DialogHeader>
          <AssistantCreator onClose={() => setShowCreator(false)} />
        </DialogContent>
      </Dialog>
      )}

      {selectedAssistant && (!isMobile || inSettings) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(selectedAssistant.id)}
          disabled={isLoading}
          title="Delete assistant"
          className={inSettings ? "h-8 w-8" : ""}
        >
          <Trash2
            className={`text-destructive ${
              inSettings ? "icon-sm" : "icon-md"
            }`}
          />
        </Button>
      )}
    </div>
  );
}

