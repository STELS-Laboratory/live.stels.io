import React from "react";
import type { LucideIcon } from "lucide-react";

interface FeatureHighlightProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "amber" | "green" | "blue";
  isMobile: boolean;
}

/**
 * Feature highlight card
 */
export function FeatureHighlight({
  icon: Icon,
  title,
  description,
  color,
  isMobile,
}: FeatureHighlightProps): React.ReactElement {
  const colorClasses = {
    amber: {
      border:
        "border-amber-500/40 active:border-amber-500/70 group-hover:border-amber-500/50",
      bg: "bg-amber-500/0 active:bg-amber-500/20 group-hover:bg-amber-500/20",
      glow: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-500/0 active:bg-amber-500/20",
      iconText:
        "text-amber-400/80 active:text-amber-300 group-hover:text-amber-400",
      cornerBorder: "border-amber-500/50",
    },
    green: {
      border:
        "border-green-500 active:border-green-500 group-hover:border-green-500",
      bg: "bg-green-500 active:bg-green-500/20 group-hover:bg-green-500/20",
      glow: "from-green-500 to-emerald-500",
      iconBg: "bg-green-500 active:bg-green-500/20",
      iconText:
        "text-green-400 active:text-green-300 group-hover:text-green-400",
      cornerBorder: "border-green-500",
    },
    blue: {
      border:
        "border-blue-500/40 active:border-blue-500/70 group-hover:border-blue-500/50",
      bg: "bg-blue-500/0 active:bg-blue-500/20 group-hover:bg-blue-500/20",
      glow: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-500/0 active:bg-blue-500/20",
      iconText:
        "text-blue-400/80 active:text-blue-300 group-hover:text-blue-400",
      cornerBorder: "border-blue-500/50",
    },
  }[color];

  if (isMobile) {
    return (
      <div
        className={`relative flex items-center gap-3 px-3 py-3.5 bg-gradient-to-r from-background via-card to-background backdrop-blur-sm border border-border/50 active:border-${color}-500/50 active:scale-[0.98] transition-all duration-200 overflow-hidden`}
      >
        {/* Background glow on active */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-${color}-500/0 via-${color}-500/0 to-${color}-500/0 active:from-${color}-500/5 active:via-${color}-500/10 active:to-${color}-500/5 transition-all duration-200`}
        />

        {/* Corner accents */}
        <div
          className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-border/50 active:${colorClasses.cornerBorder} transition-colors duration-200`}
        />
        <div
          className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-border/50 active:${colorClasses.cornerBorder} transition-colors duration-200`}
        />

        {/* Tech lines */}
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />

        <div
          className={`relative w-9 h-9 bg-gradient-to-br from-card via-muted to-card flex items-center justify-center border-2 ${colorClasses.border} transition-all duration-200 overflow-hidden`}
        >
          {/* Inner gradient */}
          <div className="absolute inset-[2px] bg-gradient-to-br from-background/80 via-card/50 to-background/80" />
          {/* Icon glow */}
          <div
            className={`absolute inset-0 ${colorClasses.iconBg} blur-sm transition-all duration-200`}
          />
          {/* Scan lines */}
          <div
            className={`absolute inset-0 bg-gradient-to-b from-transparent via-${color}-500/5 to-transparent`}
          />
          {/* Pulse indicator for green */}
          {color === "green" && (
            <div className="absolute top-1 right-1 w-1 h-1 bg-green-500 rounded-full animate-pulse" />
          )}
          <Icon
            className={`relative w-4.5 h-4.5 ${colorClasses.iconText} active:scale-110 transition-all duration-200`}
          />
        </div>
        <div className="relative flex-1">
          <p className="text-xs font-bold text-card-foreground active:text-card-foreground mb-1 transition-colors duration-200">
            {title}
          </p>
          <p className="text-[10px] text-muted-foreground active:text-muted-foreground font-semibold transition-colors duration-200">
            {description}
          </p>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div
      className={`group relative flex flex-col items-center text-center p-8 bg-gradient-to-br from-background via-card to-background backdrop-blur-sm border border-border/50 hover:border-${color}-500/30 transition-all duration-300 hover:scale-105 overflow-hidden`}
    >
      {/* Corner accents */}
      <div
        className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-border/50 group-hover:${colorClasses.cornerBorder} transition-colors duration-300`}
      />
      <div
        className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-border/50 group-hover:${colorClasses.cornerBorder} transition-colors duration-300`}
      />
      <div
        className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-border/50 group-hover:${colorClasses.cornerBorder} transition-colors duration-300`}
      />
      <div
        className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-border/50 group-hover:${colorClasses.cornerBorder} transition-colors duration-300`}
      />

      {/* Outer glow */}
      <div
        className={`absolute -inset-[2px] bg-gradient-to-br ${colorClasses.glow} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500`}
      />

      <div className="relative mb-6">
        {/* Icon glow rings */}
        <div
          className={`absolute -inset-6 bg-gradient-to-br ${colorClasses.glow} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500`}
        />
        <div
          className={`absolute -inset-2 ${colorClasses.iconBg} blur-md transition-colors duration-500`}
        />

        <div
          className={`relative w-16 h-16 bg-gradient-to-br from-card via-muted to-card flex items-center justify-center border border-border/50 group-hover:border-${color}-500/50 transition-all duration-300`}
        >
          {/* Scan line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent" />
          <Icon
            className={`relative w-8 h-8 text-muted-foreground ${colorClasses.iconText} transition-all duration-300 group-hover:scale-110`}
          />
        </div>
      </div>
      <p className="relative text-lg font-bold text-card-foreground group-hover:text-foreground mb-2 tracking-tight transition-colors duration-300">
        {title}
      </p>
      <p className="relative text-sm text-muted-foreground group-hover:text-muted-foreground font-medium transition-colors duration-300">
        {description}
      </p>
    </div>
  );
}
