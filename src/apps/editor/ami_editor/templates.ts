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
	| "maintenance"
	| "integration"
	| "notification";

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
} catch {
  logger.error('Grid strategy error:', error);
  throw error;
}`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		scope: "network",
		executionMode: "leader",
		priority: "critical",
		mode: "loop",
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
  } catch {
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
		scope: "network",
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
  } catch {
    logger.error(\`Failed to update \${symbol}\`, error);
  }
}

logger.info('Market data collection completed');`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		scope: "local",
		executionMode: "leader",
		priority: "normal",
		mode: "loop",
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
} catch {
  logger.error('Balance update failed:', error);
  throw error;
}`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		scope: "local",
		executionMode: "leader",
		priority: "critical",
		mode: "loop",
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
    } catch {
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
		scope: "network",
		executionMode: "leader",
		priority: "high",
		mode: "loop",
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
		scope: "local",
		executionMode: "leader",
		priority: "low",
		mode: "loop",
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
		scope: "local",
		executionMode: "leader",
		priority: "low",
		mode: "loop",
	},
};

/**
 * Arbitrage Monitor Template
 */
const ARBITRAGE_MONITOR_TEMPLATE: WorkerTemplate = {
	id: "arbitrage-monitor",
	name: "Arbitrage Monitor",
	description: "Monitor price differences across exchanges for arbitrage opportunities",
	category: "trading",
	icon: "💱",
	config: {
		scriptContent: `const exchanges = {
  binance: new Stels.runtime.cex.binance(),
  bybit: new Stels.runtime.cex.bybit()
};

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
const MIN_SPREAD_PERCENT = 0.5; // 0.5% minimum spread

logger.info('Arbitrage Monitor v1.0');
logger.info(\`Symbols: \${SYMBOLS.join(', ')}\`);

for (const symbol of SYMBOLS) {
  const prices = {};
  
  for (const [name, exchange] of Object.entries(exchanges)) {
    try {
      const ticker = await exchange.fetchTicker(symbol);
      prices[name] = ticker.last;
    } catch {
      logger.warn(\`Failed to fetch \${symbol} from \${name}\`);
    }
  }

  if (Object.keys(prices).length < 2) continue;

  const priceArray = Object.values(prices);
  const minPrice = Math.min(...priceArray);
  const maxPrice = Math.max(...priceArray);
  const spread = ((maxPrice - minPrice) / minPrice) * 100;

  if (spread >= MIN_SPREAD_PERCENT) {
    const buyExchange = Object.keys(prices).find(k => prices[k] === minPrice);
    const sellExchange = Object.keys(prices).find(k => prices[k] === maxPrice);

    await Stels.webfix({
      brain: Stels.net,
      method: 'set',
      channel: ['arbitrage', 'opportunity', symbol, Date.now()],
      module: 'trading',
      raw: {
        symbol,
        buyExchange,
        sellExchange,
        buyPrice: minPrice,
        sellPrice: maxPrice,
        spread: spread.toFixed(2),
        profit: ((maxPrice - minPrice) * 0.998).toFixed(2), // 0.2% fees
        node: Stels.config.nid
      },
      timestamp: Date.now()
    });

    logger.info(\`🚨 \${symbol}: Buy @ \${buyExchange} \${minPrice}, Sell @ \${sellExchange} \${maxPrice} | Spread: \${spread.toFixed(2)}%\`);
  }
}`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		scope: "network",
		executionMode: "parallel",
		priority: "high",
		mode: "loop",
	},
};

/**
 * Telegram Bot Template
 */
const TELEGRAM_BOT_TEMPLATE: WorkerTemplate = {
	id: "telegram-bot",
	name: "Telegram Bot",
	description: "Send trading signals and alerts to Telegram",
	category: "notification",
	icon: "📱",
	config: {
		scriptContent: `const BOT_TOKEN = 'YOUR_BOT_TOKEN';
const CHAT_ID = 'YOUR_CHAT_ID';

async function sendTelegram(message) {
  const url = \`https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage\`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  });

  if (!response.ok) {
    throw new Error('Telegram API error');
  }
}

// Check for trading signals
const signals = await Array.fromAsync(
  Stels.net.list({ prefix: [Stels.config.network, 'trading', 'signals'] })
);

for (const signal of signals) {
  const data = signal.value.raw;
  
  const message = \`
🚨 *Trading Signal*

Symbol: \${data.symbol}
Type: \${data.type}
Price: $\${data.price}
Target: $\${data.target}
Stop Loss: $\${data.stopLoss}

Confidence: \${data.confidence}%
Node: \${data.node}
  \`.trim();

  try {
    await sendTelegram(message);
    logger.info('✅ Signal sent to Telegram:', data.symbol);
    
    // Mark as sent
    await Stels.net.delete(signal.key);
  } catch {
    logger.error('Failed to send Telegram message:', error);
  }
}`,
		dependencies: [],
		version: "1.19.2",
		scope: "network",
		executionMode: "leader",
		priority: "normal",
		mode: "loop",
	},
};

/**
 * Position Manager Template
 */
const POSITION_MANAGER_TEMPLATE: WorkerTemplate = {
	id: "position-manager",
	name: "Position Manager",
	description: "Manage open positions with stop-loss and take-profit",
	category: "trading",
	icon: "📊",
	config: {
		scriptContent: `const exchange = new Stels.runtime.cex.bybit({
  apiKey: 'YOUR_API_KEY',
  secret: 'YOUR_SECRET'
});

logger.info('Position Manager v1.0');

const positions = await exchange.fetchPositions();
const openPositions = positions.filter(p => parseFloat(p.contracts) > 0);

logger.info(\`Managing \${openPositions.length} positions\`);

for (const position of openPositions) {
  const symbol = position.symbol;
  const side = position.side; // 'long' or 'short'
  const entryPrice = parseFloat(position.entryPrice);
  const currentPrice = parseFloat(position.markPrice);
  const contracts = parseFloat(position.contracts);
  
  const pnlPercent = side === 'long'
    ? ((currentPrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - currentPrice) / entryPrice) * 100;

  logger.info(\`\${symbol}: \${side} @ \${entryPrice} | Current: \${currentPrice} | PnL: \${pnlPercent.toFixed(2)}%\`);

  // Stop-Loss: -5%
  if (pnlPercent <= -5) {
    logger.warn(\`🛑 Stop-Loss triggered for \${symbol}\`);
    
    const order = await exchange.createMarketOrder(
      symbol,
      side === 'long' ? 'sell' : 'buy',
      contracts
    );
    
    logger.info(\`✅ Position closed: \${order.id}\`);
    continue;
  }

  // Take-Profit: +10%
  if (pnlPercent >= 10) {
    logger.info(\`✅ Take-Profit triggered for \${symbol}\`);
    
    const order = await exchange.createMarketOrder(
      symbol,
      side === 'long' ? 'sell' : 'buy',
      contracts
    );
    
    logger.info(\`✅ Position closed: \${order.id}\`);
    continue;
  }

  // Trailing Stop: Move stop-loss to break-even at +5%
  if (pnlPercent >= 5) {
    logger.info(\`📈 Trailing stop activated for \${symbol}\`);
    // Implement trailing stop logic here
  }
}

await Stels.webfix({
  brain: Stels.net,
  method: 'set',
  channel: ['trading', 'positions', Stels.config.nid],
  module: 'trading',
  raw: {
    openPositions: openPositions.length,
    totalPnL: openPositions.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl), 0),
    node: Stels.config.nid,
    timestamp: Date.now()
  },
  timestamp: Date.now()
});`,
		dependencies: ["gliesereum"],
		version: "1.19.2",
		scope: "local",
		executionMode: "leader",
		priority: "critical",
		mode: "loop",
	},
};

/**
 * WebSocket Monitor Template
 */
const WEBSOCKET_MONITOR_TEMPLATE: WorkerTemplate = {
	id: "websocket-monitor",
	name: "WebSocket Monitor",
	description: "Monitor real-time price updates via WebSocket",
	category: "monitoring",
	icon: "🔌",
	config: {
		scriptContent: `const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

logger.info('WebSocket Monitor v1.0');
logger.info(\`Symbols: \${SYMBOLS.join(', ')}\`);

// Connect to Binance WebSocket
const streams = SYMBOLS.map(s => \`\${s.toLowerCase().replace('/', '')}@ticker\`);
const wsUrl = \`wss://stream.binance.com:9443/stream?streams=\${streams.join('/')}\`;

const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  logger.info('✅ WebSocket connected');
};

ws.onmessage = async (event) => {
  const data = JSON.parse(event.data);
  const ticker = data.data;
  
  const symbol = ticker.s.replace('USDT', '/USDT');
  const price = parseFloat(ticker.c);
  const volume = parseFloat(ticker.v);
  const priceChange = parseFloat(ticker.P);

  await Stels.webfix({
    brain: Stels.local,
    method: 'set',
    channel: ['market', 'realtime', symbol],
    module: 'market',
    raw: {
      price,
      volume,
      priceChange,
      timestamp: Date.now(),
      node: Stels.config.nid
    },
    timestamp: Date.now()
  });

  logger.debug(\`\${symbol}: $\${price} (\${priceChange > 0 ? '+' : ''}\${priceChange.toFixed(2)}%)\`);
};

ws.onerror = (error) => {
  logger.error('WebSocket error:', error);
};

ws.onclose = () => {
  logger.warn('WebSocket disconnected');
};

// Keep connection alive
while (true) {
  await Stels.sleep(30000);
  if (ws.readyState === WebSocket.CLOSED) {
    logger.error('Connection lost, restarting...');
    throw new Error('WebSocket closed');
  }
}`,
		dependencies: [],
		version: "1.19.2",
		scope: "local",
		executionMode: "leader",
		priority: "high",
		mode: "single",
	},
};

/**
 * Database Backup Template
 */
const DATABASE_BACKUP_TEMPLATE: WorkerTemplate = {
	id: "database-backup",
	name: "Database Backup",
	description: "Backup distributed KV data to external storage",
	category: "maintenance",
	icon: "💾",
	config: {
		scriptContent: `logger.info('Database Backup v1.0');
logger.info('Node:', Stels.config.nid);

const BACKUP_PREFIX = [Stels.config.network];
const entries = await Array.fromAsync(
  Stels.net.list({ prefix: BACKUP_PREFIX })
);

logger.info(\`Found \${entries.length} entries to backup\`);

const backup = {
  network: Stels.config.network,
  node: Stels.config.nid,
  timestamp: Date.now(),
  entries: entries.map(e => ({
    key: e.key,
    value: e.value,
    versionstamp: e.versionstamp
  }))
};

// Save to local storage
await Stels.webfix({
  brain: Stels.local,
  method: 'set',
  channel: ['backup', Date.now()],
  module: 'maintenance',
  raw: backup,
  timestamp: Date.now()
});

// Optional: Upload to external storage (S3, etc)
// const s3Url = await uploadToS3(backup);
// logger.info('Backup uploaded to S3:', s3Url);

logger.info(\`✅ Backup complete: \${entries.length} entries saved\`);

// Cleanup old backups (keep last 7 days)
const backups = await Array.fromAsync(
  Stels.local.list({ prefix: [Stels.config.network, 'backup'] })
);

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const cutoff = Date.now() - RETENTION_MS;

let deleted = 0;
for (const backup of backups) {
  const timestamp = parseInt(backup.key[backup.key.length - 1]);
  if (timestamp < cutoff) {
    await Stels.local.delete(backup.key);
    deleted++;
  }
}

if (deleted > 0) {
  logger.info(\`🧹 Cleaned up \${deleted} old backups\`);
}`,
		dependencies: [],
		version: "1.19.2",
		scope: "local",
		executionMode: "leader",
		priority: "normal",
		mode: "loop",
	},
};

/**
 * API Endpoint Template
 */
const API_ENDPOINT_TEMPLATE: WorkerTemplate = {
	id: "api-endpoint",
	name: "REST API Endpoint",
	description: "Create HTTP API endpoint for external integrations",
	category: "integration",
	icon: "🌐",
	config: {
		scriptContent: `// HTTP Server for API endpoint
const PORT = 8080;

const handler = async (req) => {
  const url = new URL(req.url);
  
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // GET /health
    if (url.pathname === '/health' && req.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        node: Stels.config.nid,
        timestamp: Date.now()
      }), { headers });
    }

    // GET /balance
    if (url.pathname === '/balance' && req.method === 'GET') {
      const data = await Stels.net.get(['account', 'balance', Stels.config.nid]);
      return new Response(JSON.stringify({
        success: true,
        data: data.value?.raw || {}
      }), { headers });
    }

    // GET /positions
    if (url.pathname === '/positions' && req.method === 'GET') {
      const data = await Stels.net.get(['trading', 'positions', Stels.config.nid]);
      return new Response(JSON.stringify({
        success: true,
        data: data.value?.raw || {}
      }), { headers });
    }

    // POST /signal
    if (url.pathname === '/signal' && req.method === 'POST') {
      const body = await req.json();
      
      await Stels.webfix({
        brain: Stels.net,
        method: 'set',
        channel: ['trading', 'signals', Date.now()],
        module: 'trading',
        raw: body,
        timestamp: Date.now()
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Signal received'
      }), { headers });
    }

    return new Response(JSON.stringify({
      error: 'Not found'
    }), { status: 404, headers });

  } catch {
    logger.error('API error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), { status: 500, headers });
  }
};

logger.info(\`🌐 API Server starting on port \${PORT}\`);
Deno.serve({ port: PORT }, handler);`,
		dependencies: [],
		version: "1.19.2",
		scope: "local",
		executionMode: "exclusive",
		priority: "high",
		mode: "single",
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
		scope: "local",
		executionMode: "leader",
		priority: "normal",
		mode: "loop",
	},
};

/**
 * All available templates
 */
export const WORKER_TEMPLATES: Record<string, WorkerTemplate> = {
	// Trading
	"grid-trading": GRID_TRADING_TEMPLATE,
	"dca-strategy": DCA_STRATEGY_TEMPLATE,
	"arbitrage-monitor": ARBITRAGE_MONITOR_TEMPLATE,
	"position-manager": POSITION_MANAGER_TEMPLATE,
	
	// Monitoring
	"market-monitor": MARKET_MONITOR_TEMPLATE,
	"balance-monitor": BALANCE_MONITOR_TEMPLATE,
	"websocket-monitor": WEBSOCKET_MONITOR_TEMPLATE,
	"health-check": HEALTH_CHECK_TEMPLATE,
	
	// Analytics
	"price-aggregator": PRICE_AGGREGATOR_TEMPLATE,
	
	// Maintenance
	"log-cleanup": LOG_CLEANUP_TEMPLATE,
	"database-backup": DATABASE_BACKUP_TEMPLATE,
	
	// Integration
	"api-endpoint": API_ENDPOINT_TEMPLATE,
	
	// Notification
	"telegram-bot": TELEGRAM_BOT_TEMPLATE,
	
	// Other
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
	return ["trading", "monitoring", "analytics", "maintenance", "integration", "notification"];
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkerTemplate | null {
	return WORKER_TEMPLATES[id] || null;
}
