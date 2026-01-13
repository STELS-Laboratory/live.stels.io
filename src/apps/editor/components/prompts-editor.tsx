/**
 * PromptsEditor component
 * Textarea for editing worker prompts and instructions
 */

import { Textarea } from "@/components/ui/textarea";
import type { PromptsEditorProps } from "../types/editor.types.ts";

/**
 * PromptsEditor component
 */
export function PromptsEditor({
  value,
  onChange,
}: PromptsEditorProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Textarea
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onChange(e.target.value)}
        placeholder="Worker prompts and instructions..."
        className="bg-input border-border text-foreground placeholder:text-muted-foreground text-[11px] resize-none min-h-[200px] focus:border-blue-500 focus:ring-blue-500/20"
        aria-label="Worker prompts and instructions"
      />
    </div>
  );
}

