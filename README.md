# STELS Web3 Trading Platform

> Professional cryptocurrency trading platform with advanced market intelligence
> and algorithmic execution capabilities.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://reactjs.org/)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-orange.svg)](https://github.com/pmndrs/zustand)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8.svg)](https://tailwindcss.com/)

---

## 🎯 Overview

STELS is a comprehensive Web3 trading platform that provides professional
traders and developers with advanced tools for:

- **Real-time market analysis** across multiple cryptocurrency exchanges
- **Algorithmic trading** with visual workflow designer
- **Deep liquidity analysis** and order book aggregation
- **Custom dashboard creation** with modular widget system
- **Economic indicator tracking** from global data sources
- **Secure wallet management** with native blockchain integration

---

## 🏗️ Architecture

### Technology Stack

```typescript
{
  "Frontend": "React 19.1 + TypeScript 5.8 (strict mode)",
  "State Management": "Zustand 5.0 (modular architecture)",
  "Styling": "Tailwind CSS 4.1 + shadcn/ui components",
  "Charts": "lightweight-charts, recharts",
  "3D Visualization": "react-globe.gl",
  "Flow Designer": "ReactFlow 11.11",
  "Code Editor": "Monaco Editor",
  "Animations": "Framer Motion 12.23",
  "Cryptography": "secp256k1 (elliptic) + @noble/hashes",
  "Build Tool": "Vite 7.0"
}
```

### Project Structure

```
apps/web3/
├── src/
│   ├── apps/                      # Self-contained applications
│   │   ├── Canvas/               # Visual workflow designer
│   │   │   ├── Flow.tsx
│   │   │   ├── FlowWithPanels.tsx
│   │   │   ├── MacOSNode.tsx
│   │   │   ├── NodeFlow.tsx
│   │   │   └── store.ts          ← Canvas-specific state
│   │   │
│   │   ├── Editor/               # AMI Protocol editor
│   │   │   ├── AMIEditor.tsx
│   │   │   ├── AMIEditor/        # Module internals
│   │   │   └── store.ts          ← Worker management
│   │   │
│   │   ├── Markets/              # Multi-exchange aggregator
│   │   │   ├── Markets.tsx
│   │   │   ├── components/       # Market-specific components
│   │   │   └── store.ts          ← Market filters
│   │   │
│   │   ├── Scanner/              # Liquidity analyzer
│   │   ├── OrderBook/            # Order book aggregator
│   │   ├── Fred/                 # Economic indicators
│   │   ├── Globe/                # Network visualization
│   │   ├── Wallet/               # Gliesereum wallet
│   │   └── Welcome/              # App launcher
│   │
│   ├── stores/                    # Global state management
│   │   └── modules/
│   │       ├── app.store.ts      # Routing, network, sync
│   │       ├── auth.store.ts     # Wallet, authentication
│   │       ├── theme.store.ts    # Theme management
│   │       └── accounts.store.ts # Exchange accounts
│   │
│   ├── components/                # Shared components
│   │   ├── auth/                 # Authentication flow
│   │   ├── main/                 # Core components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── widgets/              # Canvas widgets
│   │   └── panels/               # Panel system
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuthRestore.ts     # Auto-restore auth
│   │   ├── useAutoConnections.ts # Auto-connect widgets
│   │   ├── useSessionStoreSync.ts# Session data sync
│   │   ├── useUrlRouter.ts       # URL-based routing
│   │   └── useTheme.ts           # Theme management
│   │
│   ├── lib/                       # Core libraries
│   │   ├── gliesereum/           # Blockchain wallet lib
│   │   │   ├── wallet.ts         # Wallet operations
│   │   │   ├── crypto.ts         # Cryptographic functions
│   │   │   ├── types.ts          # Transaction types
│   │   │   └── validation.ts     # Validators
│   │   │
│   │   ├── router.ts             # Navigation utilities
│   │   ├── utils.ts              # Common utilities
│   │   ├── canvas-types.ts       # Canvas type definitions
│   │   ├── panel-types.ts        # Panel type definitions
│   │   └── api-types.ts          # API type definitions
│   │
│   └── assets/                    # Static resources
│       └── icons/
│           ├── apps/             # Application icons
│           ├── coins/            # Cryptocurrency logos
│           └── exchanges/        # Exchange logos
│
├── public/                        # Public assets
├── dist/                          # Build output
└── docs/                          # Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Modern browser** with WebSocket support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd apps/web3

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment

The application connects to STELS backend nodes:

- **TestNet**: `https://live.stels.dev` (WebSocket: `wss://live.stels.dev`)
- **LocalNet**: `http://localhost:8108` (WebSocket: `ws://localhost:8108`)

No environment variables required - network selection happens in-app.

---

## 📱 Applications

### 1. **📊 Liquidity Pool (Scanner)**

**Purpose**: Real-time portfolio and liquidity analysis

**Features**:

- Multi-account portfolio tracking
- Position monitoring across exchanges
- P&L analysis with margin calculations
- Risk management metrics
- Network node status visualization

**Store**: `apps/Scanner/store.ts`

- Wallet filters (connection status, activity)
- Sorting and view preferences
- Expandable sections state

---

### 2. **📈 Markets**

**Purpose**: Unified multi-exchange trading terminal

**Features**:

- Real-time price aggregation from multiple exchanges
- Candlestick charts with volume analysis
- Market comparison and filtering
- Exchange/symbol filtering
- Latency monitoring

**Store**: `apps/Markets/store.ts`

- Search term and filters
- Exchange/symbol selection
- Sorting preferences (price, volume, change)
- View mode (table/grid)

---

### 3. **📖 Aggregator (OrderBook)**

**Purpose**: Professional order book analysis and aggregation

**Features**:

- Multi-exchange order book aggregation
- Liquidity-weighted price calculation
- Market depth visualization
- Large order detection
- Spread and imbalance analysis
- VWAP and market metrics

**Store**: `apps/OrderBook/store.ts`

- Display preferences (scales, volume bars)
- Depth settings (10/20/50 levels)
- Large order threshold
- Auto-refresh configuration

---

### 4. **🎨 Canvas**

**Purpose**: Visual workflow designer with drag-and-drop interface

**Features**:

- **ReactFlow integration** for node-based editing
- **Multiple panels** (workspace tabs) with independent state
- **Widget Store** with categorized widgets
- **Auto-connections** between nodes based on shared properties
- **Persistent layouts** (nodes, edges, viewport per panel)
- **Drag & Drop** widgets from store to canvas
- **macOS-style nodes** with minimize/maximize

**Store**: `apps/Canvas/store.ts`

- Widget Store UI (search, categories, grouping)
- Panel management (CRUD, switching, persistence)
- Panel data (nodes, edges, viewport)

**Auto-Connections**:

```typescript
// Automatically connects nodes that share properties
groupByKeys: ["exchange", "market", "asset", "type"];
// Creates visual connections with colored, labeled edges
```

---

### 5. **🌍 Network (Globe)**

**Purpose**: Global network infrastructure visualization

**Features**:

- Interactive 3D globe with node locations
- Real-time network health monitoring
- Geographic distribution analysis
- Node configuration details
- Network topology metrics

**Store**: None (uses local component state)

---

### 6. **💻 Editor (AMI)**

**Purpose**: Algorithmic strategy development and deployment

**Features**:

- **Monaco Editor** with JavaScript/TypeScript support
- Protocol/Worker CRUD operations
- Real-time syntax validation
- Script execution status monitoring
- Version control for strategies
- API integration for deployment

**Store**: `apps/Editor/store.ts`

- Workers list and loading state
- Worker CRUD operations
- API integration state

**Worker Structure**:

```typescript
interface Worker {
  value: {
    raw: {
      sid: string; // Strategy ID
      nid: string; // Node ID
      active: boolean; // Execution status
      script: string; // JavaScript code
      note: string; // Description
      version: string; // Version number
      dependencies: string[];
      timestamp: number;
    };
    channel: string;
  };
}
```

---

### 7. **👛 Wallet**

**Purpose**: Native Gliesereum blockchain wallet

**Features**:

- **Wallet creation** with secp256k1 key generation
- **Private key import** with validation
- **Exchange account management** (NEW)
- **Transaction signing** with cryptographic verification
- **Network selection** (testnet/mainnet/localnet)
- **Secure key storage** with localStorage encryption
- **Account viewer system** for shared access

**Store**: Uses `auth.store.ts` + `accounts.store.ts`

**New Features** (in development):

```typescript
// Exchange Account Management
interface AccountRequest {
  nid: string; // Node identifier
  exchange: string; // Exchange name
  apiKey: string; // API credentials
  secret: string;
  protocol: ProtocolData; // Trading strategy
  viewers: string[]; // Shared access
  status: "active" | "learn" | "stopped";
}

// Transaction Signing
interface SignedTransaction {
  from: string;
  to: string;
  amount: number;
  signature: string; // ECDSA signature
  timestamp: number;
}
```

---

### 8. **📉 Fred (Economic Indicators)**

**Purpose**: World Bank economic data visualization

**Features**:

- Country-based indicator grouping
- Category filtering (macro, social, tech, etc.)
- Indicator comparison across countries
- Historical data visualization
- Favorite indicators

**Store**: `apps/Fred/store.ts`

- Country/category filters
- Search and sorting
- Comparison state
- Favorite indicators list

---

### 9. **🏠 Welcome (App Store)**

**Purpose**: Application launcher with modern UX

**Features**:

- **Search** across applications
- **Category filtering** (Analytics, Trading, Development, etc.)
- **Favorites system** with persistence
- **Recent apps** tracking (last 5)
- **Featured apps** highlighting
- iOS-style grid layout
- Smooth animations and transitions

**Store**: `apps/Welcome/store.ts`

- Search term and filters
- Selected category
- Recent apps (auto-tracked)
- Favorite apps (user-selected)
- View preferences

---

## 🔐 Gliesereum Blockchain Library

### Core Features

The `lib/gliesereum/` module provides a complete blockchain wallet
implementation:

#### Wallet Operations

```typescript
import { createWallet, importWallet } from "@/lib/gliesereum";

// Create new wallet
const wallet = createWallet();
// Returns: { publicKey, privateKey, address, number }

// Import existing wallet
const wallet = importWallet(privateKeyHex);
```

#### Transaction Signing

```typescript
import { deterministicStringify, sign, verify } from "@/lib/gliesereum";

// Sign data
const dataString = deterministicStringify(data);
const signature = sign(dataString, wallet.privateKey);

// Verify signature
const isValid = verify(dataString, signature, wallet.publicKey);
```

#### Smart Transactions

```typescript
import { createSmartTransaction } from "@/lib/gliesereum";

// Create smart transaction with operations
const tx = createSmartTransaction(
  wallet,
  [
    { op: "transfer", to: "g...", amount: "100.00" },
    { op: "assert.balance", address: "g...", gte: "50.00" },
    { op: "emit.event", kind: "trade.executed", data: {...} }
  ],
  "0.0001",  // fee
  "Trade memo"
);
```

#### Security Features

- ✅ **secp256k1** elliptic curve cryptography
- ✅ **Deterministic serialization** for signatures
- ✅ **Address validation** with checksum verification
- ✅ **Constant-time comparisons** for crypto operations
- ✅ **No key logging** in any environment
- ✅ **Local key generation** (browser-side only)

---

## 🗄️ State Management

### Architecture Philosophy

STELS uses a **hybrid state management approach**:

1. **Global Stores** (`/stores/modules/`) - Application-wide state
2. **Application Stores** (`/apps/*/store.ts`) - Feature-specific state
3. **Component State** (`useState`, `useReducer`) - Temporary UI state

### State Layers

```
┌─────────────────────────────────────────────────┐
│              Global State                        │
│  (app, auth, theme, accounts)                   │
│  • Routing, Authentication, Theme               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           Application State                      │
│  (Canvas, Editor, Markets, Scanner, etc.)       │
│  • App-specific filters, preferences, UI        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│            Component State                       │
│  (useState, useReducer)                         │
│  • Temporary UI state, forms, validation        │
└─────────────────────────────────────────────────┘
```

### Global Stores

#### **app.store.ts** - Application Core

```typescript
import { useAppStore } from "@/stores";

const {
  currentRoute, // Current active route
  setRoute, // Navigate to route
  allowedRoutes, // Available routes
  routeLoading, // Route loading state
  networkStatus, // Network connection info
  syncData, // Sync with backend
} = useAppStore();
```

**Responsibilities**:

- URL-based routing
- Network status monitoring
- Data synchronization
- Version management

#### **auth.store.ts** - Authentication & Wallet

```typescript
import { useAuthStore } from "@/stores";

const {
  wallet, // Wallet instance
  isAuthenticated, // Auth status
  isConnected, // WebSocket connection
  connectionSession, // Session data
  createNewWallet, // Create wallet
  importExistingWallet, // Import wallet
  connectToNode, // Connect to backend
  resetAuth, // Logout
} = useAuthStore();
```

**Responsibilities**:

- Wallet creation and import
- Network selection (testnet/mainnet/localnet)
- WebSocket connection management
- Session persistence and restoration
- Developer mode settings

#### **theme.store.ts** - Theme Management

```typescript
import { useThemeStore } from "@/stores";

const {
  theme, // Current theme mode
  resolvedTheme, // Actual theme (light/dark)
  setTheme, // Set specific theme
  toggleTheme, // Cycle through themes
} = useThemeStore();
```

**Responsibilities**:

- Theme mode (light/dark/system)
- System theme detection
- Theme persistence
- Automatic switching based on OS preferences

#### **accounts.store.ts** - Exchange Accounts (NEW)

```typescript
import { useAccountsStore } from "@/stores/modules/accounts.store";

const {
  accounts, // All stored accounts
  activeAccountId, // Currently active account
  addAccount, // Add new exchange account
  updateAccount, // Update account data
  removeAccount, // Delete account
  signTransaction, // Sign transaction with wallet
  sendAccountToServer, // Sync to backend
} = useAccountsStore();
```

**Responsibilities**:

- Exchange account management
- API credentials storage (encrypted)
- Trading protocol configuration
- Account sharing (viewers)
- Transaction signing

---

### Application Stores

Each application manages its own state:

```typescript
// Canvas - Widget UI + Panel System
import { useCanvasStore } from "@/apps/Canvas/store";
const { ui, panels, createPanel, updatePanelData } = useCanvasStore();

// Editor - Workers/Protocols
import { useEditorStore } from "@/apps/Editor/store";
const { workers, listWorkers, updateWorker } = useEditorStore();

// Markets - Filters and Preferences
import { useMarketsStore } from "@/apps/Markets/store";
const { searchTerm, selectedExchanges, toggleExchange } = useMarketsStore();

// Scanner - Wallet Filters
import { useScannerStore } from "@/apps/Scanner/store";
const { filterByConnection, searchTerm, toggleSection } = useScannerStore();

// Fred - Economic Indicators
import { useFredStore } from "@/apps/Fred/store";
const { selectedCountry, selectedCategory, clearFilters } = useFredStore();

// OrderBook - Display Preferences
import { useOrderBookStore } from "@/apps/OrderBook/store";
const { showScales, depth, toggleScales } = useOrderBookStore();

// Welcome - App Launcher
import { useWelcomeStore } from "@/apps/Welcome/store";
const { recentApps, favoriteApps, toggleFavorite } = useWelcomeStore();
```

---

## 🎨 Canvas System

### Overview

The Canvas is a **visual workflow designer** that allows users to:

1. Drag widgets from the Widget Store
2. Create multiple panels (workspaces)
3. Automatically connect related widgets
4. Save layouts with persistence

### Widget System

**Widget Types**:

```typescript
enum WidgetType {
  TRADES = "trades", // Trade feed
  BOOK = "book", // Order book
  CANDLES = "candles", // Candlestick chart
  TICKER = "ticker", // Price ticker
  INDICATOR = "indicator", // FRED indicators
  SONAR = "sonar", // Portfolio overview
  ARIADNA = "ariadna", // AI strategy
  TIMEZONE = "timezone", // World clocks
  FINANCE = "finance", // News feed
}
```

### Panel System

**Multiple Workspaces**:

```typescript
interface Panel {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  settings: {
    background: string;
    grid: { enabled: boolean; size: number; color: string };
    snapToGrid: boolean;
    autoLayout: boolean;
  };
}

interface PanelData {
  panelId: string;
  nodes: FlowNode[]; // Widgets in this panel
  edges: Edge[]; // Connections
  viewport: { // Camera position
    x: number;
    y: number;
    zoom: number;
  };
}
```

**Usage**:

```typescript
// Create new panel
const panelId = createPanel("Trading Setup", "My BTC/ETH strategy");

// Switch to panel
setActivePanel(panelId);

// Update panel data (auto-saved with debouncing)
updatePanelData(panelId, {
  nodes: [...nodes],
  edges: [...edges],
  viewport: { x: 0, y: 0, zoom: 1 },
});
```

### Auto-Connections

**Intelligent Node Linking**:

```typescript
interface AutoConnectionConfig {
  enabled: boolean;
  groupByKeys: ["exchange", "market", "asset", "base", "quote", "type"];
  showLabels: boolean;
}
```

Widgets are automatically connected when they share properties:

- Same exchange → yellow edge
- Same market → green edge
- Same asset → blue edge
- Same type → purple edge

---

## 🔌 Real-time Data Flow

### WebSocket Architecture

```
Backend (live.stels.dev)
        ↓ WebSocket
Session Data Stream
        ↓ MessageEvent
useWebSocketStore (hook)
        ↓ Batch Processing
SessionStore (in-memory)
        ↓ useSessionStoreSync
Components/Widgets
```

### Session Data Structure

```typescript
interface SessionStore {
  [channel: string]: SessionWidgetData;
}

interface SessionWidgetData {
  module: string; // e.g., "connector.exchange.crypto"
  channel: string; // Full channel path
  widget: string; // Widget type
  raw: { // Widget-specific data
    exchange?: string;
    market?: string;
    // ... other fields
  };
  timestamp: number;
}
```

### Connection Management

```typescript
// Auto-reconnect on disconnect
reconnectAttempts: 0-10
reconnectDelay: exponential backoff (1s → 60s)

// Session restoration
useAuthRestore() // Hook in App.tsx
- Checks localStorage for session
- Validates session token
- Restores WebSocket connection
- Syncs state automatically
```

---

## 🎯 Routing System

### URL-based Navigation

```typescript
// Navigate programmatically
import { navigateTo } from "@/lib/router";
navigateTo("canvas");
// URL becomes: https://app.stels.dev/#/canvas

// Hook for automatic sync
import { useUrlRouter } from "@/hooks/useUrlRouter";
useUrlRouter(); // Syncs URL ↔ Store
```

### Route Configuration

```typescript
const allowedRoutes = [
  "welcome", // App launcher
  "scanner", // Liquidity analysis
  "markets", // Market aggregator
  "orderbook", // Order book
  "canvas", // Workflow designer
  "network", // Network globe
  "editor", // AMI Editor
  "wallet", // Wallet management
  "fred", // Economic indicators
];
```

---

## 🔐 Authentication Flow

### Multi-step Process

```
1. Wallet Setup
   ├─ Create new wallet (generate keys)
   └─ Import existing wallet (validate private key)
        ↓
2. Access Mode Selection
   ├─ User Mode (production networks only)
   └─ Developer Mode (access to testnet + dev tools)
        ↓
3. Network Selection
   ├─ TestNet (live.stels.dev)
   ├─ MainNet (production - coming soon)
   └─ LocalNet (localhost:8108)
        ↓
4. Connection Process
   ├─ Create auth transaction
   ├─ Sign with private key
   ├─ Send to network node
   ├─ Verify signature
   └─ Establish WebSocket
        ↓
5. Session Created
   ├─ Token stored in localStorage
   ├─ Session persisted (encrypted)
   └─ Auto-restore on page reload
```

### Components

```typescript
// Main flow
<ProfessionalConnectionFlow />
  ├─ <WalletTypeSelector />      // Create or import
  ├─ <WalletCreator />           // Generate/import wallet
  ├─ <WalletConfirmation />      // Verify and select mode
  ├─ <NetworkSetup />            // Choose network
  └─ <ConnectionProcess />       // Connect to node

// Status components
<ConnectionStatusSimple />        // Header dropdown
<SecurityWarningDialog />         // Logout confirmation
<SessionExpiredModal />           // Session timeout handler
```

---

## 🎨 UI/UX Design System

### Color Palette

```css
/* Primary Colors */
--color-primary: #f59e0b; /* amber-500 */
--color-primary-dark: #d97706; /* amber-600 */

/* Background (Zinc scale) */
--color-background: #09090b; /* zinc-950 (dark) */
--color-card: #18181b; /* zinc-900 (dark) */
--color-muted: #27272a; /* zinc-800 (dark) */

/* Semantic Colors */
--color-success: #22c55e; /* green-500 */
--color-error: #ef4444; /* red-500 */
--color-warning: #f59e0b; /* amber-500 */
--color-info: #3b82f6; /* blue-500 */
```

### Typography

```css
/* Font Family */
font-family: system-ui, -apple-system, sans-serif;

/* Scale */
text-xs:     0.75rem  (12px)
text-sm:     0.875rem (14px)
text-base:   1rem     (16px)
text-lg:     1.125rem (18px)
text-xl:     1.25rem  (20px)
text-2xl:    1.5rem   (24px)
```

### Component Design

**Principles**:

- ✅ No shadows (minimalist aesthetic)
- ✅ Border-based depth
- ✅ Subtle gradients
- ✅ Consistent border radius (rounded-lg, rounded-xl)
- ✅ Backdrop blur for overlays
- ✅ Professional animations (Framer Motion)

**Example Pattern**:

```tsx
<Card className="bg-card/80 border-border/50 backdrop-blur-sm">
  <CardHeader>
    <div className="flex items-center gap-2">
      <div className="p-2 border border-amber-500/30 bg-amber-500/10">
        <Icon className="h-4 w-4 text-amber-500" />
      </div>
      <CardTitle>Title</CardTitle>
    </div>
  </CardHeader>
</Card>;
```

---

## 🧩 Custom Hooks

### Authentication

```typescript
// Auto-restore authentication on app load
useAuthRestore();
// Checks localStorage → validates session → reconnects
```

### Session Data

```typescript
// Sync WebSocket session data to components
const session = useSessionStoreSync();
// Returns: { [channel]: SessionWidgetData }
```

### Theme

```typescript
// Theme management with system preference detection
const { theme, resolvedTheme, toggleTheme } = useTheme();
// Supports: light, dark, system (auto-detect)
```

### Routing

```typescript
// URL-based routing with automatic sync
useUrlRouter();
// Syncs: URL query param ↔ Zustand store ↔ history API
```

### Auto-Connections (Canvas)

```typescript
// Automatic node connections based on shared properties
const {
  isEnabled,
  toggleAutoConnections,
  allEdges, // Manual + auto-generated edges
  stats, // Connection statistics
  config, // Configuration
  updateConfig,
} = useAutoConnections(nodes, edges);
```

### Drag & Drop (Canvas)

```typescript
// Enhanced drag and drop with visual feedback
const {
  dragState, // Current drag state
  handleDragOver, // Drag over handler
  handleDragLeave, // Drag leave handler
} = useDragAndDrop();
```

---

## 📡 WebSocket Integration

### Connection Setup

```typescript
// In components/main/Provider.tsx
<SessionProvider>
  {children}
</SessionProvider>;

// Automatically connects when authenticated
useEffect(() => {
  if (isConnected && connectionSession) {
    connectNode({
      raw: {
        info: {
          connector: {
            socket: connectionSession.socket,
            protocols: ["webfix"],
          },
          network: connectionSession.network,
          title: connectionSession.title,
          pid: "sonar",
        },
      },
    });
  }
}, [isConnected, connectionSession]);
```

### Message Processing

**Batch Processing** (Performance Optimization):

```typescript
// Messages are batched every 100ms
const MESSAGE_BATCH_INTERVAL = 100;

// Updates are debounced (300ms) before persisting
const DEBOUNCE_DELAY = 300;
```

### Session Expiration Handling

```typescript
// Automatic detection and user notification
- Session expires → WebSocket disconnect
- Show SessionExpiredModal (blocking)
- User clicks "Re-authenticate"
- Restart auth flow
```

---

## 🎭 Component Patterns

### Modular Applications

Each application follows this pattern:

```typescript
// apps/Markets/Markets.tsx
function Markets(): React.ReactElement {
  // 1. Get session data
  const session = useSessionStoreSync();

  // 2. Get app-specific state
  const { searchTerm, selectedExchanges } = useMarketsStore();

  // 3. Filter and process data
  const filteredData = useMemo(() => {
    // Processing logic
  }, [session, searchTerm, selectedExchanges]);

  // 4. Render with proper structure
  return (
    <div className="container mx-auto space-y-6">
      {/* Content */}
    </div>
  );
}
```

### Widget Components

```typescript
// components/widgets/OrderBook.tsx
interface OrderBookData {
  exchange: string;
  market: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
  latency: number;
}

function OrderBook({ book }: { book: OrderBookData }): React.ReactElement {
  // Widget implementation
}
```

---

## 🔒 Security Best Practices

### Cryptographic Operations

```typescript
// ✅ DO: Use constant-time comparisons
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// ✅ DO: Deterministic serialization for signatures
export function deterministicStringify(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

// ❌ DON'T: Log or expose private keys
console.log(wallet.privateKey); // NEVER DO THIS
```

### Key Storage

```typescript
// Private keys stored in separate persisted store
// (not exported to global state)
persist(
  (set, get) => ({/* ... */}),
  {
    name: "private-store",
    partialize: (state) => ({
      raw: { session: state.connectionSession?.session },
    }),
  },
);
```

### Network Security

- ✅ WSS (WebSocket Secure) in production
- ✅ Token-based authentication
- ✅ Signature verification on backend
- ✅ Session timeout handling
- ✅ CORS-safe API calls

---

## 🎯 Development Guidelines

### TypeScript Standards

```typescript
// ✅ DO: Explicit return types
function fetchData(): Promise<DataType> {
  return api.getData();
}

// ✅ DO: Use unknown instead of any
function parseData(raw: unknown): ParsedData {
  // Type narrowing
}

// ❌ DON'T: Use any or non-null assertions
function badExample(data: any): void {} // ❌
const value = data!.property; // ❌
```

### React Component Standards

```typescript
// ✅ DO: Functional components with explicit types
export function MyComponent({ prop }: MyProps): React.ReactElement {
  return <div>{prop}</div>;
}

// ✅ DO: Extract business logic to hooks
function useMyFeature() {
  const [state, setState] = useState();
  // Logic here
  return { state, actions };
}

// ✅ DO: Memoize expensive computations
const filtered = useMemo(() => {
  return data.filter(/* ... */);
}, [data, filters]);
```

### Store Standards

```typescript
// ✅ DO: Use selectors for subscriptions
const name = useStore((state) => state.user.name);

// ❌ DON'T: Subscribe to entire state
const state = useStore();

// ✅ DO: Custom hooks for common patterns
export const useStoreActions = () =>
  useStore((state) => ({
    action1: state.action1,
    action2: state.action2,
  }));
```

---

## 📊 Performance Optimizations

### React Optimizations

- `React.memo` for expensive components
- `useMemo` for filtered/computed data
- `useCallback` for event handlers
- Selective Zustand subscriptions
- Debounced saves (300ms for viewport/nodes)

### WebSocket Optimizations

- **Message batching** (100ms intervals)
- **Selective updates** (only changed channels)
- **Automatic cleanup** on disconnect
- **Reconnection backoff** (exponential)

### Canvas Optimizations

- **Stagger animations** for perceived performance
- **Lazy widget rendering** (only visible widgets)
- **Viewport-based culling** (ReactFlow built-in)
- **Debounced persistence** (avoid excessive writes)

---

## 🧪 Testing Strategy

### Type Safety

```bash
# Type checking
npm run build  # Runs tsc -b

# Linting
npm run lint
```

### Manual Testing Checklist

**Authentication Flow**:

- [ ] Create new wallet
- [ ] Import existing wallet
- [ ] Connect to TestNet
- [ ] Session persistence on reload
- [ ] Logout and reconnect

**Canvas System**:

- [ ] Create multiple panels
- [ ] Switch between panels
- [ ] Drag widgets to canvas
- [ ] Auto-connections work
- [ ] Panel data persists

**Applications**:

- [ ] Markets show real-time data
- [ ] OrderBook aggregates correctly
- [ ] Scanner loads wallet data
- [ ] Editor manages workers

---

## 🚀 Deployment

### Build for Production

```bash
# Build optimized bundle
npm run build

# Output to /dist
# - index.html
# - assets/
#   ├── index-[hash].js
#   └── index-[hash].css
```

### Environment Configuration

**Development**:

```bash
npm run dev
# Runs on http://localhost:5173
```

**Production**:

```bash
npm run build
npm run preview
# Preview build on http://localhost:4173
```

### Backend Requirements

The application requires a STELS backend node running:

**API Endpoints**:

- `POST /connect` - Authentication
- `POST /getWalletInfo` - Fetch wallet data
- `WebSocket /` - Real-time data stream

**WebSocket Protocol**:

```typescript
// Message format
{
  "webfix": "1.0",
  "method": "subscribe",
  "params": ["channel.name"],
  "body": { /* ... */ }
}
```

---

## 📚 Documentation

### Application Guides

- [Applications Architecture](src/apps/README.md)
- [Store Architecture](src/stores/README.md)
- [Welcome App Guide](src/apps/Welcome/README.md)
- [Canvas Guide](src/apps/Canvas/README.md)

### Component Guides

- [App Icons Guide](src/components/ui/APP_ICONS_GUIDE.md)
- [Notifications](src/components/notifications/README.md)

### Gliesereum Library

- [Blockchain Wallet Guide](src/lib/gliesereum/README.md)

---

## 🤝 Contributing

### Adding a New Application

1. **Create directory**: `src/apps/NewApp/`
2. **Create main component**: `NewApp.tsx`
3. **Create store** (if needed): `store.ts`
4. **Create types**: `types.ts`
5. **Create utils**: `utils.ts`
6. **Create constants**: `constants.ts`
7. **Create barrel export**: `index.ts`
8. **Register route** in `app.store.ts`:
   ```typescript
   allowedRoutes: [..., 'new-app']
   ```
9. **Add to routing** in `App.tsx`:
   ```typescript
   case "new-app":
     return <NewApp />;
   ```
10. **Add to navigation** in `Layout.tsx`

### Code Style

- Follow workspace rules (see `.cursorrules`)
- Use provided ESLint configuration
- Write JSDoc comments for public functions
- All code, comments, and documentation in professional English
- No commented-out code in repository

### Git Workflow

```bash
# Current branch
git checkout canvas

# Make changes
git add .
git commit -m "feat: add new feature"

# Push
git push origin canvas
```

---

## 🐛 Troubleshooting

### Common Issues

**WebSocket Connection Failed**:

```typescript
// Check: 
1. Backend node is running
2. Network selected in wallet
3. Session token is valid
4. Check browser console for errors
```

**Store Not Persisting**:

```typescript
// Check:
1. localStorage is enabled
2. Check DevTools → Application → Local Storage
3. Look for: auth-store, canvas-store, etc.
4. Clear cache if corrupted
```

**Theme Not Switching**:

```typescript
// Check:
1. ThemeProvider is wrapping app
2. useTheme hook is being called
3. CSS classes applied to html element
```

**Canvas Widgets Not Loading**:

```typescript
// Check:
1. WebSocket is connected
2. Session data is available
3. Widget channel matches session key
4. Check browser console for errors
```

### Debug Tools

**Zustand DevTools**:

- Install Redux DevTools Extension
- Open DevTools → Redux tab
- Inspect store states and actions

**Component Debug**:

```tsx
// Temporary debug component
<AuthDebug />      // Shows auth state
<RouterDebug />    // Shows routing state
```

---

## 📈 Performance Metrics

### Bundle Size (Production)

- **Initial Load**: ~2.5MB (gzipped: ~600KB)
- **Route Chunks**: Lazy-loaded per application
- **Asset Optimization**: SVG icons, optimized images

### Runtime Performance

- **Initial Render**: ~200ms
- **Route Transition**: ~100ms
- **WebSocket Latency**: 50-200ms (depends on network)
- **Widget Render**: <16ms (60fps)

### Optimization Techniques

1. **Code Splitting**: Dynamic imports for heavy routes
2. **Memoization**: `useMemo`, `React.memo` for expensive renders
3. **Debouncing**: 300ms for saves, 100ms for WebSocket batching
4. **Selective Subscriptions**: Zustand selectors
5. **CSS-in-JS Avoidance**: Pure Tailwind utilities

---

## 🔮 Roadmap

### Completed ✅

- [x] Authentication system with wallet integration
- [x] Multi-panel Canvas workspace
- [x] Auto-connections between widgets
- [x] Real-time market data aggregation
- [x] Order book liquidity analysis
- [x] AMI Worker editor with Monaco
- [x] Economic indicators (World Bank data)
- [x] Network visualization (3D Globe)
- [x] Welcome screen (App Store)
- [x] Theme system (light/dark/system)
- [x] URL-based routing

### In Progress 🚧

- [ ] Exchange account management (90% complete)
- [ ] Transaction signing interface (80% complete)
- [ ] Account viewer system (prototype)

### Planned 📋

- [ ] Strategy backtesting framework
- [ ] Advanced charting with indicators
- [ ] Portfolio optimization engine
- [ ] Risk management dashboard
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

---

## 📄 License

© 2024 Gliesereum Ukraine. All rights reserved.

---

## 🔗 Links

- **Website**: [stels.dev](https://stels.dev)
- **Documentation**: [docs.stels.dev](https://docs.stels.dev)
- **Backend API**: [live.stels.dev](https://live.stels.dev)

---

## 👥 Team

Built with ❤️ by the STELS development team.

**Contact**: [Email or Discord link]

---

## 🙏 Acknowledgments

This project uses amazing open-source libraries:

- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [ReactFlow](https://reactflow.dev/) - Node-based editor
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [lightweight-charts](https://tradingview.github.io/lightweight-charts/) -
  Financial charts

---

**Version**: 0.12.8\
**Last Updated**: October 2024\
**Status**: Active Development
