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
      <div className="px-4 pt-8 pb-8 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent border-b border-border/20">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-12 h-14 text-base bg-card/50 border-2 border-border/50 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 shadow-lg font-semibold placeholder:text-muted-foreground/50 placeholder:font-medium transition-all duration-500"
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative overflow-hidden border-b border-border/30 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Static background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Neon orbs - static positioning */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-16 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and title */}
          <motion.div
            className="flex items-center justify-center gap-3 mb-6"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div>
              <Graphite size={4} primary="orange" />
            </div>
            {connectionSession?.developer && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-500 border-amber-500/30"
              >
                <Zap className="w-3 h-3 mr-1" />
                Developer Mode
              </Badge>
            )}
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="text-xl text-muted-foreground/70 mb-10 font-semibold tracking-tight leading-relaxed"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            AI, Web3, Decentralized. Explore the future of applications.
          </motion.p>

          {/* Search bar */}
          <motion.div
            className="max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative group">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-500/0 group-focus-within:border-amber-500/70 transition-colors duration-300" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-500/0 group-focus-within:border-amber-500/70 transition-colors duration-300" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-500/0 group-focus-within:border-amber-500/70 transition-colors duration-300" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-500/0 group-focus-within:border-amber-500/70 transition-colors duration-300" />

              {/* Top accent line */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-focus-within:via-amber-500/30 transition-all duration-300" />

              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors duration-300 z-10" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-16 pl-14 pr-6 text-lg bg-card/50 backdrop-blur-sm border-2 border-border/50 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:bg-card/80 shadow-lg hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-[1] font-semibold placeholder:text-muted-foreground/50 placeholder:font-medium"
              />

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/0 group-focus-within:from-amber-500/10 group-focus-within:via-amber-500/5 group-focus-within:to-amber-500/10 blur-xl transition-all duration-300 -z-[1]" />
            </div>
          </motion.div>

          {/* Stats - iOS style */}
          <motion.div
            className="flex items-center justify-center gap-8 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-amber-500 animate-pulse" />
              <span className="text-muted-foreground/70 font-medium">
                <span className="font-black text-amber-500">{totalApps}</span>
                {" "}
                Apps
              </span>
            </div>
            <div className="w-px h-5 bg-border/30" />
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground/70 font-medium">
                <span className="font-black text-amber-500">
                  {featuredCount}
                </span>{" "}
                Featured
              </span>
            </div>
            <div className="w-px h-5 bg-border/30" />
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-green-500" />
              <span className="text-muted-foreground/70 font-semibold">
                Online
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
