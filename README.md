# STELS Web 5 OS

**Type:** Distributed Web Operating System 
**License:** © 2025 Gliesereum
Ukraine. All rights reserved.

> **The world's first distributed Web OS built on heterogeneous networks.**\
> A professional laboratory for Web 5 developers to program and manage
> autonomous AI web agents.

## Overview

STELS is a **fully decentralized programming and management system** for
building autonomous web agents that operate across a global heterogeneous
network. Each web agent is a programmable application—a pure web service
leveraging modern browser technologies and distributed execution across hundreds
of heterogeneous nodes (heterogens) installed on diverse servers worldwide.

As a **Web Operating System**, STELS provides developers with:

- **Schemas and Workers**: Tools for creating intelligent web agents with
  structured data flows and programmable execution logic
- **Distributed Execution**: Protocol-driven operations that run collectively
  across the heterogeneous network
- **Reactive Visualization**: High-speed UI with minimal latency for real-time
  monitoring and control
- **Secure by Design**: Cryptographic identity and transaction signing for all
  operations
- **Network as API**: The entire heterogeneous network as a single unified
  execution environment

### What You Can Build

STELS enables development of sophisticated autonomous systems:

- **Trading Agents**: Algorithmic trading across multiple exchanges with
  real-time market analysis
- **Intelligence Networks**: Distributed data aggregation and pattern
  recognition
- **Network Operations**: Automated monitoring and management of distributed
  infrastructure
- **Custom Web Services**: Programmable APIs and services that scale across the
  network

The platform combines professional-grade trading tools, a visual workspace for
composing agent workflows, a Monaco-based protocol editor, and comprehensive
network management—all accessible through a modern React-based interface with
Tailwind CSS styling.

## Core Features

- **Progressive Web App** - Install on any device, works offline, auto-updates
- **Multi-Exchange Trading Terminal** - Unified interface for multiple
  cryptocurrency exchanges
- **Advanced Market Analysis** - Real-time liquidity scanning, order book
  aggregation, and market depth analysis
- **Algorithmic Trading Platform** - Code editor for creating and deploying
  automated trading strategies (AMI Workers)
- **Blockchain Wallet Integration** - Native Gliesereum blockchain wallet with
  secure transaction signing
- **Visual Data Composition** - Drag-and-drop canvas for building custom trading
  dashboards
- **Network Monitoring** - 3D visualization of distributed node infrastructure
- **Economic Indicators** - World Bank and FRED economic data integration

## Technology Stack

### Core Framework

- **React 19.1.0** - UI framework with functional components and hooks
- **TypeScript 5.8.3** - Strict type safety with explicit return types
- **Vite 7.0.4** - Build tool and development server
- **vite-plugin-pwa** - Progressive Web App support with service workers

### UI Components

- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **shadcn/ui** - Radix UI-based component library
- **Framer Motion 12.23.11** - Animation and gesture library
- **Lucide React** - Icon library

### State Management

- **Zustand 5.0.6** - Lightweight state management with middleware support
  - `devtools` - Redux DevTools integration
  - `persist` - LocalStorage persistence

### Specialized Libraries

- **ReactFlow 11.11.4** - Node-based canvas visualization
- **Monaco Editor 4.7.0** - Code editor for algorithmic trading
- **Lightweight Charts 5.0.8** - Financial charting
- **React Globe GL** - 3D globe visualization
- **Elliptic 6.6.1** - ECDSA cryptography (secp256k1)
- **@noble/hashes** - Cryptographic hash functions

### Development Tools

- **ESLint** - Code linting with React hooks rules
- **TypeScript ESLint** - TypeScript-specific linting

## Project Structure

```
stels/
├── src/
│   ├── apps/              # Application modules
│   │   ├── Canvas/        # Visual workspace builder
│   │   ├── Editor/        # Algorithmic trading IDE
│   │   ├── Fred/          # Economic indicators
│   │   ├── Globe/         # Network visualization
│   │   ├── Markets/       # Multi-exchange terminal
│   │   ├── OrderBook/     # Order book aggregator
│   │   ├── Scanner/       # Liquidity scanner
│   │   ├── Wallet/        # Gliesereum blockchain wallet
│   │   └── Welcome/       # Application launcher
│   ├── components/        # Reusable UI components
│   │   ├── auth/          # Authentication flow
│   │   ├── editor/        # Code editor wrapper
│   │   ├── main/          # Core app components
│   │   ├── notifications/ # Alert system
│   │   ├── panels/        # Canvas panel system
│   │   ├── ui/            # shadcn/ui components
│   │   └── widgets/       # Trading widgets
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Core utilities
│   │   ├── gliesereum/    # Blockchain SDK
│   │   ├── api-types.ts   # API type definitions
│   │   ├── canvas-types.ts # Canvas type definitions
│   │   ├── panel-types.ts # Panel system types
│   │   ├── router.ts      # URL routing
│   │   └── utils.ts       # Utility functions
│   └── stores/            # Zustand state stores
│       └── modules/       # Store modules
│           ├── accounts.store.ts # Exchange accounts
│           ├── app.store.ts      # App state
│           ├── auth.store.ts     # Authentication
│           └── theme.store.ts    # Theme management
├── public/                # Static assets
├── dist/                  # Production build
└── package.json           # Dependencies
```

## Architecture

### Application Flow

```
App.tsx (Root)
  ├── Authentication Flow
  │   ├── Wallet Creation/Import
  │   ├── Network Selection
  │   └── WebSocket Connection
  ├── Layout
  │   ├── Sidebar Navigation (Developer mode)
  │   ├── Header with Connection Status
  │   └── Main Content Area
  └── Route Components
      ├── Welcome (App Store)
      ├── Scanner (Liquidity Analysis)
      ├── Markets (Multi-Exchange)
      ├── OrderBook (Aggregator)
      ├── Canvas (Visual Workspace)
      ├── Editor (AMI Workers)
      ├── Network (Globe Visualization)
      └── Wallet (Account Management)
```

### State Management Architecture

**Zustand Stores** with persistence and devtools:

1. **App Store** (`app.store.ts`)
   - Route management
   - Network status
   - Sync state
   - Version control

2. **Auth Store** (`auth.store.ts`)
   - Wallet state
   - Network configuration
   - Connection session
   - Authentication status

3. **Accounts Store** (`accounts.store.ts`)
   - Exchange accounts
   - Transaction signing
   - Server synchronization

4. **Theme Store** (`theme.store.ts`)
   - Theme mode (light/dark/system)
   - System preference detection

**Module-Specific Stores**:

- Canvas Store (`apps/Canvas/store.ts`) - Panel system and widget UI
- Editor Store (`apps/Editor/store.ts`) - AMI Workers management
- Fred Store (`apps/Fred/store.ts`) - Economic indicators filters
- Markets Store (`apps/Markets/store.ts`) - Market filters
- OrderBook Store (`apps/OrderBook/store.ts`) - Order book preferences
- Scanner Store (`apps/Scanner/store.ts`) - Wallet scanner state
- Welcome Store (`apps/Welcome/store.ts`) - App launcher preferences

### Session Management

**WebSocket Integration** (`hooks/useWebSocketStore.ts`):

- Real-time data streaming from backend
- Automatic reconnection with exponential backoff
- Session expiration handling
- Message batching for performance
- Manual and auto-connection modes

**Session Storage Sync** (`hooks/useSessionStoreSync.ts`):

- Bridge between WebSocket data and React state
- Efficient updates with debouncing
- Cross-tab synchronization

## Application Modules

### 1. Canvas (Visual Workspace)

**Location:** `src/apps/Canvas/`

**Purpose:** Drag-and-drop workspace for composing custom trading dashboards.

**Key Features:**

- ReactFlow-based node system
- Multi-panel support with independent viewports
- Widget Store with 100+ real-time widgets
- Auto-connection system between related widgets
- Persistent state across sessions

**Components:**

- `Flow.tsx` - Main entry point
- `FlowWithPanels.tsx` - Panel management integration
- `MacOSNode.tsx` - Window-style widget container
- `NodeFlow.tsx` - Widget rendering logic
- `store.ts` - Canvas state management

**Panel System:**

- Multiple independent canvases
- Panel-specific nodes, edges, and viewport
- Smooth transitions between panels
- Panel duplication and reordering

### 2. Editor (AMI Workers)

**Location:** `src/apps/Editor/`

**Purpose:** IDE for creating and managing distributed trading algorithms.

**Key Features:**

- Monaco Editor with JavaScript/TypeScript support
- Worker templates (Grid Trading, DCA, Market Monitor, etc.)
- Execution modes: Parallel, Leader, Exclusive
- Priority system: Critical, High, Normal, Low
- Worker statistics and health monitoring
- Leader election for distributed execution

**Components:**

- `AMIEditor.tsx` - Main editor interface
- `AMIEditor/CreateWorkerDialog.tsx` - Worker creation wizard
- `AMIEditor/WorkerStatsPanel.tsx` - Execution metrics
- `AMIEditor/LeaderInfoCard.tsx` - Leader election status
- `AMIEditor/templates.ts` - Pre-built strategy templates
- `store.ts` - Worker management

**Worker Configuration:**

```typescript
interface WorkerCreateRequest {
  scriptContent: string;
  dependencies: string[];
  version: string;
  executionMode: "parallel" | "leader" | "exclusive";
  priority: "critical" | "high" | "normal" | "low";
  mode?: "loop" | "single";
  accountId?: string;
  assignedNode?: string;
  note?: string;
}
```

### 3. Markets (Multi-Exchange Terminal)

**Location:** `src/apps/Markets/`

**Purpose:** Unified view of spot markets across multiple exchanges.

**Key Features:**

- Real-time ticker data
- Mini candlestick charts
- Volume and liquidity metrics
- Exchange and symbol filtering
- Bid/Ask spreads

**Components:**

- `Markets.tsx` - Main component
- `components/ExchangeGroup.tsx` - Exchange grouping
- `components/MarketRow.tsx` - Individual market display
- `components/MarketFilters.tsx` - Filter controls
- `components/MiniCandlestickChart.tsx` - Inline charts

### 4. Scanner (Liquidity Pool)

**Location:** `src/apps/Scanner/`

**Purpose:** Advanced wallet and portfolio analysis system.

**Key Features:**

- Real-time portfolio metrics
- Position tracking
- Order management
- Risk analysis
- Network node monitoring
- Asset distribution visualization

**Components:**

- `Scanner.tsx` - Main scanner interface
- `components/AccountCard.tsx` - Account details
- `components/AccountOverview.tsx` - Portfolio summary
- `components/PositionsCard.tsx` - Trading positions
- `components/OrdersCard.tsx` - Order history

### 5. OrderBook (Aggregator)

**Location:** `src/apps/OrderBook/`

**Purpose:** Professional order book aggregation and analysis.

**Key Features:**

- Multi-exchange aggregation
- Liquidity-weighted metrics
- Market dominance analysis
- Large order detection
- VWAP calculation
- Spread monitoring

**Key Metrics:**

- Volume Imbalance
- Depth Ratio
- Market Concentration
- Large Orders Detection

### 6. Network (Heterogen Map)

**Location:** `src/apps/Globe/`

**Purpose:** 3D visualization of distributed node infrastructure.

**Key Features:**

- Interactive 3D globe with node locations
- Real-time node health status
- Geographic distribution statistics
- Network metrics and analytics

### 7. Wallet (Gliesereum)

**Location:** `src/apps/Wallet/`

**Purpose:** Native blockchain wallet for Gliesereum network.

**Key Features:**

- Wallet creation and import
- Transaction signing (basic and smart contracts)
- Exchange account management
- Multi-signature support (cosign)
- Secure key storage

### 8. Fred (Economic Indicators)

**Location:** `src/apps/Fred/`

**Purpose:** World Bank economic indicators browser.

**Key Features:**

- Multi-country economic data
- Category-based filtering
- Country comparison
- Real-time indicator updates

## Core Systems

### Authentication System

**Flow:**

1. Wallet Type Selection (Create/Import)
2. Wallet Creation/Import
3. Wallet Confirmation
4. Network Selection
5. WebSocket Connection
6. Session Management

**Components:**

- `ProfessionalConnectionFlow.tsx` - Main authentication orchestrator
- `WalletCreator.tsx` - Wallet generation
- `WalletConfirmation.tsx` - Wallet verification
- `NetworkSelector.tsx` - Network selection
- `ConnectionProcess.tsx` - Connection establishment

**Security:**

- ECDSA secp256k1 cryptography
- Constant-time comparisons
- Deterministic message signing
- No private key logging
- Secure session storage

### WebSocket Real-Time Data

**Implementation:** `hooks/useWebSocketStore.ts`

**Features:**

- Automatic reconnection (max 5 attempts, exponential backoff)
- Session expiration detection
- Message batching for performance (200ms debounce)
- Connection state management
- Error handling with user notifications

**Message Format:**

```typescript
{
  webfix: "1.0",
  method: "setAccount" | "listWorkers" | "updateWorker" | etc.,
  params: string[],
  body: { /* request-specific data */ }
}
```

### Routing System

**URL-Based Routing** (`lib/router.ts`, `hooks/useUrlRouter.ts`):

- `/app/:route` pattern
- Synchronized with Zustand state
- Browser history integration
- Route validation

**Available Routes:**

- `/app/welcome` - App Store
- `/app/scanner` - Liquidity Scanner
- `/app/markets` - Markets Terminal
- `/app/orderbook` - Order Book Aggregator
- `/app/canvas` - Visual Workspace
- `/app/editor` - AMI Editor
- `/app/network` - Network Visualization
- `/app/wallet` - Wallet Manager

### Theme System

**Implementation:** `stores/modules/theme.store.ts`, `hooks/useTheme.ts`

**Modes:**

- `light` - Light theme
- `dark` - Dark theme
- `system` - Follow OS preference

**Features:**

- Automatic system preference detection
- Real-time system theme change detection
- Persistent user preference
- CSS variable-based theming

## Custom Hooks

### useAuthRestore

**File:** `hooks/useAuthRestore.ts`\
**Purpose:** Automatic authentication restoration on page reload\
**Behavior:** Checks localStorage for existing session and restores connection

### useAutoConnections

**File:** `hooks/useAutoConnections.ts`\
**Purpose:** Generate automatic connections between Canvas widgets based on
shared properties\
**Features:**

- Group nodes by exchange, market, asset, etc.
- Visual edge grouping
- Connection statistics
- Configurable grouping keys

### useDragAndDrop

**File:** `hooks/useDragAndDrop.ts`\
**Purpose:** Enhanced drag-and-drop for widget placement\
**Features:**

- Drop zone visualization
- Mouse position tracking
- Touch support for mobile

### useSessionStoreSync

**File:** `hooks/useSessionStoreSync.ts`\
**Purpose:** Synchronize WebSocket session data with React state\
**Returns:** Real-time session object with all active widgets

### useUrlRouter

**File:** `hooks/useUrlRouter.ts`\
**Purpose:** Synchronize URL with application route state\
**Features:** Browser history integration, deep linking

### useHydration

**File:** `hooks/useHydration.ts`\
**Purpose:** Wait for Zustand store hydration from localStorage\
**Returns:** Boolean indicating hydration completion

### useMobile

**File:** `hooks/useMobile.ts`\
**Purpose:** Responsive design utilities\
**Exports:**

- `useMobile(breakpoint)` - Is viewport mobile
- `useScreenWidth()` - Current screen width
- `useOrientation()` - Portrait/Landscape
- `useDeviceType()` - Comprehensive device info

### useTheme

**File:** `hooks/useTheme.ts`\
**Purpose:** Theme management with system preference detection\
**Returns:** `{ theme, resolvedTheme, setTheme, toggleTheme }`

## Blockchain SDK

### Gliesereum Library

**Location:** `src/lib/gliesereum/`

**Core Functions:**

#### Wallet Management

```typescript
createWallet(): Wallet
importWallet(privateKey: string): Wallet
validateAddress(address: string): boolean
cardNumber(input: string | Uint8Array): string
```

#### Transaction Creation

```typescript
// Basic transaction
createSignedTransaction(
  wallet: Wallet,
  to: string,
  amount: number,
  fee: number,
  data?: string
): Transaction

// Smart contract transaction
createSmartTransaction(
  wallet: Wallet,
  ops: SmartOp[],
  fee?: string,
  memo?: string,
  prevHash?: string | null,
  rawData?: string
): SmartTransaction
```

#### Smart Contract Operations

```typescript
type SmartOp =
  | { op: "transfer"; to: string; amount: string; memo?: string }
  | { op: "assert.time"; before_ms?: number; after_ms?: number }
  | { op: "assert.balance"; address: string; gte: string }
  | {
    op: "assert.compare";
    left: string;
    cmp: "<" | "<=" | "==" | ">=" | ">";
    right: string;
  }
  | { op: "emit.event"; kind: string; data?: Record<string, unknown> };
```

#### Multi-Signature (Cosign)

```typescript
createCosignMethod(
  id: string,
  approvers: string[],
  threshold: { k: number; n: number },
  deadlineMs?: number
): CosignMethod

createCosignSignature(
  methodId: string,
  publicKey: string,
  privateKey: string,
  transaction: SmartTransaction
): CosignSignature
```

#### Cryptographic Functions

```typescript
sign(data: string, privateKey: string): string
verify(data: string, signature: string, publicKey: string): boolean
signWithDomain(data: string, privateKey: string, domain: string[]): string
deterministicStringify(obj: unknown): string
```

**Security Standards:**

- ECDSA secp256k1 curve
- SHA-256 hashing
- Constant-time comparisons for signatures
- Deterministic message serialization
- No logging of private keys

## Widget System

### Session Widget Structure

```typescript
interface SessionWidgetData {
  module: string; // Module name (e.g., "connector")
  channel: string; // Full channel path
  widget: string; // Widget type identifier
  raw: WidgetRawData; // Raw widget data
  timestamp: number | string | object;
}
```

### Available Widget Types

**Defined in:** `src/lib/canvas-types.ts`

```typescript
enum WidgetType {
  TICKER = "ticker",
  TRADES = "trades",
  BOOK = "book",
  CANDLES = "candles",
  INDICATOR = "indicator",
  TIMEZONE = "timezone",
  ARIADNA = "ariadna",
  FINANCE = "finance",
  SONAR = "sonar",
}
```

### Widget Components

**Location:** `src/components/widgets/`

- `Ticker.tsx` - Price ticker
- `TradeWidget.tsx` - Recent trades
- `OrderBook.tsx` - Full order book
- `Candles.tsx` - Candlestick chart
- `FredIndicatorWidget.tsx` - Economic indicator
- `TimeZone.tsx` - Timezone clock
- `Ariadna.tsx` - Market intelligence
- `NewsBox.tsx` - Financial news
- `SonarPortfolio.tsx` - Portfolio metrics

## API Integration

### WebFix Protocol

**Base Format:**

```typescript
{
  webfix: "1.0",
  method: string,
  params: string[],
  body: Record<string, unknown>
}
```

### Available Methods

#### Worker Management

- `listWorkers` - Fetch all workers
- `setWorker` - Create new worker
- `updateWorker` - Update existing worker
- `getLeaderInfo` - Get leader election status
- `getWorkerStats` - Get execution statistics
- `stopAllWorkers` - Emergency stop

#### Account Management

- `setAccount` - Create/Update exchange account
- `getWalletInfo` - Get wallet information

### Request Authentication

**Headers:**

```typescript
{
  "Content-Type": "application/json",
  "stels-session": connectionSession.session
}
```

## Development Guidelines

### TypeScript Standards

- **Strict mode enabled** - All strict checks active
- **No `any` type** - Use `unknown` for dynamic data
- **Explicit return types** - All functions must declare return type
- **No non-null assertions** - Avoid `!` operator
- **English only** - Code, comments, and documentation

### React Component Standards

- **Functional components only** - No class components
- **Hooks-based** - Use React Hooks for state and effects
- **Typed props** - Interface or type alias for all props
- **React.FC usage** - Only when children are required
- **Component returns** - Explicitly typed as `React.ReactElement`

### Styling Standards

- **Tailwind CSS v4** - Utility classes only
- **No inline styles** - Use Tailwind utilities
- **shadcn/ui** - Extend existing components, don't recreate
- **Color palette** - Zinc/Amber (#f59e0b primary)
- **Dark theme default** - Proper contrast ratios
- **No shadows** - Per design standards
- **Responsive design** - Mobile-first approach

### State Management Standards

- **Zustand stores** - For global state
- **Local state** - For component-specific state
- **Domain organization** - Stores grouped by domain
- **Middleware** - Use devtools and persist when appropriate
- **Store modules** - Organized in `stores/modules/`

### Performance Optimization

- **React.memo** - For expensive components
- **useMemo/useCallback** - Prevent unnecessary re-renders
- **Proper dependencies** - Accurate dependency arrays
- **WebSocket batching** - 200ms debounce for messages
- **Storage caching** - Efficient localStorage/sessionStorage usage
- **Prevent memory leaks** - Cleanup in useEffect

### Security Guidelines

**Cryptographic Operations:**

- Never log private keys in any environment
- Use constant-time comparisons for signatures
- Validate all addresses and signatures before processing
- Follow secp256k1 best practices
- Use deterministic serialization

**Key Storage:**

- Private keys encrypted in localStorage
- Separate storage keys for sensitive data
- Session tokens in memory-only mode when possible

## Build and Deployment

### Development

```bash
npm run dev
```

- Runs on `http://localhost:5173` (accessible from network via `--host`)
- Hot module replacement enabled
- Source maps for debugging
- PWA enabled in development mode

### Production Build

```bash
npm run build
```

- TypeScript compilation check (`tsc -b`)
- Vite production build
- Output directory: `dist/`
- Optimized and minified
- PWA assets generated (manifest, service worker)
- 257 files precached for offline support

### Preview Production Build

```bash
npm run preview
```

- Test production build locally
- PWA functionality available
- Install app from browser
- Test offline mode

### Linting

```bash
npm run lint
```

- ESLint with TypeScript rules
- React Hooks rules
- Custom project rules

### PWA Features

**STELS Web 5 is a Progressive Web App:**

- ✅ **Installable** - Install on desktop and mobile devices
- ✅ **Offline Support** - Works without internet connection
- ✅ **Auto-Update** - Automatic updates when new version is available
- ✅ **Fast Loading** - Cached assets for instant loading
- ✅ **Native-Like** - Runs in standalone mode
- 🔒 **Secure** - Multi-layer security with extension protection

**Installation:**

- **Desktop**: Click install button in browser address bar
- **Android**: Use "Add to Home Screen" in Chrome
- **iOS**: Use "Add to Home Screen" in Safari

## Environment Configuration

### Network Configurations

**Available Networks:**

- **TestNet** - Development/testing network
- **MainNet** - Production network
- **LocalNet** - Local development

**Configuration Structure:**

```typescript
interface NetworkConfig {
  id: string;
  name: string;
  api: string; // REST API endpoint
  socket: string; // WebSocket endpoint
  developer: boolean; // Enable developer features
  description?: string;
}
```

## Testing

### Manual Testing Checklist

**Authentication Flow:**

- [ ] Create new wallet
- [ ] Import existing wallet
- [ ] Select network
- [ ] Establish WebSocket connection
- [ ] Session persistence across reload

**Canvas System:**

- [ ] Create new panel
- [ ] Add widgets to canvas
- [ ] Auto-connections between widgets
- [ ] Panel switching
- [ ] State persistence

**Editor:**

- [ ] Create worker from template
- [ ] Edit worker script
- [ ] Start/Stop worker
- [ ] View worker statistics
- [ ] Leader election (for leader mode)

**Trading Features:**

- [ ] View real-time market data
- [ ] Analyze order book depth
- [ ] Monitor portfolio positions
- [ ] Track P&L

## Common Patterns

### Component Pattern

```typescript
/**
 * Component description
 */
export function ComponentName({
  prop1,
  prop2,
}: ComponentProps): React.ReactElement {
  // Hooks
  const state = useState();
  const effect = useEffect();

  // Event handlers
  const handleEvent = useCallback(() => {
    // logic
  }, [deps]);

  // Render
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
}
```

### Store Pattern

```typescript
/**
 * Store description
 */
export const useStoreNameStore = create<StoreType>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        property: initialValue,

        // Actions
        action: () => {
          set((state) => ({
            property: newValue,
          }));
        },
      }),
      {
        name: "store-name",
        partialize: (state) => ({
          // Only persist specific properties
          property: state.property,
        }),
      },
    ),
    {
      name: "Store Name",
    },
  ),
);
```

### API Call Pattern

```typescript
const connectionSession = useAuthStore.getState().connectionSession;

if (!connectionSession) {
  console.error("No active connection");
  return;
}

const response = await fetch(connectionSession.api, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": connectionSession.session,
  },
  body: JSON.stringify({
    webfix: "1.0",
    method: "methodName",
    params: [],
    body: {/* data */},
  }),
});

const data = await response.json();
```

## Troubleshooting

### Common Issues

**WebSocket Connection Fails:**

- Check network configuration
- Verify session token is valid
- Check browser console for errors
- Ensure backend is running

**Session Expired:**

- Use "Re-authenticate" button
- Check if wallet is still available
- Verify network is accessible

**Widget Not Displaying:**

- Check session data is present
- Verify widget type is recognized
- Check browser console for errors
- Ensure WebSocket connection is active

**Store Not Persisting:**

- Check localStorage is not full
- Verify store name is correct
- Check browser privacy settings

## Code Organization Best Practices

1. **Modular Architecture** - Each app is self-contained with its own store,
   types, utils, and components
2. **Absolute Imports** - Use `@/` alias for all imports
3. **Type Safety** - No `any`, explicit return types, strict mode
4. **Component Organization** - Separate container and presentational components
5. **Business Logic in Hooks** - Extract complex logic from components
6. **Consistent Naming** - PascalCase for components, camelCase for functions
7. **Professional English** - All code and comments in English

## Performance Considerations

### Optimization Strategies

1. **Debounced Updates** - 300ms debounce for Canvas state saves
2. **Message Batching** - 200ms batch for WebSocket messages
3. **Memoization** - Use React.memo for expensive renders
4. **Lazy Loading** - Route-based code splitting
5. **Virtual Scrolling** - For large lists (ScrollArea component)
6. **Canvas State** - Separate panel data prevents cross-contamination

### Memory Management

- **Cleanup Effects** - All useEffect hooks have cleanup functions
- **WebSocket Closure** - Proper WebSocket termination on disconnect
- **Timeout Clearing** - All setTimeout/setInterval properly cleared
- **Reference Management** - useRef for non-reactive values

## Contributing Guidelines

### Code Review Checklist

- [ ] TypeScript strict mode compliance
- [ ] Explicit return types on all functions
- [ ] No `any` or non-null assertions
- [ ] Tailwind CSS only (no inline styles)
- [ ] Professional English comments
- [ ] Proper error handling
- [ ] Component memoization where appropriate
- [ ] Cleanup functions in useEffect
- [ ] Responsive design (mobile + desktop)
- [ ] Accessibility attributes (ARIA)

### Commit Standards

- Use descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused and atomic
- Test before committing

## Resources

### Documentation

- **React 19**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Tailwind CSS v4**: https://tailwindcss.com
- **Zustand**: https://github.com/pmndrs/zustand
- **ReactFlow**: https://reactflow.dev
- **shadcn/ui**: https://ui.shadcn.com

### Cryptography

- **Elliptic**: https://github.com/indutny/elliptic
- **Noble Hashes**: https://github.com/paulmillr/noble-hashes
- **secp256k1**: https://en.bitcoin.it/wiki/Secp256k1

## License

© 2024 Gliesereum Ukraine. All rights reserved.

---

**Last Updated:** 2025-10-17\
**Maintainer:** STELS Development Team
