/**
 * Model Creator Component
 * Create and configure custom Stels models
 */

import React, { useState } from "react";
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
import { useStelsChatStore } from "../store";
import type { ModelConfig } from "../types";

interface ModelCreatorProps {
  onClose: () => void;
}

/**
 * Model Creator Component
 */
export function ModelCreator({
  onClose,
}: ModelCreatorProps): React.ReactElement {
  const { models, createModel, isLoading } = useStelsChatStore();
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
          <Label htmlFor="baseModel">Base Model (Optional)</Label>
          <Select
            value={config.baseModel || "none"}
            onValueChange={(value) =>
              setConfig({
                ...config,
                baseModel: value === "none" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select base model (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (create from scratch)</SelectItem>
              {models.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Select a base model to fine-tune, or leave empty to create from
            scratch
          </p>
        </div>

        <div>
          <Label htmlFor="modelfile">Modelfile</Label>
          <Textarea
            id="modelfile"
            value={config.modelfile}
            onChange={(e) =>
              setConfig({ ...config, modelfile: e.target.value })
            }
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
              setConfig({ ...config, systemPrompt: e.target.value })
            }
            placeholder="You are a helpful assistant..."
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="template">Template (Optional)</Label>
          <Textarea
            id="template"
            value={config.template || ""}
            onChange={(e) =>
              setConfig({ ...config, template: e.target.value })
            }
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
                  })
                }
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
                  })
                }
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
                  })
                }
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
                  })
                }
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
                  })
                }
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
                  })
                }
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

