/**
 * Stels Chat Application
 * Professional chat interface for Stels API AI models
 */

import React, { useEffect } from "react";
import { useStelsChatStore } from "./store";
import { useAuthStore } from "@/stores/modules/auth.store";
import { TabBar } from "./components/tab-bar";
import { ChatTab } from "./components/chat-tab";
import { ChatInput } from "./components/chat-input";
import { ModelSelector } from "./components/model-selector";
import { AssistantSelector } from "./components/assistant-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Stels Chat Application Component
 */
function StelsChat(): React.ReactElement {
  const {
    tabs,
    activeTabId,
    createTab,
    stelsApiUrl,
    setApiUrl,
    testConnection,
    isConnected,
    error,
    setError,
  } = useStelsChatStore();

  const { connectionSession } = useAuthStore();

  useEffect(() => {
    // Create initial tab if none exist
    if (tabs.length === 0) {
      createTab("New Chat");
    }
  }, [tabs.length, createTab]);

  // Update API URL when connectionSession changes
  useEffect(() => {
    if (connectionSession?.api && connectionSession.api !== stelsApiUrl) {
      setApiUrl(connectionSession.api);
    }
  }, [connectionSession?.api, stelsApiUrl, setApiUrl]);

  useEffect(() => {
    // Test connection on mount and when API URL or connectionSession changes
    // Only test if we have a connectionSession (for authenticated requests)
    if (connectionSession?.session) {
      testConnection();
    } else {
      console.warn(
        "[StelsChat] No connectionSession available, skipping connection test",
      );
      // Set as disconnected if no session
      useStelsChatStore.getState().setError(
        "No active session. Please connect to the network first.",
      );
    }
  }, [testConnection, stelsApiUrl, connectionSession?.session]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  const handleTestConnection = async (): Promise<void> => {
    const connected = await testConnection();
    if (!connected) {
      setError(
        "Cannot connect to Stels API. Make sure the API is running and the API URL is correct.",
      );
    } else {
      setError(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with API settings */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-card/30">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Stels Chat</h1>
          {!isConnected && <AlertCircle className="icon-sm text-destructive" />}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="icon-md" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Settings</DialogTitle>
              <DialogDescription>
                Stels API endpoint URL is automatically loaded from your
                connection configuration. You can override it here if needed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiUrl">Stels API URL</Label>
                <Input
                  id="apiUrl"
                  value={stelsApiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://live.stels.dev"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {connectionSession?.api
                    ? `Using: ${connectionSession.api}`
                    : "Default: https://live.stels.dev"}
                </p>
              </div>
              <Button onClick={handleTestConnection} className="w-full">
                Test Connection
              </Button>
              {isConnected && (
                <Alert>
                  <AlertCircle className="icon-sm" />
                  <AlertDescription>Connected successfully</AlertDescription>
                </Alert>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive" className="m-2">
          <AlertCircle className="icon-sm" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tab bar */}
      <TabBar />

      {/* Assistant selector */}
      {activeTab && <AssistantSelector tabId={activeTab.id} />}

      {/* Model selector */}
      {activeTab && <ModelSelector tabId={activeTab.id} />}

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab
          ? (
            <>
              <ChatTab
                tab={activeTab}
                isActive={activeTab.id === activeTabId}
                onClose={(tabId) => {
                  const { closeTab } = useStelsChatStore.getState();
                  closeTab(tabId);
                }}
                onSelect={(tabId) => {
                  const { setActiveTab } = useStelsChatStore.getState();
                  setActiveTab(tabId);
                }}
              />
              <div className="shrink-0">
                <ChatInput tabId={activeTab.id} />
              </div>
            </>
          )
          : (
            <div className="flex items-center justify-center flex-1">
              <p className="text-muted-foreground">No active chat</p>
            </div>
          )}
      </div>
    </div>
  );
}

export default StelsChat;
