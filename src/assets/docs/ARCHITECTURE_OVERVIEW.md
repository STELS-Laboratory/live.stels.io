# STELS Architecture Overview

**Category:** Developer\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** Software Architects, Senior Developers

---

## System Architecture

STELS is architected as a **modular Web Operating System** with clear separation
of concerns, distributed execution capabilities, and real-time communication
infrastructure.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      STELS Web OS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Canvas  │  │  Editor  │  │ Markets  │  │  Wallet  │  │
│  │  Visual  │  │  Monaco  │  │ Terminal │  │  Crypto  │  │
│  │  Builder │  │  IDE     │  │  Data    │  │  Keys    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │             │         │
├───────┴─────────────┴──────────────┴─────────────┴─────────┤
│                  Application Layer                          │
│          (React Components + Zustand Stores)                │
├─────────────────────────────────────────────────────────────┤
│                  Service Layer                              │
│    (WebSocket, API, Schema Validation, Crypto)              │
├─────────────────────────────────────────────────────────────┤
│                  Protocol Layer                             │
│         (Message Handlers, State Sync, Events)              │
├─────────────────────────────────────────────────────────────┤
│              Heterogeneous Network                          │
│         (Distributed Execution Environment)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Layers

### 1. Application Layer

The frontend user interface built with React and TypeScript.

**Key Components:**

- **Apps**: Independent application modules (`/src/apps/`)
- **Components**: Reusable UI components (`/src/components/`)
- **Stores**: State management with Zustand (`/src/stores/`)
- **Hooks**: Custom React hooks (`/src/hooks/`)

**Architecture Principles:**

- Functional components with hooks
- Strict TypeScript typing
- Component composition over inheritance
- Props typed with interfaces
- Minimal side effects

### 2. Service Layer

Abstraction layer for external communication and data processing.

**Responsibilities:**

- WebSocket connection management
- API request/response handling
- Schema validation and resolution
- Cryptographic operations
- Local storage persistence

**Key Services:**

- `WebSocketStore`: Real-time bidirectional communication
- `SchemaResolver`: JSON Schema validation and type generation
- `Gliesereum SDK`: Blockchain operations and signing
- `Logger`: Structured logging system

### 3. Protocol Layer

Message-based communication protocol for distributed operations.

**Features:**

- Structured message formats
- Request/response patterns
- Event broadcasting
- State synchronization
- Error handling and retry logic

**Message Flow:**

```typescript
Client Request
    ↓
Protocol Encoder
    ↓
WebSocket Transport
    ↓
Heterogen Network
    ↓
Worker Execution
    ↓
Response Encoder
    ↓
WebSocket Transport
    ↓
Client Handler
    ↓
State Update
```

### 4. Network Layer

The distributed heterogeneous network of execution nodes.

**Characteristics:**

- Geographically distributed
- Heterogeneous hardware
- Protocol-driven coordination
- Redundant execution
- Consensus-based validation

---

## Application Modules

STELS is composed of specialized application modules:

### 📝 Editor (Protocol IDE)

Monaco-based code editor for schemas and workers.

**Features:**

- Full TypeScript/JavaScript/JSON support
- IntelliSense and auto-completion
- Real-time syntax validation
- Schema validation
- Multiple file support
- Monaco themes (dark/light)

**Technology:**

- `@monaco-editor/react`
- Custom language configurations
- JSON Schema validation integration

### 🎨 Canvas (Visual Workflow)

ReactFlow-based visual programming interface.

**Features:**

- Node-based workflow composition
- Drag-and-drop interface
- Real-time execution visualization
- Panel management system
- State persistence
- Custom node types

**Technology:**

- `reactflow`
- Custom node implementations
- Panel state management
- localStorage persistence

### 📊 Markets (Trading Terminal)

Real-time market data aggregation and trading interface.

**Features:**

- Multi-exchange connectivity
- Order book visualization
- Trade execution
- Price charts
- Market scanner
- Liquidity analysis

**Data Sources:**

- WebSocket market feeds
- REST API integration
- Real-time price updates
- Historical data

### 💼 Wallet (Cryptographic Identity)

Gliesereum blockchain wallet for identity and signing.

**Features:**

- Key generation (secp256k1)
- Transaction signing
- Address management
- Balance tracking
- Secure key storage

**Security:**

- Private keys never leave client
- Constant-time operations
- Secure random generation
- No key logging

### 🌍 Globe (Network Visualization)

3D visualization of the heterogeneous network.

**Features:**

- Global node distribution
- Real-time status monitoring
- Connection visualization
- Geographic mapping

### 📋 Schemas (Data Structure Management)

JSON Schema management and validation.

**Features:**

- Schema creation and editing
- Real-time validation
- Type generation
- Schema registry
- Version management

### 📚 Docs (Documentation System)

Markdown-based documentation viewer.

**Features:**

- Automatic document loading
- Category filtering
- Full-text search
- Table of contents generation
- Responsive design
- Code syntax highlighting

---

## Data Flow Architecture

### State Management (Zustand)

```typescript
// Store Definition
interface AppStore {
  // State
  currentRoute: string;
  openApps: string[];

  // Actions
  navigateTo: (route: string) => void;
  openApp: (appId: string) => void;
  closeApp: (appId: string) => void;
}

// Store Creation with Middleware
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Implementation
      }),
      {
        name: "app-store",
        partialize: (state) => ({
          // What to persist
        }),
      },
    ),
    { name: "App Store" },
  ),
);
```

**Store Modules:**

- `app.store.ts`: Global application state
- `auth.store.ts`: Authentication and user session
- `theme.store.ts`: UI theme management
- `toast.store.ts`: Notification system
- `web_socket.store.ts`: WebSocket connection state

### Component Communication Patterns

**1. Props Down, Events Up**

```typescript
// Parent passes data down
<ChildComponent data={data} onUpdate={handleUpdate} />;

// Child emits events up
const handleChange = (value: string): void => {
  onUpdate(value);
};
```

**2. Global State via Zustand**

```typescript
// Any component can access
const { currentRoute, navigateTo } = useAppStore();
```

**3. Context for Scoped State**

```typescript
// Provider wraps tree
<WebSocketProvider>
  <App />
</WebSocketProvider>;

// Consumers access via hook
const { connection, send } = useWebSocket();
```

---

## Real-Time Communication

### WebSocket Architecture

```typescript
// Connection Management
class WebSocketManager {
  private connection: WebSocket | null;
  private reconnectAttempts: number;
  private messageQueue: Message[];

  connect(url: string): void {
    // Establish connection
    // Set up event handlers
    // Process message queue
  }

  send(message: Message): void {
    if (this.connection?.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private handleMessage(event: MessageEvent): void {
    const message = JSON.parse(event.data);
    // Route to appropriate handler
  }

  private reconnect(): void {
    // Exponential backoff
    // Restore subscriptions
  }
}
```

**Features:**

- Automatic reconnection
- Message queuing during disconnection
- Subscription management
- Error handling and logging
- Connection state tracking

### Message Protocol

**Request Format:**

```typescript
interface ProtocolRequest {
  id: string; // Unique request ID
  type: string; // Operation type
  payload: unknown; // Request data
  timestamp: number; // Unix timestamp
  signature?: string; // Optional cryptographic signature
}
```

**Response Format:**

```typescript
interface ProtocolResponse {
  id: string; // Matches request ID
  success: boolean; // Operation status
  data?: unknown; // Response data
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: number;
}
```

---

## Security Architecture

### Cryptographic Identity

**Key Generation:**

```typescript
import * as secp256k1 from "@noble/secp256k1";

// Generate private key
const privateKey = secp256k1.utils.randomPrivateKey();

// Derive public key
const publicKey = secp256k1.getPublicKey(privateKey);

// Compute address (Ethereum-compatible)
const address = computeAddress(publicKey);
```

**Transaction Signing:**

```typescript
async function signTransaction(
  tx: Transaction,
  privateKey: Uint8Array,
): Promise<Signature> {
  // Serialize transaction deterministically
  const message = serializeTransaction(tx);

  // Hash message
  const hash = sha256(message);

  // Sign with secp256k1
  const signature = await secp256k1.sign(hash, privateKey);

  return signature;
}
```

### Security Principles

1. **Private keys never leave the client**
2. **All operations are signed cryptographically**
3. **Constant-time comparisons for secrets**
4. **No logging of sensitive data**
5. **Secure random number generation**
6. **Input validation at all boundaries**

---

## Schema System

### JSON Schema Validation

```typescript
interface Schema {
  $id: string;
  $schema: string;
  type: string;
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

// Example Schema
const marketDataSchema: Schema = {
  $id: "market-data",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    exchange: { type: "string" },
    symbol: { type: "string" },
    price: { type: "number" },
    timestamp: { type: "number" },
  },
  required: ["exchange", "symbol", "price", "timestamp"],
};
```

### Schema Resolution

The schema resolver validates data against schemas and generates TypeScript
types:

```typescript
class SchemaResolver {
  private schemas: Map<string, Schema>;

  registerSchema(schema: Schema): void {
    this.schemas.set(schema.$id, schema);
  }

  validate(data: unknown, schemaId: string): ValidationResult {
    const schema = this.schemas.get(schemaId);
    // Perform JSON Schema validation
    return result;
  }

  generateTypes(schemaId: string): string {
    // Generate TypeScript interface from schema
    return typeDefinition;
  }
}
```

---

## Performance Optimizations

### React Optimizations

**1. Component Memoization**

```typescript
export const ExpensiveComponent = React.memo(
  function ExpensiveComponent({ data }: Props) {
    // Component implementation
  },
);
```

**2. Hook Optimization**

```typescript
// Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveOperation(data);
}, [data]);

// Memoize callbacks
const handleUpdate = useCallback((value: string) => {
  updateData(value);
}, [updateData]);
```

**3. Virtual Scrolling** For large lists, use virtualization to render only
visible items.

### State Optimization

**Selective Persistence:**

```typescript
partialize: ((state) => ({
  // Only persist necessary data
  currentRoute: state.currentRoute,
  theme: state.theme,
  // Omit large or temporary data
}));
```

**Debounced Updates:**

```typescript
const debouncedSave = useMemo(
  () =>
    debounce((data: Data) => {
      saveToStorage(data);
    }, 300),
  [],
);
```

---

## Build and Deployment

### Build System (Vite)

**Configuration:**

```typescript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/**/*"],
      manifest: {
        name: "STELS Web OS",
        short_name: "STELS",
        theme_color: "#f59e0b",
      },
    }),
  ],
  build: {
    target: "esnext",
    minify: "terser",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": ["@radix-ui/react-*"],
          "monaco-editor": ["@monaco-editor/react"],
        },
      },
    },
  },
});
```

### Progressive Web App (PWA)

**Service Worker:**

- Offline capability
- Asset caching
- Background sync
- Push notifications (future)

**Manifest:**

- App icons for all platforms
- Splash screens
- Display mode configuration
- Theme colors

---

## Testing Strategy

### Unit Testing

- Utility functions
- Custom hooks
- State stores
- Schema validation

### Integration Testing

- Component interactions
- WebSocket communication
- API integration
- Cryptographic operations

### E2E Testing

- User workflows
- Multi-app scenarios
- Network resilience
- Error recovery

---

## Monitoring and Logging

### Structured Logging

```typescript
interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: string;
  data?: unknown;
  timestamp: number;
}

class Logger {
  log(entry: LogEntry): void {
    const formatted = this.format(entry);
    console[entry.level](formatted);
    this.persist(entry);
  }
}
```

**Usage:**

```typescript
logger.info("WebSocket connected", {
  context: "WebSocketStore",
  data: { url, timestamp: Date.now() },
});
```

### Error Boundaries

```typescript
class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("Component error caught", {
      context: "ErrorBoundary",
      data: { error: error.message, componentStack: errorInfo.componentStack },
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## Scalability Considerations

### Code Splitting

- Lazy loading of application modules
- Dynamic imports for heavy dependencies
- Route-based splitting

### Asset Optimization

- Image compression and format optimization
- Icon sprite sheets
- Font subsetting
- CSS purging (Tailwind)

### Network Optimization

- WebSocket connection pooling
- Request batching
- Response caching
- Compression (gzip/brotli)

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

### Code Quality

**ESLint Configuration:**

- TypeScript rules
- React hooks rules
- Import sorting
- Accessibility checks

**TypeScript Configuration:**

- Strict mode enabled
- No implicit any
- Strict null checks
- No unused locals/parameters

---

## Extension Points

STELS is designed to be extensible:

### Adding New Apps

1. Create app directory in `/src/apps/`
2. Implement main component
3. Register in `allowedRoutes`
4. Add to navigation system
5. Configure keyboard shortcuts

### Custom Components

1. Create component in `/src/components/`
2. Type props with interface
3. Use shadcn/ui as base
4. Follow Tailwind styling standards
5. Export from index file

### New Protocol Operations

1. Define message schema
2. Implement client handler
3. Register with WebSocket store
4. Add type definitions
5. Document usage

---

## Next Steps

Dive deeper into specific areas:

- 🚀 **[Developer Onboarding](DEVELOPER_ONBOARDING.md)** - Set up your
  environment
- 🛠️ **[Building Your First Agent](BUILDING_FIRST_AGENT.md)** - Hands-on
  tutorial
- 📚 **[API Reference](API_REFERENCE.md)** - Detailed API documentation
- 🎨 **[UI Components Guide](UI_COMPONENTS_GUIDE.md)** - Component library

---

_© 2025 Gliesereum Ukraine. All rights reserved._
