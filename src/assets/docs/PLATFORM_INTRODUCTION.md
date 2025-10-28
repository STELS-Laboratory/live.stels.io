# STELS Platform Introduction

**Category:** Platform\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** Developers, Technical Architects, System Engineers

---

## Welcome to STELS

**STELS** is the world's first **distributed Web Operating System** built on a
heterogeneous network—a professional laboratory for Web5 developers to program
and manage autonomous intelligent applications.

This is not just another framework or library. STELS is a complete **operating
system for the web**, designed from the ground up to enable the next generation
of decentralized, autonomous, and intelligent systems.

---

## The Vision

We believe the future of the web is **autonomous, decentralized, and
intelligent**. Traditional web applications are centralized, require constant
maintenance, and are limited by single-server architectures. Web3 introduced
decentralization but sacrificed speed and usability. **Web5** combines the best
of both worlds.

### What We're Building

STELS enables developers to create **autonomous web applications** that:

- Execute **distributedly** across a global heterogeneous network
- Run **autonomously** after deployment, requiring minimal intervention
- Operate in **real-time** with instant updates (no block confirmations)
- Scale **automatically** as the network grows
- Communicate through **structured protocols** (WebFix)

Think of it as:

- **Cloud computing** + **AI autonomy**
- **Blockchain's decentralization** + **Web2's performance**
- **Traditional programming** + **Distributed execution**

---

## Core Philosophy

### 1. **Web5 Architecture**

STELS implements a complete Web5 stack—skipping Web4 entirely:

**Web1:** Static content (read-only)\
**Web2:** Interactive platforms (centralized)\
**Web3:** Blockchain (decentralized but slow)\
**Web5:** Distributed, autonomous, intelligent

**Key differences from Web3:**

| Aspect          | Web3 Blockchain  | Web5 STELS            |
| --------------- | ---------------- | --------------------- |
| **Network**     | Homogeneous      | Heterogeneous         |
| **Speed**       | Minutes (blocks) | Instant (real-time)   |
| **Cost**        | Gas fees         | Resource credits      |
| **Programming** | Smart Contracts  | JavaScript/TypeScript |
| **Execution**   | On-chain         | Distributed nodes     |
| **Data**        | Global ledger    | Channel streams       |
| **UI**          | Separate DApps   | Integrated schemas    |

### 2. **Heterogeneous Network**

Unlike traditional cloud (single provider) or blockchain (identical nodes),
STELS uses a **heterogeneous network** where nodes are:

- **Diverse**: Different hardware, locations, capabilities
- **Autonomous**: Self-managing and self-healing
- **Cooperative**: Work together without central coordination
- **Adaptive**: Learn and optimize over time

```
Traditional Cloud          Blockchain              Web5 Heterogeneous
┌──────────┐              ┌────┐ ┌────┐           ┌──────┐ ┌─────┐
│  Server  │              │Node│ │Node│           │ Fast │ │ GPU │
└──────────┘              └────┘ └────┘           └──────┘ └─────┘
     ↓                        ↓                        ↓
Single point             All identical          Diverse specialized
```

### 3. **AMI Workers (Autonomous Machine Intelligence)**

**AMI Workers** are JavaScript/TypeScript programs that execute on the network.
They are the "applications" of Web5.

**Key capabilities:**

```javascript
// Market monitoring worker (runs on elected leader)
const ticker = await Stels.net.get(["ticker", "BTC/USDT"]);
const price = ticker.value.raw.last;

if (price > 50000) {
  await Stels.net.set(["alerts", "price"], {
    symbol: "BTC/USDT",
    price: price,
    timestamp: Date.now(),
  });
}
```

**Execution modes:**

- **Parallel**: Runs on ALL nodes (health monitoring, data collection)
- **Leader**: Runs on ONE elected leader (trading strategies, single-point ops)
- **Exclusive**: Runs on SPECIFIC node (HTTP servers, geographic requirements)

### 4. **Channel-Based Data Flow**

Data flows through **channels**—structured paths that organize information:

```
testnet.runtime.ticker.BTC/USDT.binance.spot
│       │       │       │       │        │
Network─┴─Layer─┴─Type──┴─Pair──┴─Exchange┴─Market
```

**Benefits:**

- **Organized**: Clear hierarchy
- **Real-time**: WebSocket updates
- **Subscribable**: React to changes instantly
- **Composable**: Combine multiple channels

### 5. **Schemas (UI Definitions)**

**Schemas** are JSON-based UI definitions that visualize channel data:

```json
{
  "component": "div",
  "props": {
    "className": "p-4 bg-card rounded"
  },
  "children": [
    {
      "component": "text",
      "data": "Price: ${ticker.raw.last}",
      "props": {
        "className": "text-2xl font-bold"
      }
    }
  ]
}
```

**Types:**

- **Static schemas**: Layout containers (no data)
- **Dynamic schemas**: Data-bound widgets (live updates)
- **Nested schemas**: Composable UI components

### 6. **WebFix Protocol**

**WebFix** is the communication protocol that powers Web5:

```typescript
{
  webfix: "1.0",
  method: "setWorker",
  params: ["worker", "create"],
  body: {
    nid: "node-123",
    script: "...",
    mode: "loop",
    priority: "high"
  }
}
```

**Features:**

- Structured messages
- Cryptographic signing
- Deterministic execution
- Automatic routing

---

## What You Can Build

STELS enables sophisticated autonomous systems across multiple domains:

### 🤖 Autonomous Trading Systems

**Build algorithmic trading strategies that:**

- Monitor multiple exchanges simultaneously
- Execute trades based on real-time analysis
- Manage risk autonomously
- Adapt to market conditions

**Example: Grid Trading**

```javascript
// AMI Worker - Grid Trading Strategy
const GRID_SIZE = 100; // $100 spacing

while (true) {
  const ticker = await Stels.net.get(["ticker", "BTC/USDT"]);
  const price = ticker.value.raw.last;
  const gridLevel = Math.floor(price / GRID_SIZE) * GRID_SIZE;

  if (!hasPositionAt(gridLevel)) {
    await placeBuyOrder(gridLevel, 0.01);
  }

  await Stels.sleep(1000);
}
```

### 🌐 Distributed Intelligence Networks

**Create systems that:**

- Aggregate data from multiple sources
- Perform pattern recognition at scale
- Share insights across the network
- Learn and adapt over time

**Example: Arbitrage Detection**

```javascript
// Monitor prices across multiple exchanges
const exchanges = ["binance", "bybit", "okx"];
const prices = await Promise.all(
  exchanges.map((ex) => Stels.net.get(["ticker", `BTC/USDT.${ex}`])),
);

const max = Math.max(...prices.map((p) => p.value.raw.last));
const min = Math.min(...prices.map((p) => p.value.raw.last));

if (max - min > 50) {
  await notifyArbitrage(min, max);
}
```

### 📊 Network Operations & Monitoring

**Deploy infrastructure that:**

- Monitors heterogen health automatically
- Responds to incidents without human intervention
- Provides real-time analytics
- Self-heals and optimizes

**Example: Health Monitor**

```javascript
// Runs on every heterogen (parallel mode)
const health = {
  nid: Stels.config.nid,
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: Date.now(),
};

await Stels.net.set(["sonar", "health", Stels.config.nid], health);
```

### ⚙️ Custom Web Services

**Develop programmable APIs that:**

- Execute across the network
- Scale on demand
- Operate autonomously
- Integrate with existing systems

**Example: HTTP API Endpoint**

```javascript
// Exclusive worker on node with public IP
const handler = async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/price") {
    const symbol = url.searchParams.get("symbol");
    const ticker = await Stels.net.get(["ticker", symbol]);

    return new Response(JSON.stringify({
      price: ticker.value.raw.last,
      node: Stels.config.nid,
    }));
  }
};

Deno.serve({ port: 8080 }, handler);
```

---

## The STELS Development Environment

STELS provides a complete integrated development environment for Web5:

### 📝 Editor (AMI Workers IDE)

Monaco-based code editor for creating distributed programs:

- **Full IDE features**: IntelliSense, syntax highlighting, error checking
- **Worker templates**: Grid Trading, Market Monitor, API Endpoint, etc.
- **Execution modes**: Parallel, Leader, Exclusive
- **Priority levels**: Critical, High, Normal, Low
- **Real-time deployment**: Save and workers start running instantly

**Access:** Press `Cmd+Shift+E`

### 🎨 Canvas (Visual Workspace)

ReactFlow-based visual environment for composing UIs:

- **Drag-and-drop widgets**: Real-time market data, charts, indicators
- **Multi-panel support**: Multiple independent canvases
- **Schema-based**: All widgets backed by schemas
- **Real-time updates**: Live data through WebSocket
- **Persistent state**: Saves across sessions

**Access:** Press `Cmd+Shift+C`

### 🗂️ Schemas (UI Builder)

JSON-based schema editor for creating data visualizations:

- **Schema creation**: Define UI structure in JSON
- **Channel binding**: Connect to live data channels
- **Aliases**: Short names for channels
- **Nesting**: Compose complex UIs from simple parts
- **Testing**: Preview in Canvas instantly

**Access:** Press `Cmd+Shift+S`

### 📚 Docs (Documentation)

Comprehensive documentation viewer:

- **Platform guides**: Understanding Web5 and STELS
- **Developer guides**: Creating workers and schemas
- **API reference**: Complete technical docs
- **Searchable**: Find what you need quickly

**Access:** Press `Cmd+Shift+D`

### 📊 Markets (Trading Terminal)

Professional multi-exchange trading interface:

- **Real-time data**: Prices, trades, order books
- **Multiple exchanges**: Binance, Bybit, OKX, Coinbase
- **Advanced analysis**: Liquidity scanning, market depth
- **Order execution**: Place and manage trades

### 💼 Wallet (Cryptographic Identity)

Gliesereum blockchain wallet:

- **Key management**: Generate and import keys (secp256k1)
- **Transaction signing**: Sign all WebFix messages
- **Account integration**: Connect exchange accounts
- **Secure storage**: Keys never leave your device

### 🌍 Network (Globe Visualization)

3D visualization of heterogen distribution:

- **Global view**: See node locations worldwide
- **Real-time status**: Monitor network health
- **Performance metrics**: Latency, uptime, load
- **Interactive**: Click nodes for details

---

## Technology Stack

STELS is built on modern, professional web technologies:

### Frontend Foundation

- **React 19**: Modern hooks and concurrent features
- **TypeScript 5**: Strict type safety throughout
- **Vite 7**: Lightning-fast development and builds
- **Tailwind CSS 4**: Utility-first styling

### State Management

- **Zustand**: Lightweight, scalable state management
- **Persistence**: LocalStorage with IndexedDB
- **DevTools**: Redux DevTools integration

### UI Components

- **shadcn/ui**: Professional component library (Radix UI)
- **Lucide React**: Modern icon system
- **Framer Motion**: Smooth animations
- **ReactFlow**: Visual node system
- **Monaco Editor**: VS Code-level code editing

### Real-Time Communication

- **WebSocket**: Bidirectional communication
- **Automatic reconnection**: Network resilience
- **WebFix protocol**: Structured messages

### Cryptography

- **@noble/secp256k1**: Elliptic curve cryptography
- **@noble/hashes**: SHA-256 and other hashes
- **Secure by design**: No private key exposure

### Runtime

- **Deno** (on heterogens): Secure JavaScript/TypeScript runtime
- **Deno v1.19.2+**: Modern features and performance
- **Built-in security**: Sandbox execution

---

## Why STELS?

### For Developers

- **No Gas Fees**: Execute code without paying for every operation
- **Familiar Tools**: JavaScript/TypeScript, Monaco editor, npm packages
- **Real Performance**: Native speed, instant updates
- **Instant Deployment**: Deploy workers in seconds
- **True Autonomy**: Workers run continuously after deployment

**Compare deployment:**

```
Traditional Cloud:
1. Set up server
2. Configure environment
3. Deploy application
4. Monitor infrastructure
5. Handle scaling
Time: Hours to days

Web3 Blockchain:
1. Write smart contract
2. Deploy to blockchain
3. Pay gas fees for every operation
4. Wait for block confirmation
Time: Minutes per transaction

STELS Web5:
1. Write JavaScript in Monaco
2. Click "Save & Activate"
3. Done! Running on network
Time: Seconds
```

### For Businesses

- **Lower Costs**: No server hosting, no gas fees
- **Automatic Scaling**: Network grows with demand
- **High Reliability**: Distributed execution with failover
- **Fast Development**: From idea to production in hours
- **Professional Tools**: Everything needed for serious applications

### For the Ecosystem

- **Open Protocol**: WebFix is transparent and extensible
- **Composable**: Workers and schemas can be shared and reused
- **Fair Economics**: Resource contribution model
- **Global Scale**: Network spans the globe
- **Community-Driven**: Developers shape the platform

---

## Getting Started

Ready to build on Web5?

### 1. **Understand Web5**

Read **[Understanding Web5](WEB5_INTRODUCTION.md)** to grasp the paradigm shift.

### 2. **Quick Start**

Follow **[Quick Start Guide](QUICK_START.md)** to get STELS running in 5
minutes.

### 3. **Developer Onboarding**

Complete **[Developer Onboarding](DEVELOPER_ONBOARDING.md)** for full setup and
environment configuration.

### 4. **Create Your First Worker**

Follow **[Creating AMI Workers](CREATING_AMI_WORKERS.md)** to build your first
distributed program.

### 5. **Build UI with Schemas**

Learn **[Building with Schemas](BUILDING_WITH_SCHEMAS.md)** to create data
visualizations.

### 6. **Explore Examples**

- Open Editor (`Cmd+Shift+E`)
- Browse worker templates (Grid Trading, Market Monitor, etc.)
- Study code and modify for your needs

---

## Key Concepts to Understand

Before diving deeper, familiarize yourself with:

### Web5 Architecture

- **Heterogeneous network**: Diverse, specialized nodes
- **WebFix protocol**: Structured communication
- **Channel-based data**: Organized information streams
- **Distributed execution**: Code runs across the network

### AMI Workers

- **JavaScript/TypeScript**: Familiar programming languages
- **Execution modes**: Parallel, Leader, Exclusive
- **Priority levels**: Critical, High, Normal, Low
- **Loop vs Single**: Continuous or one-time execution

### Schemas

- **JSON-based UI**: Define interfaces declaratively
- **Data binding**: Connect to live channels
- **Static vs Dynamic**: Layout vs data-bound
- **Nested schemas**: Composable components

### Security

- **secp256k1 keys**: Same as Bitcoin/Ethereum
- **Message signing**: Every operation is signed
- **Sandbox execution**: Workers run in isolated Deno runtime
- **Your keys**: Full control, never shared

---

## Project Status

**STELS is in active development.** Current version: **0.12.8**

We're continuously adding features, improving performance, and expanding
capabilities. This is a professional-grade system designed for production use.

**Current status:**

- ✅ Core Web5 infrastructure
- ✅ AMI Workers with full execution modes
- ✅ Schema system with data binding
- ✅ Real-time WebSocket communication
- ✅ Cryptographic wallet integration
- ✅ Multi-exchange trading terminal
- ✅ Visual canvas composition
- ✅ Network monitoring and health
- 🚧 Enhanced worker templates
- 🚧 Advanced schema features
- 🚧 Expanded heterogen network

---

## Philosophy in Practice

STELS embodies several key principles:

### Simplicity Over Complexity

We choose clear patterns over clever abstractions. JavaScript/TypeScript instead
of custom languages. JSON schemas instead of complex frameworks.

### Performance Without Compromise

Real-time updates, instant deployment, native speed. No waiting for blocks, no
slow consensus, no compromise.

### Developer Experience Matters

Monaco editor, hot reload, templates, comprehensive docs. From idea to running
worker in seconds.

### Security Cannot Be Optional

Every operation signed, keys never exposed, sandbox execution, constant-time
cryptography.

### Web Standards First

Built on proven technologies: React, TypeScript, WebSocket, Deno. No
experimental dependencies in production.

### Autonomous by Design

Workers run independently after deployment. The network manages execution,
failover, and scaling automatically.

---

## Next Steps

Continue your journey into Web5:

- 🌐 **[Understanding Web5](WEB5_INTRODUCTION.md)** - Deep dive into Web5
  concepts
- 🛠️ **[Creating AMI Workers](CREATING_AMI_WORKERS.md)** - Build distributed
  programs
- 🎨 **[Building with Schemas](BUILDING_WITH_SCHEMAS.md)** - Create UI
  visualizations
- 🚀 **[Developer Onboarding](DEVELOPER_ONBOARDING.md)** - Complete setup guide
- 📚 **[API Reference](API_REFERENCE.md)** - Technical documentation

---

**Welcome to the future of autonomous web applications. Welcome to STELS.**

---

_© 2025 Gliesereum Ukraine. All rights reserved._
