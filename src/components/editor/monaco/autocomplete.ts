/**
 * Monaco Editor Autocomplete Configuration for Heterogen Runtime Workers
 * @version 2.1.0
 *
 * Note: This module provides type definitions and utilities for Monaco Editor.
 * Monaco Editor (npm:monaco-editor or @monaco-editor/react) should be installed separately.
 */

// Track if types have been loaded to prevent multiple loads
let typesLoaded = false;

// Support HMR (Hot Module Replacement) - reset state on module reload
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    typesLoaded = false;
  });
}

/**
 * Load Worker SDK type definitions into Monaco Editor
 * @param monaco - Monaco editor instance
 */
export function loadWorkerSDKTypes(monaco: any): void {
  // Only load types once to prevent editor hanging
  if (typesLoaded) {
    return;
  }

  // Add extra libraries for JavaScript autocomplete only
  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    WORKER_SDK_TYPES,
    "file:///worker-sdk.d.ts",
  );

  typesLoaded = true;
}

/**
 * Configure Monaco Editor for worker script editing
 * @param monaco - Monaco editor instance
 * @param options - Optional configuration
 */
export function configureWorkerEditor(
  monaco: any,
  options?: {
    theme?: "vs-dark" | "vs-light";
    fontSize?: number;
    minimap?: boolean;
  },
): any {
  const { theme = "vs-dark", fontSize = 14, minimap = true } = options || {};

  // Load SDK types
  loadWorkerSDKTypes(monaco);

  // Lightweight JavaScript configuration (no heavy type checking)
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2022,
    allowNonTsExtensions: true,
    noEmit: true,
    allowJs: true,
    checkJs: false,
    noLib: true, // Don't load TypeScript libs for performance
  });

  // Minimal diagnostics for performance
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,  // Disable semantic analysis for performance
    noSyntaxValidation: false,   // Keep basic syntax check
    diagnosticCodesToIgnore: [1108, 2304],
  });

  // Editor configuration
  return {
    theme,
    fontSize,
    language: "javascript",
    automaticLayout: true,
    minimap: {
      enabled: minimap,
    },
    scrollBeyondLastLine: false,
    wordWrap: "on",
    lineNumbers: "on",
    renderLineHighlight: "all",
    roundedSelection: true,
    cursorStyle: "line",
    cursorBlinking: "smooth",
    folding: true,
    links: true,
    colorDecorators: true,
    contextmenu: true,
    mouseWheelZoom: true,
    smoothScrolling: true,
    suggest: {
      showWords: true,
      showFunctions: true,
      showVariables: true,
      showModules: true,
      showKeywords: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    parameterHints: {
      enabled: true,
      cycle: true,
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    tabCompletion: "on",
    wordBasedSuggestions: "currentDocument",
    snippetSuggestions: "inline",
  };
}

/**
 * Get common worker script templates
 */
export const WORKER_TEMPLATES = {
  /**
   * Simple worker template with logging
   */
  simple: `logger.info('Worker started on node:', config.nid);

// Your code here
await Stels.sleep(1000);

logger.info('Worker iteration complete');`,

  /**
   * Worker with graceful shutdown
   */
  gracefulShutdown: `logger.info('Worker started');

while (!shouldStop()) {
  // Your work here
  logger.info('Processing...');

  await Stels.sleep(5000);
}

logger.info('Worker stopped gracefully');`,

  /**
   * Exchange data fetcher
   */
  exchangeFetcher: `logger.info('Starting exchange data fetcher');

const exchange = Stels.runtime.cex.binance;

while (!shouldStop()) {
  try {
    const ticker = await exchange.fetchTicker('BTC/USDT');
    logger.info('BTC/USDT Price:', ticker.last);

    // Save to KV
    await Stels.webfix({
      brain: Stels.local,
      method: 'set',
      channel: ['market', 'ticker', 'BTC_USDT'],
      module: 'worker',
      raw: ticker,
      timestamp: Date.now(),
      expireIn: 60000 // 1 minute
    });

  } catch (error) {
    logger.error('Failed to fetch ticker', error);
  }

  await Stels.sleep(10000); // Every 10 seconds
}`,

  /**
   * Balance checker
   */
  balanceChecker: `logger.info('Starting balance checker');

const exchange = Stels.runtime.cex.binance;

while (!shouldStop()) {
  try {
    const balance = await exchange.fetchBalance();

    logger.info('Balance fetched', {
      BTC: balance.total.BTC,
      USDT: balance.total.USDT
    });

    // Save to distributed KV
    await Stels.webfix({
      brain: Stels.net,
      method: 'set',
      channel: ['account', 'balance', config.nid],
      module: 'worker',
      raw: balance,
      timestamp: Date.now(),
      expireIn: 300000 // 5 minutes
    });

  } catch (error) {
    logger.error('Failed to fetch balance', error);
  }

  await Stels.sleep(60000); // Every minute
}`,

  /**
   * Order book watcher (WebSocket)
   */
  orderBookWatcher: `logger.info('Starting order book watcher');

const exchange = Stels.runtime.cex.binance;
const symbol = 'BTC/USDT';

while (!shouldStop()) {
  try {
    const orderBook = await exchange.watchOrderBook(symbol);

    const bestBid = orderBook.bids[0];
    const bestAsk = orderBook.asks[0];

    logger.debug('Order book updated', {
      bid: bestBid[0],
      ask: bestAsk[0],
      spread: bestAsk[0] - bestBid[0]
    });

    // Save to local KV
    await Stels.webfix({
      brain: Stels.local,
      method: 'set',
      channel: ['orderbook', symbol.replace('/', '_')],
      module: 'worker',
      raw: {
        bid: bestBid,
        ask: bestAsk,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      expireIn: 10000
    });

  } catch (error) {
    logger.error('Order book watcher error', error);

    // Reconnect on error
    await Stels.sleep(5000);
  }
}`,

  /**
   * Advanced worker with error handling and metrics
   */
  advanced: `logger.info('Advanced worker started');

let iterations = 0;
let errors = 0;
const startTime = Date.now();

while (!shouldStop()) {
  try {
    iterations++;

    // Your logic here
    const { net, local, config } = Stels;

    // Example: Fetch data from exchange
    const exchange = Stels.runtime.cex.binance;
    const ticker = await exchange.fetchTicker('BTC/USDT');

    // Save to KV
    await Stels.webfix({
      brain: local,
      method: 'set',
      channel: ['worker', 'data', config.nid],
      module: 'worker',
      raw: {
        price: ticker.last,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      expireIn: 30000
    });

    // Log metrics every 100 iterations
    if (iterations % 100 === 0) {
      const uptime = Date.now() - startTime;
      const errorRate = (errors / iterations * 100).toFixed(2);

      logger.info('Metrics', {
        iterations,
        errors,
        errorRate: errorRate + '%',
        uptime: Math.floor(uptime / 1000) + 's'
      });
    }

  } catch (error) {
    errors++;
    logger.error('Iteration failed', error);
  }

  await Stels.sleep(1000);
}

logger.info('Worker stopped', {
  totalIterations: iterations,
  totalErrors: errors,
  runtime: Math.floor((Date.now() - startTime) / 1000) + 's'
});`,

  /**
   * Blockchain wallet creator
   */
  blockchainWallet: `logger.info('Creating blockchain wallet');

const wallet = Stels.blockchain.createWallet();

logger.info('Wallet created', {
  address: wallet.address,
  publicKey: wallet.publicKey,
  number: wallet.number
});

// Validate address
const isValid = Stels.blockchain.validateAddress(wallet.address);
logger.info('Address valid:', isValid);

// Save to KV
await Stels.webfix({
  brain: Stels.local,
  method: 'set',
  channel: ['wallet', 'created', wallet.address],
  module: 'worker',
  raw: {
    address: wallet.address,
    publicKey: wallet.publicKey,
    number: wallet.number,
    createdAt: Date.now()
  },
  timestamp: Date.now()
});`,

  /**
   * Smart transaction builder
   */
  smartTransaction: `logger.info('Building smart transaction');

const { blockchain, wallet } = Stels;

// Create smart transaction with multiple operations
const smartTx = blockchain.createSmartTransaction(
  wallet,
  [
    {
      op: 'transfer',
      to: 'g-recipient-address',
      amount: '0.001000',
      memo: 'Payment from worker'
    },
    {
      op: 'emit.event',
      kind: 'payment.sent',
      data: {
        worker: config.nid,
        timestamp: Date.now()
      }
    }
  ],
  '0.000100', // fee
  'Smart transaction from worker'
);

logger.info('Smart transaction created', {
  from: smartTx.from,
  fee: smartTx.fee,
  operations: smartTx.args.ops.length
});

// Validate
const isValid = blockchain.validateSmartTransaction(smartTx);
logger.info('Transaction valid:', isValid);`,

  /**
   * Trading bot template
   */
  tradingBot: `logger.info('Trading bot started');

const exchange = Stels.runtime.cex.binance;
const SYMBOL = 'BTC/USDT';
const ORDER_SIZE = 0.001;
const SPREAD_THRESHOLD = 0.5; // 0.5%

while (!shouldStop()) {
  try {
    // Fetch ticker
    const ticker = await exchange.fetchTicker(SYMBOL);
    logger.info('Price:', ticker.last, 'Change:', ticker.percentage + '%');
    
    // Fetch order book
    const orderBook = await exchange.fetchOrderBook(SYMBOL, 10);
    const bestBid = orderBook.bids[0][0];
    const bestAsk = orderBook.asks[0][0];
    const spread = ((bestAsk - bestBid) / bestBid * 100).toFixed(2);
    
    logger.info('Spread:', spread + '%');
    
    // Check if spread is profitable
    if (parseFloat(spread) > SPREAD_THRESHOLD) {
      logger.info('Profitable spread detected!');
      
      // Place buy order
      const buyOrder = await exchange.createLimitOrder(
        SYMBOL,
        'buy',
        ORDER_SIZE,
        bestBid
      );
      logger.info('Buy order placed:', buyOrder.id);
      
      // Place sell order
      const sellOrder = await exchange.createLimitOrder(
        SYMBOL,
        'sell',
        ORDER_SIZE,
        bestAsk
      );
      logger.info('Sell order placed:', sellOrder.id);
    }
    
    // Check open orders
    const openOrders = await exchange.fetchOpenOrders(SYMBOL);
    logger.info('Open orders:', openOrders.length);
    
  } catch (error) {
    logger.error('Trading bot error', error);
  }
  
  await Stels.sleep(10000); // Check every 10 seconds
}

logger.info('Trading bot stopped');`,

  /**
   * Market maker template
   */
  marketMaker: `logger.info('Market maker started');

const exchange = Stels.runtime.cex.bybit;
const SYMBOL = 'BTC/USDT';
const GRID_LEVELS = 5;
const GRID_STEP_PERCENT = 0.5;
const ORDER_SIZE = 0.001;

while (!shouldStop()) {
  try {
    // Get current price
    const ticker = await exchange.fetchTicker(SYMBOL);
    const currentPrice = ticker.last;
    
    logger.info('Current price:', currentPrice);
    
    // Cancel all existing orders
    await exchange.cancelAllOrders(SYMBOL);
    logger.info('Canceled all orders');
    
    // Place grid orders
    for (let i = 1; i <= GRID_LEVELS; i++) {
      const buyPrice = currentPrice * (1 - (GRID_STEP_PERCENT / 100) * i);
      const sellPrice = currentPrice * (1 + (GRID_STEP_PERCENT / 100) * i);
      
      // Buy order
      await exchange.createLimitOrder(
        SYMBOL,
        'buy',
        ORDER_SIZE,
        Math.round(buyPrice * 100) / 100
      );
      
      // Sell order
      await exchange.createLimitOrder(
        SYMBOL,
        'sell',
        ORDER_SIZE,
        Math.round(sellPrice * 100) / 100
      );
      
      await Stels.sleep(100); // Rate limiting
    }
    
    logger.info('Grid placed:', GRID_LEVELS * 2, 'orders');
    
    // Check filled orders
    const openOrders = await exchange.fetchOpenOrders(SYMBOL);
    const filled = (GRID_LEVELS * 2) - openOrders.length;
    if (filled > 0) {
      logger.info('Filled orders:', filled);
    }
    
  } catch (error) {
    logger.error('Market maker error', error);
  }
  
  await Stels.sleep(30000); // Rebalance every 30 seconds
}

logger.info('Market maker stopped');`,
};

/**
 * Get code snippet for Monaco Editor
 */
export function getWorkerSnippets(): any[] {
  return [
    {
      label: "logger.info",
      kind: 0, // Method
      insertText: 'logger.info("${1:message}", ${2:data});',
      insertTextRules: 4, // InsertAsSnippet
      documentation: "Log informational message",
    },
    {
      label: "logger.error",
      kind: 0,
      insertText: 'logger.error("${1:message}", ${2:error});',
      insertTextRules: 4,
      documentation: "Log error message",
    },
    {
      label: "logger.warn",
      kind: 0,
      insertText: 'logger.warn("${1:message}", ${2:data});',
      insertTextRules: 4,
      documentation: "Log warning message",
    },
    {
      label: "logger.debug",
      kind: 0,
      insertText: 'logger.debug("${1:message}", ${2:data});',
      insertTextRules: 4,
      documentation: "Log debug message",
    },
    {
      label: "Stels.sleep",
      kind: 0,
      insertText: "await Stels.sleep(${1:1000});",
      insertTextRules: 4,
      documentation: "Sleep with auto-cancel on worker stop",
    },
    {
      label: "shouldStop",
      kind: 2, // Function
      insertText: "shouldStop()",
      documentation: "Check if worker should stop",
    },
    {
      label: "while-shouldStop",
      kind: 14, // Snippet
      insertText:
        "while (!shouldStop()) {\n  ${1:// Your code here}\n  await Stels.sleep(${2:1000});\n}",
      insertTextRules: 4,
      documentation: "Loop with graceful shutdown",
    },
    {
      label: "Stels.webfix-set",
      kind: 14,
      insertText: `await Stels.webfix({
  brain: Stels.\${1|local,net|},
  method: 'set',
  channel: [\${2:'key'}],
  module: 'worker',
  raw: \${3:data},
  timestamp: Date.now(),
  expireIn: \${4:60000}
});`,
      insertTextRules: 4,
      documentation: "Save data to KV store",
    },
    {
      label: "Stels.webfix-get",
      kind: 14,
      insertText: `const result = await Stels.webfix({
  brain: Stels.\${1|local,net|},
  method: 'get',
  channel: [\${2:'key'}],
  module: 'worker',
  timestamp: Date.now()
});
const data = result.value;`,
      insertTextRules: 4,
      documentation: "Get data from KV store",
    },
    {
      label: "exchange-fetchTicker",
      kind: 14,
      insertText: `const exchange = Stels.runtime.cex.\${1:binance};
const ticker = await exchange.fetchTicker('\${2:BTC/USDT}');
logger.info('Price:', ticker.last);`,
      insertTextRules: 4,
      documentation: "Fetch ticker from exchange",
    },
    {
      label: "exchange-fetchBalance",
      kind: 14,
      insertText: `const exchange = Stels.runtime.cex.\${1:binance};
const balance = await exchange.fetchBalance();
logger.info('Balance:', balance.total);`,
      insertTextRules: 4,
      documentation: "Fetch balance from exchange",
    },
    {
      label: "try-catch-worker",
      kind: 14,
      insertText: `try {
  \${1:// Your code here}
} catch (error) {
  logger.error('\${2:Operation failed}', error);
  \${3:// Handle error}
}`,
      insertTextRules: 4,
      documentation: "Try-catch block with logger",
    },
    {
      label: "Stels.blockchain-createWallet",
      kind: 14,
      insertText: `const wallet = Stels.blockchain.createWallet();
logger.info('Wallet created:', wallet.address);`,
      insertTextRules: 4,
      documentation: "Create new blockchain wallet",
    },
    {
      label: "Stels.blockchain-importWallet",
      kind: 14,
      insertText: `const wallet = Stels.blockchain.importWallet('\${1:privateKey}');
logger.info('Wallet imported:', wallet.address);`,
      insertTextRules: 4,
      documentation: "Import wallet from private key",
    },
    {
      label: "Stels.blockchain-createTransaction",
      kind: 14,
      insertText: `const tx = Stels.blockchain.createSignedTransaction(
  Stels.wallet,
  '\${1:recipientAddress}',
  \${2:amount},
  \${3:fee},
  '\${4:data}'
);
logger.info('Transaction created:', tx.hash);`,
      insertTextRules: 4,
      documentation: "Create and sign transaction",
    },
    {
      label: "Stels.blockchain-smartTransaction",
      kind: 14,
      insertText: `const smartTx = Stels.blockchain.createSmartTransaction(
  Stels.wallet,
  [
    {
      op: 'transfer',
      to: '\${1:address}',
      amount: '\${2:0.000100}',
      memo: '\${3:Payment}'
    }
  ],
  '\${4:0.000100}',
  '\${5:Memo}'
);
logger.info('Smart transaction created');`,
      insertTextRules: 4,
      documentation: "Create smart transaction with operations",
    },
    {
      label: "Stels.blockchain-validateAddress",
      kind: 14,
      insertText: `const isValid = Stels.blockchain.validateAddress('\${1:address}');
if (!isValid) {
  logger.error('Invalid address');
}`,
      insertTextRules: 4,
      documentation: "Validate Gliesereum address",
    },
    {
      label: "exchange-createLimitOrder",
      kind: 14,
      insertText: `const exchange = Stels.runtime.cex.\${1:binance};
const order = await exchange.createLimitOrder(
  '\${2:BTC/USDT}',
  '\${3|buy,sell|}',
  \${4:0.001},
  \${5:50000}
);
logger.info('Limit order created:', order.id);`,
      insertTextRules: 4,
      documentation: "Create limit order on exchange",
    },
    {
      label: "exchange-createMarketOrder",
      kind: 14,
      insertText: `const exchange = Stels.runtime.cex.\${1:binance};
const order = await exchange.createMarketOrder(
  '\${2:BTC/USDT}',
  '\${3|buy,sell|}',
  \${4:0.001}
);
logger.info('Market order created:', order.id);`,
      insertTextRules: 4,
      documentation: "Create market order on exchange",
    },
    {
      label: "exchange-fetchOpenOrders",
      kind: 14,
      insertText: `const exchange = Stels.runtime.cex.\${1:binance};
const openOrders = await exchange.fetchOpenOrders('\${2:BTC/USDT}');
logger.info('Open orders:', openOrders.length);

for (const order of openOrders) {
  logger.info('Order:', {
    id: order.id,
    symbol: order.symbol,
    side: order.side,
    price: order.price,
    amount: order.amount,
    filled: order.filled
  });
}`,
      insertTextRules: 4,
      documentation: "Fetch open orders from exchange",
    },
    {
      label: "exchange-watchOrderBook",
      kind: 14,
      insertText: `const exchange = Stels.runtime.cex.\${1:binance};

while (!shouldStop()) {
  try {
    const orderBook = await exchange.watchOrderBook('\${2:BTC/USDT}');
    
    const bestBid = orderBook.bids[0];
    const bestAsk = orderBook.asks[0];
    const spread = bestAsk[0] - bestBid[0];
    
    logger.debug('OrderBook', {
      bid: bestBid[0],
      ask: bestAsk[0],
      spread: spread
    });
    
  } catch (error) {
    logger.error('OrderBook error', error);
    await Stels.sleep(5000);
  }
}`,
      insertTextRules: 4,
      documentation: "Watch order book updates (WebSocket)",
    },
    {
      label: "exchange-cancelOrder",
      kind: 14,
      insertText: `const exchange = Stels.runtime.cex.\${1:binance};
const result = await exchange.cancelOrder('\${2:orderId}', '\${3:BTC/USDT}');
logger.info('Order canceled:', result.id);`,
      insertTextRules: 4,
      documentation: "Cancel order by ID",
    },
    {
      label: "exchange-fetchOHLCV",
      kind: 14,
      insertText: `const exchange = Stels.runtime.cex.\${1:binance};
const candles = await exchange.fetchOHLCV(
  '\${2:BTC/USDT}',
  '\${3|1m,5m,15m,30m,1h,4h,1d|}',
  undefined,
  100
);

logger.info('Fetched', candles.length, 'candles');
const latest = candles[candles.length - 1];
logger.info('Latest candle:', {
  timestamp: latest[0],
  open: latest[1],
  high: latest[2],
  low: latest[3],
  close: latest[4],
  volume: latest[5]
});`,
      insertTextRules: 4,
      documentation: "Fetch OHLCV candles",
    },
  ];
}

// Track completion provider registration
let completionProviderRegistered: any = null;

// Support HMR - reset completion provider on module reload
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    if (completionProviderRegistered) {
      completionProviderRegistered.dispose?.();
      completionProviderRegistered = null;
    }
  });
}

/**
 * Register custom completion provider for worker context
 */
export function registerWorkerCompletionProvider(
  monaco: any,
): any {
  // Only register once to prevent duplicate providers
  if (completionProviderRegistered) {
    return completionProviderRegistered;
  }

  completionProviderRegistered = monaco.languages.registerCompletionItemProvider("javascript", {
    triggerCharacters: [".", " "],
    provideCompletionItems: (_model: any, _position: any) => {
      const suggestions = getWorkerSnippets();

      return {
        suggestions: suggestions as any[],
      };
    },
  });

  return completionProviderRegistered;
}

/**
 * Setup Monaco Editor with full worker SDK support
 * Call this function when initializing Monaco Editor
 * @param monaco - Monaco editor instance
 * @param options - Editor configuration options
 * @returns Editor configuration object
 */
export function setupWorkerMonacoEditor(
  monaco: any,
  options?: {
    theme?: "vs-dark" | "vs-light";
    fontSize?: number;
    minimap?: boolean;
  },
): {
  editorOptions: any;
  disposables: any[];
} {
  // Load types
  loadWorkerSDKTypes(monaco);

  // Register completion provider
  const completionProvider = registerWorkerCompletionProvider(monaco);

  // Get editor options
  const editorOptions = configureWorkerEditor(monaco, options);

  return {
    editorOptions,
    disposables: [completionProvider],
  };
}

/**
 * Worker SDK TypeScript definitions
 * This is injected into Monaco Editor for autocomplete
 */
const WORKER_SDK_TYPES = `
/**
 * Heterogen Runtime Worker SDK
 * @version 2.1.0
 */

/** Worker logger with automatic KV storage */
interface WorkerLogger {
  /** Log informational message */
  info(message: string, data?: any): void;
  /** Log warning message */
  warn(message: string, data?: any): void;
  /** Log error message */
  error(message: string, error?: any): void;
  /** Log debug message */
  debug(message: string, data?: any): void;
}

/** Application configuration */
interface AppConfig {
  /** Network name (e.g., "testnet") */
  network: string;
  /** Node ID (e.g., "s-0001") */
  nid: string;
  /** Tick rate */
  tick: number;
  /** Network workers enabled */
  workers: number;
  /** Wallet lists */
  walletList: {
    owners: string[];
    advisors: string[];
    developers: string[];
    partners: string[];
  };
  server: {
    open: number;
    hostname: string;
    port: string;
  };
}

/** CCXT Types */
type CCXTOrderSide = 'buy' | 'sell';
type CCXTOrderType = 'limit' | 'market' | 'stop-loss' | 'stop-loss-limit' | 'take-profit' | 'take-profit-limit';
type CCXTOrderStatus = 'open' | 'closed' | 'canceled' | 'expired' | 'rejected';

interface CCXTTicker {
  symbol: string;
  info: any;
  timestamp: number;
  datetime: string;
  high: number;
  low: number;
  bid: number;
  bidVolume: number;
  ask: number;
  askVolume: number;
  vwap: number;
  open: number;
  close: number;
  last: number;
  previousClose: number;
  change: number;
  percentage: number;
  average: number;
  quoteVolume: number;
  baseVolume: number;
}

interface CCXTOrderBook {
  asks: [number, number][];
  bids: [number, number][];
  datetime: string;
  timestamp: number;
  nonce: number;
  symbol: string;
}

interface CCXTBalance {
  free: number;
  used: number;
  total: number;
  debt?: number;
}

interface CCXTBalances {
  [currency: string]: CCXTBalance;
  free: { [currency: string]: number };
  used: { [currency: string]: number };
  total: { [currency: string]: number };
  info: any;
}

interface CCXTOrder {
  id: string;
  clientOrderId: string;
  datetime: string;
  timestamp: number;
  lastTradeTimestamp: number;
  status: CCXTOrderStatus;
  symbol: string;
  type: CCXTOrderType;
  timeInForce?: string;
  side: CCXTOrderSide;
  price: number;
  average?: number;
  amount: number;
  filled: number;
  remaining: number;
  stopPrice?: number;
  triggerPrice?: number;
  cost: number;
  trades: CCXTTrade[];
  fee: { currency: string; cost: number; rate?: number };
  info: any;
}

interface CCXTTrade {
  info: any;
  amount: number;
  datetime: string;
  id: string;
  order: string;
  price: number;
  timestamp: number;
  type: CCXTOrderType;
  side: CCXTOrderSide;
  symbol: string;
  takerOrMaker: 'taker' | 'maker';
  cost: number;
  fee: { currency: string; cost: number; rate?: number };
}

interface CCXTOHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** CCXT Pro exchange */
interface CCXTExchange {
  id: string;
  name: string;
  countries: string[];
  
  // Market data
  fetchTicker(symbol: string): Promise<CCXTTicker>;
  fetchTickers(symbols?: string[]): Promise<{ [symbol: string]: CCXTTicker }>;
  fetchOrderBook(symbol: string, limit?: number): Promise<CCXTOrderBook>;
  fetchTrades(symbol: string, since?: number, limit?: number): Promise<CCXTTrade[]>;
  fetchOHLCV(symbol: string, timeframe?: string, since?: number, limit?: number): Promise<CCXTOHLCV[]>;
  
  // Account
  fetchBalance(): Promise<CCXTBalances>;
  
  // Trading
  createOrder(symbol: string, type: CCXTOrderType, side: CCXTOrderSide, amount: number, price?: number, params?: any): Promise<CCXTOrder>;
  createLimitOrder(symbol: string, side: CCXTOrderSide, amount: number, price: number, params?: any): Promise<CCXTOrder>;
  createMarketOrder(symbol: string, side: CCXTOrderSide, amount: number, params?: any): Promise<CCXTOrder>;
  createMarketBuyOrder(symbol: string, amount: number, params?: any): Promise<CCXTOrder>;
  createMarketSellOrder(symbol: string, amount: number, params?: any): Promise<CCXTOrder>;
  cancelOrder(id: string, symbol: string, params?: any): Promise<CCXTOrder>;
  cancelAllOrders(symbol?: string, params?: any): Promise<CCXTOrder[]>;
  fetchOrder(id: string, symbol: string, params?: any): Promise<CCXTOrder>;
  fetchOrders(symbol?: string, since?: number, limit?: number, params?: any): Promise<CCXTOrder[]>;
  fetchOpenOrders(symbol?: string, since?: number, limit?: number, params?: any): Promise<CCXTOrder[]>;
  fetchClosedOrders(symbol?: string, since?: number, limit?: number, params?: any): Promise<CCXTOrder[]>;
  
  // WebSocket (CCXT Pro)
  watchTicker(symbol: string): Promise<CCXTTicker>;
  watchTickers(symbols?: string[]): Promise<{ [symbol: string]: CCXTTicker }>;
  watchOrderBook(symbol: string, limit?: number): Promise<CCXTOrderBook>;
  watchTrades(symbol: string): Promise<CCXTTrade[]>;
  watchOHLCV(symbol: string, timeframe?: string): Promise<CCXTOHLCV[]>;
  watchBalance(): Promise<CCXTBalances>;
  watchOrders(symbol?: string): Promise<CCXTOrder[]>;
  watchMyTrades(symbol?: string): Promise<CCXTTrade[]>;
  
  // Connection
  close(): Promise<void>;
  
  [key: string]: any;
}

/** Runtime with exchanges */
interface RuntimeConfig {
  cex: {
    [exchangeId: string]: CCXTExchange;
  };
}

/** Blockchain wallet */
interface BlockchainWallet {
  readonly publicKey: string;
  readonly privateKey: string;
  readonly address: string;
  readonly biometric?: string | null;
  readonly number: string;
}

/** Smart operation types */
type SmartOp =
  | { op: "transfer"; to: string; amount: string; memo?: string }
  | { op: "assert.time"; before_ms?: number; after_ms?: number }
  | { op: "assert.balance"; address: string; gte: string }
  | { op: "assert.compare"; left: string; cmp: "<" | "<=" | "==" | ">=" | ">"; right: string }
  | { op: "emit.event"; kind: string; data?: Record<string, unknown> };

/** Transaction signature */
interface TransactionSignature {
  kid: string;
  alg: "ecdsa-secp256k1";
  sig: string;
}

/** Basic transaction */
interface Transaction {
  from: { address: string; publicKey: string; number: string };
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  hash: string;
  signature?: string;
  data?: string;
}

/** Smart transaction */
interface SmartTransaction {
  type: "smart";
  method: "smart.exec";
  args: { ops: SmartOp[]; memo?: string };
  from: string;
  fee: string;
  currency: "TST";
  prev_hash: string | null;
  timestamp: number;
  signatures: TransactionSignature[];
}

/** Blockchain SDK */
interface GliesereumSDK {
  // Wallet functions
  cardNumber(input: string | Uint8Array, prefix?: string, secretKey?: string | Uint8Array): string;
  createWallet(): BlockchainWallet;
  importWallet(privateKey: string): BlockchainWallet;
  validateAddress(address: string): boolean;
  getAddress(bytes: Uint8Array): string;
  getAddressFromPublicKey(publicKey: string): string;
  verifyPublicKeyAddress(publicKey: string, address: string): boolean;
  
  // Transaction functions
  createSignedTransaction(wallet: BlockchainWallet, to: string, amount: number, fee: number, data?: string): Transaction;
  validateTransaction(tx: Transaction): boolean;
  
  // Smart transaction functions
  createSmartTransaction(wallet: BlockchainWallet, ops: SmartOp[], fee?: string, memo?: string, prevHash?: string | null, rawData?: string): SmartTransaction;
  validateSmartTransaction(tx: SmartTransaction): boolean;
  validateSmartOperation(op: SmartOp): boolean;
  calculateSmartTransactionFee(ops: SmartOp[], rawBytes?: number, baseFee?: string): string;
  
  // Cryptographic functions
  sign(data: string, privateKey: string): string;
  verify(data: string, signature: string, publicKey: string): boolean;
  signWithDomain(data: string, privateKey: string, domain: string[]): string;
  
  // Validation functions
  validateFeeFormat(fee: string): boolean;
  validateAmountFormat(amount: string): boolean;
  validateRawData(rawData: string): boolean;
  validateMemo(memo: string): boolean;
  validateEventKind(kind: string): boolean;
  validateEventData(data: Record<string, unknown>): boolean;
}

/** WebFIX configuration */
interface WebfixConfig {
  brain: Deno.Kv;
  method: "get" | "set" | "update" | "delete";
  channel: string[];
  module: string;
  raw?: any;
  timestamp: number;
  expireIn?: number;
  versionstamp?: string;
}

/** WebFIX result */
interface WebfixResult {
  value: any;
  versionstamp: string | null;
  key: string[];
}

/** Main Stels global object */
interface StelsGlobal {
  /** Deno runtime */
  engine: typeof Deno;
  /** Distributed KV (shared across nodes) */
  net: Deno.Kv;
  /** Local KV (node-specific) */
  local: Deno.Kv;
  /** Blockchain SDK */
  blockchain: GliesereumSDK;
  /** Runtime with exchanges */
  runtime: RuntimeConfig;
  /** Wallet instance */
  wallet: BlockchainWallet;
  /** App configuration */
  config: AppConfig;
  /** WebFIX KV operations */
  webfix(config: WebfixConfig): Promise<WebfixResult>;
  /** Sleep with auto-cancel */
  sleep(ms: number): Promise<void>;
  /** Hybrid timestamp */
  hybridTimestamp: number;
}

/** Worker logger (auto-created) */
declare const logger: WorkerLogger;

/** Global Stels context */
declare const Stels: StelsGlobal;

/** Config shorthand */
declare const config: AppConfig;

/** Abort signal */
declare const signal: AbortSignal;

/**
 * Check if worker should stop
 * @returns true if worker should stop
 */
declare function shouldStop(): boolean;
`;
