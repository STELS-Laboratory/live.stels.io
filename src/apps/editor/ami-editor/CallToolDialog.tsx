/**
 * CallToolDialog component
 * Test run a tool with optional input JSON (result shown in styled <pre>, no syntax-highlighter dep).
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import type { ToolRaw } from "../types/tools.types";
import type { ToolExecutionResult } from "../types/tools.types";

export interface CallToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: ToolRaw | null;
  onExecute: (toolId: string, input: Record<string, unknown>) => Promise<ToolExecutionResult | null>;
}

export function CallToolDialog({
  open,
  onOpenChange,
  tool,
  onExecute,
}: CallToolDialogProps): React.ReactElement {
  const [inputJson, setInputJson] = useState("{}");
  const [result, setResult] = useState<ToolExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async (): Promise<void> => {
    if (!tool) return;
    setError(null);
    setResult(null);
    let input: Record<string, unknown>;
    try {
      input = JSON.parse(inputJson.trim() || "{}");
    } catch {
      setError("Invalid JSON input");
      return;
    }
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      setError("Input must be a JSON object");
      return;
    }
    setIsExecuting(true);
    try {
      const res = await onExecute(tool.sid, input);
      setResult(res ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      setInputJson("{}");
      setResult(null);
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-amber-500" />
            Test run: {tool?.name ?? "—"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Execute the tool with optional input (JSON object). Result will appear below.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-500">{error}</AlertDescription>
          </Alert>
        )}

        {tool && (
          <>
            <div className="space-y-2">
              <Label htmlFor="call-input">Input (JSON)</Label>
              <Textarea
                id="call-input"
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
                placeholder='{"key": "value"}'
              />
            </div>

            {isExecuting && (
              <div className="rounded-lg border border-border p-4 flex flex-col items-center justify-center gap-2 min-h-[120px]">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" aria-hidden />
                <p className="text-sm text-muted-foreground">Running tool…</p>
              </div>
            )}

            {result && !isExecuting && (
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  {result.success ? "Success" : "Error"} — {result.duration} ms
                </div>
                <pre className="text-xs font-mono bg-muted/50 dark:bg-muted/30 p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {result.success
                    ? JSON.stringify(result.result, null, 2)
                    : String(result.error ?? "Unknown error")}
                </pre>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isExecuting}>
            Close
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!tool || isExecuting}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Running…
              </>
            ) : (
              "Execute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
