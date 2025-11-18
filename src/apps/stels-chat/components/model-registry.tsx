/**
 * Model Registry Component
 * Manage registered models for automatic loading in production
 */

import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useStelsChatStore } from "../store";
import { useAuthStore } from "@/stores/modules/auth.store";
import type { ModelStatus, RegisterModelRequest } from "../types";

/**
 * Get status badge configuration
 */
function getStatusConfig(status: ModelStatus): {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
} {
  switch (status) {
    case "ready":
      return {
        label: "Ready",
        icon: CheckCircle2,
        variant: "default",
        className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      };
    case "downloading":
      return {
        label: "Downloading...",
        icon: Loader2,
        variant: "secondary",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "pending":
      return {
        label: "Pending",
        icon: Clock,
        variant: "outline",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    case "error":
      return {
        label: "Error",
        icon: XCircle,
        variant: "destructive",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      };
  }
}

/**
 * Model Registry Component
 */
export function ModelRegistry(): React.ReactElement {
  const {
    registeredModels,
    listRegisteredModels,
    registerModel,
    unregisterModel,
    stelsPullModel,
    stelsListModels,
    isLoading,
    error,
  } = useStelsChatStore();
  const { connectionSession } = useAuthStore();
  const isDeveloper = connectionSession?.developer || false;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [registerConfig, setRegisterConfig] = useState<RegisterModelRequest>({
    name: "",
    metadata: {
      description: "",
      tags: [],
    },
  });
  const [tagsInput, setTagsInput] = useState("");
  const [showPullDialog, setShowPullDialog] = useState(false);
  const [pullModelName, setPullModelName] = useState("");
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    const init = async (): Promise<void> => {
      // Only load registered models for developers
      if (connectionSession?.session && isDeveloper) {
        await listRegisteredModels();
      }
    };
    init();
  }, [listRegisteredModels, connectionSession?.session, isDeveloper]);

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await listRegisteredModels();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadAvailableModels = async (): Promise<void> => {
    setIsLoadingAvailable(true);
    try {
      const models = await stelsListModels();
      setAvailableModels(models.map((m) => m.name));
    } catch (error) {
      console.error("Failed to load available models:", error);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const handleRegister = async (): Promise<void> => {
    if (!registerConfig.name.trim()) {
      alert("Model name is required");
      return;
    }

    try {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await registerModel({
        ...registerConfig,
        metadata: {
          ...registerConfig.metadata,
          tags: tags.length > 0 ? tags : undefined,
        },
      });
      setShowRegisterDialog(false);
      setRegisterConfig({
        name: "",
        metadata: { description: "", tags: [] },
      });
      setTagsInput("");
    } catch (error) {
      console.error("Failed to register model:", error);
    }
  };

  const handleUnregister = async (modelName: string): Promise<void> => {
    if (
      !confirm(
        `Are you sure you want to unregister "${modelName}"? The model will no longer be automatically loaded in production.`,
      )
    ) {
      return;
    }

    try {
      await unregisterModel(modelName);
    } catch (error) {
      console.error("Failed to unregister model:", error);
    }
  };

  const handlePullAndRegister = async (modelName: string): Promise<void> => {
    try {
      await stelsPullModel(modelName);
      // Model will be auto-registered if user is developer/owner
      await listRegisteredModels();
      // Also refresh available models list
      await handleLoadAvailableModels();
    } catch (error) {
      console.error("Failed to pull model:", error);
      throw error;
    }
  };

  const handlePullModel = async (): Promise<void> => {
    if (!pullModelName.trim()) {
      alert("Model name is required");
      return;
    }

    setIsPulling(true);
    try {
      await handlePullAndRegister(pullModelName.trim());
      setShowPullDialog(false);
      setPullModelName("");
    } catch {
      // Error already logged in handlePullAndRegister
    } finally {
      setIsPulling(false);
    }
  };

  // Show message for non-developers
  if (!isDeveloper) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="icon-sm" />
          <AlertDescription>
            Model Registry is only available for developers. You can create and manage assistants instead.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Model Registry</h2>
          <p className="text-sm text-muted-foreground">
            Manage models for automatic loading in production. Use "Pull Model" to
            download your first model from Ollama registry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={cn("icon-sm mr-2", isRefreshing && "animate-spin")}
            />
            Refresh
          </Button>
          <Dialog open={showPullDialog} onOpenChange={setShowPullDialog}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Download className="icon-sm mr-2" />
                Pull Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pull Model from Ollama</DialogTitle>
                <DialogDescription>
                  Download a model from Ollama registry. This is the primary method
                  to load models when you don't have any. If you're a
                  developer/owner, the model will be automatically registered after
                  successful download.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pullModelName">Model Name *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pullModelName"
                      value={pullModelName}
                      onChange={(e) => setPullModelName(e.target.value)}
                      placeholder="llama2"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLoadAvailableModels}
                      disabled={isLoadingAvailable}
                    >
                      {isLoadingAvailable ? (
                        <Loader2 className="icon-sm animate-spin" />
                      ) : (
                        <Download className="icon-sm" />
                      )}
                    </Button>
                  </div>
                  {availableModels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {availableModels.map((name) => (
                        <Badge
                          key={name}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => setPullModelName(name)}
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Popular models: llama2, mistral, codellama, phi
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPullDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePullModel}
                    disabled={isPulling || isLoading || !pullModelName.trim()}
                  >
                    {isPulling ? (
                      <>
                        <Loader2 className="icon-sm mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="icon-sm mr-2" />
                        Pull Model
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="icon-sm mr-2" />
                Register Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register Model</DialogTitle>
                <DialogDescription>
                  Register a model in the registry for automatic loading in
                  production. The model must be available in Ollama.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="modelName">Model Name *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="modelName"
                      value={registerConfig.name}
                      onChange={(e) =>
                        setRegisterConfig({
                          ...registerConfig,
                          name: e.target.value,
                        })
                      }
                      placeholder="llama2"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLoadAvailableModels}
                      disabled={isLoadingAvailable}
                    >
                      {isLoadingAvailable ? (
                        <Loader2 className="icon-sm animate-spin" />
                      ) : (
                        <Download className="icon-sm" />
                      )}
                    </Button>
                  </div>
                  {availableModels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {availableModels.map((name) => (
                        <Badge
                          key={name}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() =>
                            setRegisterConfig({
                              ...registerConfig,
                              name,
                            })
                          }
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={registerConfig.metadata?.description || ""}
                    onChange={(e) =>
                      setRegisterConfig({
                        ...registerConfig,
                        metadata: {
                          ...registerConfig.metadata,
                          description: e.target.value,
                        },
                      })
                    }
                    placeholder="Model description..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="chat, general, llama"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegisterDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleRegister}
                    disabled={isLoading}
                  >
                    {isLoading ? "Registering..." : "Register"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="icon-sm" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {registeredModels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Download className="icon-2xl text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No models registered yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Start by pulling a model from Ollama registry. This will download the
              model and automatically register it if you're a developer/owner.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowPullDialog(true)}>
                <Download className="icon-sm mr-2" />
                Pull First Model
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRegisterDialog(true)}
              >
                <Plus className="icon-sm mr-2" />
                Register Existing Model
              </Button>
            </div>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-md">
              <p className="text-xs font-semibold mb-2">Popular models to start:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["llama2", "mistral", "codellama", "phi"].map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      setPullModelName(name);
                      setShowPullDialog(true);
                    }}
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {registeredModels.map((model) => {
            const statusConfig = getStatusConfig(model.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={model.name}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{model.name}</CardTitle>
                      {model.metadata?.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {model.metadata.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleUnregister(model.name)}
                      disabled={isLoading}
                      title="Unregister model"
                    >
                      <Trash2 className="icon-xs text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      className={cn(
                        "icon-sm",
                        model.status === "downloading" && "animate-spin",
                      )}
                    />
                    <Badge
                      variant={statusConfig.variant}
                      className={cn("text-xs", statusConfig.className)}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {model.status === "error" && model.error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        {model.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {model.metadata?.tags && model.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {model.metadata.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Registered:{" "}
                      {new Date(model.registeredAt).toLocaleDateString()}
                    </div>
                    {model.lastChecked && (
                      <div>
                        Last checked:{" "}
                        {new Date(model.lastChecked).toLocaleDateString()}
                      </div>
                    )}
                    <div>By: {model.registeredBy.substring(0, 8)}...</div>
                  </div>

                  {model.status !== "ready" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handlePullAndRegister(model.name)}
                      disabled={isLoading}
                    >
                      <Download className="icon-sm mr-2" />
                      Pull & Register
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

