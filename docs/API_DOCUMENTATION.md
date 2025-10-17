# STELS Web3 OS - API Documentation

## Overview

STELS Web3 OS communicates with backend services using the **WebFix Protocol**
over HTTP and WebSocket connections. This document describes all available API
methods, request/response formats, and integration patterns.

## WebFix Protocol

### Base Protocol Structure

All API requests follow the WebFix 1.0 protocol format:

```typescript
{
  webfix: "1.0",
  method: string,
  params: string[],
  body: Record<string, unknown>
}
```

### Authentication

**Header-Based:**

```typescript
{
  "Content-Type": "application/json",
  "stels-session": string  // Session token from connection
}
```

**Session Acquisition:**

1. Create/Import wallet
2. Select network
3. Connect to WebSocket
4. Receive session token
5. Use token in all subsequent requests

## Connection API

### Establish Connection

**Endpoint:** WebSocket URL (from network configuration)

**Protocol:** WebSocket with automatic reconnection

**Connection Flow:**

```typescript
// 1. Open WebSocket
const ws = new WebSocket(socketUrl, protocols);

// 2. Listen for messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Process session updates
};

// 3. Connection established
// Session token available in initial message
```

**Message Format:**

```json
{
  "channel": "string",
  "module": "string",
  "widget": "string",
  "raw": {},
  "timestamp": 1234567890
}
```

## Account Management API

### Create/Update Account

**Method:** `setAccount`

**HTTP Endpoint:** `{api}/` (POST)

**Request:**

```typescript
{
  webfix: "1.0",
  method: "setAccount",
  params: ["gliesereum"],
  body: {
    account: {
      nid: string,              // Node ID
      connection: boolean,       // Connection enabled
      exchange: string,          // Exchange name
      note: string,              // Description
      apiKey: string,            // Exchange API key
      secret: string,            // Exchange API secret
      status: "active" | "learn" | "stopped",
      password?: string,         // Optional API password
      protocol?: ProtocolData,   // Trading strategy config
      viewers?: string[]         // Authorized viewer addresses
    },
    publicKey: string,           // Wallet public key
    address: string,             // Wallet address
    signature: string            // ECDSA signature of account data
  }
}
```

**Response:**

```typescript
{
  key: string[],                 // Storage key path
  value: {
    raw: AccountRequest,         // Account data
    channel: string              // Channel identifier
  }
}
```

**Signature Generation:**

```typescript
import { deterministicStringify, sign } from "@/lib/gliesereum";

const accountData: AccountRequest = {/* ... */};
const dataString = deterministicStringify(accountData);
const signature = sign(dataString, wallet.privateKey);
```

### Get Wallet Information

**Method:** `getWalletInfo`

**HTTP Endpoint:** `{api}/` (POST)

**Request:**

```typescript
{
  webfix: "1.0",
  method: "getWalletInfo",
  params: ["gliesereum"],
  body: {
    address: string  // Wallet address to query
  }
}
```

**Response:**

```typescript
Array<{
  nid: string;
  address: string;
  exchange: string;
  wallet: {
    info: {
      result: {
        list: [{
          totalEquity: string;
          totalWalletBalance: string;
          totalAvailableBalance: string;
          totalPerpUPL: string;
          totalMaintenanceMargin: string;
          totalInitialMargin: string;
          accountLTV: string;
          coin: CoinInfo[];
        }];
      };
    };
  };
  positions?: PositionData[];
  orders?: {
    spot: OrderData[];
    futures: OrderData[];
  };
  protocol?: Protocol;
  connection: boolean;
  note?: string;
  viewers?: string[];
  workers?: string[];
}>;
```

## Worker Management API

### List Workers

**Method:** `listWorkers`

**Request:**

```typescript
{
  webfix: "1.0",
  method: "listWorkers",
  params: [],
  body: {}
}
```

**Response:**

```typescript
Array<{
  key: string[];
  value: {
    raw: {
      sid: string; // Worker ID
      nid: string; // Node ID
      active: boolean; // Running state
      note: string; // Description
      script: string; // Worker code
      dependencies: string[]; // Package dependencies
      version: string; // Runtime version
      timestamp: number; // Creation time
      executionMode?: "parallel" | "leader" | "exclusive";
      priority?: "critical" | "high" | "normal" | "low";
      mode?: "loop" | "single";
      accountId?: string; // Trading account
      assignedNode?: string; // For exclusive mode
    };
    channel: string;
  };
}>;
```

### Create Worker

**Method:** `setWorker`

**Request:**

```typescript
{
  webfix: "1.0",
  method: "setWorker",
  params: [],
  body: {
    scriptContent: string,
    dependencies: string[],
    version: string,
    executionMode: "parallel" | "leader" | "exclusive",
    priority: "critical" | "high" | "normal" | "low",
    mode?: "loop" | "single",
    accountId?: string,
    assignedNode?: string,  // Required for exclusive mode
    note?: string
  }
}
```

**Response:**

```typescript
{
  key: string[],
  value: {
    raw: WorkerData,
    channel: string
  }
}
```

**Script Context:**

```typescript
// Available in worker script execution:
Stels.config.nid; // Current node ID
Stels.config.network; // Network name
Stels.net; // Distributed store
Stels.local; // Local store
Stels.runtime.cex; // Exchange connectors
Stels.sleep(); // Async sleep
Stels.webfix(); // Send data to frontend
logger.info(); // Logging
logger.error();
logger.debug();
```

### Update Worker

**Method:** `updateWorker`

**Request:**

```typescript
{
  webfix: "1.0",
  method: "updateWorker",
  params: [],
  body: {
    channel: string,
    raw: {
      sid: string,
      nid: string,
      active: boolean,
      mode: "loop" | "single",
      executionMode: "parallel" | "leader" | "exclusive",
      priority: "critical" | "high" | "normal" | "low",
      accountId?: string | null,
      assignedNode?: string | null,
      note: string,
      script: string,
      dependencies: string[],
      version: string,
      timestamp: number
    }
  }
}
```

**Important:** API requires complete `raw` object, not partial updates.

**Response:**

```typescript
{
  key: string[],
  value: {
    raw: WorkerData,
    channel: string
  }
}
```

### Get Leader Information

**Method:** `getLeaderInfo`

**Request:**

```typescript
{
  webfix: "1.0",
  method: "getLeaderInfo",
  params: [],
  body: {
    workerId: string  // Worker SID
  }
}
```

**Response:**

```typescript
{
  workerId: string,
  hasLeader: boolean,
  leader: string | null,        // Leader node ID
  timestamp: number,            // Election timestamp
  expiresAt: number,            // Lease expiration
  renewedAt: number,            // Last renewal
  expiresIn: number,            // Milliseconds until expiration
  isExpired: boolean
}
```

### Get Worker Statistics

**Method:** `getWorkerStats`

**Request:**

```typescript
{
  webfix: "1.0",
  method: "getWorkerStats",
  params: [],
  body: {}
}
```

**Response:**

```typescript
{
  workers: Array<{
    sid: string;
    executions: number;
    errors: number;
    errorRate: string; // Format: "0.00%"
    networkErrors: number;
    criticalErrors: number;
    isRunning: boolean;
    lastRun?: number; // Timestamp
  }>;
}
```

### Stop All Workers

**Method:** `stopAllWorkers`

**Request:**

```typescript
{
  webfix: "1.0",
  method: "stopAllWorkers",
  params: [],
  body: {}
}
```

**Response:**

```typescript
{
  stopped: number,   // Successfully stopped count
  failed: number,    // Failed to stop count
  total: number      // Total workers processed
}
```

## Session Data API

### Real-Time Data Stream

**Protocol:** WebSocket messages

**Message Structure:**

```typescript
{
  channel: string,     // Unique channel identifier
  module: string,      // Module name
  widget: string,      // Widget type
  raw: object,         // Widget-specific data
  timestamp: number    // Server timestamp
}
```

### Channel Naming Convention

**Pattern:**

```
{network}.{domain}.{module}.{submodule}.{type}.{identifier}.{widget}
```

**Examples:**

```
testnet.runtime.connector.exchange.crypto.bybit.spot.BTC/USDT.ticker
testnet.runtime.connector.exchange.crypto.binance.spot.ETH/USDT.trades
testnet.runtime.connector.exchange.crypto.okx.spot.SOL/USDT.book
testnet.snapshot.sonar
testnet.runtime.sonar
testnet.fred.usa.macro.indicator
```

### Widget Data Formats

#### Ticker Widget

```typescript
{
  widget: "ticker",
  raw: {
    exchange: string,
    market: string,
    last: number,
    bid: number,
    ask: number,
    change: number,
    percentage: number,
    baseVolume: number,
    quoteVolume: number,
    timestamp: number,
    latency: number
  }
}
```

#### Trades Widget

```typescript
{
  widget: "trades",
  raw: {
    exchange: string,
    market: string,
    trades: Array<{
      id: string,
      timestamp: number,
      side: "buy" | "sell",
      price: number,
      amount: number
    }>
  }
}
```

#### Order Book Widget

```typescript
{
  widget: "book",
  raw: {
    exchange: string,
    market: string,
    bids: Array<[number, number]>,  // [price, volume]
    asks: Array<[number, number]>,
    volume: [number, number],
    timestamp: number,
    latency: number
  }
}
```

#### Candles Widget

```typescript
{
  widget: "candles",
  raw: {
    exchange: string,
    market: string,
    timeframe: string,
    candles: Array<[
      number,  // timestamp
      number,  // open
      number,  // high
      number,  // low
      number,  // close
      number   // volume
    ]>
  }
}
```

#### FRED Indicator Widget

```typescript
{
  widget: "indicator",
  raw: {
    source: string,
    groupId: string,
    indicator: string,
    indicatorName: string,
    unit: string,
    scale?: number,
    agg: string,
    invert?: boolean,
    country: string,
    countryName: string,
    date: string,
    value: number,
    decimal: number
  }
}
```

#### Sonar Portfolio Widget

```typescript
{
  widget: "sonar",
  raw: {
    liquidity: number,
    available: number,
    margin: {
      balance: number,
      initial: number,
      maintenance: number
    },
    protection: number,
    coins: Record<string, number>,
    rate: number,
    timestamp: number,
    exchanges: string[],
    accounts: unknown[],
    workers: {
      active: number,
      stopped: number,
      total: number
    }
  }
}
```

## Error Responses

### Standard Error Format

```typescript
{
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

### Common Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or expired session)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (maintenance)

### Session Expiration

**Detection:**

```typescript
// WebSocket close event with specific code
ws.onclose = (event) => {
  if (event.code === 4401 || event.reason === "Session expired") {
    // Trigger session expired modal
    handleSessionExpired();
  }
};
```

**Recovery:**

1. Show session expired modal
2. User clicks "Re-authenticate"
3. Restore wallet from localStorage
4. Re-establish connection
5. Resume normal operation

## Rate Limiting

### Request Limits

- **Worker API:** 10 requests per minute per session
- **Account API:** 5 requests per minute per session
- **Wallet Info:** 20 requests per minute per IP

### Backoff Strategy

```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get("Retry-After");
  const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;

  setTimeout(() => {
    // Retry request
  }, delay);
}
```

## WebSocket Integration

### Connection Establishment

```typescript
interface WebSocketConfig {
  raw: {
    info: {
      connector: {
        socket: string; // WebSocket URL
        protocols?: string; // Optional protocols
      };
      network: string; // Network name
      title: string; // Network display name
      pid: string; // Process ID
    };
  };
}
```

### Session Data Format

**Received Message:**

```typescript
{
  channel: string,
  module: string,
  widget: string,
  raw: {
    // Widget-specific data
  },
  timestamp: number
}
```

**Storage:**

```typescript
sessionStorage.setItem(channel, JSON.stringify(messageData));
```

### Message Batching

**Implementation:**

```typescript
const MESSAGE_BATCH_INTERVAL = 200; // ms
let messageBatch: Record<string, string> = {};

// Accumulate messages
messageBatch[channel] = JSON.stringify(data);

// Flush after 200ms
setTimeout(() => {
  Object.entries(messageBatch).forEach(([key, value]) => {
    sessionStorage.setItem(key, value);
  });
  messageBatch = {};
}, MESSAGE_BATCH_INTERVAL);
```

**Optimization Benefits:**

- Reduces sessionStorage write operations
- Prevents UI blocking
- Improves performance with high-frequency updates

## Exchange Integration

### Supported Exchanges

**Implementation Location:** Workers can integrate any CCXT-compatible exchange

**Common Exchanges:**

- Binance
- Bybit
- OKX
- Coinbase
- Kraken
- KuCoin
- HTX (Huobi)
- Gate.io
- Bitget
- Upbit

### Exchange Data Structure

**Balance Response:**

```typescript
{
  info: {
    result: {
      list: [{
        totalEquity: string,
        totalWalletBalance: string,
        totalAvailableBalance: string,
        totalPerpUPL: string,
        totalInitialMargin: string,
        totalMaintenanceMargin: string,
        accountLTV: string,
        coin: Array<{
          coin: string;
          equity: string;
          usdValue: string;
          walletBalance: string;
          unrealisedPnl: string;
          borrowAmount: string;
          locked: string;
          // ... more fields
        }>,
      }];
    }
  }
}
```

**Position Data:**

```typescript
{
  positions: Array<{
    symbol: string;
    contracts: number;
    contractSize: number;
    unrealizedPnl: number;
    leverage: number;
    liquidationPrice: number;
    collateral: number;
    notional: number;
    markPrice: number;
    entryPrice: number;
    timestamp: number;
    side: string;
    marginMode: string;
    marginType: string;
  }>;
}
```

**Order Data:**

```typescript
{
  orders: {
    [symbol: string]: {
      open: OrderInfo[],
      closed: OrderInfo[],
      canceled: OrderInfo[]
    }
  }
}

interface OrderInfo {
  id: string,
  symbol: string,
  type: string,
  side: string,
  price: number,
  amount: number,
  filled: number,
  remaining: number,
  cost: number,
  status: string,
  timestamp: number,
  fee: {
    cost: number,
    currency: string
  }
}
```

## Worker Script API

### Runtime Context

**Available in Worker Scripts:**

```typescript
// Configuration
Stels.config.nid          // Current node ID
Stels.config.network      // Network name

// Distributed KV Store
Stels.net.get(key: string[]): Promise<{ value: any }>
Stels.net.set(key: string[], value: any): Promise<void>

// Local KV Store
Stels.local.get(key: string[]): Promise<{ value: any }>
Stels.local.set(key: string[], value: any): Promise<void>
Stels.local.list(options: { prefix: string[] }): AsyncIterator

// Exchange Connectors (when dependencies include "gliesereum")
Stels.runtime.cex.binance(config)
Stels.runtime.cex.bybit(config)
Stels.runtime.cex.okx(config)
// etc.

// Utilities
Stels.sleep(ms: number): Promise<void>

// Send data to frontend
Stels.webfix({
  brain: Stels.net,
  method: "set",
  channel: string[],
  module: string,
  raw: Record<string, unknown>,
  timestamp: number
}): Promise<void>

// Logging
logger.info(message: string, ...args: any[]): void
logger.error(message: string, ...args: any[]): void
logger.warn(message: string, ...args: any[]): void
logger.debug(message: string, ...args: any[]): void
```

### Worker Script Example

```typescript
// Grid Trading Worker
const exchange = new Stels.runtime.cex.bybit({
  apiKey: "YOUR_API_KEY",
  secret: "YOUR_SECRET",
});

const SYMBOL = "BTC/USDT";
const GRID_LEVELS = 10;
const GRID_STEP = 100;
const ORDER_SIZE = 0.001;

logger.info("Grid Trading Strategy v2.0");
logger.info(`Node: ${Stels.config.nid}`);

try {
  const ticker = await exchange.fetchTicker(SYMBOL);
  const basePrice = ticker.last;

  for (let i = 0; i < GRID_LEVELS; i++) {
    const price = basePrice - (GRID_LEVELS / 2) * GRID_STEP + (i * GRID_STEP);
    const side = price < basePrice ? "buy" : "sell";

    const order = await exchange.createLimitOrder(
      SYMBOL,
      side,
      ORDER_SIZE,
      price,
    );

    logger.info(`✅ ${side.toUpperCase()} order @ ${price}: ${order.id}`);
    await Stels.sleep(200);
  }

  logger.info(`🎉 Grid complete: ${GRID_LEVELS} orders placed`);
} catch (error) {
  logger.error("Grid strategy error:", error);
  throw error;
}
```

### Worker Execution Modes

#### Parallel Mode

```typescript
executionMode: "parallel";
```

- Executes on all nodes simultaneously
- No coordination needed
- Use for: data collection, monitoring, distributed tasks

#### Leader Mode

```typescript
executionMode: "leader";
```

- Distributed leader election
- Only one node executes at a time
- Automatic failover on leader failure
- Leader lease: 60 seconds (auto-renewed)
- Use for: trading strategies, singleton operations

**Leader Election Flow:**

```
1. Worker marked active
2. Nodes compete for leadership
3. Winner acquires lease in distributed KV
4. Leader executes script
5. Lease renewed every 30 seconds
6. On failure, new election occurs
```

#### Exclusive Mode

```typescript
executionMode: "exclusive";
assignedNode: "s-0001";
```

- Runs only on specified node
- No election or coordination
- Use for: node-specific maintenance, log cleanup

### Worker Priority System

**Priority Levels:**

```typescript
"critical": {
  maxErrors: 50,
  retryDelay: 1     // ms
}

"high": {
  maxErrors: 20,
  retryDelay: 10    // ms
}

"normal": {
  maxErrors: 10,
  retryDelay: 100   // ms
}

"low": {
  maxErrors: 5,
  retryDelay: 1000  // ms
}
```

**Behavior:**

- Worker stops after reaching max errors
- Retry delay increases with each failure
- Error counters reset on successful execution

## Network Status API

### Network Connections

**Channel:** `{network}.network.connections`

**Data Structure:**

```typescript
{
  raw: {
    network: string,
    totalClients: number,
    anonymousClients: number,
    authenticatedClients: number,
    sessionCount: number,
    maxConnectionsPerSession: number,
    streamingActive: boolean,
    dataTransmissionInterval: number,  // ms
    heartbeatInterval: number,         // ms
    cleanupRunning: boolean,
    timestamp: number
  }
}
```

### Node Information

**Channel Pattern:** `{network}.heterogen.{nodeId}.setting`

**Data Structure:**

```typescript
{
  raw: {
    location: {
      latitude: number,
      longitude: number,
      name: string,
      ip: string,
      network: string,
      version: string,
      city: string,
      country: string,
      country_name: string,
      timezone: string,
      // ... more location data
    },
    config: {
      network: string,
      title: string,
      type: string,
      brain: string,
      tick: number,
      connectors: string[],
      markets: string[],
      dns: {
        public: boolean,
        hetNet: {
          socket: string,
          protocol: string
        }
      }
    }
  }
}
```

## Transaction API

### Create Basic Transaction

**Client-Side Only:**

```typescript
import { createSignedTransaction } from "@/lib/gliesereum";

const transaction = createSignedTransaction(
  wallet,
  toAddress,
  amount,
  fee,
  data  // optional
);

// Transaction structure:
{
  from: {
    address: string,
    publicKey: string,
    number: string
  },
  to: string,
  amount: number,
  fee: number,
  timestamp: number,
  hash: string,
  signature: string,
  validators: string[],
  data?: string
}
```

### Create Smart Transaction

**Client-Side Only:**

```typescript
import { createSmartTransaction } from "@/lib/gliesereum";

const ops: SmartOp[] = [
  {
    op: "transfer",
    to: "g...",
    amount: "1.5",
    memo: "Payment",
  },
  {
    op: "assert.time",
    before_ms: Date.now() + 86400000, // Must execute within 24h
  },
];

const smartTx = createSmartTransaction(
  wallet,
  ops,
  "0.0001", // fee
  "Multi-operation transaction", // memo
  null, // prevHash
  undefined, // rawData
);

// Smart transaction includes:
// - Multiple operations
// - Fee calculation
// - Signatures
// - Optional cosign methods
```

## Integration Examples

### Frontend Integration

#### Connect to Network

```typescript
import { useAuthStore } from "@/stores";

function MyComponent() {
  const { connectToNode, connectionSession } = useAuthStore();

  const handleConnect = async () => {
    const success = await connectToNode();
    if (success) {
      console.log("Connected:", connectionSession);
    }
  };

  return <button onClick={handleConnect}>Connect</button>;
}
```

#### Access Session Data

```typescript
import useSessionStoreSync from "@/hooks/useSessionStoreSync";

function MyWidget() {
  const session = useSessionStoreSync();

  if (!session) return <div>Loading...</div>;

  const ticker = session["testnet.runtime...ticker"];

  return <div>Price: {ticker?.raw?.last}</div>;
}
```

#### Create Worker

```typescript
import { useEditorStore } from "@/apps/Editor/store";

function CreateWorker() {
  const createWorker = useEditorStore((state) => state.createWorker);

  const handleCreate = async () => {
    const worker = await createWorker({
      scriptContent: "logger.info('Hello from worker');",
      dependencies: [],
      version: "1.19.2",
      executionMode: "parallel",
      priority: "normal",
      mode: "loop",
    });

    if (worker) {
      console.log("Worker created:", worker.value.raw.sid);
    }
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

#### Add Exchange Account

```typescript
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { useAuthStore } from "@/stores/modules/auth.store";

function AddAccount() {
  const { wallet, connectionSession } = useAuthStore();
  const { sendAccountToServer } = useAccountsStore();

  const handleAdd = async () => {
    const accountData = {
      nid: `nid-${Date.now()}`,
      connection: true,
      exchange: "bybit",
      apiKey: "...",
      secret: "...",
      status: "active",
      note: "My account",
    };

    await sendAccountToServer(
      accountData,
      wallet,
      connectionSession.session,
      connectionSession.api,
    );
  };

  return <button onClick={handleAdd}>Add Account</button>;
}
```

## Best Practices

### API Call Error Handling

```typescript
async function safeApiCall<T>(
  method: string,
  body: unknown,
): Promise<T | null> {
  const { connectionSession } = useAuthStore.getState();

  if (!connectionSession) {
    console.error("No active connection");
    return null;
  }

  try {
    const response = await fetch(connectionSession.api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stels-session": connectionSession.session,
      },
      body: JSON.stringify({
        webfix: "1.0",
        method,
        params: [],
        body,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Session expired
        useAuthStore.getState().handleSessionExpired();
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed [${method}]:`, error);
    return null;
  }
}
```

### WebSocket Reconnection

```typescript
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000; // ms

let reconnectAttempts = 0;

function reconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    // Show session expired
    return;
  }

  const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
  reconnectAttempts++;

  setTimeout(() => {
    // Attempt reconnection
    connectWebSocket();
  }, delay);
}
```

### Session Data Access

```typescript
// Type-safe session access
function useSessionWidget<T = unknown>(channel: string): T | null {
  const session = useSessionStoreSync();

  if (!session || !session[channel]) {
    return null;
  }

  return session[channel] as T;
}

// Usage:
const ticker = useSessionWidget<TickerWidget>(
  "testnet.runtime.connector.exchange.crypto.bybit.spot.BTC/USDT.ticker",
);
```

## API Versioning

**Current Version:** WebFix 1.0

**Future Compatibility:**

- Protocol version checked on connection
- Graceful degradation for unsupported features
- Migration path for breaking changes

## Security Considerations

### API Security

1. **Session Token Security**
   - Tokens stored in memory during session
   - Not persisted to localStorage
   - Transmitted only over secure WebSocket

2. **Request Signing**
   - All account updates signed with wallet
   - Signature verification on backend
   - Deterministic message serialization

3. **Data Validation**
   - All inputs validated before sending
   - Type checking with TypeScript
   - Schema validation on backend

### Best Practices

- Never log session tokens
- Validate all user inputs
- Use HTTPS for API endpoints
- Implement request timeouts
- Handle connection failures gracefully

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Authors:** STELS Development Team
