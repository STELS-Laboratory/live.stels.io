# STELS Web3 OS - Technical Specifications

## System Requirements

### Client Requirements

**Minimum:**

- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- 2GB RAM
- 1280x720 screen resolution
- Stable internet connection (1 Mbps+)
- JavaScript enabled
- WebSocket support
- LocalStorage enabled (10MB+)

**Recommended:**

- Chrome 120+ or equivalent
- 4GB+ RAM
- 1920x1080+ screen resolution
- 10 Mbps+ internet connection
- 50MB+ LocalStorage available

**Mobile:**

- iOS 14+ (Safari, Chrome)
- Android 10+ (Chrome, Firefox)
- Touch-enabled device
- Minimum 375x667 viewport

### Server Requirements

**Backend Dependencies:**

- WebSocket server (WSS protocol)
- HTTP/HTTPS API endpoint
- Deno runtime for worker execution
- Distributed KV store (for worker coordination)
- CCXT library (for exchange integration)

### Network Requirements

**Latency:**

- WebSocket: < 500ms recommended
- HTTP API: < 1000ms recommended
- Real-time data: < 100ms update frequency

**Bandwidth:**

- Initial load: ~2-5 MB
- Real-time data: ~10-50 KB/s (varies by active widgets)
- WebSocket: Persistent connection

## Technical Constraints

### Browser Storage Limits

**LocalStorage:**

- Quota: 5-10 MB (browser dependent)
- Used for: Store persistence, wallet storage
- Clearing: User can clear in browser settings

**SessionStorage:**

- Quota: 5-10 MB (browser dependent)
- Used for: Real-time session data
- Clearing: Automatically cleared on tab close

**Management Strategy:**

- Monitor storage usage
- Implement cleanup for old data
- Warn user when approaching limit
- Provide manual cleanup options

### Performance Targets

**Loading Performance:**

- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Total Blocking Time (TBT): < 300ms

**Runtime Performance:**

- Frame rate: 60 FPS for animations
- Input latency: < 100ms
- WebSocket message processing: < 50ms
- State update latency: < 16ms (1 frame)

**Memory Usage:**

- Initial heap: < 50 MB
- Maximum heap: < 200 MB
- Memory leaks: Zero tolerance

### Scalability Limits

**Canvas:**

- Maximum widgets per panel: 50 (performance degrades after)
- Maximum panels: 20
- Maximum auto-connections: 200

**Workers:**

- Maximum active workers: Limited by backend
- Maximum script size: 1 MB
- Maximum dependencies: 20

**Session Data:**

- Maximum session keys: 1000
- Maximum widget data size: 1 MB per widget
- Session storage limit: 5-10 MB total

## Data Specifications

### Wallet Format

**Wallet Object:**

```typescript
interface Wallet {
  publicKey: string; // 66-char hex (compressed secp256k1)
  privateKey: string; // 64-char hex
  address: string; // Base58Check encoded, starts with 'g'
  biometric?: string | null;
  number: string; // Card number (Luhn checksum)
}
```

**Address Format:**

- Prefix: `g` (Gliesereum mainnet)
- Encoding: Base58Check
- Length: 42-44 characters
- Checksum: Last 4 bytes
- Example: `gAbc123...xyz789`

**Card Number Format:**

- Pattern: `{prefix}{digits}{checksum}`
- Prefix: Configurable (default "0")
- Digits: Derived from public key
- Checksum: Luhn algorithm
- Length: 16 digits
- Example: `0123456789012345`

### Transaction Format

**Basic Transaction:**

```typescript
interface Transaction {
  from: {
    address: string;
    publicKey: string;
    number: string;
  };
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  hash: string; // SHA-256 of transaction data
  signature: string; // ECDSA secp256k1
  validators: string[]; // Validator addresses
  status?: "pending" | "confirmed" | "failed";
  verified?: boolean;
  data?: string; // Optional metadata
}
```

**Smart Transaction:**

```typescript
interface SmartTransaction {
  type: "smart";
  method: "smart.exec";
  args: {
    ops: SmartOp[]; // Operations to execute
    memo?: string; // Optional description
  };
  from: string;
  fee: string; // Decimal string format
  currency: "TST";
  prev_hash: string | null;
  timestamp: number;
  signatures: TransactionSignature[];
  raw?: string; // Optional raw data
  raw_encoding?: "utf8";
  raw_sha256?: string; // Hash of raw data
  methods?: CosignMethod[];
  cosigs?: CosignSignature[];
}
```

**Signature Format:**

```typescript
interface TransactionSignature {
  kid: string; // Key ID (public key)
  alg: "ecdsa-secp256k1";
  sig: string; // Hex-encoded signature
}
```

### Worker Specification

**Worker Object:**

```typescript
interface Worker {
  key: string[]; // Storage key path
  value: {
    raw: {
      sid: string; // Worker ID
      nid: string; // Node ID
      active: boolean; // Execution state
      note: string; // Description
      script: string; // Worker code
      dependencies: string[]; // npm packages
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
}
```

**Worker Script Constraints:**

- Language: JavaScript/TypeScript (executed in Deno)
- Maximum size: 1 MB
- Timeout: Configurable per priority
- Memory limit: Backend-defined
- CPU limit: Backend-defined

**Execution Modes:**

| Mode      | Nodes         | Coordination          | Use Case                       |
| --------- | ------------- | --------------------- | ------------------------------ |
| Parallel  | All           | None                  | Data collection, monitoring    |
| Leader    | One (elected) | Distributed consensus | Trading strategies, singletons |
| Exclusive | Assigned      | None                  | Node-specific maintenance      |

**Priority Levels:**

| Priority | Max Errors | Retry Delay | Use Case                    |
| -------- | ---------- | ----------- | --------------------------- |
| Critical | 50         | 1ms         | Critical trading operations |
| High     | 20         | 10ms        | Important strategies        |
| Normal   | 10         | 100ms       | Standard operations         |
| Low      | 5          | 1s          | Background tasks            |

### Session Data Format

**Channel Naming:**

```
{network}.{domain}.{module}.{submodule}.{type}.{identifier}.{widget}

Components:
- network: testnet | mainnet | localnet
- domain: runtime | snapshot | heterogen | fred
- module: connector | sonar | network
- submodule: exchange | crypto | balance
- type: spot | futures | perpetual
- identifier: exchange name, market pair, country code
- widget: ticker | trades | book | candles | indicator

Examples:
testnet.runtime.connector.exchange.crypto.bybit.spot.BTC/USDT.ticker
testnet.runtime.connector.exchange.crypto.binance.spot.ETH/USDT.trades
testnet.snapshot.sonar
testnet.fred.usa.macro.indicator
```

**Widget Data Structure:**

```typescript
interface SessionWidgetData {
  module: string; // Module name
  channel: string; // Full channel path
  widget: string; // Widget type
  raw: { // Widget-specific data
    [key: string]: unknown;
  };
  timestamp: number | string | object;
}
```

### API Protocol Specification

**WebFix 1.0 Request:**

```typescript
{
  webfix: "1.0",                    // Protocol version
  method: string,                   // API method name
  params: string[],                 // Method parameters
  body: Record<string, unknown>     // Request body
}
```

**Headers:**

```typescript
{
  "Content-Type": "application/json",
  "stels-session": string           // Session token (required)
}
```

**Response Format:**

```typescript
// Success:
{
  // Method-specific response data
}

// Error:
{
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

**HTTP Status Codes:**

- 200 - Success
- 400 - Bad Request (validation failed)
- 401 - Unauthorized (session invalid/expired)
- 403 - Forbidden (insufficient permissions)
- 404 - Not Found
- 429 - Too Many Requests (rate limit)
- 500 - Internal Server Error
- 503 - Service Unavailable (maintenance)

## Cryptographic Specifications

### Elliptic Curve Cryptography

**Curve:** secp256k1

**Parameters:**

- p: FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F (prime)
- a: 0
- b: 7
- G: Generator point (standard secp256k1)
- n: Order of G
- h: Cofactor = 1

**Key Generation:**

```
1. Generate 32 random bytes (private key)
2. Derive public key: P = privateKey × G
3. Compress public key to 33 bytes
4. Encode in hex (66 characters)
```

**Signature Algorithm (ECDSA):**

```
1. Hash message with SHA-256
2. Generate signature (r, s) using ECDSA
3. Encode signature in hex
4. Format: {r}{s} (128 characters)
```

**Verification:**

```
1. Parse signature (r, s)
2. Hash message with SHA-256
3. Verify signature using ECDSA
4. Use constant-time comparison
```

### Hashing

**Algorithm:** SHA-256

**Usage:**

- Transaction hashing
- Message signing
- Checksum calculation
- Address derivation

**Implementation:**

```typescript
import { sha256 } from "@noble/hashes/sha256";

const hash = sha256(data); // Returns Uint8Array(32)
```

### Address Encoding

**Base58Check Algorithm:**

```
1. Prepare payload (public key hash)
2. Calculate checksum: SHA-256(SHA-256(payload))
3. Take first 4 bytes of checksum
4. Append checksum to payload
5. Encode with Base58 alphabet
6. Prepend version prefix ('g')
```

**Base58 Alphabet:**

```
123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
(Excludes: 0, O, I, l to avoid confusion)
```

## Network Specifications

### WebSocket Protocol

**Connection:**

- Protocol: WSS (WebSocket Secure)
- URL format: `wss://domain:port`
- Subprotocols: Optional

**Message Format:**

```typescript
{
  channel: string,
  module: string,
  widget: string,
  raw: Record<string, unknown>,
  timestamp: number
}
```

**Connection Lifecycle:**

```
1. Connect → readyState = CONNECTING (0)
2. Open → readyState = OPEN (1)
3. Message flow → continuous
4. Close → readyState = CLOSING (2) → CLOSED (3)
```

**Reconnection Strategy:**

```
Attempt 1: 1s delay
Attempt 2: 2s delay (exponential backoff)
Attempt 3: 4s delay
Attempt 4: 8s delay
Attempt 5: 16s delay
After 5 failures: Show session expired modal
```

**Heartbeat:**

- Interval: Backend-defined (typically 30s)
- Timeout: Backend-defined (typically 60s)
- Purpose: Detect connection loss

### HTTP API

**Endpoint:** `{api}/` (POST)

**Rate Limits:**

- Worker API: 10 requests/minute/session
- Account API: 5 requests/minute/session
- Wallet Info: 20 requests/minute/IP

**Timeout:**

- Request timeout: 30 seconds
- Connection timeout: 10 seconds

**Retry Logic:**

- Max retries: 3
- Backoff: Exponential (1s, 2s, 4s)
- Retry on: 500, 502, 503, 504

## Data Storage Specifications

### LocalStorage Schema

**Key Format:** `{store-name}`

**Stores:**

```typescript
"_g"; // Wallet (special key)
"auth-store"; // Authentication state
"accounts-store"; // Exchange accounts
"theme-store"; // Theme preferences
"canvas-store"; // Canvas panels
"markets-store"; // Markets filters
"orderbook-store"; // OrderBook settings
"scanner-store"; // Scanner state
"fred-store"; // Fred filters
"welcome-store"; // Welcome preferences
```

**Data Format:**

```typescript
{
  state: {
    // Store state
  },
  version: number
}
```

**Versioning:**

- Version stored with data
- Migration on version mismatch
- Backward compatibility required

### SessionStorage Schema

**Key Format:** Channel path (dot-separated)

**Example Keys:**

```
testnet.runtime.connector.exchange.crypto.bybit.spot.BTC/USDT.ticker
testnet.runtime.connector.exchange.crypto.binance.spot.ETH/USDT.trades
testnet.snapshot.sonar
```

**Value Format:**

```typescript
{
  module: string,
  channel: string,
  widget: string,
  raw: Record<string, unknown>,
  timestamp: number
}
```

**Lifecycle:**

- Populated by WebSocket messages
- Cleared on tab close
- Cleared on logout
- Not persisted across sessions

## Performance Specifications

### Bundle Size Targets

**Initial Bundle:**

- JavaScript: < 500 KB gzipped
- CSS: < 50 KB gzipped
- Total: < 2 MB uncompressed

**Code Splitting:**

- Main bundle: Core + Welcome
- Route bundles: Lazy loaded per app
- Vendor bundle: React, ReactFlow, large libraries

**Asset Optimization:**

- Images: WebP format, responsive sizes
- Icons: SVG (inline or sprite)
- Fonts: System fonts preferred

### Runtime Performance

**React Rendering:**

- Component render time: < 16ms (60 FPS)
- List virtualization: > 100 items
- Debouncing: 300ms for saves, 200ms for messages

**State Updates:**

- Store update: < 1ms
- Component re-render: < 16ms
- LocalStorage write: Debounced 300ms

**WebSocket:**

- Message processing: < 50ms
- Batch interval: 200ms
- Reconnection: Exponential backoff (1s to 16s)

## Integration Specifications

### Exchange Integration

**Supported via Workers:**

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
- Bitstamp
- Crypto.com
- Bitfinex

**API Credentials:**

- Stored in encrypted form (signed by wallet)
- Transmitted only to backend
- Never exposed in frontend logs
- User responsible for key security

**Data Refresh Rates:**

- Ticker: Real-time (< 1s)
- Trades: Real-time (< 1s)
- Order Book: Real-time (< 1s)
- Candles: Configurable (1m, 5m, 15m, 1h, etc.)
- Balance: On-demand or periodic (configurable in worker)
- Positions: On-demand or periodic
- Orders: On-demand or periodic

### Blockchain Integration

**Gliesereum Network:**

- Consensus: TBD (backend implementation)
- Block time: TBD
- Transaction finality: TBD
- Smart contract: Multi-operation support

**Supported Operations:**

- Transfer: Send tokens
- Assert Time: Time-based conditions
- Assert Balance: Balance-based conditions
- Assert Compare: Conditional logic
- Emit Event: Event emission

**Transaction Limits:**

- Max operations per transaction: 10
- Max memo length: 256 characters
- Max raw data: 10 KB
- Fee precision: 8 decimal places

## Security Specifications

### Cryptographic Requirements

**Key Generation:**

- Entropy source: crypto.getRandomValues()
- Key size: 256 bits (32 bytes)
- Algorithm: ECDSA with secp256k1

**Signature Security:**

- Algorithm: ECDSA
- Hash: SHA-256
- Nonce: RFC 6979 deterministic
- Verification: Constant-time comparison

**Message Signing:**

- Serialization: Deterministic (sorted keys)
- Encoding: UTF-8
- Hash: SHA-256
- Signature: ECDSA secp256k1

### Authentication Requirements

**Wallet Security:**

- Private key never transmitted
- Signature created client-side
- Public key and address sent to server
- Server verifies signature

**Session Security:**

- Session token: Cryptographically secure random
- Token length: 32+ bytes
- Token transmission: WSS only
- Token storage: Memory only (not persisted)
- Token expiration: Backend-defined (typically 24h)

**Connection Security:**

- Protocol: WSS (WebSocket Secure)
- TLS: 1.2+ required
- Certificate validation: Enabled
- Man-in-the-middle protection: Via TLS

### Data Security

**Encryption at Rest:**

- Wallet: Plaintext in localStorage (future: encrypted)
- API Keys: Signed by wallet (future: encrypted)
- Session data: Temporary (sessionStorage)

**Encryption in Transit:**

- All communications: TLS 1.2+
- WebSocket: WSS protocol
- HTTP API: HTTPS only

**Access Control:**

- Wallet access: User only
- API credentials: Wallet signature required
- Session token: Per-connection unique

## Monitoring Specifications

### Logging

**Log Levels:**

```typescript
enum LogLevel {
  ERROR = 0, // Critical errors only
  WARN = 1, // Warnings and errors
  INFO = 2, // General information
  DEBUG = 3, // Detailed debug info
}
```

**Production:** WARN level\
**Development:** DEBUG level

**Log Format:**

```
[Timestamp] [Level] [Component] Message
[2025-10-17T12:00:00.000Z] [ERROR] [WebSocket] Connection failed
```

**Sensitive Data:**

- Private keys: Never logged
- API secrets: Never logged
- Session tokens: Never logged
- User data: Sanitized before logging

### Metrics

**Application Metrics:**

- Page views per route
- User session duration
- Feature usage statistics
- Error rates
- Performance metrics (Web Vitals)

**Technical Metrics:**

- WebSocket connection uptime
- API response times
- State update frequency
- Bundle size trends
- Memory usage patterns

### Error Tracking

**Client Errors:**

- JavaScript errors
- React errors
- Network errors
- WebSocket errors
- State errors

**Error Context:**

- User agent
- Route/Component
- State snapshot (sanitized)
- Action sequence
- Timestamp

**Error Reporting:**

- Console logging (development)
- Error tracking service (production)
- User notification (user-facing errors)

## Compatibility Matrix

### Browser Support

| Browser       | Minimum Version | Tested  | Notes                        |
| ------------- | --------------- | ------- | ---------------------------- |
| Chrome        | 90              | ✅ 120+ | Full support                 |
| Edge          | 90              | ✅ 120+ | Chromium-based, full support |
| Firefox       | 88              | ✅ 120+ | Full support                 |
| Safari        | 14              | ✅ 17+  | Full support                 |
| Mobile Safari | 14              | ✅ 17+  | iOS support                  |
| Chrome Mobile | 90              | ✅ 120+ | Android support              |

**Required Features:**

- ES2020+ JavaScript
- WebSocket API
- LocalStorage API
- SessionStorage API
- Web Crypto API
- Fetch API
- CSS Grid
- CSS Flexbox
- CSS Custom Properties

### Platform Support

| Platform    | Status       | Notes             |
| ----------- | ------------ | ----------------- |
| Windows 10+ | ✅ Supported | Desktop browsers  |
| macOS 11+   | ✅ Supported | Desktop browsers  |
| Linux       | ✅ Supported | Desktop browsers  |
| iOS 14+     | ✅ Supported | Safari, Chrome    |
| Android 10+ | ✅ Supported | Chrome, Firefox   |
| Tablet      | ✅ Supported | Responsive design |

## Dependency Specifications

### Core Dependencies

**Production:**

```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "zustand": "^5.0.6",
  "reactflow": "^11.11.4",
  "framer-motion": "^12.23.11",
  "@monaco-editor/react": "^4.7.0",
  "lightweight-charts": "^5.0.8",
  "elliptic": "^6.6.1",
  "@noble/hashes": "^1.8.0",
  "tailwindcss": "^4.1.11"
}
```

**Development:**

```json
{
  "typescript": "~5.8.3",
  "vite": "^7.0.4",
  "eslint": "^9.30.1",
  "@vitejs/plugin-react": "^4.6.0"
}
```

**Update Policy:**

- Security patches: Immediate
- Minor versions: Monthly review
- Major versions: Quarterly review, testing required

### Peer Dependencies

**Required by Components:**

- React 19.x
- React DOM 19.x

**Optional:**

- Redux DevTools Extension (debugging)

## Compatibility Guarantees

### API Stability

**Until 1.0.0:**

- Breaking changes possible in minor versions
- Deprecation warnings provided
- Migration guides for breaking changes

**After 1.0.0:**

- Breaking changes only in major versions
- Deprecation period of 2 minor versions minimum
- Backward compatibility maintained

### Data Format Stability

**Guaranteed Stable:**

- Wallet format
- Transaction format
- Signature format
- Address encoding

**May Change (with migration):**

- Store schemas
- Widget data formats
- Configuration formats

## Limits and Quotas

### Application Limits

**Canvas:**

- Panels: 20 maximum
- Widgets per panel: 50 recommended
- Auto-connections: 200 maximum
- Manual edges: Unlimited

**Editor:**

- Workers: Backend-limited
- Script size: 1 MB maximum
- Dependencies: 20 maximum

**Storage:**

- LocalStorage: ~5 MB available
- SessionStorage: ~5 MB available
- Total: Browser-dependent

### API Quotas

**Request Limits:**

- Worker operations: 10/minute
- Account operations: 5/minute
- Wallet queries: 20/minute

**Data Limits:**

- Request body: 1 MB maximum
- Response body: 10 MB maximum
- WebSocket message: 1 MB maximum

**Concurrent Connections:**

- WebSocket: 1 per session
- HTTP: Browser-limited (typically 6-10)

## Internationalization

### Current Status

- Language: English only
- Number format: en-US
- Date format: ISO 8601
- Currency: USD primary
- Timezone: User system timezone

### Future Support

- Multi-language UI
- Localized number formatting
- Timezone selection
- Currency conversion
- Regional preferences

## Accessibility Specifications

### WCAG Compliance

**Target:** WCAG 2.1 Level AA

**Requirements:**

- Keyboard navigation: Full support
- Screen readers: ARIA attributes
- Color contrast: 4.5:1 for text, 3:1 for UI components
- Focus indicators: Visible on all interactive elements
- Alt text: All images
- Form labels: All inputs

**Implementation:**

```typescript
// Semantic HTML
<button>Click</button>  // Not <div onClick={}>

// ARIA attributes
<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>

// Focus management
<div tabIndex={0} onKeyDown={handleKeyDown}>

// Color contrast
// All text meets WCAG AA standards
```

## Version Compatibility

### Breaking Changes Policy

**Definition:** Changes that require code modification in consuming applications

**Examples:**

- Removed API methods
- Changed function signatures
- Renamed exports
- Modified data formats
- Changed required props

**Process:**

1. Announce in advance (deprecation warning)
2. Provide migration guide
3. Increment MAJOR version
4. Update CHANGELOG
5. Update documentation

### Deprecation Process

```typescript
/**
 * @deprecated Use newFunction instead. Will be removed in v2.0.0
 */
export function oldFunction(): void {
  console.warn("oldFunction is deprecated. Use newFunction instead.");
  newFunction();
}
```

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Authors:** STELS Development Team
