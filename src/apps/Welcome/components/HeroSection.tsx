/**
 * Hero Section Component
 * Premium futuristic header with search and stats
 */

import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Zap } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import Graphite from "@/components/ui/vectors/logos/Graphite.tsx";
import { useWelcomeStore } from "../store.ts";
import { useAuthStore } from "@/stores";

interface HeroSectionProps {
  totalApps: number;
  featuredCount: number;
  isMobile: boolean;
}

/**
 * Hero Section with search and branding
 */
export function HeroSection({
  totalApps,
  featuredCount,
  isMobile,
}: HeroSectionProps): React.ReactElement {
  const searchTerm = useWelcomeStore((state) => state.searchTerm);
  const setSearchTerm = useWelcomeStore((state) => state.setSearchTerm);
  const { connectionSession } = useAuthStore();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm],
  );

  if (isMobile) {
    return (
      <div className="relative px-4 pt-6 pb-6 bg-card border-b border-border overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-px bg-amber-500/30" />
        <div className="absolute top-0 right-0 w-8 h-px bg-amber-500/30" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        {/* Logo and title */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative p-1.5 border border-amber-500/30 bg-amber-500/10">
              <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-amber-500/50" />
              <Graphite size={2} primary="orange" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">
                STELS
              </h1>
              <p className="text-[10px] text-muted-foreground/70 font-medium">
                Application Store
              </p>
            </div>
          </div>
          {connectionSession?.developer && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] px-1.5 py-0.5"
            >
              <Zap className="w-2.5 h-2.5 mr-0.5" />
              Dev
            </Badge>
          )}
        </div>

        {/* Stats - compact mobile version */}
        <div className="relative flex items-center justify-between mb-4 px-0.5">
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-amber-500 animate-pulse" />
              <span className="text-muted-foreground/70 font-medium">
                <span className="font-bold text-foreground">{totalApps}</span>
                {" "}
                Apps
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-muted-foreground/70 font-medium">
                <span className="font-bold text-foreground">
                  {featuredCount}
                </span>{" "}
                Featured
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <div className="w-1 h-1 bg-green-500" />
              <div className="absolute inset-0 w-1 h-1 bg-green-500 animate-ping" />
            </div>
            <span className="text-[10px] text-muted-foreground/70 font-medium">
              Online
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          {/* Corner decorations */}
          <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-border" />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t border-r border-border" />
          <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b border-l border-border" />
          <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b border-r border-border" />

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 h-10 text-sm bg-background border border-border focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 font-medium placeholder:text-muted-foreground/50"
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative border-b border-border bg-card overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-px bg-amber-500/30" />
      <div className="absolute top-0 right-0 w-20 h-px bg-amber-500/30" />

      <div className="container mx-auto px-6 py-8 relative">
        <div className="max-w-3xl mx-auto">
          {/* Logo and title */}
          <motion.div
            className="flex items-center justify-between mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <Graphite size={3} primary="orange" />
              <div>
                <h1 className="text-lg font-bold text-foreground">STELS</h1>
                <p className="text-xs text-muted-foreground">
                  Application Store
                </p>
              </div>
            </div>
            {connectionSession?.developer && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                Developer
              </Badge>
            )}
          </motion.div>

          {/* Search bar */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="relative group">
              {/* Corner decorations */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-border group-focus-within:border-amber-500/50 transition-colors" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-border group-focus-within:border-amber-500/50 transition-colors" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-border group-focus-within:border-amber-500/50 transition-colors" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-border group-focus-within:border-amber-500/50 transition-colors" />

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-10 pl-10 pr-4 text-sm bg-background border border-border focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 font-medium placeholder:text-muted-foreground/50"
              />
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex items-center gap-4 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
              <span className="text-muted-foreground font-medium">
                <span className="font-bold text-foreground">{totalApps}</span>
                {" "}
                Apps
              </span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              <span className="text-muted-foreground font-medium">
                <span className="font-bold text-foreground">
                  {featuredCount}
                </span>{" "}
                Featured
              </span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-green-500" />
                <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 animate-ping" />
              </div>
              <span className="text-muted-foreground font-medium">Online</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
