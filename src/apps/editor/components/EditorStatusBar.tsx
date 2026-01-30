/**
 * EditorStatusBar - VS Code-style bottom status bar
 */

import type { EditorActivityId } from "./EditorActivityBar";

export interface EditorStatusBarProps {
  mode: EditorActivityId;
  /** Left section: e.g. "Workers" or "MCP Tools" */
  primaryLabel: string;
  /** Optional: selected item count or name */
  secondaryLabel?: string;
  /** Optional: encoding / language hint */
  encoding?: string;
  /** Optional: position (line:col) for code view */
  position?: string;
}

export function EditorStatusBar({
  primaryLabel,
  secondaryLabel,
  encoding = "UTF-8",
  position,
}: EditorStatusBarProps) {
  return (
    <footer
      className="editor-status-bar flex items-center justify-between h-6 px-3 text-[11px] font-medium border-t border-[var(--editor-status-bar-border)] bg-[var(--editor-status-bar)] text-[var(--editor-status-bar-foreground)]"
      role="status"
      aria-label="Editor status"
    >
      <div className="flex items-center gap-4 min-w-0">
        <span className="truncate text-[var(--editor-status-bar-foreground)]">
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="truncate text-[var(--editor-status-bar-muted)] max-w-[200px]">
            {secondaryLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {position && (
          <span className="text-[var(--editor-status-bar-muted)] font-mono tabular-nums">
            {position}
          </span>
        )}
        <span className="text-[var(--editor-status-bar-muted)]">{encoding}</span>
      </div>
    </footer>
  );
}
