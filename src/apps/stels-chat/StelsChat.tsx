/**
 * Stels Chat Application
 * Professional chat interface for Stels API AI models
 */

import React, { useEffect } from "react";
import { useStelsChatStore } from "./store";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useMobile } from "@/hooks/use_mobile";
import { TabBar } from "./components/tab-bar";
import { ChatTab } from "./components/chat-tab";
import { ChatInput } from "./components/chat-input";
import { ModelSelector } from "./components/model-selector";
import { AssistantSelector } from "./components/assistant-selector";
import { ModelRegistry } from "./components/model-registry";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Stels Chat Application Component
 */
function StelsChat(): React.ReactElement {
  const isMobile = useMobile();
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
  const isDeveloper = connectionSession?.developer || false;

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
    // Skip if already connected and models are loaded
    const state = useStelsChatStore.getState();
    if (connectionSession?.session && (!state.isConnected || state.models.length === 0)) {
      testConnection();
    } else if (!connectionSession?.session) {

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
      <div
        className={`flex items-center justify-between border-b border-border bg-card/30 ${
          isMobile ? "p-1" : "p-2"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <h1
            className={`ml-2 font-semibold truncate ${
              isMobile ? "text-xs" : "text-lg"
            }`}
          >
            {isMobile ? "Chat" : "Stels Chat"}
          </h1>
          {!isConnected && (
            <AlertCircle
              className={`text-destructive ${isMobile ? "w-3 h-3" : "icon-sm"}`}
            />
          )}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size={isMobile ? "icon" : "icon"}
              title="Settings"
              className={isMobile ? "h-7 w-7" : ""}
            >
              <Settings className={isMobile ? "w-3.5 h-3.5" : "icon-md"} />
            </Button>
          </DialogTrigger>
          <DialogContent
            className={`overflow-y-auto ${
              isMobile
                ? "max-w-full max-h-[95vh] rounded-t-2xl"
                : "max-w-4xl max-h-[90vh]"
            }`}
          >
            <DialogHeader>
              <DialogTitle className={isMobile ? "text-base" : ""}>
                Settings
              </DialogTitle>
              <DialogDescription
                className={isMobile ? "text-xs" : ""}
              >
                Configure API settings and manage model registry
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue={isMobile ? "chat" : "api"} className="w-full">
              <TabsList
                className={isDeveloper
                  ? `grid w-full ${
                    isMobile ? "grid-cols-3 h-9" : "grid-cols-3"
                  }`
                  : isMobile
                  ? "grid-cols-2 w-full h-9"
                  : "grid-cols-2 w-full"}
              >
                {isMobile && (
                  <TabsTrigger
                    value="chat"
                    className={isMobile ? "text-xs" : ""}
                  >
                    Chat
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="api"
                  className={isMobile ? "text-xs" : ""}
                >
                  API Settings
                </TabsTrigger>
                {isDeveloper && (
                  <TabsTrigger
                    value="registry"
                    className={isMobile ? "text-xs" : ""}
                  >
                    Model Registry
                  </TabsTrigger>
                )}
              </TabsList>
              {/* Chat Settings Tab - Mobile only */}
              {isMobile && activeTab && (
                <TabsContent
                  value="chat"
                  className={isMobile ? "space-y-3 mt-3" : "space-y-4 mt-4"}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className={isMobile ? "text-xs" : "text-sm"}>
                        Model
                      </Label>
                      <ModelSelector tabId={activeTab.id} inSettings={true} />
                    </div>
                    <div className="space-y-2">
                      <Label className={isMobile ? "text-xs" : "text-sm"}>
                        Assistant
                      </Label>
                      <AssistantSelector
                        tabId={activeTab.id}
                        inSettings={true}
                      />
                    </div>
                  </div>
                </TabsContent>
              )}

              <TabsContent
                value="api"
                className={isMobile ? "space-y-3 mt-3" : "space-y-4 mt-4"}
              >
                <div>
                  <Label
                    htmlFor="apiUrl"
                    className={isMobile ? "text-xs" : ""}
                  >
                    Stels API URL
                  </Label>
                  <Input
                    id="apiUrl"
                    value={stelsApiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://beta.stels.dev"
                    className={isMobile ? "h-9 text-sm" : ""}
                  />
                  <p
                    className={`text-muted-foreground mt-1 ${
                      isMobile ? "text-[10px]" : "text-xs"
                    }`}
                  >
                    {connectionSession?.api
                      ? `Using: ${connectionSession.api}`
                      : "Default: https://beta.stels.dev"}
                  </p>
                </div>
                <Button
                  onClick={handleTestConnection}
                  className={`w-full ${isMobile ? "h-9 text-sm" : ""}`}
                >
                  Test Connection
                </Button>
                {isConnected && (
                  <Alert className={isMobile ? "text-xs py-2" : ""}>
                    <AlertCircle
                      className={isMobile ? "icon-xs" : "icon-sm"}
                    />
                    <AlertDescription
                      className={isMobile ? "text-xs" : ""}
                    >
                      Connected successfully
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              {isDeveloper && (
                <TabsContent
                  value="registry"
                  className={isMobile ? "mt-3" : "mt-4"}
                >
                  <ModelRegistry />
                </TabsContent>
              )}
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error alert */}
      {error && (
        <Alert
          variant="destructive"
          className={isMobile ? "m-1 py-1.5 text-[10px]" : "m-2"}
        >
          <AlertCircle className={isMobile ? "w-3 h-3" : "icon-sm"} />
          <AlertDescription className={isMobile ? "text-[10px]" : ""}>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Tab bar */}
      <TabBar />

      {/* Assistant selector - hidden on mobile, moved to settings */}
      {activeTab && !isMobile && <AssistantSelector tabId={activeTab.id} />}

      {/* Model selector - hidden on mobile, moved to settings */}
      {activeTab && !isMobile && <ModelSelector tabId={activeTab.id} />}

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
