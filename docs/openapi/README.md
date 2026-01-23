# STELS Agentic AI Platform - OpenAPI Specification

OpenAPI 3.1 specification for the STELS Runtime API.

## Files

## Agent-Account Security Model

**IMPORTANT**: Agents only have access to explicitly connected accounts.

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
- `/docs/FRONTEND-GUIDE.md` - Complete guide with code examples
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
│   ├── trading.yaml       # Trading schemas (8 methods)
│   ├── accounts.yaml      # Account schemas (10 methods)
│   ├── orchestration.yaml # Orchestration schemas (5 methods)
│   ├── realtime.yaml      # Realtime schemas (3 methods)
│   ├── knowledge-bases.yaml # Knowledge base schemas (3 methods)
│   ├── workspaces.yaml    # Workspace schemas (4 methods)
│   ├── domains.yaml       # Domain schemas (5 methods)
│   ├── strategies.yaml    # Strategy templates and instances (8 methods)
│   ├── workers.yaml       # Worker schemas (8 methods)
│   ├── connection.yaml    # Connection schemas (5 methods)
│   ├── health.yaml        # Health schemas (1 method)
│   └── responses.yaml     # Common error responses
└── paths/
    ├── rpc.yaml           # Main POST / RPC endpoint
    ├── health.yaml        # GET /health, /healthz, /ready
    ├── workers.yaml       # GET /api/worker/logs, /api/worker/logs/stream
    └── auth.yaml          # GET /auth/github/callback
```

## API Overview

### Total Methods: 88 (12 public, 67 session, 4 developer, 5 owner)

| Module              | Methods | Access Level          | Description                                  |
| ------------------- | ------- | --------------------- | -------------------------------------------- |
| **Connection**      | 5       | 3 public, 1 session, 1 owner | Authentication and access control     |
| **Agents**          | 8       | 4 public, 4 session   | AI agent CRUD, chat, move, and Gradient sync |
| **Tasks**           | 10      | 10 session            | Autonomous task management                   |
| **Chains**          | 10      | 10 session            | Cross-domain task chains                     |
| **Trading**         | 8       | 8 session             | Trading operations (requires exchange setup) |
| **Accounts**        | 10      | 1 public, 9 session   | Connected external accounts                  |
| **Strategies**      | 8       | 8 session             | Strategy templates and automated strategies  |
| **Orchestration**   | 5       | 5 session             | Agent coordination                           |
| **Realtime**        | 3       | 3 session             | State and triggers                           |
| **Knowledge Bases** | 3       | 3 session             | RAG knowledge bases                          |
| **Workspaces**      | 4       | 4 public              | Workspace management                         |
| **Domains**         | 5       | 5 session             | Domain adapters                              |
| **Workers**         | 8       | 4 developer, 4 owner  | Worker management                            |
| **Health**          | 1       | 1 session             | Health checks (RPC method)                   |

### HTTP Endpoints (non-RPC)

| Endpoint                    | Method | Description                      |
| --------------------------- | ------ | -------------------------------- |
| `/health`, `/healthz`, `/ready` | GET | Health check for load balancers |
| `/metrics`                  | GET    | Prometheus metrics               |
| `/auth/github/callback`     | GET    | GitHub OAuth callback            |
| `/api/worker/logs/:workerId`| GET    | Worker logs                      |

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

Most endpoints require a valid session token in the `stels-session` header.
Sessions are obtained via GitHub OAuth through the `githubAuth` method.

### Rate Limits

| Tier           | Limit              |
| -------------- | ------------------ |
| public         | 1000 requests/min  |
| auth           | 20 requests/min    |
| trading        | 50 requests/min    |
| tradingQuery   | 200 requests/min   |
| agent          | 30 requests/min    |
| agentChat      | 20 requests/min    |
| workspace      | 30 requests/min    |

## Method Reference

### Connection (5 methods)
- `connectionNode` - Connect to node [public]
- `githubAuth` - GitHub OAuth [public]
- `requestDeveloperAccess` - Request developer access [public]
- `listDeveloperRequests` - List developer requests [session]
- `approveDeveloperAccess` - Approve developer access [owner]

### Agents (8 methods)
- `listAgents` - List all agents [public]
- `createAgent` - Create a new agent [public]
- `getAgent` - Get agent by ID [session]
- `updateAgent` - Update agent [session]
- `deleteAgent` - Delete agent [session]
- `chatWithAgent` - Chat with agent [public]
- `syncFromGradient` - Sync agents from Gradient API [public]
- `moveAgentToWorkspace` - Move agent to another workspace [session]

### Tasks (10 methods)
- `listTasks`, `createTask`, `getTask`, `updateTask`, `executeTask`
- `approveTask`, `pauseTask`, `resumeTask`, `getTaskHistory`, `deleteTask`

### Chains (10 methods)
- `listChains`, `createChain`, `getChain`, `updateChain`, `executeChain`
- `getChainStatus`, `getChainHistory`, `pauseChain`, `resumeChain`, `deleteChain`

### Trading (8 methods)
- `getBalance`, `getTicker`, `getOrderBook`, `listOrders`
- `listTrades`, `createOrder`, `getOrder`, `cancelOrder`

### Accounts (10 methods)
- `listAccounts` [public]
- `setAccount`, `connectAccount`, `validateAccount`, `disconnectAccount`
- `linkAgentToAccount`, `connectAccountToAgent` (deprecated alias)
- `unlinkAgentFromAccount`, `disconnectAccountFromAgent` (deprecated alias)
- `syncAccountBalance`

### Strategies (8 methods)
- `listStrategyTemplates`, `getStrategyTemplate`, `createStrategy`
- `listStrategies`, `getStrategy`, `startStrategy`, `stopStrategy`, `deleteStrategy`

### Orchestration (5 methods)
- `routeToAgents`, `startCollaboration`, `sendAgentMessage`
- `endCollaboration`, `getOrchestratorStats`

### Realtime (3 methods)
- `getAgentState`, `setTrigger`, `getDomainData`

### Knowledge Bases (3 methods)
- `createKnowledgeBase`, `listKnowledgeBases`, `deleteKnowledgeBase`

### Workspaces (4 methods)
- `listWorkspaces`, `createWorkspace`, `updateWorkspace`, `deleteWorkspace` [all public]

### Domains (5 methods)
- `listDomains`, `getDomainInfo`, `executeDomainAction`
- `listTemplates`, `createFromTemplate`

### Workers (8 methods)
- `listWorkers`, `getWorkerStats`, `getLeaderInfo`, `checkLeaderHealth` [developer]
- `setWorker`, `updateWorker`, `migrateWorker`, `stopAllWorkers` [owner]

### Health (1 method)
- `getHealth` [session]

## Validation

Use [Spectral](https://stoplight.io/spectral) for validation:

```bash
npx @stoplight/spectral lint docs/openapi/openapi.yaml
```

## Last Updated

**Date**: 2026-01-21
**Version**: 2.10.0
**Total Methods**: 88
