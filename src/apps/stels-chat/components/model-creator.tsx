/**
 * Model Creator Component
 * Create and configure custom Stels models
 */

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useStelsChatStore } from "../store";
import { useAuthStore } from "@/stores/modules/auth.store";
import type { ModelConfig } from "../types";

interface ModelCreatorProps {
  onClose: () => void;
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

/**
 * Model Creator Component
 */
export function ModelCreator({
  onClose,
}: ModelCreatorProps): React.ReactElement {
  const {
    models,
    createModel,
    isLoading,
    fetchModels,
    testConnection,
  } = useStelsChatStore();
  const { connectionSession } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [config, setConfig] = useState<ModelConfig>({
    name: "",
    baseModel: "",
    modelfile: "",
    parameters: {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_predict: 2048,
      repeat_penalty: 1.1,
      num_ctx: 4096,
    },
    systemPrompt: "",
    template: "",
  });

  // Load models from Ollama API when component mounts
  useEffect(() => {
    const init = async (): Promise<void> => {
      // Only fetch models if we have a session
      if (connectionSession?.session) {
        console.log("[ModelCreator] Initializing with session:", {
          hasSession: !!connectionSession.session,
          apiUrl: connectionSession.api,
        });
        const connected = await testConnection();
        if (connected) {
          // Only fetch if models list is empty
          if (models.length === 0) {
            await fetchModels();
          }
        }
      } else {
        console.warn(
          "[ModelCreator] No connectionSession available, skipping model loading",
        );
      }
    };
    init();
  }, [
    fetchModels,
    testConnection,
    connectionSession?.session,
    connectionSession?.api,
    models.length,
  ]);

  const handleRefreshModels = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await fetchModels();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!config.name.trim()) {
      alert("Model name is required");
      return;
    }

    if (!config.baseModel && !config.modelfile.trim()) {
      alert("Either base model or modelfile is required");
      return;
    }

    try {
      await createModel(config);
      onClose();
    } catch (error) {
      console.error("Failed to create model:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Model Name</Label>
          <Input
            id="name"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="my-custom-model"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="baseModel">Base Model (Optional)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRefreshModels}
              disabled={isRefreshing || isLoading}
              className="h-7 px-2 text-xs"
              title="Refresh models from Ollama"
            >
              <RefreshCw
                className={cn("icon-xs mr-1", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
          <Select
            value={config.baseModel || "none"}
            onValueChange={(value) =>
              setConfig({
                ...config,
                baseModel: value === "none" ? undefined : value,
              })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select base model (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (create from scratch)</SelectItem>
              {models.length === 0
                ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {isLoading
                      ? "Loading models..."
                      : "No models available. Click Refresh to load from Ollama."}
                  </div>
                )
                : (
                  models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{model.name}</span>
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs shrink-0"
                        >
                          {formatSize(model.size)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Select a base model from Ollama to fine-tune, or leave empty to
            create from scratch
          </p>
          {!connectionSession?.session && (
            <Alert variant="default" className="mt-2">
              <AlertDescription className="text-xs">
                Connect to the network to load models from Ollama API
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <Label htmlFor="modelfile">Modelfile</Label>
          <Textarea
            id="modelfile"
            value={config.modelfile}
            onChange={(e) =>
              setConfig({ ...config, modelfile: e.target.value })}
            placeholder={`# Example modelfile
# You can add custom instructions here
SYSTEM """You are a helpful assistant."""
`}
            className="min-h-[150px] font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Modelfile content (instructions, system prompts, etc.)
          </p>
        </div>

        <div>
          <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
          <Textarea
            id="systemPrompt"
            value={config.systemPrompt || ""}
            onChange={(e) =>
              setConfig({ ...config, systemPrompt: e.target.value })}
            placeholder="You are a helpful assistant..."
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="template">Template (Optional)</Label>
          <Textarea
            id="template"
            value={config.template || ""}
            onChange={(e) => setConfig({ ...config, template: e.target.value })}
            placeholder="Template for message formatting..."
            className="min-h-[100px] font-mono text-xs"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Advanced Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={config.parameters.temperature || 0.7}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    parameters: {
                      ...config.parameters,
                      temperature: parseFloat(e.target.value) || 0.7,
                    },
                  })}
              />
            </div>

            <div>
              <Label htmlFor="top_p">Top P</Label>
              <Input
                id="top_p"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={config.parameters.top_p || 0.9}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    parameters: {
                      ...config.parameters,
                      top_p: parseFloat(e.target.value) || 0.9,
                    },
                  })}
              />
            </div>

            <div>
              <Label htmlFor="top_k">Top K</Label>
              <Input
                id="top_k"
                type="number"
                min="0"
                value={config.parameters.top_k || 40}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    parameters: {
                      ...config.parameters,
                      top_k: parseInt(e.target.value, 10) || 40,
                    },
                  })}
              />
            </div>

            <div>
              <Label htmlFor="num_predict">Max Tokens</Label>
              <Input
                id="num_predict"
                type="number"
                min="1"
                value={config.parameters.num_predict || 2048}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    parameters: {
                      ...config.parameters,
                      num_predict: parseInt(e.target.value, 10) || 2048,
                    },
                  })}
              />
            </div>

            <div>
              <Label htmlFor="repeat_penalty">Repeat Penalty</Label>
              <Input
                id="repeat_penalty"
                type="number"
                step="0.1"
                min="0"
                value={config.parameters.repeat_penalty || 1.1}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    parameters: {
                      ...config.parameters,
                      repeat_penalty: parseFloat(e.target.value) || 1.1,
                    },
                  })}
              />
            </div>

            <div>
              <Label htmlFor="num_ctx">Context Window</Label>
              <Input
                id="num_ctx"
                type="number"
                min="1"
                value={config.parameters.num_ctx || 4096}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    parameters: {
                      ...config.parameters,
                      num_ctx: parseInt(e.target.value, 10) || 4096,
                    },
                  })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Model"}
        </Button>
      </div>
    </form>
  );
}
