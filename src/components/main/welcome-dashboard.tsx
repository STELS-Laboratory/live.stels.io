/**
 * Welcome Dashboard Component
 * Private zone - authenticated users dashboard
 * Rendered inside Layout with sidebar
 */

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Boxes } from "lucide-react";
import { navigateTo } from "@/lib/router";
import { AppCard } from "@/components/main/app-card";
import { motion } from "framer-motion";

/**
 * App configuration for dashboard cards
 */
const APPS = [
  {
    id: "editor",
    title: "Code Editor",
    description:
      "Professional AMI editor with syntax highlighting and code validation",
    icon: Code,
    accentColor: "#3b82f6",
    gradientFrom: "#3b82f6",
    gradientTo: "#1d4ed8",
    route: "editor",
    shortcut: "⌘E",
  },
  {
    id: "canvas",
    title: "Visual Canvas",
    description:
      "Node-based workflow designer for building AI agent pipelines",
    icon: Boxes,
    accentColor: "#8b5cf6",
    gradientFrom: "#8b5cf6",
    gradientTo: "#6d28d9",
    route: "canvas",
    shortcut: "⌘K",
  },
] as const;

/**
 * Container animation variants
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * Welcome Dashboard - Private Zone
 * Content only - Layout provides sidebar/header
 */
export function WelcomeDashboard(): React.ReactElement {
  const handleAppClick = useCallback((route: string) => {
    navigateTo(route);
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="mb-10">
          <div className="flex flex-col gap-2">
            <motion.p
              className="text-sm font-medium text-primary"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Welcome back
            </motion.p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Command Center
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Build, deploy and manage your AI agents and workflows with STELS
              Web 5 platform.
            </p>
          </div>
        </motion.div>

        {/* Apps Section */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Applications
            </h2>
            <span className="text-xs text-muted-foreground">
              {APPS.length} available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {APPS.map((app, index) => (
              <motion.div key={app.id} variants={itemVariants} custom={index}>
                <AppCard
                  id={app.id}
                  title={app.title}
                  description={app.description}
                  icon={app.icon}
                  accentColor={app.accentColor}
                  gradientFrom={app.gradientFrom}
                  gradientTo={app.gradientTo}
                  onClick={() => handleAppClick(app.route)}
                  shortcut={app.shortcut}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="mt-10">
          <div className="rounded border border-border/50 bg-card/30 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Ready to build?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start with the Canvas to design your first AI workflow, or
                  use the Editor for advanced configuration.
                </p>
              </div>
              <Button
                onClick={() => handleAppClick("canvas")}
                className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Boxes className="w-4 h-4 mr-2" />
                Open Canvas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Footer spacing */}
        <div className="h-8" />
      </motion.div>
    </div>
  );
}
