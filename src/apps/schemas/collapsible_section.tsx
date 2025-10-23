/**
 * Collapsible Section Component
 * Reusable accordion-style section
 */

import { type ReactElement, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
}

/**
 * Expandable/collapsible section with header
 */
export default function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
  badge,
}: CollapsibleSectionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded bg-card/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {isOpen
            ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
            : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          <span className="text-[11px] font-medium text-foreground">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground">
              · {subtitle}
            </span>
          )}
        </div>
        {badge !== undefined && (
          <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-500 rounded">
            {badge}
          </span>
        )}
      </button>

      {isOpen && <div className="border-t border-border">{children}</div>}
    </div>
  );
}
