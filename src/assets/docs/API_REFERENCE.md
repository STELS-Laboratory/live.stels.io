# API Reference

**Category:** Developer\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** Developers seeking API details

---

## Overview

This document provides a comprehensive reference for STELS APIs, hooks, stores,
and utilities.

---

## Core Stores

### App Store

Global application state management.

**Location:** `@/stores/modules/app.store.ts`

```typescript
interface AppStore {
  // State
  currentRoute: string;
  allowedRoutes: string[];
  isDeveloper: boolean;
  isInitialized: boolean;

  // Actions
  navigateTo: (route: string) => void;
  setDeveloperMode: (enabled: boolean) => void;
  initialize: () => void;
}

// Usage
import { useAppStore } from "@/stores";

const currentRoute = useAppStore((state) => state.currentRoute);
const navigateTo = useAppStore((state) => state.navigateTo);
```

**Methods:**

#### `navigateTo(route: string): void`

Navigate to a different route.

```typescript
const navigateTo = useAppStore((state) => state.navigateTo);
navigateTo("canvas");
```

#### `setDeveloperMode(enabled: boolean): void`

Enable or disable developer mode.

```typescript
const setDeveloperMode = useAppStore((state) => state.setDeveloperMode);
setDeveloperMode(true);
```

---

### Auth Store

Authentication and user session management.

**Location:** `@/stores/modules/auth.store.ts`

```typescript
interface AuthStore {
  // State
  isAuthenticated: boolean;
  user: User | null;
  walletAddress: string | null;

  // Actions
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  setWalletAddress: (address: string) => void;
}

// Usage
import { useAuthStore } from "@/stores";

const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
const login = useAuthStore((state) => state.login);
```

**Methods:**

#### `login(credentials: Credentials): Promise<void>`

Authenticate user with credentials.

```typescript
await login({ username, password });
```

#### `logout(): void`

Clear authentication state.

```typescript
logout();
```

---

### Theme Store

UI theme management (dark/light mode).

**Location:** `@/stores/modules/theme.store.ts`

```typescript
interface ThemeStore {
  // State
  theme: "light" | "dark" | "system";

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
}

// Usage
import { useThemeStore } from "@/stores";

const theme = useThemeStore((state) => state.theme);
const setTheme = useThemeStore((state) => state.setTheme);
```

**Methods:**

#### `setTheme(theme: 'light' | 'dark' | 'system'): void`

Set application theme.

```typescript
setTheme("dark");
```

#### `toggleTheme(): void`

Toggle between light and dark themes.

```typescript
toggleTheme();
```

---

### Toast Store

Notification management.

**Location:** `@/stores/modules/toast.store.ts`

```typescript
interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

interface ToastStore {
  // State
  toasts: Toast[];

  // Actions
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Usage
import { useToastStore } from "@/stores";

const addToast = useToastStore((state) => state.addToast);
```

**Methods:**

#### `addToast(toast: Omit<Toast, 'id'>): void`

Display a notification.

```typescript
addToast({
  title: "Success!",
  description: "Operation completed",
  variant: "success",
  duration: 3000,
});
```

#### `removeToast(id: string): void`

Dismiss a specific toast.

```typescript
removeToast("toast-id-123");
```

---

## Custom Hooks

### useMobile

Detect if device is mobile.

**Location:** `@/hooks/use_mobile.ts`

```typescript
function useMobile(): boolean;

// Usage
import { useMobile } from "@/hooks/use_mobile";

const isMobile = useMobile();

if (isMobile) {
  // Mobile-specific behavior
}
```

**Returns:** `boolean` - True if viewport width < 768px

---

### useTheme

Access current theme and resolved theme.

**Location:** `@/hooks/use_theme.ts`

```typescript
interface ThemeHook {
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

function useTheme(): ThemeHook;

// Usage
import { useTheme } from "@/hooks/use_theme";

const { theme, resolvedTheme, setTheme } = useTheme();

// Use resolvedTheme for actual color scheme
const bgColor = resolvedTheme === "dark" ? "#000" : "#fff";
```

---

### useWebSocketStore

Access WebSocket connection and messaging.

**Location:** `@/hooks/use_web_socket_store.ts`

```typescript
interface WebSocketStore {
  connection: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  connect: (url: string) => void;
  disconnect: () => void;
  send: (message: unknown) => void;
  subscribe: (handler: MessageHandler) => () => void;
}

function useWebSocketStore(): WebSocketStore;

// Usage
import { useWebSocketStore } from "@/hooks/use_web_socket_store";

const { connection, isConnected, send } = useWebSocketStore();

if (isConnected) {
  send({ type: "ping" });
}
```

**Methods:**

#### `send(message: unknown): void`

Send message through WebSocket.

```typescript
send({
  type: "market-subscribe",
  payload: { symbol: "BTC/USD" },
});
```

#### `subscribe(handler: MessageHandler): () => void`

Subscribe to WebSocket messages. Returns unsubscribe function.

```typescript
useEffect(() => {
  const unsubscribe = subscribe((message) => {
    console.log("Received:", message);
  });

  return unsubscribe;
}, []);
```

---

### useHydration

Wait for Zustand store hydration from localStorage.

**Location:** `@/hooks/use_hydration.ts`

```typescript
function useHydration(): boolean;

// Usage
import { useHydration } from "@/hooks/use_hydration";

function MyComponent() {
  const hasHydrated = useHydration();

  if (!hasHydrated) {
    return <Loading />;
  }

  return <Content />;
}
```

**Returns:** `boolean` - True when stores have hydrated

---

## Utilities

### cn (Class Names)

Merge Tailwind CSS classes with conditional logic.

**Location:** `@/lib/utils.ts`

```typescript
function cn(...inputs: ClassValue[]): string;

// Usage
import { cn } from "@/lib/utils";

<div
  className={cn(
    "base-class",
    isActive && "active-class",
    hasError && "error-class",
    customClass,
  )}
>
  Content
</div>;
```

---

### Router

Programmatic navigation utilities.

**Location:** `@/lib/router.ts`

```typescript
interface Router {
  navigateTo: (route: string) => void;
  getCurrentRoute: () => string;
  isRouteAllowed: (route: string) => boolean;
}

// Usage
import { navigateTo } from "@/lib/router";

navigateTo("canvas");
```

**Functions:**

#### `navigateTo(route: string): void`

Navigate to route programmatically.

```typescript
import { navigateTo } from "@/lib/router";

navigateTo("editor");
```

#### `getCurrentRoute(): string`

Get current active route.

```typescript
import { getCurrentRoute } from "@/lib/router";

const route = getCurrentRoute();
console.log("Current:", route);
```

---

### Logger

Structured logging system.

**Location:** `@/lib/logger.ts`

```typescript
interface Logger {
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
}

interface LogContext {
  context?: string;
  data?: unknown;
}

// Usage
import { logger } from "@/lib/logger";

logger.info("Operation started", {
  context: "MyComponent",
  data: { userId: 123 },
});

logger.error("Operation failed", {
  context: "MyComponent",
  data: { error: error.message },
});
```

**Methods:**

#### `info(message: string, context?: LogContext): void`

Log informational message.

```typescript
logger.info("User logged in", {
  context: "AuthService",
  data: { username },
});
```

#### `error(message: string, context?: LogContext): void`

Log error message.

```typescript
logger.error("Failed to fetch data", {
  context: "DataService",
  data: { error: error.message },
});
```

---

## Schema Resolver

JSON Schema validation and type generation.

**Location:** `@/lib/gui/schema-resolver.ts`

```typescript
class SchemaResolver {
  registerSchema(schema: JSONSchema): void;
  validate(data: unknown, schemaId: string): ValidationResult;
  generateTypes(schemaId: string): string;
  getSchema(schemaId: string): JSONSchema | undefined;
}

// Usage
import { schemaResolver } from "@/lib/gui/schema-resolver";

// Register schema
schemaResolver.registerSchema({
  $id: "my-schema",
  type: "object",
  properties: {
    name: { type: "string" },
  },
});

// Validate data
const result = schemaResolver.validate(data, "my-schema");
if (!result.valid) {
  console.error("Validation errors:", result.errors);
}
```

**Methods:**

#### `registerSchema(schema: JSONSchema): void`

Register a new schema.

```typescript
schemaResolver.registerSchema({
  $id: "user-schema",
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
  },
  required: ["id", "name"],
});
```

#### `validate(data: unknown, schemaId: string): ValidationResult`

Validate data against schema.

```typescript
const result = schemaResolver.validate(userData, "user-schema");
if (result.valid) {
  console.log("Valid!");
} else {
  console.error(result.errors);
}
```

---

## Gliesereum SDK

Blockchain operations and cryptography.

**Location:** `@/lib/gliesereum/`

### Key Generation

```typescript
import { computeAddress, generateKeyPair } from "@/lib/gliesereum";

// Generate new key pair
const { privateKey, publicKey } = generateKeyPair();

// Compute address from public key
const address = computeAddress(publicKey);
```

### Transaction Signing

```typescript
import { signTransaction } from "@/lib/gliesereum";

// Sign transaction
const signature = await signTransaction(transaction, privateKey);
```

### Message Signing

```typescript
import { signMessage, verifySignature } from "@/lib/gliesereum";

// Sign message
const signature = await signMessage(message, privateKey);

// Verify signature
const isValid = await verifySignature(message, signature, publicKey);
```

---

## UI Components (shadcn/ui)

### Button

**Location:** `@/components/ui/button.tsx`

```typescript
interface ButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// Usage
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg" onClick={handleClick}>
  Click me
</Button>;
```

**Variants:**

- `default`: Primary button (amber background)
- `destructive`: Danger button (red)
- `outline`: Border only
- `secondary`: Muted background
- `ghost`: Transparent with hover
- `link`: Text-only

---

### Card

**Location:** `@/components/ui/card.tsx`

```typescript
// Usage
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

---

### Input

**Location:** `@/components/ui/input.tsx`

```typescript
interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

// Usage
import { Input } from "@/components/ui/input";

<Input
  type="text"
  placeholder="Enter value"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>;
```

---

### Badge

**Location:** `@/components/ui/badge.tsx`

```typescript
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  children: React.ReactNode;
}

// Usage
import { Badge } from "@/components/ui/badge";

<Badge variant="success">Active</Badge>
<Badge variant="destructive">Error</Badge>
```

---

### Dialog

**Location:** `@/components/ui/dialog.tsx`

```typescript
// Usage
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div>Content</div>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

---

### ScrollArea

**Location:** `@/components/ui/scroll-area.tsx`

```typescript
// Usage
import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="h-[400px]">
  <div className="p-4">
    {/* Long content */}
  </div>
</ScrollArea>;
```

---

## Type Definitions

### Common Types

```typescript
// Route type
type Route = string;

// User type
interface User {
  id: string;
  username: string;
  email: string;
}

// Message type
interface Message {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

// Error type
interface AppError {
  code: string;
  message: string;
  details?: unknown;
}
```

### WebSocket Types

```typescript
interface WebSocketMessage {
  type: string;
  payload: unknown;
}

interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

type MessageHandler = (message: WebSocketMessage) => void;
```

### Schema Types

```typescript
interface JSONSchema {
  $id: string;
  $schema: string;
  type: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

interface SchemaProperty {
  type: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

interface ValidationError {
  path: string;
  message: string;
}
```

---

## Constants

### Routes

```typescript
// Available routes
const ROUTES = {
  WELCOME: "welcome",
  CANVAS: "canvas",
  EDITOR: "editor",
  SCHEMAS: "schemas",
  DOCS: "docs",
  MARKETS: "markets",
  WALLET: "wallet",
} as const;
```

### Theme Values

```typescript
const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;
```

### WebSocket Events

```typescript
const WS_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  MESSAGE: "message",
  ERROR: "error",
} as const;
```

---

## Environment Variables

### Development

```typescript
// Vite environment variables
const DEV = import.meta.env.DEV; // boolean
const PROD = import.meta.env.PROD; // boolean
const MODE = import.meta.env.MODE; // 'development' | 'production'
const BASE_URL = import.meta.env.BASE_URL; // string

// Custom environment variables (prefix with VITE_)
const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;
```

---

## Best Practices

### Type Safety

```typescript
// ✅ GOOD: Explicit types
function fetchUser(id: string): Promise<User> {
  return api.get<User>(`/users/${id}`);
}

// ❌ BAD: No types
function fetchUser(id) {
  return api.get(`/users/${id}`);
}
```

### Error Handling

```typescript
// ✅ GOOD: Proper error handling
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  logger.error("Operation failed", {
    context: "MyService",
    data: { error: error instanceof Error ? error.message : "Unknown" },
  });
  return { success: false, error: error as Error };
}
```

### React Hooks

```typescript
// ✅ GOOD: Proper dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]); // userId in dependencies

// ❌ BAD: Missing dependencies
useEffect(() => {
  fetchData(userId);
}, []); // ESLint will warn
```

### Store Access

```typescript
// ✅ GOOD: Selective subscription
const currentRoute = useAppStore((state) => state.currentRoute);

// ❌ BAD: Full store subscription
const store = useAppStore(); // Re-renders on ANY change
```

---

## Further Reading

- 📖 **[Platform Introduction](PLATFORM_INTRODUCTION.md)** - Understand STELS
- 🏗️ **[Architecture Overview](ARCHITECTURE_OVERVIEW.md)** - System design
- 🚀 **[Developer Onboarding](DEVELOPER_ONBOARDING.md)** - Get started
- 🛠️ **[Building Your First Agent](BUILDING_FIRST_AGENT.md)** - Hands-on
  tutorial

---

_© 2025 Gliesereum Ukraine. All rights reserved._
