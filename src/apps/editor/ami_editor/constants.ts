/**
 * Constants for AMIEditor module
 */

/**
 * Available brain types
 */
export const BRAIN_TYPES = [
	"trader",
	"analyzer",
	"monitor",
	"aggregator",
	"oracle",
	"arbitrage",
] as const;

/**
 * Available worker types
 */
export const WORKER_TYPES = [
	"continuous",
	"periodic",
	"triggered",
	"scheduled",
] as const;

/**
 * Default intervals for workers
 */
export const DEFAULT_INTERVALS = {
	continuous: "1s",
	periodic: "1m",
	triggered: "on-event",
	scheduled: "1h",
} as const;

/**
 * Default empty script template
 */
export const DEFAULT_SCRIPT = `// Worker script
// Available context: { session, wallet, config }

async function execute(ctx) {
  // Your logic here
  return {
    status: 'success',
    data: {}
  };
}

return execute;`;

/**
 * Default empty prompt
 */
export const DEFAULT_PROMPT = "No prompts";

/**
 * Status badge colors
 */
export const STATUS_COLORS = {
	active: "bg-green-500",
	inactive: "bg-muted",
	error: "bg-red-500",
	pending: "bg-yellow-500",
} as const;

/**
 * Brain type colors
 */
export const BRAIN_COLORS: Record<string, string> = {
	trader: "text-blue-500",
	analyzer: "text-purple-500",
	monitor: "text-green-500",
	aggregator: "text-orange-500",
	oracle: "text-pink-500",
	arbitrage: "text-amber-500",
};

/**
 * Worker type colors
 */
export const WORKER_TYPE_COLORS: Record<string, string> = {
	continuous: "text-blue-700 dark:text-blue-400",
	periodic: "text-green-700 dark:text-green-600",
	triggered: "text-yellow-700 dark:text-yellow-400",
	scheduled: "text-purple-700 dark:text-purple-400",
};

