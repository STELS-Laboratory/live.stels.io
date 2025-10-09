import React, { useState } from "react";
import { Activity, Play, TrendingUp } from "lucide-react";
import type { AppMetadata } from "./types";

interface AppCardProps {
  app: AppMetadata;
  onLaunch: (route: string) => void;
  isMobile: boolean;
}

/**
 * Mobile version of app card
 */
function MobileAppCard({
  app,
  onLaunch,
  isLaunching,
}: AppCardProps & { isLaunching: boolean }): React.ReactElement {
  return (
    <button
      onClick={() => onLaunch(app.route)}
      disabled={isLaunching}
      className={`relative flex flex-col items-center gap-3 focus:outline-none active:scale-90 transition-all duration-200 ${
        isLaunching ? "opacity-60 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* App icon */}
      <div className="relative w-[68px] h-[68px]">
        {/* Multi-layer outer glow effect */}
        <div
          className={`absolute -inset-2 bg-gradient-to-br ${app.color} opacity-0 active:opacity-70 transition-opacity duration-300 blur-xl`}
        />
        <div
          className={`absolute -inset-1 bg-gradient-to-br ${app.color} opacity-0 active:opacity-40 transition-opacity duration-200 blur-md`}
        />

        {/* Animated corner accents */}
        <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-muted/60 active:border-amber-500/80 transition-all duration-200" />
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-muted/60 active:border-amber-500/80 transition-all duration-200" />
        <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-muted/60 active:border-amber-500/80 transition-all duration-200" />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-muted/60 active:border-amber-500/80 transition-all duration-200" />

        {/* Secondary decorative lines */}
        <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-border/40 active:border-amber-400/60 transition-all duration-200" />
        <div className="absolute top-1 right-1 w-1 h-1 border-t border-r border-border/40 active:border-amber-400/60 transition-all duration-200" />
        <div className="absolute bottom-1 left-1 w-1 h-1 border-b border-l border-border/40 active:border-amber-400/60 transition-all duration-200" />
        <div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-border/40 active:border-amber-400/60 transition-all duration-200" />

        {/* Icon container with gradient border */}
        <div className="relative w-full h-full bg-gradient-to-br from-card via-background to-card backdrop-blur-sm flex items-center justify-center border border-border/40 active:border-amber-500/70 transition-all duration-200 overflow-hidden">
          {/* Inner gradient highlight */}
          <div className="absolute inset-[1px] bg-gradient-to-br from-background/80 via-card/50 to-background/80" />

          {/* Animated scan line effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent opacity-50 active:opacity-100 transition-opacity duration-200" />

          {/* Horizontal tech line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border/20 to-transparent" />

          {/* Vertical tech line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-border/20 to-transparent" />

          {/* Active state glow */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 active:opacity-20 transition-opacity duration-200`}
          />

          {/* Icon with enhanced effects */}
          <div className="relative z-10">
            {/* Icon glow ring */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 active:opacity-50 blur-md transition-opacity duration-200 scale-150`}
            />

            <div className="relative text-muted-foreground active:text-amber-300 transition-all duration-200 active:scale-125">
              {app.icon}
            </div>
          </div>
        </div>

        {/* Enhanced badge indicator with pulse */}
        {app.badge && (
          <div className="absolute -top-1.5 -right-1.5 z-10">
            {/* Outer glow rings */}
            <div className="absolute inset-0 w-3 h-3 bg-amber-500/30 rounded-full blur-md animate-pulse" />
            <div className="absolute inset-0.5 w-2 h-2 bg-amber-500/50 rounded-full blur-sm animate-pulse" />
            {/* Main badge */}
            <div className="relative w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* App name with enhanced styling */}
      <span className="text-[11px] font-bold text-muted-foreground active:text-card-foreground text-center max-w-[76px] line-clamp-2 leading-tight tracking-tight transition-colors duration-200">
        {app.name}
      </span>
    </button>
  );
}

/**
 * Desktop version of app card
 */
function DesktopAppCard({
  app,
  onLaunch,
  isLaunching,
}: AppCardProps & { isLaunching: boolean }): React.ReactElement {
  // Get size-specific classes
  const sizeClasses = {
    large: "md:col-span-2 md:row-span-2 p-8",
    medium: "md:col-span-1 p-6",
    small: "md:col-span-1 p-5",
  }[app.size || "medium"];

  return (
    <button
      onClick={() => onLaunch(app.route)}
      disabled={isLaunching}
      className={`group relative overflow-hidden text-left transition-all duration-300 hover:scale-[1.02] focus:outline-none cursor-pointer ${
        isLaunching ? "opacity-70 scale-95" : "opacity-100 scale-100"
      } ${sizeClasses}`}
    >
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />

      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-15 transition-opacity duration-500`}
      />

      {/* Scan line effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent opacity-50" />

      {/* Animated gradient border */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-border to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ padding: "1px" }}
      >
        <div className="absolute inset-[1px] bg-gradient-to-br from-background via-card to-background" />
      </div>

      {/* Default border */}
      <div className="absolute inset-0 border border-border/50 group-hover:border-transparent transition-colors duration-300" />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-border/50 group-hover:border-amber-500/60 transition-colors duration-300 z-10" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-border/50 group-hover:border-amber-500/60 transition-colors duration-300 z-10" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-border/50 group-hover:border-amber-500/60 transition-colors duration-300 z-10" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-border/50 group-hover:border-amber-500/60 transition-colors duration-300 z-10" />

      {/* Outer glow on hover */}
      <div
        className={`absolute -inset-[2px] bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-500 -z-10`}
      />

      {/* Header badges */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
        {/* Web3 badge */}
        <div className="relative px-3 py-1.5 bg-card/60 backdrop-blur-sm border border-border/40 group-hover:border-cyan-500/50 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors duration-300" />
          <span className="relative text-[9px] font-bold text-muted-foreground group-hover:text-cyan-400 tracking-wider transition-colors duration-300">
            WEB3
          </span>
        </div>

        {/* Marketing badge */}
        {app.badge && (
          <div className="relative px-3 py-1.5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/30 group-hover:border-amber-500/60 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/20 transition-colors duration-300" />
            <span className="relative text-[9px] font-bold text-amber-400/80 group-hover:text-amber-300 tracking-wide transition-colors duration-300">
              {app.badge.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Blur overlay with launch button on hover */}
      <div className="absolute inset-0 bg-background/0 backdrop-blur-none group-hover:bg-background/80 group-hover:backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 z-30 flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
          {/* Launch button */}
          <div className="relative px-6 py-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/20 to-amber-500/10 blur-sm" />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-400/60" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-400/60" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-400/60" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-400/60" />

            <div className="relative flex items-center gap-3">
              <Play className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-amber-300 tracking-wide">
                Launch Application
              </span>
            </div>
          </div>

          {/* App name */}
          <p className="text-base font-bold text-card-foreground tracking-tight">
            {app.name}
          </p>
        </div>
      </div>

      {/* Icon */}
      <div
        className={`relative z-10 ${app.size === "large" ? "mb-8" : "mb-6"}`}
      >
        {/* Outer neon glow */}
        <div
          className={`absolute -inset-4 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-500 ${
            app.size === "large" ? "scale-150" : ""
          }`}
        />

        {/* Inner glow ring */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-50 blur-md transition-all duration-500 ${
            app.size === "large" ? "scale-150" : ""
          }`}
        />

        {/* Icon container with geometric accent */}
        <div className="relative inline-block">
          {/* Rotating border accent */}
          <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="w-full h-full border border-amber-500/30 rotate-45" />
          </div>

          <div
            className={`relative text-muted-foreground transition-all duration-300 group-hover:text-card-foreground group-hover:scale-110 ${
              app.size === "large" ? "scale-150" : ""
            }`}
          >
            {app.icon}
          </div>
        </div>
      </div>

      {/* Content - varies by size */}
      <div
        className={`relative z-10 ${
          app.size === "large" ? "space-y-4" : "space-y-3"
        }`}
      >
        <div>
          <h3
            className={`font-bold text-amber-600/70 group-hover:text-foreground mb-2 tracking-tight transition-colors duration-300 ${
              app.size === "large" ? "text-3xl" : "text-2xl"
            }`}
          >
            {app.name}
          </h3>
          <p
            className={`text-muted-foreground group-hover:text-card-foreground font-semibold transition-colors duration-300 ${
              app.size === "large" ? "text-base" : "text-sm"
            }`}
          >
            {app.tagline}
          </p>
        </div>
        <p
          className={`text-muted-foreground group-hover:text-muted-foreground leading-relaxed transition-colors duration-300 ${
            app.size === "large"
              ? "text-base line-clamp-4"
              : "text-sm line-clamp-3"
          }`}
        >
          {app.description}
        </p>

        {/* Stats for large cards */}
        {app.size === "large" && app.stats && (
          <div className="flex items-center gap-2 pt-2">
            <div className="relative flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-card via-muted to-card backdrop-blur-sm border border-border/50 group-hover:border-amber-500/40 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors duration-300" />
              <TrendingUp className="relative w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-400 transition-colors duration-300" />
              <span className="relative text-xs font-bold text-muted-foreground group-hover:text-card-foreground transition-colors duration-300">
                {app.stats}
              </span>
            </div>
            <div className="relative flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-card via-muted to-card backdrop-blur-sm border border-border/50 group-hover:border-green-500/40 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/10 transition-colors duration-300" />
              <div className="relative w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <Activity className="relative w-3.5 h-3.5 text-muted-foreground group-hover:text-green-400 transition-colors duration-300" />
              <span className="relative text-xs font-bold text-muted-foreground group-hover:text-card-foreground transition-colors duration-300">
                Real-time
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer with category and launch CTA */}
      <div
        className={`relative flex items-center justify-between gap-2 z-10 ${
          app.size === "large" ? "mt-8" : "mt-6"
        }`}
      >
        {/* Category and stats */}
        <div className="flex items-center gap-2">
          <div className="relative inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-card via-muted to-card backdrop-blur-sm border border-border/50 group-hover:border-border transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/10 transition-colors duration-300" />
            <Activity className="relative w-3 h-3 text-muted-foreground group-hover:text-muted-foreground transition-colors duration-300" />
            <span className="relative text-xs font-bold text-muted-foreground group-hover:text-card-foreground transition-colors duration-300">
              {app.category}
            </span>
          </div>
          {app.stats && app.size !== "large" && (
            <div className="relative inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-card via-muted to-card backdrop-blur-sm border border-border/50 group-hover:border-border transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/10 transition-colors duration-300" />
              <span className="relative text-xs font-bold text-muted-foreground group-hover:text-card-foreground transition-colors duration-300">
                {app.stats}
              </span>
            </div>
          )}
        </div>

        {/* Launch CTA */}
        <div className="relative inline-flex items-center gap-2 px-4 py-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 group-hover:from-amber-500/20 group-hover:via-orange-500/20 group-hover:to-amber-500/20 transition-all duration-300" />
          <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 blur-sm transition-colors duration-300" />
          <div className="absolute inset-0 border border-amber-500/30 group-hover:border-amber-500/60 transition-colors duration-300" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-400/50" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-400/50" />

          <Play className="relative w-3.5 h-3.5 text-amber-400/70 group-hover:text-amber-300 transition-colors duration-300" />
          <span className="relative text-xs font-bold text-amber-400/90 group-hover:text-amber-300 tracking-wide transition-colors duration-300">
            Launch
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Application card component - switches between mobile and desktop versions
 */
export function AppCard(
  { app, onLaunch, isMobile }: AppCardProps,
): React.ReactElement {
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = (route: string): void => {
    setIsLaunching(true);
    onLaunch(route);
  };

  if (isMobile) {
    return (
      <MobileAppCard
        app={app}
        onLaunch={handleLaunch}
        isMobile={isMobile}
        isLaunching={isLaunching}
      />
    );
  }

  return (
    <DesktopAppCard
      app={app}
      onLaunch={handleLaunch}
      isMobile={isMobile}
      isLaunching={isLaunching}
    />
  );
}
