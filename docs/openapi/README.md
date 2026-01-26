# STELS Agentic AI Platform - OpenAPI Specification

OpenAPI 3.1 specification for the STELS Runtime API.

## Version History

### v2.15.0 - Professional Trading Terminal API

New endpoints for advanced trading terminals with Bybit priority:

**Order Management:**
- `editOrder` - Edit existing orders (price, amount)
- `cancelAllOrders` - Cancel all orders for symbol
- `createOrderWithTpSl` - Create orders with Take Profit / Stop Loss
- `createStopOrder` - Create stop/trigger orders (stop_loss, take_profit, trailing_stop)

**Position Management:**
- `setMarginMode` - Switch between cross/isolated margin
- `closePosition` - Close open positions
- `setPositionMode` - Switch between one-way/hedge mode
- `modifyMargin` - Add or reduce margin for isolated positions

**Risk Management:**
- `fetchLeverageTiers` - Get leverage tier information
- `fetchFundingRate` - Get current and historical funding rates
- `fetchMyLiquidations` - Get liquidation history
- `fetchGreeks` - Get option Greeks (delta, gamma, vega, theta)

**Bybit-specific parameters supported:**
- `positionIdx` (0, 1, 2) for hedge mode
- `tpTriggerBy`, `slTriggerBy` for TP/SL triggers
- `tpslMode` (Full/Partial)
- `triggerBy` (LastPrice/MarkPrice/IndexPrice)
- `orderFilter` for cancelAllOrders

### v2.14.0 - Worker Metrics Enhancement

- **Worker Metrics by Scope**: Metrics now include breakdown by `local` and `network` workers
- **Worker Counts**: `total`, `active`, `running` for each scope
- **Top Workers List**: Now includes `scope` field
- **Prometheus Metrics**: New metrics for local/network worker counts

### v2.13.0 - Multi-Market Trading Support

- **Multiple Market Types**: Support for `spot`, `linear`, `inverse`, `option` per account
- **`getAccountMarketTypes` Method**: Get available market types and RPC methods per type
- **Market Type Override**: Pass `marketType` param to trading methods

### v2.12.0 - Breaking Change: Unified `raw` Response Format

**All API responses now use the `raw` field for data payload.**

See `/docs/WEBFIX-MIGRATION-GUIDE.md` for detailed migration instructions.

---

## Professional Trading API (v2.15.0)

### Order Management

```json
// editOrder
{
  "method": "editOrder",
  "body": {
    "accountId": "uuid",
    "orderId": "order-id",
    "symbol": "BTC/USDT",
    "amount": 0.5,
    "price": 45000,
    "positionIdx": 0
  }
}

// cancelAllOrders
{
  "method": "cancelAllOrders",
  "body": {
    "accountId": "uuid",
    "symbol": "BTC/USDT",
    "marketType": "linear",
    "orderFilter": "Order"
  }
}

// createOrderWithTpSl
{
  "method": "createOrderWithTpSl",
  "body": {
    "accountId": "uuid",
    "symbol": "BTC/USDT",
    "type": "limit",
    "side": "buy",
    "amount": 0.1,
    "price": 44000,
    "takeProfitPrice": 48000,
    "stopLossPrice": 42000,
    "tpTriggerBy": "MarkPrice",
    "slTriggerBy": "MarkPrice",
    "tpslMode": "Full"
  }
}

// createStopOrder
{
  "method": "createStopOrder",
  "body": {
    "accountId": "uuid",
    "symbol": "BTC/USDT",
    "stopOrderType": "stop_loss",
    "side": "sell",
    "amount": 0.1,
    "triggerPrice": 43000,
    "triggerBy": "MarkPrice",
    "reduceOnly": true
  }
}
```

### Position Management

```json
// setMarginMode
{
  "method": "setMarginMode",
  "body": {
    "accountId": "uuid",
    "marginMode": "isolated",
    "symbol": "BTC/USDT"
  }
}

// closePosition
{
  "method": "closePosition",
  "body": {
    "accountId": "uuid",
    "symbol": "BTC/USDT",
    "amount": 0.05,
    "positionIdx": 0
  }
}

// setPositionMode
{
  "method": "setPositionMode",
  "body": {
    "accountId": "uuid",
    "hedged": true,
    "symbol": "BTC/USDT"
  }
}

// modifyMargin
{
  "method": "modifyMargin",
  "body": {
    "accountId": "uuid",
    "symbol": "BTC/USDT",
    "amount": 100,
    "action": "add",
    "positionIdx": 0
  }
}
```

### Risk Management

```json
// fetchLeverageTiers
{
  "method": "fetchLeverageTiers",
  "body": {
    "accountId": "uuid",
    "symbol": "BTC/USDT"
  }
}

// fetchFundingRate
{
  "method": "fetchFundingRate",
  "body": {
    "accountId": "uuid",
    "symbol": "BTC/USDT",
    "history": true,
    "limit": 100
  }
}

// fetchMyLiquidations
{
  "method": "fetchMyLiquidations",
  "body": {
    "accountId": "uuid",
    "symbol": "BTC/USDT",
    "limit": 50
  }
}

// fetchGreeks (options)
{
  "method": "fetchGreeks",
  "body": {
    "accountId": "uuid",
    "symbol": "BTC-31JAN25-50000-C"
  }
}
```

---

## Worker Metrics (v2.14.0)

The `getMetrics` RPC method now returns comprehensive worker statistics:

```json
{
  "workers": {
    "totalWorkers": 23,
    "runningWorkers": 1,
    "stoppedWorkers": 22,
    
    "local": {
      "total": 15,
      "active": 5,
      "running": 3
    },
    
    "network": {
      "total": 8,
      "active": 2,
      "running": 1
    },
    
    "totalExecutions": 48,
    "totalErrors": 0,
    "errorRate": 0,
    
    "capacity": {
      "current": 1,
      "maxRecommended": 100,
      "utilizationPercent": 1
    },
    
    "topWorkers": [
      {
        "sid": "9948e72a-...",
        "isRunning": true,
        "scope": "local",
        "executions": 48,
        "errors": 0
      }
    ]
  }
}
```

---

## Trading Methods

### New in v2.15.0 (Professional Trading)

| Method | Params | Description |
|--------|--------|-------------|
| `editOrder` | `{ accountId, orderId, symbol, amount?, price? }` | Edit existing order |
| `cancelAllOrders` | `{ accountId, symbol?, marketType?, orderFilter? }` | Cancel all orders |
| `createOrderWithTpSl` | `{ accountId, symbol, type, side, amount, price?, takeProfitPrice?, stopLossPrice? }` | Order with TP/SL |
| `createStopOrder` | `{ accountId, symbol, stopOrderType, side, amount, triggerPrice }` | Stop/trigger order |
| `setMarginMode` | `{ accountId, marginMode, symbol }` | Set cross/isolated margin |
| `closePosition` | `{ accountId, symbol, amount?, positionIdx? }` | Close position |
| `setPositionMode` | `{ accountId, hedged, symbol? }` | Set one-way/hedge mode |
| `modifyMargin` | `{ accountId, symbol, amount, action }` | Add/reduce margin |
| `fetchLeverageTiers` | `{ accountId, symbol?, symbols? }` | Get leverage tiers |
| `fetchFundingRate` | `{ accountId, symbol, history?, since?, limit? }` | Get funding rates |
| `fetchMyLiquidations` | `{ accountId, symbol?, since?, limit? }` | Get liquidations |
| `fetchGreeks` | `{ accountId, symbol?, baseCurrency? }` | Get option Greeks |

### New in v2.12.0

| Method | Params | Description |
|--------|--------|-------------|
| `fetchPositions` | `{ accountId, symbol?, marketType? }` | Get open futures positions |
| `fetchBalance` | `{ accountId, marketType? }` | Get balance by UUID |
| `fetchOpenOrders` | `{ accountId, symbol?, marketType? }` | Get open orders |
| `fetchOrderHistory` | `{ accountId, symbol?, since?, limit? }` | Get order history |
| `fetchTrades` | `{ accountId, symbol?, since?, limit? }` | Get trade history |
| `setLeverage` | `{ accountId, leverage, symbol? }` | Set leverage (1-125x) |
| `transferFunds` | `{ accountId, currency, amount, fromAccount, toAccount }` | Transfer funds |
| `createBatchOrders` | `{ accountId, orders[] }` | Create batch orders |
| `createConditionalOrder` | `{ accountId, condition, order }` | Conditional orders |

### New in v2.13.0

| Method | Params | Description |
|--------|--------|-------------|
| `getAccountMarketTypes` | `{ accountId }` | Get available market types and methods |

---

## Files Structure

```
docs/openapi/
├── openapi.yaml           # Standalone single-file spec
├── README.md              # This file
├── schemas/
│   ├── common.yaml        # UUID, Timestamp, Pagination
│   ├── agents.yaml        # Agent schemas
│   ├── tasks.yaml         # Task schemas
│   ├── chains.yaml        # Chain schemas
│   ├── trading.yaml       # Trading schemas (v2.12.0+)
│   ├── accounts.yaml      # Account schemas (v2.13.0+)
│   ├── strategies.yaml    # Strategy schemas
│   ├── workers.yaml       # Worker schemas
│   ├── health.yaml        # Health & Metrics schemas (v2.14.0+)
│   └── ...
└── paths/
    └── ...
```

## API Overview

### Total Methods: 112+ (12 public, 90 session, 4 developer, 5 owner)

| Module | Methods | Description |
|--------|---------|-------------|
| **Connection** | 5 | Authentication and access control |
| **Agents** | 8 | AI agent CRUD, chat |
| **Tasks** | 10 | Autonomous task management |
| **Chains** | 10 | Cross-domain task chains |
| **Trading** | 30 | Trading operations (incl. professional) |
| **Accounts** | 11 | Connected accounts + market types |
| **Strategies** | 8 | Strategy templates |
| **Workers** | 8 | Worker management |
| **Health** | 2 | Health checks and metrics |

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

## Documentation Links

- `/docs/FRONTEND-GUIDE.md` - Complete frontend integration guide
- `/docs/WEBFIX-MIGRATION-GUIDE.md` - v2.12.0 migration guide
