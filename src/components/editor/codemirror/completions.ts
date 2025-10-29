/**
 * Worker SDK Autocomplete for CodeMirror 6
 * 
 * Provides intelligent autocomplete for STELS Worker SDK APIs:
 * - Stels.* global APIs
 * - logger.* logging functions
 * - config.* configuration
 * - Common patterns and snippets
 */

import type { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

interface Completion {
  label: string;
  type: string;
  info?: string;
  detail?: string;
  apply?: string;
}

/**
 * Worker SDK completions
 */
const workerSDKCompletions: Completion[] = [
  // Logger
  { label: "logger.info", type: "method", info: "Log informational message", apply: "logger.info('${1:message}', ${2:data});" },
  { label: "logger.error", type: "method", info: "Log error message", apply: "logger.error('${1:message}', ${2:error});" },
  { label: "logger.warn", type: "method", info: "Log warning message", apply: "logger.warn('${1:message}', ${2:data});" },
  { label: "logger.debug", type: "method", info: "Log debug message", apply: "logger.debug('${1:message}', ${2:data});" },
  
  // Stels Global API
  { label: "Stels.sleep", type: "method", info: "Sleep with auto-cancel", apply: "await Stels.sleep(${1:1000});" },
  { label: "Stels.webfix", type: "method", info: "WebFIX KV operations", apply: "await Stels.webfix({ brain: Stels.${1:local}, method: '${2:set}', channel: [${3:'key'}], module: 'worker', raw: ${4:data}, timestamp: Date.now() });" },
  { label: "Stels.net", type: "property", info: "Distributed KV (shared across nodes)", detail: "Deno.Kv" },
  { label: "Stels.local", type: "property", info: "Local KV (node-specific)", detail: "Deno.Kv" },
  { label: "Stels.config", type: "property", info: "App configuration", detail: "AppConfig" },
  { label: "Stels.wallet", type: "property", info: "Wallet instance", detail: "BlockchainWallet" },
  { label: "Stels.blockchain", type: "property", info: "Blockchain SDK", detail: "GliesereumSDK" },
  { label: "Stels.runtime", type: "property", info: "Runtime with exchanges", detail: "RuntimeConfig" },
  
  // Blockchain
  { label: "Stels.blockchain.createWallet", type: "method", info: "Create new blockchain wallet", apply: "const wallet = Stels.blockchain.createWallet();\nlogger.info('Wallet created:', wallet.address);" },
  { label: "Stels.blockchain.importWallet", type: "method", info: "Import wallet from private key", apply: "const wallet = Stels.blockchain.importWallet('${1:privateKey}');\nlogger.info('Wallet imported:', wallet.address);" },
  { label: "Stels.blockchain.validateAddress", type: "method", info: "Validate Gliesereum address", apply: "const isValid = Stels.blockchain.validateAddress('${1:address}');\nif (!isValid) {\n  logger.error('Invalid address');\n}" },
  { label: "Stels.blockchain.createSignedTransaction", type: "method", info: "Create and sign transaction", apply: "const tx = Stels.blockchain.createSignedTransaction(\n  Stels.wallet,\n  '${1:recipientAddress}',\n  ${2:amount},\n  ${3:fee},\n  '${4:data}'\n);\nlogger.info('Transaction created:', tx.hash);" },
  
  // Config
  { label: "config.network", type: "property", info: "Network name (e.g., 'testnet')", detail: "string" },
  { label: "config.nid", type: "property", info: "Node ID (e.g., 's-0001')", detail: "string" },
  { label: "config.tick", type: "property", info: "Tick rate", detail: "number" },
  
  // Control Flow
  { label: "shouldStop", type: "function", info: "Check if worker should stop", apply: "shouldStop()" },
  { label: "while-shouldStop", type: "snippet", info: "Loop with graceful shutdown", apply: "while (!shouldStop()) {\n  ${1:// Your code here}\n  await Stels.sleep(${2:1000});\n}" },
  
  // Exchange API
  { label: "exchange.fetchTicker", type: "method", info: "Fetch ticker from exchange", apply: "const exchange = Stels.runtime.cex.${1:binance};\nconst ticker = await exchange.fetchTicker('${2:BTC/USDT}');\nlogger.info('Price:', ticker.last);" },
  { label: "exchange.fetchBalance", type: "method", info: "Fetch balance from exchange", apply: "const exchange = Stels.runtime.cex.${1:binance};\nconst balance = await exchange.fetchBalance();\nlogger.info('Balance:', balance.total);" },
  { label: "exchange.fetchOrderBook", type: "method", info: "Fetch order book", apply: "const exchange = Stels.runtime.cex.${1:binance};\nconst orderBook = await exchange.fetchOrderBook('${2:BTC/USDT}', ${3:10});" },
  { label: "exchange.createLimitOrder", type: "method", info: "Create limit order", apply: "const exchange = Stels.runtime.cex.${1:binance};\nconst order = await exchange.createLimitOrder(\n  '${2:BTC/USDT}',\n  '${3:buy}',\n  ${4:0.001},\n  ${5:50000}\n);\nlogger.info('Limit order created:', order.id);" },
  { label: "exchange.watchOrderBook", type: "method", info: "Watch order book (WebSocket)", apply: "const exchange = Stels.runtime.cex.${1:binance};\n\nwhile (!shouldStop()) {\n  try {\n    const orderBook = await exchange.watchOrderBook('${2:BTC/USDT}');\n    const bestBid = orderBook.bids[0];\n    const bestAsk = orderBook.asks[0];\n    logger.debug('OrderBook', { bid: bestBid[0], ask: bestAsk[0] });\n  } catch (error) {\n    logger.error('OrderBook error', error);\n    await Stels.sleep(5000);\n  }\n}" },
  
  // WebFIX patterns
  { label: "webfix-set", type: "snippet", info: "Save data to KV store", apply: "await Stels.webfix({\n  brain: Stels.${1:local},\n  method: 'set',\n  channel: [${2:'key'}],\n  module: 'worker',\n  raw: ${3:data},\n  timestamp: Date.now(),\n  expireIn: ${4:60000}\n});" },
  { label: "webfix-get", type: "snippet", info: "Get data from KV store", apply: "const result = await Stels.webfix({\n  brain: Stels.${1:local},\n  method: 'get',\n  channel: [${2:'key'}],\n  module: 'worker',\n  timestamp: Date.now()\n});\nconst data = result.value;" },
  
  // Common patterns
  { label: "try-catch-worker", type: "snippet", info: "Try-catch block with logger", apply: "try {\n  ${1:// Your code here}\n} catch (error) {\n  logger.error('${2:Operation failed}', error);\n  ${3:// Handle error}\n}" },
];

/**
 * Get completions for Worker SDK
 */
export function workerCompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[\w.]+/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  const options = workerSDKCompletions.map(comp => ({
    label: comp.label,
    type: comp.type,
    info: comp.info,
    detail: comp.detail,
    apply: comp.apply || comp.label,
  }));

  return {
    from: word.from,
    options,
  };
}

