/**
 * Stats Bar Component
 * Futuristic display of application statistics
 */

import React from "react";
import { motion } from "framer-motion";
import { Activity, BarChart3, Sparkles, Users, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";

interface StatsBarProps {
  totalApps: number;
  featuredApps: number;
  categories: number;
  isMobile: boolean;
}

/**
 * Individual stat item
 */
function StatItem({
  icon: Icon,
  label,
  value,
  color,
  delay,
  isMobile,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay: number;
  isMobile: boolean;
}): React.ReactElement {
  if (isMobile) {
    return (
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
      >
        <div
          className={cn("flex items-center justify-center gap-1 mb-1", color)}
        >
          <Icon className="w-4 h-4" />
          <span className="text-lg font-bold">{value}</span>
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group"
    >
      <Card className="relative border-2 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top accent line */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            color.replace("text-", "via-"),
          )}
        />

        {/* Corner accents */}
        <div
          className={cn(
            "absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-transparent group-hover:border-opacity-30 transition-all",
            color.replace("text-", "group-hover:border-"),
          )}
        />
        <div
          className={cn(
            "absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-transparent group-hover:border-opacity-30 transition-all",
            color.replace("text-", "group-hover:border-"),
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-transparent group-hover:border-opacity-30 transition-all",
            color.replace("text-", "group-hover:border-"),
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-transparent group-hover:border-opacity-30 transition-all",
            color.replace("text-", "group-hover:border-"),
          )}
        />

        <CardContent className="p-6 text-center relative z-10">
          <motion.div
            className={cn(
              "w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center relative",
              color.replace("text-", "bg-") + "/10",
              "border-2",
              color.replace("text-", "border-") + "/20",
            )}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className={cn("w-6 h-6 relative z-10", color)} />
          </motion.div>

          <p className={cn("text-3xl font-black mb-2", color)}>{value}</p>

          <p className="text-sm text-muted-foreground font-medium">{label}</p>
        </CardContent>

        {/* Glow effect */}
        <motion.div
          className={cn(
            "absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10",
            color.replace("text-", "bg-") + "/20",
          )}
        />
      </Card>
    </motion.div>
  );
}

/**
 * Stats Bar Component
 */
export function StatsBar({
  totalApps,
  featuredApps,
  categories,
  isMobile,
}: StatsBarProps): React.ReactElement {
  if (isMobile) {
    return (
      <div className="px-4 py-6 bg-card/30 border-b border-border/30">
        <div className="grid grid-cols-4 gap-4">
          <StatItem
            icon={BarChart3}
            label="Apps"
            value={totalApps}
            color="text-blue-500"
            delay={0}
            isMobile={isMobile}
          />
          <StatItem
            icon={Sparkles}
            label="Featured"
            value={featuredApps}
            color="text-amber-500"
            delay={0.1}
            isMobile={isMobile}
          />
          <StatItem
            icon={Activity}
            label="Categories"
            value={categories}
            color="text-green-500"
            delay={0.2}
            isMobile={isMobile}
          />
          <StatItem
            icon={Zap}
            label="Active"
            value={totalApps}
            color="text-purple-500"
            delay={0.3}
            isMobile={isMobile}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-6 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatItem
          icon={BarChart3}
          label="Total Applications"
          value={totalApps}
          color="text-blue-500"
          delay={0}
          isMobile={isMobile}
        />
        <StatItem
          icon={Sparkles}
          label="Featured Apps"
          value={featuredApps}
          color="text-amber-500"
          delay={0.1}
          isMobile={isMobile}
        />
        <StatItem
          icon={Activity}
          label="Categories"
          value={categories}
          color="text-green-500"
          delay={0.2}
          isMobile={isMobile}
        />
        <StatItem
          icon={Users}
          label="Active Users"
          value="50K+"
          color="text-purple-500"
          delay={0.3}
          isMobile={isMobile}
        />
      </div>
    </motion.div>
  );
}
