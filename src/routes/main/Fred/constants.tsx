/**
 * Constants for Fred (FRED Economic Indicators) module
 */

import {
  Activity,
  BarChart3,
  Globe,
  LineChart,
  PieChart,
  TrendingUp,
} from "lucide-react";
import type { CategoryData } from "./types";

/**
 * Economic indicator categories with metadata
 */
export const CATEGORIES: Record<string, CategoryData> = {
  macro: {
    name: "macro",
    displayName: "Macroeconomic",
    color: "bg-blue-500",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  social: {
    name: "social",
    displayName: "Social",
    color: "bg-green-500",
    icon: <Activity className="w-4 h-4" />,
  },
  tech: {
    name: "tech",
    displayName: "Technology",
    color: "bg-purple-500",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  invest: {
    name: "invest",
    displayName: "Investment",
    color: "bg-orange-500",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  external: {
    name: "external",
    displayName: "External Trade",
    color: "bg-red-500",
    icon: <Globe className="w-4 h-4" />,
  },
  fiscal: {
    name: "fiscal",
    displayName: "Fiscal",
    color: "bg-yellow-500",
    icon: <PieChart className="w-4 h-4" />,
  },
  depth: {
    name: "depth",
    displayName: "Financial Depth",
    color: "bg-indigo-500",
    icon: <LineChart className="w-4 h-4" />,
  },
  energy: {
    name: "energy",
    displayName: "Energy",
    color: "bg-teal-500",
    icon: <Activity className="w-4 h-4" />,
  },
};

/**
 * Default category color for unknown categories
 */
export const DEFAULT_CATEGORY_COLOR = "bg-zinc-500";

/**
 * Trend colors based on direction
 */
export const TREND_COLORS = {
  up: "text-green-500",
  down: "text-red-500",
  neutral: "text-zinc-400",
} as const;

/**
 * Value thresholds for highlighting
 */
export const VALUE_THRESHOLDS = {
  high: 100000,
  medium: 1000,
  low: 0,
} as const;
