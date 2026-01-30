/**
 * EditorActivityBar - VS Code-style vertical activity bar
 * Icons for Workers (Explorer) and MCP Tools
 */

import { Database, Wrench } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type EditorActivityId = "workers" | "tools";

export interface EditorActivityBarProps {
  activeId: EditorActivityId;
  onSelect: (id: EditorActivityId) => void;
}

const ACTIVITIES: { id: EditorActivityId; icon: typeof Database; label: string }[] = [
  { id: "workers", icon: Database, label: "Protocol Registry" },
  { id: "tools", icon: Wrench, label: "MCP Tools" },
];

export function EditorActivityBar({ activeId, onSelect }: EditorActivityBarProps) {
  return (
    <aside
      className="editor-activity-bar flex flex-col w-[48px] shrink-0 border-r border-[var(--editor-activity-bar-border)] bg-[var(--editor-activity-bar)]"
      role="tablist"
      aria-label="Editor activities"
    >
      <TooltipProvider delayDuration={400}>
        {ACTIVITIES.map(({ id, icon: Icon, label }) => {
          const isActive = activeId === id;
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={label}
                  onClick={() => onSelect(id)}
                  className={`
                    editor-activity-item relative flex items-center justify-center w-full h-[48px] shrink-0
                    text-[var(--editor-activity-bar-foreground)] transition-colors duration-150
                    hover:bg-[var(--editor-activity-bar-hover)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--editor-accent)] focus-visible:ring-inset
                    ${isActive ? "bg-[var(--editor-activity-bar-active)] text-[var(--editor-activity-bar-active-foreground)]" : ""}
                  `}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[var(--editor-accent)] rounded-r"
                      aria-hidden
                    />
                  )}
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </aside>
  );
}
