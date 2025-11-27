/**
 * Assistant Creator Component
 * Create and configure AI assistants
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
import type { CreateAssistantRequest, AssistantOptions } from "../types";

interface AssistantCreatorProps {
  onClose: () => void;
}

/**
 * Assistant Creator Component
 */
export function AssistantCreator({
  onClose,
}: AssistantCreatorProps): React.ReactElement {
  const { models, createAssistant, isLoading } = useStelsChatStore();
  const [config, setConfig] = useState<CreateAssistantRequest>({
    name: "",
    description: "",
    model: "",
    systemPrompt: "",
    options: {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_predict: 2048,
      repeat_penalty: 1.1,
    },
    metadata: {
      tags: [],
    },
  });
  const [tagsInput, setTagsInput] = useState("");

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!config.name.trim()) {
      alert("Assistant name is required");
      return;
    }

    if (!config.model) {
      alert("Model is required");
      return;
    }

    try {
      // Parse tags
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await createAssistant({
        ...config,
        metadata: {
          tags: tags.length > 0 ? tags : undefined,
        },
      });
      onClose();
    } catch {
			// Error handled silently
		}
  };

  const updateOption = (
    key: keyof AssistantOptions,
    value: number | string[],
  ): void => {
    setConfig({
      ...config,
      options: {
        ...config.options,
        [key]: value,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Assistant Name *</Label>
          <Input
            id="name"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="Code Assistant"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={config.description || ""}
            onChange={(e) =>
              setConfig({ ...config, description: e.target.value })
            }
            placeholder="A helpful assistant for coding tasks"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="model">Model *</Label>
          <Select
            value={config.model}
            onValueChange={(value) => setConfig({ ...config, model: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="systemPrompt">System Prompt</Label>
          <Textarea
            id="systemPrompt"
            value={config.systemPrompt || ""}
            onChange={(e) =>
              setConfig({ ...config, systemPrompt: e.target.value })
            }
            placeholder="You are a helpful assistant..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="coding, typescript, development"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate tags with commas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Model Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={config.options?.temperature || 0.7}
                onChange={(e) =>
                  updateOption("temperature", parseFloat(e.target.value))
                }
              />
            </div>

            <div>
              <Label htmlFor="top_p">Top P</Label>
              <Input
                id="top_p"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.options?.top_p || 0.9}
                onChange={(e) =>
                  updateOption("top_p", parseFloat(e.target.value))
                }
              />
            </div>

            <div>
              <Label htmlFor="top_k">Top K</Label>
              <Input
                id="top_k"
                type="number"
                min="0"
                value={config.options?.top_k || 40}
                onChange={(e) =>
                  updateOption("top_k", parseInt(e.target.value, 10))
                }
              />
            </div>

            <div>
              <Label htmlFor="num_predict">Max Tokens</Label>
              <Input
                id="num_predict"
                type="number"
                min="1"
                value={config.options?.num_predict || 2048}
                onChange={(e) =>
                  updateOption("num_predict", parseInt(e.target.value, 10))
                }
              />
            </div>

            <div>
              <Label htmlFor="repeat_penalty">Repeat Penalty</Label>
              <Input
                id="repeat_penalty"
                type="number"
                min="0"
                step="0.1"
                value={config.options?.repeat_penalty || 1.1}
                onChange={(e) =>
                  updateOption("repeat_penalty", parseFloat(e.target.value))
                }
              />
            </div>

            <div>
              <Label htmlFor="seed">Seed (Optional)</Label>
              <Input
                id="seed"
                type="number"
                value={config.options?.seed || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateOption(
                    "seed",
                    value ? parseInt(value, 10) : 0,
                  );
                }}
                placeholder="Random"
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
          {isLoading ? "Creating..." : "Create Assistant"}
        </Button>
      </div>
    </form>
  );
}
