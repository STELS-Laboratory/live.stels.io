/**
 * Worker script templates for different use cases
 */

import type { WorkerCreateRequest } from "../store.ts";

/**
 * Template category
 */
export type TemplateCategory =
	| "trading"
	| "monitoring"
	| "analytics"
	| "maintenance";

/**
 * Worker template definition
 */
export interface WorkerTemplate {
	id: string;
	name: string;
	description: string;
	category: TemplateCategory;
	icon: string;
	config: Omit<WorkerCreateRequest, "note">;
}

/**
 * Grid Trading Strategy Template
 */
const GRID_TRADING_TEMPLATE: WorkerTemplate = {
	id: "grid-trading",
	name: "Grid Trading",
	description:
		"Automated grid trading strategy with configurable levels and step size",
	category: "trading",
	icon: "📊",
	config: {
		scriptContent: `const exchange = new Stels.runtime.cex.bybit({
  apiKey: 'YOUR_API_KEY',
  secret: 'YOUR_SECRET'
});

const SYMBOL = 'BTC/USDT';
const GRID_LEVELS = 10;
const GRID_STEP = 100;
const ORDER_SIZE = 0.001;

logger.info('Grid Trading Strategy v2.0');
logger.info(\`Node: \${Stels.config.nid}\`);
logger.info(\`Symbol: \${SYMBOL}\`);

try {
  const ticker = await exchange.fetchTicker(SYMBOL);
  const basePrice = ticker.last;
  logger.info(\`Current price: \${basePrice}\`);

  const existingOrders = await exchange.fetchOpenOrders(SYMBOL);
  if (existingOrders.length > 0) {
    logger.warn('Grid already exists, skipping placement');
    return;
  }

  const startPrice = basePrice - (GRID_LEVELS / 2) * GRID_STEP;

  for (let i = 0; i < GRID_LEVELS; i++) {
    const price = Math.round(startPrice + (i * GRID_STEP));
    const side = price < basePrice ? 'buy' : 'sell';

    const order = await exchange.createLimitOrder(SYMBOL, side, ORDER_SIZE, price);
    logger.info(\`✅ \${side.toUpperCase()} order @ \${price}: \${order.id}\`);

    await Stels.sleep(200);
  }

  logger.info(\`🎉 Grid complete: \${GRID_LEVELS} orders placed\`);
} catch (error) {
  logger.error('Grid strategy error:', error);
  throw error;
}`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		executionMode: "leader",
		priority: "critical",
	},
};

/**
 * DCA Strategy Template
 */
const DCA_STRATEGY_TEMPLATE: WorkerTemplate = {
	id: "dca-strategy",
	name: "DCA Strategy",
	description: "Dollar Cost Averaging with hourly purchases",
	category: "trading",
	icon: "💰",
	config: {
		scriptContent: `const exchange = new Stels.runtime.cex.binance({
  apiKey: 'YOUR_API_KEY',
  secret: 'YOUR_SECRET'
});

const SYMBOL = 'BTC/USDT';
const DAILY_AMOUNT_USD = 100;
const BUY_INTERVAL_MS = 3600000; // 1 hour

logger.info('DCA Strategy v2.0');
logger.info(\`Node: \${Stels.config.nid}\`);
logger.info(\`Symbol: \${SYMBOL}\`);
logger.info(\`Daily: $\${DAILY_AMOUNT_USD}\`);

while (true) {
  try {
    const hourlyAmount = DAILY_AMOUNT_USD / 24;
    const ticker = await exchange.fetchTicker(SYMBOL);
    const price = ticker.last;
    const amount = hourlyAmount / price;

    logger.info(\`💰 Buying \${amount.toFixed(8)} BTC @ \${price}\`);

    const order = await exchange.createMarketBuyOrder(SYMBOL, amount);
    logger.info('✅ Order executed:', order.id);

    await Stels.webfix({
      brain: Stels.net,
      method: 'set',
      channel: ['strategy', 'dca', SYMBOL, Date.now()],
      module: 'dca',
      raw: {
        orderId: order.id,
        amount: order.amount,
        price: order.price,
        cost: order.cost,
        node: Stels.config.nid
      },
      timestamp: Date.now()
    });

    logger.info(\`⏰ Next buy in \${BUY_INTERVAL_MS / 1000 / 60} minutes\`);
  } catch (error) {
    logger.error('❌ DCA error:', error);
    
    if (error.name === 'InsufficientFunds') {
      logger.error('⚠️  Insufficient balance, pausing');
      await Stels.sleep(86400000); // 24h
    }
  }

  await Stels.sleep(BUY_INTERVAL_MS);
}`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		executionMode: "leader",
		priority: "high",
		mode: "single",
	},
};

/**
 * Market Monitoring Template
 */
const MARKET_MONITOR_TEMPLATE: WorkerTemplate = {
	id: "market-monitor",
	name: "Market Monitor",
	description: "Collect and store market data from multiple symbols",
	category: "monitoring",
	icon: "📈",
	config: {
		scriptContent: `const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

for (const symbol of SYMBOLS) {
  try {
    const ticker = await exchange.fetchTicker(symbol);

    await Stels.webfix({
      brain: Stels.net,
      method: 'set',
      channel: ['market', 'ticker', symbol, Stels.config.nid],
      module: 'market',
      raw: {
        price: ticker.last,
        volume: ticker.baseVolume,
        change: ticker.percentage,
        node: Stels.config.nid
      },
      timestamp: Date.now()
    });

    logger.debug(\`Updated \${symbol}: \${ticker.last}\`);
  } catch (error) {
    logger.error(\`Failed to update \${symbol}\`, error);
  }
}

logger.info('Market data collection completed');`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		executionMode: "parallel",
		priority: "normal",
	},
};

/**
 * Balance Monitor Template
 */
const BALANCE_MONITOR_TEMPLATE: WorkerTemplate = {
	id: "balance-monitor",
	name: "Balance Monitor",
	description: "Monitor account balances and update distributed KV",
	category: "monitoring",
	icon: "💵",
	config: {
		scriptContent: `const exchange = new Stels.runtime.cex.bybit({
  apiKey: 'YOUR_API_KEY',
  secret: 'YOUR_SECRET'
});

try {
  const balance = await exchange.fetchBalance();

  const totalEquity = parseFloat(balance.info?.result?.list?.[0]?.totalEquity || '0');
  const totalAvailable = parseFloat(balance.info?.result?.list?.[0]?.totalAvailableBalance || '0');

  await Stels.webfix({
    brain: Stels.net,
    method: 'set',
    channel: ['account', 'balance', Stels.config.nid],
    module: 'balance',
    raw: {
      equity: totalEquity,
      available: totalAvailable,
      node: Stels.config.nid,
      timestamp: Date.now()
    },
    timestamp: Date.now()
  });

  logger.info(\`💵 Balance updated: \${totalEquity} USDT\`);
} catch (error) {
  logger.error('Balance update failed:', error);
  throw error;
}`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		executionMode: "parallel",
		priority: "critical",
	},
};

/**
 * Price Aggregator Template
 */
const PRICE_AGGREGATOR_TEMPLATE: WorkerTemplate = {
	id: "price-aggregator",
	name: "Price Aggregator",
	description: "Aggregate prices from all nodes and calculate VWAP",
	category: "analytics",
	icon: "🔢",
	config: {
		scriptContent: `const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
const NODES = ['s-0001', 's-0002', 's-0003'];

for (const symbol of SYMBOLS) {
  const prices = [];

  for (const node of NODES) {
    try {
      const data = await Stels.net.get(['market', 'ticker', symbol, node]);
      if (data.value) {
        prices.push(data.value.raw.price);
      }
    } catch (error) {
      logger.warn(\`Failed to fetch \${symbol} from \${node}\`);
    }
  }

  if (prices.length === 0) continue;

  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const spread = maxPrice - minPrice;

  await Stels.webfix({
    brain: Stels.net,
    method: 'set',
    channel: ['market', 'aggregated', symbol],
    module: 'market',
    raw: {
      avgPrice,
      minPrice,
      maxPrice,
      spread,
      nodeCount: prices.length,
      timestamp: Date.now()
    },
    timestamp: Date.now()
  });

  logger.info(\`\${symbol} avg: \${avgPrice.toFixed(2)} (spread: \${spread.toFixed(2)})\`);
}`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		executionMode: "leader",
		priority: "high",
	},
};

/**
 * Node Health Check Template
 */
const HEALTH_CHECK_TEMPLATE: WorkerTemplate = {
	id: "health-check",
	name: "Health Check",
	description: "Monitor node health and system resources",
	category: "monitoring",
	icon: "🏥",
	config: {
		scriptContent: `const nodeId = Stels.config.nid;

const health = {
  node: nodeId,
  memory: Deno.memoryUsage(),
  cpu: Deno.loadavg(),
  uptime: Date.now() - (Stels.startTime || Date.now()),
  timestamp: Date.now()
};

await Stels.webfix({
  brain: Stels.net,
  method: 'set',
  channel: ['health', nodeId],
  module: 'monitoring',
  raw: health,
  timestamp: Date.now()
});

logger.debug(\`Health: CPU \${health.cpu[0].toFixed(2)} Memory \${(health.memory.heapUsed / 1024 / 1024).toFixed(0)}MB\`);`,
		dependencies: [],
		version: "1.19.2",
		executionMode: "parallel",
		priority: "low",
	},
};

/**
 * Log Cleanup Template
 */
const LOG_CLEANUP_TEMPLATE: WorkerTemplate = {
	id: "log-cleanup",
	name: "Log Cleanup",
	description: "Clean up old logs (node-specific maintenance)",
	category: "maintenance",
	icon: "🧹",
	config: {
		scriptContent: `logger.info('Log cleanup started on', Stels.config.nid);

const OLD_LOGS_PREFIX = [Stels.config.network, 'logs'];
const entries = await Array.fromAsync(
  Stels.local.list({ prefix: OLD_LOGS_PREFIX })
);

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const cutoff = Date.now() - RETENTION_MS;

let deleted = 0;
for (const entry of entries) {
  const timestamp = parseInt(entry.key[entry.key.length - 1]);
  if (timestamp < cutoff) {
    await Stels.local.delete(entry.key);
    deleted++;
  }
}

logger.info(\`Cleanup complete: \${deleted} old logs deleted\`);`,
		dependencies: [],
		version: "1.19.2",
		executionMode: "exclusive",
		priority: "low",
		assignedNode: "s-0001",
	},
};

/**
 * Empty Template
 */
const EMPTY_TEMPLATE: WorkerTemplate = {
	id: "empty",
	name: "Empty Script",
	description: "Start from scratch with a blank template",
	category: "analytics",
	icon: "📝",
	config: {
		scriptContent: `// Worker script
// Available context: { Stels, logger }

logger.info('Worker started on node:', Stels.config.nid);

// Your logic here

logger.info('Worker execution completed');`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		executionMode: "parallel",
		priority: "normal",
	},
};

/**
 * All available templates
 */
export const WORKER_TEMPLATES: Record<string, WorkerTemplate> = {
	"grid-trading": GRID_TRADING_TEMPLATE,
	"dca-strategy": DCA_STRATEGY_TEMPLATE,
	"market-monitor": MARKET_MONITOR_TEMPLATE,
	"balance-monitor": BALANCE_MONITOR_TEMPLATE,
	"price-aggregator": PRICE_AGGREGATOR_TEMPLATE,
	"health-check": HEALTH_CHECK_TEMPLATE,
	"log-cleanup": LOG_CLEANUP_TEMPLATE,
	empty: EMPTY_TEMPLATE,
};

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
	category: TemplateCategory,
): WorkerTemplate[] {
	return Object.values(WORKER_TEMPLATES).filter((t) => t.category === category);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): TemplateCategory[] {
	return ["trading", "monitoring", "analytics", "maintenance"];
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkerTemplate | null {
	return WORKER_TEMPLATES[id] || null;
}

