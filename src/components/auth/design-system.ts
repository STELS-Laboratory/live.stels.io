/**
 * Auth Components Design System
 * Unified design tokens and configuration for all authentication components
 */

import type { NetworkConfig } from "@/stores/modules/auth.store";

/**
 * Design tokens for consistent styling across auth components
 */
export const authDesignTokens = {
  /**
   * Corner decoration sizes
   */
  corners: {
    tiny: "w-1 h-1",
    small: "w-1.5 h-1.5",
    medium: "w-2 h-2",
    large: "w-3 h-3",
  },

  /**
   * Corner positioning
   */
  cornerPositions: {
    topLeft: "-top-0.5 -left-0.5",
    topRight: "-top-0.5 -right-0.5",
    bottomLeft: "-bottom-0.5 -left-0.5",
    bottomRight: "-bottom-0.5 -right-0.5",
  },

  /**
   * Wallet type colors
   */
  walletTypes: {
    create: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      hover: "hover:border-amber-500/50",
      icon: "text-amber-500",
    },
    import: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      hover: "hover:border-blue-500/50",
      icon: "text-blue-500",
    },
  },

  /**
   * Network colors
   */
  networks: {
    testnet: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    mainnet: {
      border: "border-green-500/30",
      bg: "bg-green-500/10",
      text: "text-green-500",
      badge: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    localnet: {
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
      text: "text-purple-500",
      badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
  },

  /**
   * Status colors
   */
  status: {
    success: {
      border: "border-green-500/30",
      bg: "bg-green-500/10",
      text: "text-green-500",
      icon: "text-green-500",
    },
    error: {
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-500",
      icon: "text-red-500",
    },
    warning: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      icon: "text-amber-500",
    },
    info: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      icon: "text-blue-500",
    },
  },

  /**
   * Spacing
   */
  spacing: {
    card: "p-4 sm:p-6",
    cardHeader: "px-4 sm:px-6 py-4",
    cardContent: "px-4 sm:px-6 pb-6",
    section: "space-y-4",
    inline: "gap-3",
  },

  /**
   * Typography
   */
  typography: {
    title: "text-xl sm:text-2xl font-bold text-foreground",
    subtitle: "text-sm text-muted-foreground",
    sectionTitle: "text-base sm:text-lg font-semibold text-card-foreground",
    label: "text-sm font-medium text-muted-foreground",
    body: "text-sm text-muted-foreground",
    mono: "font-mono text-xs text-foreground break-all",
  },

  /**
   * Animations
   */
  transitions: {
    default: "transition-all duration-300 ease-in-out",
    fast: "transition-all duration-150 ease-in-out",
    slow: "transition-all duration-500 ease-in-out",
    colors: "transition-colors duration-200",
  },

  /**
   * Interactive states
   */
  interactive: {
    hover: "hover:bg-muted/50 cursor-pointer",
    focus: "focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none",
    active: "active:scale-[0.98]",
    disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  },

  /**
   * Button sizes (WCAG 2.1 compliant)
   */
  buttons: {
    default: "h-10 min-h-[44px] touch-manipulation",
    large: "h-12 min-h-[48px] touch-manipulation",
  },
} as const;

/**
 * Connection step configuration
 */
export const connectionSteps = [
  {
    label: "Initialize connection",
    progress: 10,
    description: "Initializing secure connection...",
  },
  {
    label: "Validate credentials",
    progress: 20,
    description: "Validating wallet credentials...",
  },
  {
    label: "Create transaction",
    progress: 35,
    description: "Creating authentication transaction...",
  },
  {
    label: "Sign transaction",
    progress: 50,
    description: "Signing transaction with private key...",
  },
  {
    label: "Send to network",
    progress: 65,
    description: "Encrypting and sending to network...",
  },
  {
    label: "Verify signature",
    progress: 80,
    description: "Verifying transaction signature...",
  },
  {
    label: "Establish WebSocket",
    progress: 90,
    description: "Establishing WebSocket connection...",
  },
  {
    label: "Create session",
    progress: 100,
    description: "Creating secure session...",
  },
] as const;

/**
 * Helper function to get network colors
 */
export function getNetworkColors(
  networkId: NetworkConfig["id"],
): typeof authDesignTokens.networks.testnet {
  return (
    authDesignTokens.networks[networkId] || authDesignTokens.networks.testnet
  );
}

/**
 * Helper function to build corner decoration classes
 */
export function buildCornerClasses(
  size: keyof typeof authDesignTokens.corners = "small",
  position: keyof typeof authDesignTokens.cornerPositions = "topLeft",
): string {
  return `${authDesignTokens.corners[size]} ${authDesignTokens.cornerPositions[position]}`;
}

/**
 * Helper function to combine design token classes
 */
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

