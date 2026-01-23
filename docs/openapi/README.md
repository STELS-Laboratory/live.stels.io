# STELS Agentic AI Platform - OpenAPI Specification

OpenAPI 3.1 specification for the STELS Runtime API.

## Version 2.12.0 - Breaking Change: Unified `raw` Response Format

### ⚠️ BREAKING CHANGE

**All API responses now use the `raw` field for data payload.**

See `/docs/WEBFIX-MIGRATION-GUIDE.md` for detailed migration instructions.

### Before (v2.11.x)
```json
{
  "success": true,
  "data": { "free": {...}, "used": {...} },
  "orders": [...],
  "agent": { "id": "..." }
}
```

### After (v2.12.0)
```json
{
  "success": true,
  "raw": {
    "free": {...},
    "used": {...},
    "orders": [...],
    "agent": { "id": "..." }
  }
}
```

### New Trading Methods (v2.12.0)

| Method | Params | Description |
|--------|--------|-------------|
| `fetchPositions` | `{ accountId, symbol? }` | Get open futures positions |
| `fetchBalance` | `{ accountId }` | Get balance by UUID |
| `fetchOpenOrders` | `{ accountId, symbol? }` | Get open orders |
| `fetchOrderHistory` | `{ accountId, symbol?, since?, limit? }` | Get order history |
| `fetchTrades` | `{ accountId, symbol?, since?, limit? }` | Get trade history |
| `setLeverage` | `{ accountId, leverage, symbol? }` | Set leverage (1-125x) |
| `transferFunds` | `{ accountId, currency, amount, fromAccount, toAccount }` | Transfer funds |
| `createBatchOrders` | `{ accountId, orders[] }` | Create batch orders |
| `createConditionalOrder` | `{ accountId, condition, order }` | Conditional orders |

### Migration Quick Reference

```typescript
// Before
const balance = response.data;
const orders = response.orders;
const agent = response.agent;

// After
const balance = response.raw;
const orders = response.raw.orders;
const agent = response.raw.agent;
```

---

## Version 2.11.0 - Unified WebFIX Response Format

### What's New in v2.11.0

- **Standardized Response Structure**: All API responses now use unified WebFIX KV format
- **New Fields**: `channel`, `module`, `widget` for routing, `raw` for data, `requestId` for tracing  
- **getMetrics RPC Method**: Full system metrics available via RPC (developer access)
- **Application Metrics**: HTTP, agents, tasks, chains, domains, connections metrics
- **Prometheus Export**: `format: "prometheus"` for Grafana integration
- **Consistent Error Codes**: Standardized ErrorCodes enum across all endpoints

### Response Format

All responses now follow the unified WebFIX structure:

```json
// Success Response
{
  "success": true,
  "raw": { "id": "...", "name": "..." },
  "channel": "agent.response",
  "module": "agent",
  "timestamp": 1737561234567,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}

// Error Response  
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Agent not found",
    "httpStatus": 404
  },
  "timestamp": 1737561234567,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Files

### Key Concepts

1. **No automatic account access** - Agents don't see all user accounts by default
2. **Explicit binding required** - Use `connectAccountToAgent` to grant access
3. **Scopes control permissions** - `read`, `trade`, `balance`, `orders`, `history`
4. **Strategies bound to agents** - `createStrategy` requires `agentId` parameter
5. **Validation on creation** - `config.accountId` must be in agent's `connectedAccounts`

### Account Connection Flow

```
1. connectAccount       → User connects exchange account
2. connectAccountToAgent → User grants agent access with scopes
3. getAgent             → Returns agent.connectedAccounts[]
4. createStrategy       → Validates accountId is in connectedAccounts
```

### Frontend Integration

For detailed frontend integration guide, see:

- `/docs/WEBFIX-MIGRATION-GUIDE.md` - **v2.12.0 migration guide (required)**
- `/docs/FRONTEND-GUIDE.md` - Complete guide with code examples
- `/docs/METRICS-FRONTEND-GUIDE.md` - Metrics API for dashboards
- `/docs/openapi/schemas/strategies.yaml` - Strategy schemas with documentation

### Single File (Standalone)

- `openapi.yaml` - Complete OpenAPI 3.1 specification (~3000 lines)

### Modular Structure

- `openapi-bundled.yaml` - Main file with references to modules

```
docs/openapi/
├── openapi.yaml           # Standalone single-file spec
├── openapi-bundled.yaml   # Modular spec (entry point)
├── schemas/
│   ├── common.yaml        # UUID, Timestamp, Pagination, WebFIX protocol
│   ├── agents.yaml        # Agent schemas (8 methods)
│   ├── tasks.yaml         # Task schemas (10 methods)
│   ├── chains.yaml        # Chain schemas (10 methods)
│   ├── trading.yaml       # Trading schemas (17 methods) ← Updated v2.12.0
│   ├── accounts.yaml      # Account schemas (10 methods)
│   ├── orchestration.yaml # Orchestration schemas (5 methods)
│   ├── realtime.yaml      # Realtime schemas (3 methods)
│   ├── knowledge-bases.yaml # Knowledge base schemas (3 methods)
│   ├── workspaces.yaml    # Workspace schemas (4 methods)
│   ├── domains.yaml       # Domain schemas (5 methods)
│   ├── strategies.yaml    # Strategy templates and instances (8 methods)
│   ├── workers.yaml       # Worker schemas (8 methods)
│   ├── connection.yaml    # Connection schemas (5 methods)
│   ├── health.yaml        # Health schemas (2 methods)
│   └── responses.yaml     # Common error responses
└── paths/
    ├── rpc.yaml           # Main POST / RPC endpoint
    ├── health.yaml        # GET /health, /healthz, /ready
    ├── workers.yaml       # GET /api/worker/logs, /api/worker/logs/stream
    └── auth.yaml          # GET /auth/github/callback
```

## API Overview

### Total Methods: 98 (12 public, 76 session, 4 developer, 5 owner)

| Module              | Methods | Access Level                 | Description                                  |
| ------------------- | ------- | ---------------------------- | -------------------------------------------- |
| **Connection**      | 5       | 3 public, 1 session, 1 owner | Authentication and access control            |
| **Agents**          | 8       | 4 public, 4 session          | AI agent CRUD, chat, move, and Gradient sync |
| **Tasks**           | 10      | 10 session                   | Autonomous task management                   |
| **Chains**          | 10      | 10 session                   | Cross-domain task chains                     |
| **Trading**         | 17      | 17 session                   | Trading operations (+9 new in v2.12.0)       |
| **Accounts**        | 10      | 1 public, 9 session          | Connected external accounts                  |
| **Strategies**      | 8       | 8 session                    | Strategy templates and automated strategies  |
| **Orchestration**   | 5       | 5 session                    | Agent coordination                           |
| **Realtime**        | 3       | 3 session                    | State and triggers                           |
| **Knowledge Bases** | 3       | 3 session                    | RAG knowledge bases                          |
| **Workspaces**      | 4       | 4 public                     | Workspace management                         |
| **Domains**         | 5       | 5 session                    | Domain adapters                              |
| **Workers**         | 8       | 4 developer, 4 owner         | Worker management                            |
| **Health**          | 2       | 1 session, 1 developer       | Health checks and system metrics             |

### HTTP Endpoints (non-RPC)

| Endpoint                        | Method | Description                     |
| ------------------------------- | ------ | ------------------------------- |
| `/health`, `/healthz`, `/ready` | GET    | Health check for load balancers |
| `/metrics`                      | GET    | Prometheus metrics              |
| `/auth/github/callback`         | GET    | GitHub OAuth callback           |
| `/api/worker/logs/:workerId`    | GET    | Worker logs                     |

## WebFIX Protocol

All RPC methods use **POST /** with a WebFIX protocol body:

```json
{
  "webfix": "1.0",
  "method": "methodName",
  "body": { ... }
}
```

### Authentication

Include session header:
```
stels-session: <session-token>
```

### TypeScript Example

```typescript
interface ApiResponse<T> {
  success: boolean;
  raw?: T;
  error?: {
    code: string;
    message: string;
    httpStatus?: number;
  };
  requestId?: string;
  timestamp?: number;
}

async function rpc<T>(method: string, params: unknown): Promise<ApiResponse<T>> {
  const response = await fetch('/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stels-session': sessionToken,
    },
    body: JSON.stringify({
      webfix: '1.0',
      method,
      body: params,
    }),
  });
  return response.json();
}

// Usage
const result = await rpc<{ orders: Order[] }>('listOrders', { nid: 'g-vld' });
if (result.success && result.raw) {
  console.log(result.raw.orders);
}
```

## Validation

```bash
# Validate spec
npx @redocly/cli lint openapi.yaml

# Generate documentation
npx @redocly/cli build-docs openapi.yaml -o api-docs.html

# Preview
npx @redocly/cli preview-docs openapi.yaml
```
