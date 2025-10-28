# Creating AMI Workers

**Category:** Developer\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** Developers building distributed systems

---

## What are AMI Workers?

**AMI (Autonomous Machine Intelligence) Workers** are JavaScript/TypeScript
programs that execute on the STELS heterogeneous network. They are the
"applications" of Web5—autonomous, distributed, and intelligent.

**Key characteristics:**

- Written in **JavaScript/TypeScript**
- Execute in **Deno runtime** (v1.19.2+)
- Run **distributedly** across network nodes
- Operate **autonomously** after deployment
- Access **network data** through `Stels.net` API

---

## Worker Anatomy

### Basic Structure

Every AMI Worker has access to two main objects:

```typescript
// Global context available to all workers:
Stels; // Network API and configuration
logger; // Structured logging

// Your worker code
logger.info("Worker started on node:", Stels.config.nid);
```

### Worker Configuration

```typescript
{
  // Execution Configuration
  scope: "local" | "network",           // Where worker runs
  executionMode: "parallel" | "leader" | "exclusive",
  priority: "critical" | "high" | "normal" | "low",
  mode: "loop" | "single",              // Continuous or one-time
  
  // Runtime Configuration
  version: "1.19.2",                    // Deno version
  dependencies: ["gliesereum"],         // NPM packages
  
  // Assignment (for exclusive mode)
  assignedNode: "node-xyz",             // Specific heterogen
  accountId: "account-123"              // Associated account
}
```

---

## Execution Modes

### 1. Parallel Mode

**Runs on ALL nodes simultaneously**

**Use cases:**

- Health monitoring
- Data collection
- Network-wide operations

**Example:**

```javascript
// Health check worker (runs on every heterogen)
const health = {
  nid: Stels.config.nid,
  uptime: Deno.metrics().ops.op_now,
  memory: Deno.memoryUsage(),
  timestamp: Date.now(),
};

await Stels.net.set(["sonar", "health", Stels.config.nid], health);

logger.info(`Health reported from ${Stels.config.nid}`);
```

**Characteristics:**

- ✅ Maximum redundancy
- ✅ Distributed data collection
- ❌ Higher resource usage
- ❌ Potential conflicts if not designed carefully

### 2. Leader Mode

**Runs on ONE elected leader node (with automatic failover)**

**Use cases:**

- Trading strategies
- Centralized decision-making
- Resource-sensitive operations

**Example:**

```javascript
// Grid trading strategy (runs on elected leader only)
logger.info(`Leader node ${Stels.config.nid} executing strategy`);

const positions = await Stels.net.get([
  "trading",
  "positions",
  Stels.config.nid,
]);
const ticker = await Stels.net.get(["ticker", "BTC/USDT"]);

const price = ticker.value.raw.last;
const gridLevel = Math.floor(price / gridSize) * gridSize;

if (!hasPositionAt(positions, gridLevel) && shouldBuy(price)) {
  await placeBuyOrder(gridLevel, amount);
  logger.info(`Buy order placed at ${gridLevel}`);
}
```

**Leader Election:**

- Automatic election among available nodes
- If leader fails, another node elected instantly
- No manual intervention required
- Transparent to your code

**Characteristics:**

- ✅ Single point of execution (no conflicts)
- ✅ Automatic failover
- ✅ Resource efficient
- ✅ Perfect for strategies

### 3. Exclusive Mode

**Runs on a SPECIFIC assigned node**

**Use cases:**

- HTTP servers
- Hardware-specific operations
- Geographic requirements

**Example:**

```javascript
// API endpoint (assigned to specific node with public IP)
const PORT = 8080;

const handler = async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/price") {
    const symbol = url.searchParams.get("symbol");
    const ticker = await Stels.net.get(["ticker", symbol]);

    return new Response(
      JSON.stringify({
        success: true,
        price: ticker.value.raw.last,
        node: Stels.config.nid,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response("Not Found", { status: 404 });
};

logger.info(`API server started on node ${Stels.config.nid}:${PORT}`);
Deno.serve({ port: PORT }, handler);
```

**Assignment:**

```typescript
{
  executionMode: "exclusive",
  assignedNode: "node-us-east-1",  // Must specify node
  mode: "single"                   // Usually runs once
}
```

**Characteristics:**

- ✅ Full control over execution location
- ✅ Predictable performance
- ❌ No automatic failover
- ❌ Requires node availability

---

## Priority Levels

Workers can have different priorities affecting their resource allocation:

### Critical Priority

```typescript
priority: "critical";
```

- Highest resource allocation
- Fastest startup
- Maximum reliability
- Use for: Core trading, risk management, critical monitoring

### High Priority

```typescript
priority: "high";
```

- Above-normal resources
- Quick startup
- High reliability
- Use for: Active strategies, important monitoring

### Normal Priority

```typescript
priority: "normal";
```

- Standard resources (default)
- Normal startup
- Standard reliability
- Use for: General operations, most workers

### Low Priority

```typescript
priority: "low";
```

- Minimal resources
- Slower startup
- Lower reliability
- Use for: Background tasks, analytics, cleanup

---

## Execution Loop vs Single

### Loop Mode (Continuous)

```typescript
mode: "loop";
```

Worker runs continuously until manually stopped.

**Example: Market monitor**

```javascript
// Runs forever, checking every 5 seconds
while (true) {
  const ticker = await Stels.net.get(["ticker", "BTC/USDT"]);
  const price = ticker.value.raw.last;

  if (price > 50000) {
    await Stels.net.set(["alerts", "price"], {
      symbol: "BTC/USDT",
      price: price,
      timestamp: Date.now(),
    });
  }

  await Stels.sleep(5000); // Wait 5 seconds
}
```

### Single Mode (One-Time)

```typescript
mode: "single";
```

Worker runs once and stops.

**Example: Data migration**

```javascript
// Runs once, migrates data, then stops
logger.info("Starting data migration");

const oldData = await Stels.net.get(["old", "data"]);
const transformed = transformData(oldData);

await Stels.net.set(["new", "data"], transformed);

logger.info("Migration complete");
// Worker stops automatically
```

---

## Stels API Reference

### Network Operations

#### Get Data

```javascript
const result = await Stels.net.get(channel);
```

**Parameters:**

- `channel`: Array of strings defining the channel path

**Returns:**

```typescript
{
  key: string[];        // Channel path
  value: {
    raw: any;          // Your data
    channel: string;   // Full channel string
  };
  timestamp: number;
}
```

**Examples:**

```javascript
// Get ticker data
const ticker = await Stels.net.get(["ticker", "BTC/USDT"]);
const price = ticker.value.raw.last;

// Get order book
const book = await Stels.net.get([
  "testnet",
  "runtime",
  "book",
  "SOL/USDT",
  "bybit",
  "spot",
]);
const bestAsk = book.value.raw.asks[0][0];

// Get positions
const positions = await Stels.net.get([
  "trading",
  "positions",
  Stels.config.nid,
]);
```

#### Set Data

```javascript
await Stels.net.set(channel, data);
```

**Parameters:**

- `channel`: Array of strings defining the channel path
- `data`: Any JSON-serializable data

**Examples:**

```javascript
// Publish alert
await Stels.net.set(["alerts", "price", Date.now()], {
  symbol: "BTC/USDT",
  price: 51000,
  type: "above_threshold",
});

// Store position
await Stels.net.set(["trading", "positions", Stels.config.nid], {
  symbol: "BTC/USDT",
  side: "long",
  size: 0.1,
  entry: 50000,
});

// Update analytics
await Stels.net.set(["analytics", "volume", "24h"], {
  total: 1234567890,
  exchanges: ["binance", "bybit"],
  timestamp: Date.now(),
});
```

#### Subscribe to Updates

```javascript
const subscription = await Stels.net.subscribe(channel);

subscription.on("update", (data) => {
  // Handle real-time updates
});
```

**Example:**

```javascript
// Real-time price monitoring
const tickerSub = await Stels.net.subscribe(["ticker", "BTC/USDT"]);

tickerSub.on("update", (data) => {
  const price = data.raw.last;
  logger.info(`Price updated: ${price}`);

  if (price > threshold) {
    triggerAlert(price);
  }
});
```

### Configuration

#### Worker Identity

```javascript
const nodeId = Stels.config.nid; // Current heterogen ID
const workerId = Stels.config.sid; // Current worker ID
```

#### WebFix Method

```javascript
await Stels.webfix({
  brain: Stels.net,
  method: "set",
  channel: ["trading", "orders"],
  module: "trading",
  raw: orderData,
  timestamp: Date.now(),
});
```

### Utility Functions

#### Sleep

```javascript
await Stels.sleep(milliseconds);
```

**Example:**

```javascript
while (true) {
  await doWork();
  await Stels.sleep(5000); // Wait 5 seconds
}
```

---

## Worker Templates

STELS provides pre-built templates for common use cases:

### 1. Grid Trading Strategy

**Category:** Trading\
**Execution Mode:** Leader\
**Priority:** High

```javascript
// Grid Trading Worker
const GRID_SIZE = 100; // $100 grid spacing
const POSITION_SIZE = 0.01; // 0.01 BTC per grid

logger.info("Grid Trading started");

while (true) {
  const ticker = await Stels.net.get(["ticker", "BTC/USDT"]);
  const price = ticker.value.raw.last;

  const gridLevel = Math.floor(price / GRID_SIZE) * GRID_SIZE;
  const positions = await Stels.net.get([
    "trading",
    "positions",
    Stels.config.nid,
  ]);

  // Check if we have position at this grid level
  if (!hasPositionAt(positions, gridLevel)) {
    // Place buy order
    await placeBuyOrder(gridLevel, POSITION_SIZE);
    logger.info(`Buy order at ${gridLevel}`);
  }

  // Check for sell opportunities
  if (hasPositionBelow(positions, price - GRID_SIZE)) {
    await placeSellOrder(price, POSITION_SIZE);
    logger.info(`Sell order at ${price}`);
  }

  await Stels.sleep(1000);
}
```

### 2. Market Monitor

**Category:** Monitoring\
**Execution Mode:** Parallel\
**Priority:** Normal

```javascript
// Market Monitoring Worker
logger.info("Market Monitor started on", Stels.config.nid);

const symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT"];

while (true) {
  for (const symbol of symbols) {
    const ticker = await Stels.net.get(["ticker", symbol]);
    const price = ticker.value.raw.last;
    const volume = ticker.value.raw.volume;

    // Store metrics
    await Stels.net.set(["metrics", "price", symbol], {
      price: price,
      volume: volume,
      node: Stels.config.nid,
      timestamp: Date.now(),
    });
  }

  await Stels.sleep(5000);
}
```

### 3. Balance Monitor

**Category:** Monitoring\
**Execution Mode:** Leader\
**Priority:** Normal

```javascript
// Balance Monitoring Worker
logger.info("Balance Monitor started");

const THRESHOLD = 1000; // Alert if balance below $1000

while (true) {
  const balance = await Stels.net.get(["account", "balance", Stels.config.nid]);
  const usdBalance = balance.value.raw.USD || 0;

  if (usdBalance < THRESHOLD) {
    await Stels.net.set(["alerts", "balance"], {
      level: "warning",
      balance: usdBalance,
      threshold: THRESHOLD,
      timestamp: Date.now(),
    });

    logger.warn(`Low balance: $${usdBalance}`);
  }

  await Stels.sleep(60000); // Check every minute
}
```

### 4. Arbitrage Monitor

**Category:** Trading\
**Execution Mode:** Parallel\
**Priority:** High

```javascript
// Arbitrage Detection Worker
const EXCHANGES = ["binance", "bybit", "okx"];
const SYMBOL = "BTC/USDT";
const MIN_DIFF = 50; // Minimum $50 difference

logger.info("Arbitrage Monitor started on", Stels.config.nid);

while (true) {
  const prices = {};

  // Fetch prices from all exchanges
  for (const exchange of EXCHANGES) {
    const ticker = await Stels.net.get(["ticker", `${SYMBOL}.${exchange}`]);
    prices[exchange] = ticker.value.raw.last;
  }

  // Find arbitrage opportunities
  const max = Math.max(...Object.values(prices));
  const min = Math.min(...Object.values(prices));
  const diff = max - min;

  if (diff > MIN_DIFF) {
    const buyExchange = Object.keys(prices).find((ex) => prices[ex] === min);
    const sellExchange = Object.keys(prices).find((ex) => prices[ex] === max);

    await Stels.net.set(["arbitrage", "opportunities", Date.now()], {
      symbol: SYMBOL,
      buyExchange: buyExchange,
      sellExchange: sellExchange,
      buyPrice: min,
      sellPrice: max,
      difference: diff,
      profit: (diff / min) * 100,
      node: Stels.config.nid,
    });

    logger.info(
      `Arbitrage: Buy ${buyExchange} @ ${min}, Sell ${sellExchange} @ ${max}`,
    );
  }

  await Stels.sleep(1000);
}
```

### 5. API Endpoint

**Category:** Integration\
**Execution Mode:** Exclusive\
**Priority:** High

```javascript
// HTTP API Server Worker
const PORT = 8080;

const handler = async (req) => {
  const url = new URL(req.url);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    // GET /health
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          node: Stels.config.nid,
          timestamp: Date.now(),
        }),
        { headers },
      );
    }

    // GET /price?symbol=BTC/USDT
    if (url.pathname === "/price") {
      const symbol = url.searchParams.get("symbol");
      const ticker = await Stels.net.get(["ticker", symbol]);

      return new Response(
        JSON.stringify({
          symbol: symbol,
          price: ticker.value.raw.last,
          volume: ticker.value.raw.volume,
          timestamp: Date.now(),
        }),
        { headers },
      );
    }

    // POST /signal
    if (url.pathname === "/signal" && req.method === "POST") {
      const body = await req.json();

      await Stels.net.set(["trading", "signals", Date.now()], body);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Signal received",
        }),
        { headers },
      );
    }

    return new Response(
      JSON.stringify({
        error: "Not found",
      }),
      { status: 404, headers },
    );
  } catch (error) {
    logger.error("API error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { status: 500, headers },
    );
  }
};

logger.info(`API Server starting on port ${PORT}`);
Deno.serve({ port: PORT }, handler);
```

---

## Creating Workers in Editor

### Step 1: Open Editor

Press `Cmd+Shift+E` or click Editor in navigation.

### Step 2: Create New Worker

Click **"Create New Worker"** button.

### Step 3: Choose Template

- **Trading**: Grid, DCA, Arbitrage, Position Manager
- **Monitoring**: Market Monitor, Balance Monitor, Health Check
- **Analytics**: Price Aggregator
- **Integration**: API Endpoint, Telegram Bot
- **Empty**: Start from scratch

### Step 4: Configure Worker

```typescript
{
  note: "My First Worker",          // Description
  scope: "local",                   // local or network
  executionMode: "leader",          // parallel, leader, exclusive
  priority: "normal",               // critical, high, normal, low
  mode: "loop",                     // loop or single
  version: "1.19.2",                // Deno version
  dependencies: []                  // NPM packages
}
```

### Step 5: Write/Edit Code

Use Monaco editor with full IntelliSense:

```javascript
logger.info("Worker started");

// Your code here
```

### Step 6: Save & Activate

Click **"Save & Activate"** to deploy to network.

### Step 7: Monitor Status

View worker status in the list:

- ✅ **Active**: Running successfully
- ⏸️ **Inactive**: Manually stopped
- ⚠️ **Error**: Check logs for issues

---

## Best Practices

### 1. Error Handling

```javascript
try {
  const data = await Stels.net.get(["ticker", "BTC/USDT"]);
  processData(data);
} catch (error) {
  logger.error("Failed to fetch ticker:", error);
  // Don't crash the worker, handle gracefully
}
```

### 2. Resource Management

```javascript
// BAD: Infinite loop without delay
while (true) {
  await doWork(); // CPU intensive!
}

// GOOD: Add delays
while (true) {
  await doWork();
  await Stels.sleep(1000); // Give CPU a break
}
```

### 3. Logging

```javascript
// Use structured logging
logger.info("Order placed", {
  symbol: "BTC/USDT",
  side: "buy",
  price: 50000,
  amount: 0.1,
});

// Avoid sensitive data
logger.info("User action"); // ❌ Don't log API keys, private keys
```

### 4. Channel Organization

```javascript
// GOOD: Clear hierarchy
await Stels.net.set(["trading", "orders", "buy", Date.now()], order);

// BAD: Flat structure
await Stels.net.set(["order123"], order);
```

### 5. Graceful Shutdown

```javascript
// Listen for stop signals
Deno.addSignalListener("SIGTERM", () => {
  logger.info("Worker stopping...");
  // Cleanup resources
  closeConnections();
  Deno.exit(0);
});
```

---

## Testing Workers

### 1. Local Testing

Test in Editor before deploying:

1. Write worker code
2. Check for syntax errors (Monaco highlights them)
3. Use `logger.info()` for debugging
4. Save without activating initially

### 2. Testnet Deployment

Deploy to testnet nodes first:

```typescript
{
  scope: "local",        // Only on testnet nodes
  mode: "single",        // Run once for testing
  priority: "low"        // Lower priority
}
```

### 3. Production Deployment

After successful testing:

```typescript
{
  scope: "network",      // All production nodes
  mode: "loop",          // Continuous operation
  priority: "high"       // Production priority
}
```

---

## Troubleshooting

### Worker Not Starting

**Symptoms:** Worker shows as inactive

**Solutions:**

- Check for syntax errors in code
- Verify dependencies are correct
- Check node availability (for exclusive mode)
- Review logs for error messages

### Worker Crashes Repeatedly

**Symptoms:** Worker starts then stops immediately

**Solutions:**

- Add try-catch blocks around operations
- Check network connectivity
- Verify channel paths exist
- Add delays in loops

### Poor Performance

**Symptoms:** Worker runs slowly

**Solutions:**

- Add sleep delays to reduce CPU usage
- Use caching for frequently accessed data
- Optimize data queries
- Consider using higher priority

### Data Not Updating

**Symptoms:** Old or stale data

**Solutions:**

- Verify channel paths are correct
- Check if data source is active
- Use subscriptions for real-time updates
- Confirm network connection

---

## Advanced Topics

### 1. Leader Election

When using `leader` mode, the network automatically elects a leader:

```javascript
// Check if this node is the leader
const leaderInfo = await Stels.net.get(["leader", "info", Stels.config.sid]);
const isLeader = leaderInfo.value.raw.nid === Stels.config.nid;

if (isLeader) {
  logger.info("This node is the leader");
} else {
  logger.info("This node is a follower");
}
```

### 2. Worker Communication

Workers can communicate via channels:

```javascript
// Worker A: Publisher
await Stels.net.set(["worker", "messages", "A"], {
  from: "workerA",
  message: "Hello Worker B",
  timestamp: Date.now(),
});

// Worker B: Subscriber
const sub = await Stels.net.subscribe(["worker", "messages", "A"]);
sub.on("update", (data) => {
  logger.info("Message received:", data.raw.message);
});
```

### 3. State Persistence

Workers can persist state across restarts:

```javascript
// Save state
await Stels.net.set(["worker", "state", Stels.config.sid], {
  lastProcessedTime: Date.now(),
  counters: { trades: 123, signals: 456 },
});

// Restore state on restart
const savedState = await Stels.net.get(["worker", "state", Stels.config.sid]);
if (savedState) {
  const { lastProcessedTime, counters } = savedState.value.raw;
  logger.info("State restored:", counters);
}
```

---

## Next Steps

- 🎨 **[Building with Schemas](BUILDING_WITH_SCHEMAS.md)** - Create UI for your
  workers
- 🌐 **[Network Deployment](NETWORK_DEPLOYMENT.md)** - Deploy to production
- 📚 **[API Reference](API_REFERENCE.md)** - Complete API documentation
- 🔒 **[Security Best Practices](SECURITY_GUIDE.md)** - Secure your workers

---

_© 2025 Gliesereum Ukraine. All rights reserved._
