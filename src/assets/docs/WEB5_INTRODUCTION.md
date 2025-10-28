# Understanding Web5 in STELS

**Category:** Platform\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** Developers, System Architects, Web5 Enthusiasts

---

## What is Web5?

**Web5** is the next evolution of the web, combining the decentralization
principles of Web3 with the performance and usability of Web2. STELS implements
a complete Web5 architecture through its **heterogeneous network**.

### 

The Evolution

```
Web1 (1990s)     → Static content, read-only
Web2 (2000s)     → Interactive, centralized platforms
Web3 (2010s)     → Blockchain, decentralized but slow
Web5 (2020s+)    → Distributed, autonomous, intelligent
```

**Web5** skips Web4 entirely—it's not just an incremental update, it's a
paradigm shift.

---

## Web5 Core Principles

### 1. **Heterogeneous Network**

Unlike traditional blockchain (homogeneous), STELS uses a **heterogeneous
network** where nodes (heterogens) are:

- **Diverse**: Different hardware, locations, capabilities
- **Autonomous**: Self-managing and self-healing
- **Cooperative**: Work together without central coordination
- **Adaptive**: Learn and optimize over time

```
Traditional Cloud:
┌──────────┐
│  Server  │ ← Single point of failure
└──────────┘

Blockchain:
┌────┐ ┌────┐ ┌────┐
│Node│ │Node│ │Node│ ← All nodes identical
└────┘ └────┘ └────┘

Web5 Heterogeneous:
┌──────┐ ┌─────┐ ┌───────┐
│ Fast │ │ GPU │ │Storage│ ← Diverse specializations
└──────┘ └─────┘ └───────┘
     ╲      │      ╱
      ╲     │     ╱
       └────┴────┘
```

### 2. **Protocol-Driven Communication**

Web5 uses **WebFix Protocol**—a structured message format that enables:

- **Deterministic execution** across different nodes
- **Verifiable operations** through cryptographic signing
- **Efficient routing** based on message structure
- **Automatic coordination** without central authority

**WebFix Message Format:**

```typescript
{
  webfix: "1.0",              // Protocol version
  method: "setWorker",        // Operation type
  params: ["worker", "create"],
  body: {
    nid: "node-123",          // Node identifier
    script: "...",            // Worker code
    mode: "loop",             // Execution mode
    priority: "high"          // Priority level
  }
}
```

### 3. **Channel-Based Data Flow**

Data in Web5 flows through **channels**—structured paths that organize
information:

```
Channel Structure:
testnet.runtime.book.SOL/USDT.bybit.spot
│       │       │    │       │      │
│       │       │    │       │      └─ Market type
│       │       │    │       └──────── Exchange
│       │       │    └──────────────── Trading pair
│       │       └─────────────────────── Data type (order book)
│       └─────────────────────────────── Network layer
└─────────────────────────────────────── Network name
```

**Why Channels?**

- **Organized**: Clear data hierarchy
- **Subscribable**: Real-time updates
- **Filterable**: Select exactly what you need
- **Composable**: Combine multiple channels

### 4. **AMI Workers (Autonomous Machine Intelligence)**

**AMI Workers** are JavaScript/TypeScript scripts that execute distributedly
across the heterogeneous network. They are the "programs" of Web5.

**Worker Characteristics:**

```typescript
{
  script: "// Your JavaScript code",
  scope: "local" | "network",         // Where it runs
  executionMode: "parallel" | "leader" | "exclusive",
  priority: "critical" | "high" | "normal" | "low",
  mode: "loop" | "single",            // Continuous or one-time
  dependencies: ["gliesereum"],       // Required modules
  version: "1.19.2"                   // Deno runtime version
}
```

**Execution Modes:**

- **Parallel**: Runs on ALL nodes simultaneously
- **Leader**: Runs on ONE elected leader node (with failover)
- **Exclusive**: Runs on a SPECIFIC assigned node

### 5. **Schemas (UI Definitions)**

**Schemas** define how data from channels is visualized. They are **not** data
validators—they are UI blueprints.

**Schema Structure:**

```json
{
  "component": "div",
  "props": {
    "className": "p-4 rounded border"
  },
  "children": [
    {
      "component": "text",
      "data": "{self.raw.last}",      ← Displays channel data
      "props": {
        "className": "text-2xl font-bold"
      }
    }
  ]
}
```

**Key Concepts:**

- **Static Schemas**: Containers/routers (layout only)
- **Dynamic Schemas**: Data-bound widgets (show live data)
- **Nested Schemas**: Compose complex UIs from simpler ones
- **Channel Aliases**: Short names for channels (`{ticker}` instead of full
  path)

---

## How Web5 Works in STELS

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      STELS Web OS                           │
│                    (Browser Interface)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Schemas  │  │  AMI     │  │ Channels │  │  Wallet  │  │
│  │   (UI)   │  │ Workers  │  │  (Data)  │  │  (Auth)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │             │         │
├───────┴─────────────┴──────────────┴─────────────┴─────────┤
│                   WebSocket Layer                           │
│              (Real-time bidirectional)                      │
├─────────────────────────────────────────────────────────────┤
│                   WebFix Protocol                           │
│         (Structured message format)                         │
├─────────────────────────────────────────────────────────────┤
│              Heterogeneous Network                          │
│         (Distributed execution environment)                 │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Heterogen │  │Heterogen │  │Heterogen │  │Heterogen │  │
│  │   US     │  │   EU     │  │   Asia   │  │ Oceania  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. Worker Creation:**

```typescript
User creates AMI Worker in Editor
         ↓
WebFix message sent: { method: "setWorker", ... }
         ↓
Message signed with user's private key
         ↓
Sent via WebSocket to network
         ↓
Network deploys worker to appropriate nodes
         ↓
Worker starts executing (based on mode and scope)
```

**2. Data Visualization:**

```typescript
Worker executes and generates data
         ↓
Data published to channel: "testnet.runtime.ticker.BTC/USDT"
         ↓
WebSocket pushes update to all subscribed clients
         ↓
Schema receives data via channel alias
         ↓
UI updates in real-time
```

---

## Key Differences from Web3

| Aspect           | Web3 (Blockchain)   | Web5 (STELS)         |
| ---------------- | ------------------- | -------------------- |
| **Network Type** | Homogeneous         | Heterogeneous        |
| **Consensus**    | Proof of Work/Stake | Leader Election      |
| **Speed**        | Slow (blocks)       | Real-time (instant)  |
| **Cost**         | Gas fees            | Network resources    |
| **Data Storage** | On-chain            | Channels + IndexedDB |
| **Execution**    | Smart Contracts     | AMI Workers          |
| **State**        | Global ledger       | Distributed channels |
| **UI**           | DApps (separate)    | Schemas (integrated) |

---

## Web5 Benefits

### For Developers

- **No Gas Fees**: Execute code without paying for every operation
- **Real Performance**: JavaScript/TypeScript at native speed
- **Familiar Tools**: Use Monaco editor, npm packages, modern frameworks
- **Instant Deployment**: Deploy workers in seconds, not minutes
- **True Autonomy**: Workers run continuously without your intervention

### For Users

- **Fast Experience**: Instant updates, no block confirmation waits
- **Lower Costs**: Network resource model instead of gas fees
- **Better UX**: Smooth, responsive interfaces built with modern web tech
- **Offline Capable**: PWA architecture with service workers
- **Privacy**: Your keys, your data, your control

### For the Ecosystem

- **Open Protocol**: WebFix is transparent and extensible
- **Composable**: Schemas and workers can be shared and reused
- **Scalable**: Add more heterogens to increase capacity
- **Resilient**: Distributed execution with automatic failover
- **Adaptive**: Network learns and optimizes over time

---

## Web5 Use Cases

### 1. Autonomous Trading Systems

**Traditional approach:**

```
User → TradingView → Manual execution → Exchange
      ↑
   Slow, manual, error-prone
```

**Web5 approach:**

```
AMI Worker → Real-time data → Autonomous decision → Execution
    ↑
Instant, automated, reliable
```

**Example Worker:**

```javascript
// Grid Trading Strategy
const positions = await Stels.net.get([
  "trading",
  "positions",
  Stels.config.nid,
]);
const ticker = await Stels.net.get(["ticker", "BTC/USDT"]);

const price = ticker.value.raw.last;
const gridLevel = calculateGrid(price, gridSize);

if (shouldBuy(positions, gridLevel)) {
  await placeBuyOrder(price, amount);
}
```

### 2. Real-Time Data Aggregation

**Collect data from multiple sources simultaneously:**

```javascript
// Parallel data collection across all exchanges
const exchanges = ["binance", "bybit", "okx", "coinbase"];

const prices = await Promise.all(
  exchanges.map((ex) => Stels.net.get(["ticker", `BTC/USDT.${ex}`])),
);

const averagePrice = prices.reduce((sum, p) => sum + p.value.raw.last, 0) /
  prices.length;

// Publish to channel
await Stels.net.set(["analytics", "average", "BTC/USDT"], {
  average: averagePrice,
  exchanges: exchanges.length,
});
```

### 3. Network Monitoring & Health

**Monitor heterogen status across the globe:**

```javascript
// Health check worker (runs on all nodes)
const health = {
  nid: Stels.config.nid,
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: Date.now(),
};

await Stels.net.set(["sonar", "health", Stels.config.nid], health);

// Check other nodes
const allNodes = await Stels.net.get(["sonar", "health"]);
const unhealthyNodes = findUnhealthyNodes(allNodes);

if (unhealthyNodes.length > 0) {
  await notifyAdmin(unhealthyNodes);
}
```

### 4. Distributed API Services

**Create public APIs that scale automatically:**

```javascript
// HTTP server running on heterogen
const handler = async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/price") {
    const symbol = url.searchParams.get("symbol");
    const data = await Stels.net.get(["ticker", symbol]);

    return new Response(
      JSON.stringify({
        symbol: symbol,
        price: data.value.raw.last,
        node: Stels.config.nid,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

Deno.serve({ port: 8080 }, handler);
```

---

## Security in Web5

### Cryptographic Foundation

**STELS uses secp256k1 (same as Bitcoin/Ethereum):**

- **Key Generation**: ECDSA private/public key pairs
- **Signing**: All operations are cryptographically signed
- **Verification**: Network verifies signatures before execution
- **Deterministic**: Same input always produces same output

### Authentication Flow

```
1. Generate key pair (secp256k1)
   Private Key: Never leaves your device
   Public Key: Your identity on network

2. Connect to network
   WebSocket connection established
   Session created with public key

3. Sign messages
   Every WebFix message signed with private key
   Network verifies signature before processing

4. Secure execution
   Workers run in isolated Deno sandbox
   No access to system resources without permission
```

### Privacy Model

- **Your Keys**: You control your private keys (stored locally)
- **Your Data**: Channel data is encrypted in transit
- **Your Workers**: Code execution is isolated per user
- **Your Choice**: Opt-in to data sharing, not default

---

## Web5 vs Traditional Approaches

### Example: Price Monitoring

**Traditional Web2:**

```javascript
// Centralized server
setInterval(async () => {
  const price = await fetch("https://api.exchange.com/ticker");
  if (price > threshold) {
    await sendEmail(user.email);
  }
}, 60000); // Check every minute

// Problems:
// - Single point of failure (server down = no monitoring)
// - Scaling costs money (more users = more servers)
// - Privacy concerns (email, API keys on server)
// - Latency (60s intervals)
```

**Web3 Blockchain:**

```solidity
// Smart contract
contract PriceMonitor {
    function checkPrice() public {
        uint price = oracle.getPrice();
        if (price > threshold) {
            emit PriceAlert(price);
        }
    }
}

// Problems:
// - Gas fees for every check
// - Oracle delays (minutes)
// - Complex to update
// - Not real-time
```

**Web5 STELS:**

```javascript
// AMI Worker (distributed, real-time, autonomous)
const ticker = await Stels.net.subscribe(["ticker", "BTC/USDT"]);

ticker.on("update", async (data) => {
  const price = data.raw.last;

  if (price > threshold) {
    // Instant notification
    await Stels.net.set(["alerts", "price", Date.now()], {
      symbol: "BTC/USDT",
      price: price,
      threshold: threshold,
    });
  }
});

// Benefits:
// ✅ Real-time (instant updates)
// ✅ No gas fees
// ✅ Distributed (runs on network)
// ✅ Autonomous (no manual checks)
// ✅ Resilient (automatic failover)
```

---

## The Web5 Developer Experience

### Traditional Development

```
1. Set up servers
2. Configure databases
3. Deploy applications
4. Monitor infrastructure
5. Handle scaling
6. Manage security
7. Update code manually

Result: Complex, expensive, time-consuming
```

### Web5 Development with STELS

```
1. Write JavaScript in Monaco Editor
2. Click "Deploy" (worker goes to network)
3. Done! Worker runs autonomously

Result: Simple, cost-effective, instant
```

**Example: Deploy in 30 seconds:**

```typescript
// 1. Open Editor (Cmd+Shift+E)
// 2. Create new worker
// 3. Paste code:

logger.info("Hello Web5!");

const ticker = await Stels.net.get(["ticker", "BTC/USDT"]);
logger.info("BTC Price:", ticker.value.raw.last);

// 4. Set execution mode: "leader"
// 5. Click "Save & Activate"
// 6. Worker deploys and starts running!
```

---

## Web5 Network Economics

### Resource Model

Instead of gas fees, STELS uses a **resource contribution model**:

- **Provide Resources**: Run a heterogen node
- **Earn Credits**: Network rewards your contribution
- **Use Credits**: Deploy workers, store data, execute operations
- **Fair Distribution**: Active nodes get more credits

### No Upfront Costs

- **Free to Start**: Create wallet, connect, explore
- **Free to Learn**: Templates and examples included
- **Pay Only for Usage**: Credits consumed by execution time
- **Community Support**: Shared nodes for testing

---

## Getting Started with Web5

### Step 1: Understand the Concepts

- ✅ Heterogeneous network (diverse nodes)
- ✅ WebFix protocol (structured messages)
- ✅ Channels (data organization)
- ✅ AMI Workers (execution)
- ✅ Schemas (visualization)

### Step 2: Explore Examples

1. **Open Editor** (Cmd+Shift+E)
2. **Browse Templates**: Grid Trading, Market Monitor, API Endpoint
3. **Read Code**: Understand how workers access data
4. **Modify**: Change parameters and test

### Step 3: Create Your First Worker

Follow **[Creating AMI Workers](CREATING_AMI_WORKERS.md)** guide

### Step 4: Build UI with Schemas

Follow **[Building with Schemas](BUILDING_WITH_SCHEMAS.md)** guide

### Step 5: Deploy to Network

Follow **[Network Deployment](NETWORK_DEPLOYMENT.md)** guide

---

## Web5 Resources

### Documentation

- 📖 **[Platform Introduction](PLATFORM_INTRODUCTION.md)** - Overview and
  philosophy
- 🛠️ **[Creating AMI Workers](CREATING_AMI_WORKERS.md)** - Build distributed
  programs
- 🎨 **[Building with Schemas](BUILDING_WITH_SCHEMAS.md)** - Create UI
  visualizations
- 🌐 **[Network Deployment](NETWORK_DEPLOYMENT.md)** - Deploy to heterogens
- 📚 **[API Reference](API_REFERENCE.md)** - Complete API docs

### Community

- **GitHub**: Source code and issues
- **Discussions**: Q&A and ideas
- **Network Status**: Real-time heterogen monitoring

---

## The Future of Web5

Web5 is not just technology—it's a movement toward:

- **True Decentralization**: No single entity controls the network
- **Developer Empowerment**: Build complex systems with simple tools
- **User Autonomy**: Full control over data and operations
- **Economic Fairness**: Resources distributed based on contribution
- **Global Scale**: Network grows with demand

**STELS is the first complete Web5 implementation.** Join us in building the
future of the autonomous web.

---

_© 2025 Gliesereum Ukraine. All rights reserved._
