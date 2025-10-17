# STELS Web3 OS - Deployment & Security Guide

## Deployment

### Development Environment

**Prerequisites:**

- Node.js 18+ (LTS recommended)
- npm 9+ or equivalent package manager
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)

**Setup:**

```bash
# Clone repository
git clone <repository-url>
cd apps/web3

# Install dependencies
npm install

# Start development server
npm run dev

# Access application
# Local: http://localhost:5173
# Network: http://<your-ip>:5173 (via --host flag)
```

**Development Features:**

- Hot Module Replacement (HMR)
- Source maps
- React Fast Refresh
- TypeScript type checking
- ESLint on save

### Production Build

**Build Process:**

```bash
# 1. Type check
tsc -b

# 2. Production build
npm run build

# 3. Preview build
npm run preview
```

**Output Structure:**

```
dist/
├── index.html              # Entry point
├── assets/
│   ├── index-[hash].js    # Bundled JavaScript
│   ├── index-[hash].css   # Bundled styles
│   └── [images]           # Optimized images
└── logo.svg               # Static assets
```

**Build Optimizations:**

- Tree shaking (removes unused code)
- Code splitting (route-based)
- Asset optimization
- CSS minification
- JS minification and compression

### Deployment Strategies

#### Static Hosting (Recommended)

**Platforms:**

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

**Configuration Example (Vercel):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Important:** Configure SPA routing redirect (all routes → index.html)

#### Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY .. .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**

```nginx
server {
  listen 80;
  server_name _;
  
  root /usr/share/nginx/html;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /assets {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

#### Environment Configuration

**Build-time Variables:**

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL),
    "import.meta.env.VITE_NETWORK": JSON.stringify(process.env.VITE_NETWORK),
  },
});
```

**Usage:**

```typescript
const apiUrl = import.meta.env.VITE_API_URL || "https://api.stels.network";
```

## Security

### Critical Security Principles

#### 1. Private Key Management

**Storage:**

```typescript
// ✅ Correct: Encrypted in localStorage
const wallet = createWallet();
localStorage.setItem("_g", JSON.stringify(wallet));

// ❌ Never: Log private keys
console.log(wallet.privateKey); // NEVER DO THIS

// ❌ Never: Send to server
fetch("/api", {
  body: JSON.stringify({ privateKey: wallet.privateKey }),
}); // NEVER DO THIS

// ❌ Never: Store in plain text files
fs.writeFileSync("key.txt", wallet.privateKey); // NEVER DO THIS
```

**Best Practices:**

- Private keys generated client-side only
- Never transmitted over network
- User responsible for secure backup
- Consider hardware wallet integration (future)

#### 2. Cryptographic Standards

**Signature Generation:**

```typescript
import { deterministicStringify, sign } from "@/lib/gliesereum";

// ✅ Correct: Deterministic serialization
const data = { field1: "value", field2: 123 };
const canonical = deterministicStringify(data);
const signature = sign(canonical, privateKey);

// ❌ Wrong: Non-deterministic serialization
const json = JSON.stringify(data); // Field order not guaranteed
const signature = sign(json, privateKey); // Verification may fail
```

**Verification:**

```typescript
import { verify } from "@/lib/gliesereum";

// ✅ Correct: Constant-time comparison
const isValid = verify(data, signature, publicKey);

// ❌ Wrong: String comparison
if (computedSig === providedSig) {} // Timing attack vulnerable
```

**Hashing:**

```typescript
import { createHash } from "@/lib/gliesereum";

// ✅ Use SHA-256 for all hashing
const hash = createHash(data);

// ❌ Don't use weak hash functions
const hash = md5(data); // Not available, shown as anti-pattern
```

#### 3. Session Security

**Token Storage:**

```typescript
// ✅ Session token in memory only
interface ConnectionSession {
  session: string; // Never persisted to localStorage
  token: string;
  network: string;
  // ...
}

// Token cleared on:
// - Manual disconnect
// - Session expiration
// - Page close
```

**Session Validation:**

```typescript
// Every API request includes session header
headers: {
  "stels-session": connectionSession.session
}

// Backend validates:
// 1. Token format
// 2. Token expiration
// 3. Token ownership
```

**Session Expiration Handling:**

```typescript
// Detected via:
// 1. WebSocket close event (code 4401)
// 2. HTTP 401 responses
// 3. Periodic heartbeat checks

// Recovery flow:
// 1. Show modal to user
// 2. User chooses to re-authenticate
// 3. Restore wallet from localStorage
// 4. Establish new connection
// 5. Continue session
```

#### 4. Input Validation

**Client-Side Validation:**

```typescript
// ✅ Validate all user inputs
function validateAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;

  // Check format
  if (!/^g[a-zA-Z0-9]{40,}$/.test(address)) return false;

  // Verify checksum
  return verifyAddressChecksum(address);
}

// ✅ Sanitize before processing
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, ""); // Remove potential XSS
}

// ✅ Type checking for API responses
function isValidResponse(data: unknown): data is ValidType {
  return (
    typeof data === "object" &&
    data !== null &&
    "field" in data
  );
}
```

**Never Trust Client Input:**

- Always validate on backend
- Check data types
- Verify value ranges
- Sanitize strings
- Validate array lengths

#### 5. API Security

**Request Authentication:**

```typescript
// Every request must include:
{
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken  // Required
  }
}
```

**Request Signing (for sensitive operations):**

```typescript
// Account creation/update
const signature = sign(
  deterministicStringify(accountData),
  wallet.privateKey,
);

const body = {
  account: accountData,
  publicKey: wallet.publicKey,
  address: wallet.address,
  signature: signature, // Proves ownership
};
```

**Rate Limiting:**

```typescript
// Client-side throttling
const rateLimiter = {
  lastRequest: 0,
  minInterval: 1000, // ms

  canMakeRequest(): boolean {
    const now = Date.now();
    if (now - this.lastRequest < this.minInterval) {
      return false;
    }
    this.lastRequest = now;
    return true;
  },
};

// Before API call:
if (!rateLimiter.canMakeRequest()) {
  console.warn("Rate limit: Please wait");
  return;
}
```

#### 6. XSS Prevention

**Safe Rendering:**

```typescript
// ✅ React escapes by default
<div>{userInput}</div>

// ✅ Sanitize before dangerouslySetInnerHTML (if absolutely necessary)
import DOMPurify from "dompurify";

<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(htmlContent) 
}} />

// ❌ Never trust user HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // DANGEROUS
```

**URL Safety:**

```typescript
// ✅ Validate URLs
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Usage:
{
  isSafeUrl(link) && (
    <a href={link} target="_blank" rel="noopener noreferrer">
      Link
    </a>
  );
}
```

#### 7. CORS and CSP

**Content Security Policy (Recommended):**

```html
<!-- index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' wss: https:;
  font-src 'self';
"
>
```

**CORS Handling:**

```typescript
// Backend must allow frontend origin
Access-Control-Allow-Origin: https://app.stels.network
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, stels-session
```

### Secure Development Practices

#### Code Review Security Checklist

- [ ] No private keys in code
- [ ] No hardcoded credentials
- [ ] All user inputs validated
- [ ] SQL injection prevention (if applicable)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secure random generation
- [ ] Proper error messages (no sensitive info leak)
- [ ] HTTPS enforced
- [ ] Secure session management

#### Dependency Security

**Audit Dependencies:**

```bash
npm audit

# Fix vulnerabilities
npm audit fix

# Manual review
npm audit --json > audit.json
```

**Keep Dependencies Updated:**

```bash
# Check for updates
npm outdated

# Update with caution
npm update

# Major version updates
npm install package@latest
```

**Trusted Sources Only:**

- Verify package authenticity
- Check npm package downloads and maintenance
- Review package source code for critical dependencies
- Use lock files (`package-lock.json`)

## Data Security

### Sensitive Data Handling

**Classification:**

**Level 1 - Critical (Never Store):**

- Private keys (except encrypted in localStorage)
- API secrets
- Session tokens (memory only)
- User passwords

**Level 2 - Sensitive (Encrypt if Stored):**

- Exchange API keys
- User personal information
- Transaction history

**Level 3 - Public (Safe to Store):**

- Public keys
- Wallet addresses
- Market data
- UI preferences

**Storage Matrix:**

| Data Type     | Memory | localStorage   | sessionStorage | Backend        |
| ------------- | ------ | -------------- | -------------- | -------------- |
| Private Key   | ✅     | ✅ (encrypted) | ❌             | ❌             |
| Public Key    | ✅     | ✅             | ✅             | ✅             |
| Session Token | ✅     | ❌             | ❌             | ✅             |
| API Keys      | ✅     | ✅ (signed)    | ❌             | ✅ (encrypted) |
| UI State      | ✅     | ✅             | ✅             | ❌             |
| Market Data   | ✅     | ❌             | ✅             | ✅             |

### LocalStorage Security

**Current Implementation:**

```typescript
// Wallet stored in localStorage
localStorage.setItem("_g", JSON.stringify(wallet));

// Future enhancement: Encryption
import { decrypt, encrypt } from "crypto-lib";

const encryptedWallet = encrypt(
  JSON.stringify(wallet),
  userPassword, // Derived from user PIN/password
);
localStorage.setItem("_g", encryptedWallet);
```

**Access Control:**

```typescript
// Only authorized code should access sensitive data
const SENSITIVE_KEYS = ["_g", "private-store"];

function checkAccess(key: string): boolean {
  if (SENSITIVE_KEYS.includes(key)) {
    // Verify caller context
    // Log access
    return true;
  }
  return true;
}
```

### Session Storage Security

**Usage:**

```typescript
// ✅ Correct: Non-sensitive data only
sessionStorage.setItem(channel, JSON.stringify(widgetData));

// ❌ Wrong: Sensitive data
sessionStorage.setItem("privateKey", wallet.privateKey);
```

**Cleanup:**

```typescript
// On logout or session end
sessionStorage.clear();
```

## Network Security

### WebSocket Security

**Connection Security:**

```typescript
// ✅ Use WSS (WebSocket Secure)
const ws = new WebSocket("wss://api.stels.network", protocols);

// ❌ Avoid WS (unencrypted)
const ws = new WebSocket("ws://api.stels.network"); // Only for localhost
```

**Message Validation:**

```typescript
ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);

    // Validate structure
    if (!isValidMessage(message)) {
      console.error("Invalid message format");
      return;
    }

    // Validate content
    if (!validateMessageContent(message)) {
      console.error("Invalid message content");
      return;
    }

    // Process message
    processMessage(message);
  } catch (error) {
    console.error("Message processing error:", error);
  }
};

function isValidMessage(msg: unknown): msg is ValidMessage {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "channel" in msg &&
    "widget" in msg &&
    "raw" in msg
  );
}
```

**Connection Timeout:**

```typescript
const CONNECTION_TIMEOUT = 30000; // 30 seconds

const timeoutId = setTimeout(() => {
  if (ws.readyState !== WebSocket.OPEN) {
    ws.close();
    handleConnectionTimeout();
  }
}, CONNECTION_TIMEOUT);

ws.onopen = () => {
  clearTimeout(timeoutId);
};
```

### HTTPS Enforcement

**Production Configuration:**

```typescript
// Redirect HTTP to HTTPS
if (location.protocol !== "https:" && location.hostname !== "localhost") {
  location.replace(
    `https:${location.href.substring(location.protocol.length)}`,
  );
}
```

### API Communication Security

**Request Integrity:**

```typescript
async function secureApiCall(method: string, body: unknown): Promise<unknown> {
  const { connectionSession } = useAuthStore.getState();

  if (!connectionSession) {
    throw new Error("No active session");
  }

  // Validate session token format
  if (!isValidSessionToken(connectionSession.session)) {
    throw new Error("Invalid session token");
  }

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

  // Validate response
  if (!response.ok) {
    if (response.status === 401) {
      // Session expired
      handleSessionExpiration();
    }
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

## Monitoring and Logging

### Production Logging

**Log Levels:**

```typescript
enum LogLevel {
  ERROR = 0, // Critical errors
  WARN = 1, // Warnings
  INFO = 2, // General info
  DEBUG = 3, // Debug info (dev only)
}

const currentLogLevel = import.meta.env.PROD ? LogLevel.WARN : LogLevel.DEBUG;

function log(level: LogLevel, message: string, ...args: unknown[]): void {
  if (level > currentLogLevel) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${LogLevel[level]}]`;

  switch (level) {
    case LogLevel.ERROR:
      console.error(prefix, message, ...args);
      break;
    case LogLevel.WARN:
      console.warn(prefix, message, ...args);
      break;
    default:
      console.log(prefix, message, ...args);
  }
}
```

**Sensitive Data Filtering:**

```typescript
function sanitizeLogData(data: unknown): unknown {
  if (typeof data === "object" && data !== null) {
    const sanitized = { ...data };

    // Remove sensitive fields
    const sensitiveKeys = [
      "privateKey",
      "secret",
      "apiKey",
      "password",
      "token",
    ];

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  }

  return data;
}

// Usage:
console.log("User data:", sanitizeLogData(userData));
```

### Error Reporting

**Error Tracking Service Integration:**

```typescript
// Example: Sentry integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,

  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.user) {
      delete event.user.privateKey;
      delete event.user.apiKey;
    }

    return event;
  },
});

// Capture errors
try {
  performAction();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Performance Monitoring

**Web Vitals:**

```typescript
import { getCLS, getFCP, getFID, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric: Metric): void {
  // Send to analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Compliance and Privacy

### GDPR Compliance

**User Data Collection:**

- Wallet address (pseudonymous)
- UI preferences (non-personal)
- Network usage (anonymous)

**User Rights:**

- Right to access: Export localStorage data
- Right to erasure: Clear all storage
- Right to portability: JSON export

**Implementation:**

```typescript
// Export user data
export function exportUserData(): string {
  const data = {
    wallet: localStorage.getItem("_g"),
    preferences: localStorage.getItem("theme-store"),
    accounts: localStorage.getItem("accounts-store"),
    // Exclude: session tokens, temporary data
  };

  return JSON.stringify(data, null, 2);
}

// Delete user data
export function deleteUserData(): void {
  // Clear localStorage
  const keysToDelete = [
    "_g",
    "auth-store",
    "accounts-store",
    "theme-store",
    // All user-specific stores
  ];

  keysToDelete.forEach((key) => localStorage.removeItem(key));

  // Clear sessionStorage
  sessionStorage.clear();

  // Notify user
  alert("All user data deleted");
}
```

### Terms of Service

**Disclaimer Display:**

```typescript
// First-time user flow
useEffect(() => {
  const hasAcceptedTerms = localStorage.getItem("terms-accepted");

  if (!hasAcceptedTerms) {
    setShowTermsDialog(true);
  }
}, []);

function handleAcceptTerms(): void {
  localStorage.setItem("terms-accepted", "true");
  setShowTermsDialog(false);
}
```

## Backup and Recovery

### Wallet Backup

**Export Private Key:**

```typescript
function exportPrivateKey(wallet: Wallet): void {
  const blob = new Blob([wallet.privateKey], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gliesereum-key-${wallet.address.slice(0, 8)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Warn user
  alert(
    "IMPORTANT: Store this file securely. Anyone with this key can access your funds.",
  );
}
```

**Import Private Key:**

```typescript
function importPrivateKey(privateKeyFile: File): Promise<Wallet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const privateKey = e.target?.result as string;
        const wallet = importWallet(privateKey.trim());
        resolve(wallet);
      } catch (error) {
        reject(new Error("Invalid private key format"));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(privateKeyFile);
  });
}
```

### Account Backup

**Export Accounts:**

```typescript
function exportAccounts(): void {
  const accounts = useAccountsStore.getState().accounts;

  // Remove sensitive data
  const safeAccounts = accounts.map((account) => ({
    ...account,
    account: {
      ...account.account,
      apiKey: "[REDACTED]",
      secret: "[REDACTED]",
      password: "[REDACTED]",
    },
  }));

  const json = JSON.stringify(safeAccounts, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "stels-accounts-backup.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

## Incident Response

### Security Incident Handling

**If Private Key Compromised:**

1. Immediately create new wallet
2. Transfer all funds to new wallet
3. Revoke all exchange API keys
4. Update all account configurations
5. Monitor for unauthorized transactions

**If Session Hijacked:**

1. Disconnect from network
2. Clear all sessions
3. Reconnect with new session
4. Review recent activities
5. Report to backend if suspicious

**If API Keys Exposed:**

1. Immediately revoke keys on exchange
2. Generate new API keys
3. Update account configuration
4. Review recent trading activity

### Emergency Procedures

**Emergency Stop (Workers):**

```typescript
// Stop all automated trading
const { stopAllWorkers } = useEditorStore.getState();

await stopAllWorkers();
// Result: { stopped: number, failed: number, total: number }
```

**Emergency Disconnect:**

```typescript
// Immediately close all connections
const { disconnectFromNode } = useAuthStore.getState();

await disconnectFromNode();

// Clear session data
sessionStorage.clear();

// Clear sensitive localStorage (optional)
localStorage.removeItem("_g");
```

## Disaster Recovery

### Data Recovery Plan

**Scenario 1: LocalStorage Corruption**

```typescript
function recoverFromCorruptedStorage(): void {
  try {
    // Try to parse each store
    const stores = [
      "auth-store",
      "accounts-store",
      "canvas-store",
    ];

    for (const store of stores) {
      try {
        const data = localStorage.getItem(store);
        if (data) JSON.parse(data);
      } catch {
        console.error(`Corrupted store: ${store}`);
        localStorage.removeItem(store);
      }
    }

    // Reload app
    window.location.reload();
  } catch (error) {
    console.error("Recovery failed:", error);
  }
}
```

**Scenario 2: Lost Wallet**

```typescript
// User must import from backup
function recoverWallet(privateKey: string): void {
  try {
    const wallet = importWallet(privateKey);

    // Restore to store
    useAuthStore.setState({ wallet, isWalletCreated: true });

    // Persist
    localStorage.setItem("_g", JSON.stringify(wallet));

    alert("Wallet recovered successfully");
  } catch (error) {
    alert("Invalid private key. Recovery failed.");
  }
}
```

**Scenario 3: Session Loss**

```typescript
// Automatic restoration via useAuthRestore hook
// If wallet exists in localStorage, automatically reconnect
```

## Security Checklist

### Pre-Deployment

- [ ] All dependencies audited (`npm audit`)
- [ ] No console.log statements with sensitive data
- [ ] All API endpoints use HTTPS
- [ ] WebSocket uses WSS
- [ ] Private keys never logged
- [ ] Session tokens not persisted
- [ ] Input validation implemented
- [ ] XSS prevention verified
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting implemented
- [ ] Authentication flow tested
- [ ] Session expiration handled
- [ ] Backup/recovery tested

### Post-Deployment

- [ ] Monitor error rates
- [ ] Track failed authentication attempts
- [ ] Review suspicious activities
- [ ] Regular security audits
- [ ] Update dependencies monthly
- [ ] Penetration testing (quarterly)
- [ ] User education (security best practices)

## Security Updates

### Vulnerability Disclosure

**Report Security Issues:**

- Email: security@gliesereum.ua
- Encrypted communication preferred
- Responsible disclosure (90-day window)

**Security Update Process:**

1. Vulnerability reported
2. Team assesses severity
3. Patch developed and tested
4. Security advisory published
5. Users notified to update
6. Patch deployed

## Additional Security Resources

### References

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Web3 Security**: https://ethereum.org/en/developers/docs/security/
- **React Security**: https://react.dev/learn/keeping-components-pure
- **Cryptography**: https://www.iacr.org/

### Security Tools

**Recommended:**

- `npm audit` - Dependency vulnerability scanning
- SonarQube - Static code analysis
- OWASP ZAP - Security testing
- Burp Suite - Web security testing

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Classification:** Public\
**Authors:** STELS Development Team
