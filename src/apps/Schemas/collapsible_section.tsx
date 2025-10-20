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
    <div className="border border-zinc-800 rounded bg-zinc-900/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen
            ? <ChevronDown className="w-4 h-4 text-zinc-400" />
            : <ChevronRight className="w-4 h-4 text-zinc-400" />}
          <span className="text-sm font-medium text-zinc-300">{title}</span>
          {subtitle && (
            <span className="text-xs text-zinc-500">— {subtitle}</span>
          )}
        </div>
        {badge !== undefined && (
          <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-500 rounded border border-amber-500/30">
            {badge}
          </span>
        )}
      </button>

      {isOpen && <div className="border-t border-zinc-800">{children}</div>}
    </div>
  );
}
