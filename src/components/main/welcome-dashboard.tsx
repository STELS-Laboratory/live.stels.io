/**
 * Welcome Dashboard Component
 * Private zone - authenticated users dashboard
 * Rendered inside Layout with sidebar
 */

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Code, 
  Boxes, 
  Bot, 
  GitBranch, 
  Zap, 
  TrendingUp, 
  Wallet, 
  Globe, 
  BarChart3,
  Sparkles,
} from "lucide-react";
import { navigateTo } from "@/lib/router";
import { AppCard } from "@/components/main/app-card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * App Groups configuration for dashboard
 */
const APP_GROUPS = [
  {
    id: "featured",
    label: "Featured",
    description: "Most used applications",
    apps: [
      {
        id: "canvas",
        title: "Visual Canvas",
        description: "Node-based workflow designer for building AI agent pipelines",
        icon: Boxes,
        accentColor: "#8b5cf6",
        gradientFrom: "#8b5cf6",
        gradientTo: "#6d28d9",
        route: "canvas",
        shortcut: "⌘K",
      },
      {
        id: "trading",
        title: "Trading Terminal",
        description: "Professional trading interface with real-time charts and order management",
        icon: TrendingUp,
        accentColor: "#10b981",
        gradientFrom: "#10b981",
        gradientTo: "#059669",
        route: "trading",
        shortcut: "⌘T",
        badge: "Pro",
      },
    ],
  },
  {
    id: "ai",
    label: "AI & Automation",
    description: "Build intelligent workflows",
    apps: [
      {
        id: "agents",
        title: "AI Agents",
        description: "Create, manage and deploy autonomous AI agents with custom behaviors",
        icon: Bot,
        accentColor: "#f59e0b",
        gradientFrom: "#f59e0b",
        gradientTo: "#d97706",
        route: "agents",
        shortcut: "⌘A",
      },
      {
        id: "chains",
        title: "Chains",
        description: "Build sequential processing chains for complex AI workflows",
        icon: GitBranch,
        accentColor: "#ec4899",
        gradientFrom: "#ec4899",
        gradientTo: "#db2777",
        route: "chains",
      },
      {
        id: "strategies",
        title: "Strategies",
        description: "Configure and deploy automated trading strategies",
        icon: Zap,
        accentColor: "#6366f1",
        gradientFrom: "#6366f1",
        gradientTo: "#4f46e5",
        route: "strategies",
      },
    ],
  },
  {
    id: "trading",
    label: "Trading",
    description: "Financial tools and accounts",
    apps: [
      {
        id: "accounts",
        title: "Accounts",
        description: "Manage exchange connections and API credentials",
        icon: Wallet,
        accentColor: "#14b8a6",
        gradientFrom: "#14b8a6",
        gradientTo: "#0d9488",
        route: "accounts",
      },
    ],
  },
  {
    id: "development",
    label: "Development",
    description: "Tools for advanced users",
    apps: [
      {
        id: "editor",
        title: "Code Editor",
        description: "Professional AMI editor with syntax highlighting and code validation",
        icon: Code,
        accentColor: "#3b82f6",
        gradientFrom: "#3b82f6",
        gradientTo: "#1d4ed8",
        route: "editor",
        shortcut: "⌘E",
      },
      {
        id: "domains",
        title: "Domains",
        description: "Configure custom domains and routing rules",
        icon: Globe,
        accentColor: "#8b5cf6",
        gradientFrom: "#8b5cf6",
        gradientTo: "#7c3aed",
        route: "domains",
      },
      {
        id: "metrics",
        title: "Metrics",
        description: "Monitor system performance and analytics dashboards",
        icon: BarChart3,
        accentColor: "#06b6d4",
        gradientFrom: "#06b6d4",
        gradientTo: "#0891b2",
        route: "metrics",
      },
    ],
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
      ease: [0.16, 1, 0.3, 1] as const,
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

  const totalApps = APP_GROUPS.reduce((sum, group) => sum + group.apps.length, 0);

  return (
    <div className="h-full w-full overflow-y-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="mb-10">
          <div className="flex flex-col gap-2">
            <motion.div
              className="flex items-center gap-2 text-sm font-medium text-primary"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4" />
              Welcome back
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              STELS Command Center
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Build, deploy and manage your AI agents and workflows with STELS
              Web 5 platform.
            </p>
          </div>
        </motion.div>

        {/* Featured Apps - Larger cards */}
        <motion.div variants={itemVariants} className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {APP_GROUPS[0].label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {APP_GROUPS[0].description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {APP_GROUPS[0].apps.map((app, index) => (
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
                  badge={'badge' in app ? app.badge : undefined}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Other App Groups */}
        {APP_GROUPS.slice(1).map((group, groupIndex) => (
          <motion.div 
            key={group.id} 
            variants={itemVariants} 
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {group.label}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {group.description}
                </p>
              </div>
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-full">
                {group.apps.length} apps
              </span>
            </div>

            <div className={cn(
              "grid gap-3",
              group.apps.length === 1 
                ? "grid-cols-1 max-w-md" 
                : group.apps.length === 2 
                  ? "grid-cols-1 sm:grid-cols-2" 
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}>
              {group.apps.map((app, index) => (
                <motion.button
                  key={app.id}
                  variants={itemVariants}
                  custom={groupIndex * 10 + index}
                  onClick={() => handleAppClick(app.route)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "group relative flex items-center gap-4 p-4 rounded-lg border",
                    "bg-card/60 hover:bg-card border-border/50 hover:border-border",
                    "text-left transition-all duration-200",
                    "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                      "transition-transform duration-200 group-hover:scale-110"
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${app.gradientFrom} 0%, ${app.gradientTo} 100%)`,
                    }}
                  >
                    <app.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {app.title}
                      </h3>
                      {'badge' in app && app.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {app.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight 
                    className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                    style={{ color: app.accentColor }}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border/50 bg-card/30 p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{totalApps}</div>
              <div className="text-xs text-muted-foreground">Applications</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/30 p-4 text-center">
              <div className="text-2xl font-bold text-primary">AI</div>
              <div className="text-xs text-muted-foreground">Powered</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/30 p-4 text-center">
              <div className="text-2xl font-bold text-foreground">24/7</div>
              <div className="text-xs text-muted-foreground">Automation</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/30 p-4 text-center">
              <div className="text-2xl font-bold text-foreground">∞</div>
              <div className="text-xs text-muted-foreground">Possibilities</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="mt-8">
          <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Ready to build?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start with the Canvas to design your first AI workflow, or explore the Trading Terminal.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAppClick("trading")}
                  className="shrink-0"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trading
                </Button>
                <Button
                  onClick={() => handleAppClick("canvas")}
                  className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Boxes className="w-4 h-4 mr-2" />
                  Canvas
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer spacing */}
        <div className="h-8" />
      </motion.div>
    </div>
  );
}
