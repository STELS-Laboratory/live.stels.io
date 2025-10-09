import React from "react";

interface SectionHeaderProps {
  title: string;
  description: string;
  badge?: string | number;
  isMobile: boolean;
}

/**
 * Section header component
 */
export function SectionHeader({
  title,
  description,
  badge,
  isMobile,
}: SectionHeaderProps): React.ReactElement {
  if (isMobile) {
    return (
      <div className="px-4 mb-5 pt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-card-foreground tracking-tight">
            {title}
          </h2>
          {badge && (
            <div className="px-2.5 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-400/80">
                {badge}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          {description}
        </p>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="mb-10 pb-6 border-b border-border/50 relative">
      {/* Gradient underline */}
      <div className="absolute bottom-0 left-0 h-[1px] w-24 bg-gradient-to-r from-amber-500/50 to-transparent" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground mb-2 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            {description}
          </p>
        </div>

        {/* Badge */}
        {badge && (
          <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <span className="text-sm font-bold text-amber-400/90">
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
