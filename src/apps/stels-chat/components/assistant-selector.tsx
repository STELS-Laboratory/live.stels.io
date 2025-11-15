/**
 * Assistant Selector Component
 * Select and manage AI assistants
 */

import React, { useEffect, useState } from "react";
import { RefreshCw, Plus, Trash2 } from "lucide-react";
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
}

/**
 * Assistant Selector Component
 */
export function AssistantSelector({
  tabId,
}: AssistantSelectorProps): React.ReactElement {
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
    <div className="flex items-center gap-2 p-2 border-b border-border bg-card/30">
      <Select
        value={selectedAssistant?.id || ""}
        onValueChange={handleSelect}
        disabled={isLoading || assistants.length === 0}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select assistant" />
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

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing || isLoading}
        title="Refresh assistants"
      >
        <RefreshCw
          className={cn("icon-md", isRefreshing && "animate-spin")}
        />
      </Button>

      <Dialog open={showCreator} onOpenChange={setShowCreator}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Create assistant">
            <Plus className="icon-md" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Assistant</DialogTitle>
            <DialogDescription>
              Create a custom AI assistant with your own configuration, system
              prompt, and model parameters.
            </DialogDescription>
          </DialogHeader>
          <AssistantCreator onClose={() => setShowCreator(false)} />
        </DialogContent>
      </Dialog>

      {selectedAssistant && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(selectedAssistant.id)}
          disabled={isLoading}
          title="Delete assistant"
        >
          <Trash2 className="icon-md text-destructive" />
        </Button>
      )}
    </div>
  );
}

