/**
 * Shared login hero: logo, title, description, features, Private Access button.
 * Used by AuthPage (single authentication screen).
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Bot, Network, LayoutGrid, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Graphite from "@/components/ui/vectors/logos/graphite";

export interface LoginHeroProps {
  onOpenAuth: () => void;
  className?: string;
}

const features = [
  { icon: Bot, label: "Autonomous AI agents and workers" },
  { icon: Network, label: "Web 5 and heterogeneous networks" },
  { icon: LayoutGrid, label: "Trading, strategies, canvas, and editor" },
  { icon: LogIn, label: "One sign-in with your GitHub account" },
] as const;

export function LoginHero({ onOpenAuth, className }: LoginHeroProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative z-10 w-full max-w-lg", className)}
    >
      {/* Card container */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "border border-border/60 bg-card/10 backdrop-blur-xl",
          "shadow-xl shadow-black/5 dark:shadow-black/20",
          "px-6 py-10 sm:px-10 sm:py-12"
        )}
      >
        {/* Subtle gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, var(--primary) / 0.15, transparent)",
          }}
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="relative inline-flex">
              <Graphite size={7} />
              <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/10 blur-2xl" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-3"
          >
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              STELS
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="mb-8 max-w-sm text-base leading-relaxed text-muted-foreground"
          >
            Distributed Web OS for autonomous AI agents. Professional laboratory for Web 5
            developers on heterogeneous networks.
          </motion.p>

          {/* Features grid */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.36, duration: 0.4 }}
            className="mb-8 grid w-full max-w-sm grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
          >
            {features.map(({ icon: Icon, label }, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border/40 bg-background/50 px-3 py-2.5 text-left",
                  "text-sm text-muted-foreground"
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{label}</span>
              </li>
            ))}
          </motion.ul>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.4 }}
            className="w-full max-w-xs sm:max-w-sm"
          >
            <Button
              onClick={onOpenAuth}
              size="lg"
              className={cn(
                "w-full px-6 py-6 text-base font-semibold rounded-xl",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "transition-all duration-300"
              )}
              aria-label="Private Access"
            >
              <Lock className="mr-2 h-4 w-4" />
              Private Access
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.52, duration: 0.4 }}
            className="mt-6 flex flex-col items-center gap-1 text-xs text-muted-foreground/70"
          >
            <p>Secure authentication via GitHub OAuth</p>
            <p>
              © {new Date().getFullYear()}{" "}
              <a
                href="https://gliesereum.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground hover:decoration-primary transition-colors"
              >
                Gliesereum Ukraine LLC
              </a>
              . All rights reserved.
            </p>
          </motion.footer>
        </div>
      </div>
    </motion.div>
  );
}
