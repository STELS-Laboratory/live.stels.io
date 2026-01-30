/**
 * CreateToolDialog component
 * Dialog for creating a new MCP tool with minimal required fields
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Wrench } from "lucide-react";
import { useEffect } from "react";
import { TOOL_CATEGORIES, TOOL_SCOPES } from "./constants";
import type { SetToolRequest, ToolCategory, ToolScope } from "../types/tools.types";

const DEFAULT_SCRIPT = `async function execute(input) {
  // Your tool logic here
  return { success: true, data: input };
}`;

const DEFAULT_INPUT_SCHEMA = {
  type: "object",
  properties: {},
  required: [],
};

export interface CreateToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: SetToolRequest) => Promise<unknown>;
  onCreated?: (toolId: string) => void;
}

export function CreateToolDialog({
  open,
  onOpenChange,
  onSubmit,
  onCreated,
}: CreateToolDialogProps): React.ReactElement {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ToolCategory>("utility");
  const [scope, setScope] = useState<ToolScope>("local");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const namePattern = /^[a-z][a-z0-9-]*$/;

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setName("");
      setDescription("");
      setCategory("utility");
      setScope("local");
      setError(null);
      setSuccess(false);
      onOpenChange(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [success, onOpenChange]);

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    const trimmedName = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (!namePattern.test(trimmedName)) {
      setError("Name must start with a letter, use only lowercase letters, numbers, and hyphens");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        name: trimmedName,
        description: description.trim(),
        script: DEFAULT_SCRIPT,
        inputSchema: DEFAULT_INPUT_SCHEMA,
        category,
        scope,
        active: true,
      });
      const saved = result as { sid?: string };
      if (saved?.sid && onCreated) {
        onCreated(saved.sid);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tool");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    setName("");
    setDescription("");
    setCategory("utility");
    setScope("local");
    setError(null);
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md bg-card border-border">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-500 mb-4 animate-in zoom-in duration-300" />
            <p className="text-sm font-semibold text-foreground">Created successfully!</p>
            <p className="text-xs text-muted-foreground mt-1">Closing...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-500" />
                Create MCP Tool
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new tool for agents. You can edit script and schema after creation.
              </DialogDescription>
            </DialogHeader>

            {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-500">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tool-name">Name *</Label>
            <Input
              id="tool-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-tool-name"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Lowercase, letters, numbers, hyphens only (e.g. sentiment-analyzer)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tool-desc">Description *</Label>
            <Textarea
              id="tool-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this tool does for the LLM"
              className="min-h-[60px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ToolCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOOL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as ToolScope)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOOL_SCOPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !name.trim() || !description.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                {isSubmitting ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
