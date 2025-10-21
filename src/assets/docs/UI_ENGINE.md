# Reactive UI Engine 🎨

**Category:** Platform\
**Last Updated:** October 21, 2025\
**Version:** 0.12.8

---

## Introduction

The **STELS UI Engine** is a revolutionary approach to building reactive user
interfaces in the Web 5 era. Instead of writing React components, you define
interfaces using **declarative JSON schemas** that automatically respond to
real-time data changes.

This document explains how to use the UI Engine to build sophisticated,
real-time interfaces without writing a single line of UI code.

---

## What is Reactive UI?

Traditional web applications require developers to write component code, manage
state, handle updates, and ensure proper rendering. The STELS UI Engine
eliminates this complexity through:

### Core Principles

1. **Declarative**: Define _what_ you want, not _how_ to render it
2. **Data-Driven**: UI automatically updates when data changes
3. **Real-Time**: Sub-100ms latency from data update to screen render
4. **Composable**: Combine and nest schemas for complex interfaces
5. **Type-Safe**: JSON schemas with validation

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Worker (Backend)                    │
│                                                         │
│  • Connects to WebSocket (exchange, API, etc.)        │
│  • Processes incoming data                             │
│  • Builds JSON schema + data payload                   │
│  • Writes to SessionStorage                            │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Session Storage
                         │ (key: channel path)
                         │
┌────────────────────────▼────────────────────────────────┐
│                   UI Engine (Frontend)                  │
│                                                         │
│  • Reads data from SessionStorage                      │
│  • Parses UI schema (JSON)                             │
│  • Interpolates data into schema                       │
│  • Renders React elements                              │
│  • Re-renders on data changes (100ms polling)          │
└─────────────────────────────────────────────────────────┘
```

---

## Basic Concepts

### 1. Schema Structure

Every UI schema is a JSON object with these properties:

```typescript
interface UINode {
  type: string; // HTML element type
  className?: string; // Tailwind CSS classes
  style?: Record<string, unknown>; // Dynamic styles
  text?: string; // Text content with interpolation
  format?: FormatConfig; // Number/date formatting
  condition?: Condition; // Conditional rendering
  iterate?: IterateConfig; // Array iteration
  refreshInterval?: number; // Auto-refresh interval (ms)
  schemaRef?: string; // Reference to another schema
  events?: { // Event handlers
    onClick?: Action;
    onDoubleClick?: Action;
    onMouseEnter?: Action;
    onMouseLeave?: Action;
  };
  children?: UINode[]; // Nested nodes
}
```

### 2. Data Payload

Every schema receives a data object:

```typescript
interface DataPayload {
  channel: string; // Channel identifier
  module: string; // Module type (ticker, book, trades)
  widget: string; // Widget key for composition
  ui: UINode; // UI schema
  raw: { // Raw data accessible in schema
    exchange: string;
    market: string;
    data: unknown; // Module-specific data
    timestamp: number;
    latency: number;
  };
  active: boolean; // Connection status
  timestamp: number;
}
```

### 3. Session Storage Integration

Workers write data to SessionStorage using channel keys:

```javascript
// Worker writes
const payload = {
  channel: "testnet.runtime.ticker.BTC/USDT.bybit.spot",
  ui: {/* schema */},
  raw: {/* data */},
};

await Stels.local.set(payload.channel.split("."), payload);
```

UI Engine reads automatically:

```typescript
// UI Engine reads
const data = sessionStorage.getItem(channel);
const parsed = JSON.parse(data);

// Renders using parsed.ui and parsed.raw
```

---

## Data Access & Interpolation

### Basic Interpolation

Access data using curly braces:

```json
{
  "type": "div",
  "text": "{market}",
  "className": "text-white font-bold"
}
```

**Input data:**

```json
{
  "market": "BTC/USDT",
  "exchange": "bybit"
}
```

**Output:** `<div class="text-white font-bold">BTC/USDT</div>`

### Nested Properties

Use dot notation for nested data:

```json
{
  "type": "div",
  "text": "${data.last}",
  "format": { "type": "number", "decimals": 2 }
}
```

**Input data:**

```json
{
  "data": {
    "last": 65432.123
  }
}
```

**Output:** `<div>65432.12</div>`

### Array Access

Use bracket notation for arrays:

```json
{
  "type": "div",
  "text": "${data.bids[0][0]}",
  "format": { "type": "number", "decimals": 2 }
}
```

**Input data:**

```json
{
  "data": {
    "bids": [[65000, 1.5], [64999, 2.3]]
  }
}
```

**Output:** `<div>65000.00</div>`

---

## Math Operations

Perform calculations directly in interpolations:

```json
{
  "type": "div",
  "text": "${data.last * 2 + 100}",
  "format": { "type": "number", "decimals": 2 }
}
```

**Supported operators:** `+`, `-`, `*`, `/`, `%`, `()`

### Example: Spread Calculation

```json
{
  "type": "span",
  "text": "Spread: ${data.asks[0][0] - data.bids[0][0]}",
  "format": { "type": "number", "decimals": 2 }
}
```

---

## Formatting

### Number Formatting

```json
{
  "type": "div",
  "text": "${data.price}",
  "format": {
    "type": "number",
    "decimals": 2
  }
}
```

### Volume Formatting

Automatically formats large numbers with K/M/B suffixes:

```json
{
  "type": "div",
  "text": "{data.volume}",
  "format": {
    "type": "volume",
    "decimals": 2
  }
}
```

**Examples:**

- `1234` → `1.23K`
- `1234567` → `1.23M`
- `1234567890` → `1.23B`

### DateTime Formatting

```json
{
  "type": "div",
  "text": "{timestamp}",
  "format": { "type": "datetime" }
}
```

**Output:** `10/21/2025, 3:45:12 PM`

### Time Formatting

```json
{
  "type": "div",
  "text": "{timestamp}",
  "format": { "type": "time" }
}
```

**Output:** `3:45:12 PM`

---

## Conditional Rendering

### Show/Hide Based on Condition

```json
{
  "type": "div",
  "text": "Price is rising!",
  "condition": {
    "key": "data.change",
    "operator": ">",
    "value": 0
  }
}
```

**Renders only if `data.change > 0`**

### Conditional Styling

Dynamic colors based on data:

```json
{
  "type": "span",
  "text": "${data.change}",
  "format": { "type": "number", "decimals": 2 },
  "style": {
    "color": {
      "condition": {
        "key": "data.change",
        "operator": ">",
        "value": 0
      },
      "true": "#00C853",
      "false": "#D50000"
    }
  }
}
```

**Operators:** `===`, `>`, `<`, `>=`, `<=`

---

## Array Iteration

### Basic Iteration

Loop through arrays with `$item` accessor:

```json
{
  "type": "div",
  "iterate": {
    "source": "data.bids",
    "limit": 10
  },
  "children": [
    {
      "type": "span",
      "text": "${$item[0]}",
      "format": { "type": "number", "decimals": 2 }
    }
  ]
}
```

### Reversed Iteration

```json
{
  "type": "div",
  "iterate": {
    "source": "data.asks",
    "limit": 10,
    "reverse": true
  },
  "children": [
    {
      "type": "div",
      "text": "${$item[0]}",
      "format": { "type": "number", "decimals": 2 }
    }
  ]
}
```

### Object Properties in Iteration

```json
{
  "type": "tr",
  "iterate": { "source": "data", "limit": 20 },
  "className": "border-b border-zinc-850",
  "children": [
    { "type": "td", "text": "{$item.timestamp}", "format": { "type": "time" } },
    {
      "type": "td",
      "text": "${$item.price}",
      "format": { "type": "number", "decimals": 2 }
    },
    {
      "type": "td",
      "text": "{$item.amount}",
      "format": { "type": "number", "decimals": 4 }
    }
  ]
}
```

### Math in Iteration

```json
{
  "type": "div",
  "iterate": { "source": "data.bids" },
  "children": [
    {
      "type": "div",
      "text": "${$item[0] * $item[1]}",
      "format": { "type": "number", "decimals": 2 }
    }
  ]
}
```

### Conditional Styling in Iteration

```json
{
  "type": "span",
  "iterate": { "source": "data" },
  "text": "{$item.side}",
  "className": "px-2 py-0.5 rounded text-xs font-semibold uppercase",
  "style": {
    "backgroundColor": {
      "condition": { "key": "$item.side", "operator": "===", "value": "buy" },
      "true": "rgba(0, 200, 83, 0.15)",
      "false": "rgba(213, 0, 0, 0.15)"
    },
    "color": {
      "condition": { "key": "$item.side", "operator": "===", "value": "buy" },
      "true": "#00C853",
      "false": "#D50000"
    }
  }
}
```

---

## Advanced Features

### 1. Auto Refresh

Re-render component at specified interval:

```json
{
  "type": "div",
  "refreshInterval": 100,
  "text": "${data.last}",
  "format": { "type": "number", "decimals": 2 }
}
```

**Use case:** Display constantly updating values with smooth transitions

### 2. Percentage Calculations

Calculate width as percentage for progress bars:

```json
{
  "type": "div",
  "className": "bg-green-500/8",
  "style": {
    "width": {
      "calculate": "percentage",
      "value": "{$item[1]}",
      "max": "{data.volume[0]}"
    }
  }
}
```

### 3. Layered Positioning

Create overlays with absolute positioning:

```json
{
  "type": "div",
  "className": "flex relative py-1",
  "children": [
    {
      "type": "div",
      "className": "absolute top-0 right-0 bottom-0 bg-green-500/8",
      "style": {
        "width": {
          "calculate": "percentage",
          "value": "{$item[1]}",
          "max": "{data.volume[0]}"
        }
      }
    },
    {
      "type": "div",
      "className": "relative z-10",
      "text": "${$item[0]}",
      "format": { "type": "number", "decimals": 2 }
    }
  ]
}
```

**Result:** Background bar with overlaid text

### 4. Schema Composition

Reference other schemas for reusable components:

```json
{
  "type": "div",
  "className": "grid grid-cols-2 gap-4",
  "children": [
    { "schemaRef": "widget.testnet.runtime.ticker.BTC/USDT.bybit.spot" },
    { "schemaRef": "widget.testnet.runtime.ticker.SOL/USDT.bybit.spot" }
  ]
}
```

**Benefits:**

- ✅ Reusable components
- ✅ Automatic channel subscription
- ✅ Independent data updates
- ✅ Nested composition support

---

## Event Handling

### Modal Events

Open modals on click:

```json
{
  "type": "div",
  "className": "cursor-pointer hover:bg-zinc-800/50 p-2 rounded",
  "text": "📊 Click to view Order Book",
  "events": {
    "onClick": {
      "type": "openModal",
      "payload": {
        "channel": "testnet.runtime.book.BTC/USDT.bybit.spot",
        "modalId": "orderbook-modal",
        "width": "500px",
        "height": "auto",
        "maxHeight": "80vh",
        "backdrop": "dark",
        "closeOnBackdrop": true
      }
    }
  }
}
```

### Backdrop Options

```json
"backdrop": "dark"    // Dark overlay
"backdrop": "light"   // Light overlay
"backdrop": "blur"    // Blurred backdrop
```

### Supported Events

- `onClick`: Click handler
- `onDoubleClick`: Double-click handler
- `onMouseEnter`: Mouse enter handler
- `onMouseLeave`: Mouse leave handler

---

## Real-World Examples

### Example 1: Ticker Widget

Complete ticker with price, change, bid/ask, and volumes:

```json
{
  "type": "div",
  "refreshInterval": 100,
  "className": "flex flex-col gap-4 p-4 bg-zinc-950 rounded border font-mono",
  "children": [
    {
      "type": "div",
      "className": "flex justify-between items-center pb-3 border-b",
      "children": [
        {
          "type": "div",
          "className": "flex items-center gap-2",
          "children": [
            {
              "type": "span",
              "text": "{market}",
              "className": "text-lg font-bold text-white"
            },
            {
              "type": "span",
              "text": " • {exchange}",
              "className": "text-sm text-zinc-500"
            }
          ]
        },
        {
          "type": "span",
          "text": "●",
          "condition": { "key": "active", "operator": "===", "value": true },
          "className": "text-xs text-green-500"
        }
      ]
    },
    {
      "type": "div",
      "className": "flex flex-col gap-2",
      "children": [
        {
          "type": "div",
          "text": "${data.last}",
          "format": { "type": "number", "decimals": 2 },
          "className": "text-[32px] font-bold"
        },
        {
          "type": "div",
          "children": [
            {
              "type": "span",
              "text": "${data.change}",
              "format": { "type": "number", "decimals": 2 },
              "className": "text-sm font-semibold",
              "style": {
                "color": {
                  "condition": {
                    "key": "data.change",
                    "operator": ">",
                    "value": 0
                  },
                  "true": "#00C853",
                  "false": "#D50000"
                }
              }
            },
            {
              "type": "span",
              "text": " ({data.percentage}%)",
              "format": { "type": "number", "decimals": 2 },
              "className": "text-sm",
              "style": {
                "color": {
                  "condition": {
                    "key": "data.percentage",
                    "operator": ">",
                    "value": 0
                  },
                  "true": "#00C853",
                  "false": "#D50000"
                }
              }
            }
          ]
        }
      ]
    },
    {
      "type": "div",
      "className": "grid grid-cols-2 gap-3",
      "children": [
        {
          "type": "div",
          "className": "flex flex-col gap-1 p-3 bg-green-500/5 rounded border border-green-500/20",
          "children": [
            {
              "type": "span",
              "text": "Bid",
              "className": "text-xs text-zinc-500"
            },
            {
              "type": "span",
              "text": "${data.bid}",
              "format": { "type": "number", "decimals": 2 },
              "className": "text-lg font-semibold text-green-500"
            }
          ]
        },
        {
          "type": "div",
          "className": "flex flex-col gap-1 p-3 bg-red-500/5 rounded border border-red-500/20",
          "children": [
            {
              "type": "span",
              "text": "Ask",
              "className": "text-xs text-zinc-500"
            },
            {
              "type": "span",
              "text": "${data.ask}",
              "format": { "type": "number", "decimals": 2 },
              "className": "text-lg font-semibold text-red-600"
            }
          ]
        }
      ]
    }
  ]
}
```

### Example 2: Order Book

Real-time order book with bid/ask visualization:

```json
{
  "type": "div",
  "refreshInterval": 100,
  "className": "flex flex-col gap-0 p-5 bg-zinc-900 rounded-lg border border-zinc-700 font-mono",
  "children": [
    {
      "type": "div",
      "className": "grid grid-cols-3 gap-2 py-2 text-xs text-zinc-600 border-b border-zinc-800",
      "children": [
        { "type": "span", "text": "Price", "className": "text-right" },
        { "type": "span", "text": "Amount", "className": "text-right" },
        { "type": "span", "text": "Total", "className": "text-right" }
      ]
    },
    {
      "type": "div",
      "iterate": { "source": "data.asks", "limit": 10, "reverse": true },
      "className": "flex relative py-1",
      "children": [
        {
          "type": "div",
          "className": "absolute top-0 right-0 bottom-0 bg-red-500/8",
          "style": {
            "width": {
              "calculate": "percentage",
              "value": "{$item[1]}",
              "max": "{data.volume[1]}"
            }
          }
        },
        {
          "type": "div",
          "className": "grid grid-cols-3 gap-2 relative z-10 w-full",
          "children": [
            {
              "type": "span",
              "text": "${$item[0]}",
              "format": { "type": "number", "decimals": 2 },
              "className": "text-right text-red-600 text-[13px]"
            },
            {
              "type": "span",
              "text": "{$item[1]}",
              "format": { "type": "number", "decimals": 4 },
              "className": "text-right text-zinc-300 text-[13px]"
            },
            {
              "type": "span",
              "text": "{$item[0] * $item[1]}",
              "format": { "type": "number", "decimals": 2 },
              "className": "text-right text-zinc-500 text-[13px]"
            }
          ]
        }
      ]
    },
    {
      "type": "div",
      "className": "py-3 text-center text-base font-semibold text-amber-500 border-t border-b border-zinc-800",
      "children": [
        {
          "type": "span",
          "text": "Spread: ${data.asks[0][0] - data.bids[0][0]}",
          "format": { "type": "number", "decimals": 2 }
        }
      ]
    },
    {
      "type": "div",
      "iterate": { "source": "data.bids", "limit": 10 },
      "className": "flex relative py-1",
      "children": [
        {
          "type": "div",
          "className": "absolute top-0 right-0 bottom-0 bg-green-500/8",
          "style": {
            "width": {
              "calculate": "percentage",
              "value": "{$item[1]}",
              "max": "{data.volume[0]}"
            }
          }
        },
        {
          "type": "div",
          "className": "grid grid-cols-3 gap-2 relative z-10 w-full",
          "children": [
            {
              "type": "span",
              "text": "${$item[0]}",
              "format": { "type": "number", "decimals": 2 },
              "className": "text-right text-green-500 text-[13px]"
            },
            {
              "type": "span",
              "text": "{$item[1]}",
              "format": { "type": "number", "decimals": 4 },
              "className": "text-right text-zinc-300 text-[13px]"
            },
            {
              "type": "span",
              "text": "{$item[0] * $item[1]}",
              "format": { "type": "number", "decimals": 2 },
              "className": "text-right text-zinc-500 text-[13px]"
            }
          ]
        }
      ]
    }
  ]
}
```

### Example 3: Trades Table

Real-time trades with conditional styling:

```json
{
  "type": "table",
  "className": "w-full border-collapse",
  "children": [
    {
      "type": "thead",
      "children": [
        {
          "type": "tr",
          "className": "border-b border-zinc-800",
          "children": [
            {
              "type": "th",
              "text": "Time",
              "className": "text-left px-1 py-2 text-xs text-zinc-600"
            },
            {
              "type": "th",
              "text": "Side",
              "className": "text-center px-1 py-2 text-xs text-zinc-600"
            },
            {
              "type": "th",
              "text": "Price",
              "className": "text-right px-1 py-2 text-xs text-zinc-600"
            },
            {
              "type": "th",
              "text": "Amount",
              "className": "text-right px-1 py-2 text-xs text-zinc-600"
            }
          ]
        }
      ]
    },
    {
      "type": "tbody",
      "children": [
        {
          "type": "tr",
          "iterate": { "source": "data", "limit": 20 },
          "className": "border-b border-zinc-850",
          "children": [
            {
              "type": "td",
              "text": "{$item.timestamp}",
              "format": { "type": "time" },
              "className": "px-1 py-1.5 text-xs"
            },
            {
              "type": "td",
              "className": "px-1 py-1.5 text-center",
              "children": [
                {
                  "type": "span",
                  "text": "{$item.side}",
                  "className": "px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase",
                  "style": {
                    "backgroundColor": {
                      "condition": {
                        "key": "$item.side",
                        "operator": "===",
                        "value": "buy"
                      },
                      "true": "rgba(0, 200, 83, 0.15)",
                      "false": "rgba(213, 0, 0, 0.15)"
                    },
                    "color": {
                      "condition": {
                        "key": "$item.side",
                        "operator": "===",
                        "value": "buy"
                      },
                      "true": "#00C853",
                      "false": "#D50000"
                    }
                  }
                }
              ]
            },
            {
              "type": "td",
              "text": "${$item.price}",
              "format": { "type": "number", "decimals": 2 },
              "className": "px-1 py-1.5 text-right"
            },
            {
              "type": "td",
              "text": "{$item.amount}",
              "format": { "type": "number", "decimals": 4 },
              "className": "px-1 py-1.5 text-right"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Worker Integration

### Creating a Worker with UI Schema

Complete worker example:

```javascript
const exchangeId = "bybit";
const symbol = "BTCUSDT";
const category = "spot";

function buildTickerData({ lastPrice, bid, ask, change, percentage }) {
  const TICKER_KEY = [
    Stels.config.network,
    "runtime",
    "ticker",
    marketWithSlash(symbol),
    exchangeId,
    category,
  ].filter(Boolean);

  return {
    channel: TICKER_KEY.join("."),
    module: "ticker",
    widget: `widget.${TICKER_KEY.join(".")}`,
    ui: {
      type: "div",
      refreshInterval: 100,
      className: "flex flex-col gap-4 p-4 bg-zinc-950 rounded border",
      children: [
        {
          type: "div",
          text: "${data.last}",
          format: { type: "number", decimals: 2 },
          className: "text-[32px] font-bold",
        },
        {
          type: "div",
          text: "${data.change}",
          format: { type: "number", decimals: 2 },
          style: {
            color: {
              condition: { key: "data.change", operator: ">", value: 0 },
              true: "#00C853",
              false: "#D50000",
            },
          },
        },
      ],
    },
    raw: {
      exchange: exchangeId,
      market: marketWithSlash(symbol),
      data: {
        last: lastPrice,
        bid: bid,
        ask: ask,
        change: change,
        percentage: percentage,
      },
      timestamp: Date.now(),
      latency: 0,
    },
    active: true,
    timestamp: Date.now(),
  };
}

// Write to session storage
async function main() {
  // ... WebSocket connection logic ...

  ws.onmessage = async (ev) => {
    const msg = JSON.parse(ev.data);

    // Process data
    const payload = buildTickerData({
      lastPrice: msg.lastPrice,
      bid: msg.bid,
      ask: msg.ask,
      change: msg.change,
      percentage: msg.percentage,
    });

    // Write to SessionStorage
    await Stels.local.set(payload.channel.split("."), payload);
  };
}
```

### Frontend Usage

The UI Engine automatically renders the schema:

```typescript
import { UIEngineProvider, UIRenderer } from "@/lib/gui/ui";

function App() {
  return (
    <UIEngineProvider>
      {/* Your app content */}
    </UIEngineProvider>
  );
}

// In your component
function TickerWidget({ channel }: { channel: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = sessionStorage.getItem(channel);
      if (stored) {
        setData(JSON.parse(stored));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [channel]);

  if (!data?.ui || !data?.raw) return null;

  return <UIRenderer schema={data.ui} data={data.raw} />;
}
```

---

## Best Practices

### 1. Performance

✅ **Do:**

- Use `refreshInterval` for constantly updating values
- Limit array iterations (use `limit` property)
- Keep schemas simple and focused
- Use schema composition for complex UIs

❌ **Don't:**

- Create deeply nested schemas (max 5 levels)
- Iterate over large arrays without limit
- Use complex math operations in tight loops

### 2. Styling

✅ **Do:**

- Use Tailwind CSS utility classes
- Follow the zinc/amber color palette
- Use standard text sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`
- Apply consistent spacing: `gap-2`, `gap-4`, `p-2`, `p-4`

❌ **Don't:**

- Use inline styles unless dynamic
- Mix custom CSS with Tailwind
- Use shadows (per project standards)

### 3. Data Structure

✅ **Do:**

- Keep data flat when possible
- Use consistent naming conventions
- Include timestamp and latency
- Validate data before rendering

❌ **Don't:**

- Store UI state in data payload
- Include large binary data
- Use circular references

### 4. Error Handling

Always validate data:

```json
{
  "type": "div",
  "condition": {
    "key": "data.last",
    "operator": ">",
    "value": 0
  },
  "text": "${data.last}",
  "format": { "type": "number", "decimals": 2 }
}
```

---

## Testing

### Unit Testing Schemas

```typescript
import { evaluateCondition, formatValue, interpolate } from "@/lib/gui/ui";

describe("UI Schema", () => {
  test("interpolates data correctly", () => {
    const data = { market: "BTC/USDT", price: 65000 };
    const result = interpolate("{market} - ${price}", data);
    expect(result).toBe("BTC/USDT - 65000");
  });

  test("formats numbers", () => {
    const result = formatValue(65432.123, { type: "number", decimals: 2 });
    expect(result).toBe("65432.12");
  });

  test("evaluates conditions", () => {
    const data = { change: 150 };
    const condition = { key: "data.change", operator: ">", value: 0 };
    const result = evaluateCondition(condition, data);
    expect(result).toBe(true);
  });
});
```

### Integration Testing

```typescript
describe("UIRenderer", () => {
  test("renders ticker schema", () => {
    const schema = {
      type: "div",
      text: "${data.last}",
      format: { type: "number", decimals: 2 },
    };

    const data = { data: { last: 65000 } };

    render(<UIRenderer schema={schema} data={data} />);

    expect(screen.getByText("65000.00")).toBeInTheDocument();
  });
});
```

---

## Debugging

### Enable Debug Logging

```typescript
// In browser console
localStorage.setItem("DEBUG_UI_ENGINE", "true");

// UI Engine will log:
// - Schema parsing
// - Data interpolation
// - Condition evaluation
// - Render cycles
```

### Common Issues

#### 1. Data Not Updating

**Problem:** UI doesn't reflect new data

**Solution:**

- Check `refreshInterval` is set
- Verify SessionStorage key matches channel
- Ensure data is being written by worker

#### 2. Interpolation Errors

**Problem:** `NaN` or empty values

**Solution:**

- Check data path exists: `{data.field}` vs `{field}`
- Verify format type matches data type
- Use browser console to inspect data

#### 3. Conditional Rendering Not Working

**Problem:** Elements not showing/hiding

**Solution:**

- Verify condition key path
- Check operator is correct
- Test condition with sample data

---

## API Reference

### Format Types

```typescript
type FormatType = "number" | "volume" | "datetime" | "time";

interface FormatConfig {
  type: FormatType;
  decimals?: number; // For number/volume
}
```

### Condition Operators

```typescript
type Operator = "===" | ">" | "<" | ">=" | "<=";

interface Condition {
  key: string; // Data path
  operator: Operator;
  value: unknown; // Comparison value
}
```

### Iterate Config

```typescript
interface IterateConfig {
  source: string; // Data array path
  limit?: number; // Max items (default: all)
  reverse?: boolean; // Reverse order (default: false)
}
```

### Action Types

```typescript
type ActionType = "openModal" | "closeModal" | "emit";

interface Action {
  type: ActionType;
  payload?: ActionPayload;
}

interface ActionPayload {
  channel?: string;
  modalId?: string;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  backdrop?: "dark" | "light" | "blur";
  closeOnBackdrop?: boolean;
}
```

---

## Advanced Topics

### Schema Resolver

The schema resolver handles composition:

```typescript
import {
  collectRequiredChannels,
  resolveSchemaRefs,
} from "@/lib/gui/schema-resolver";

// Resolve nested schemas
const resolved = await resolveSchemaRefs(schema, store);

// Collect all required channels
const channels = await collectRequiredChannels(schema, store);
```

### Custom Components

Extend with custom React components:

```typescript
// Register custom component
UIEngine.registerComponent("MyChart", ChartComponent);

// Use in schema
{
  "type": "MyChart",
  "props": {
    "data": "{chartData}"
  }
}
```

---

## Resources

### Documentation

- **API Reference**: `API_REFERENCE.md`
- **Worker Guide**: `WORKER_GUIDE.md`
- **Web 5 Standards**: `WEB5_STANDARDS.md`

### Code Examples

- **Ticker Worker**: `src/lib/gui/workers/testnet.runtime.ticker.js`
- **Order Book Worker**: `src/lib/gui/workers/testnet.runtime.book.js`
- **Trades Worker**: `src/lib/gui/workers/testnet.runtime.trades.js`

### Interactive Help

Open Schema Manager in STELS and click the **API Reference** button for live
examples and copy-paste snippets.

---

## Summary

The STELS Reactive UI Engine enables:

✅ **Zero-Code UI**: Define interfaces with JSON schemas\
✅ **Real-Time Updates**: Sub-100ms rendering latency\
✅ **Data-Driven**: Automatic reactivity to data changes\
✅ **Composable**: Reusable schema components\
✅ **Type-Safe**: Structured validation\
✅ **Web 5 Native**: Decentralized and secure

---

## Next Steps

**Start building reactive UIs:**

1. Create a worker that writes to SessionStorage
2. Define a UI schema in JSON
3. Test with live data
4. Compose multiple schemas
5. Add interactivity with events

**Explore more:**

→ **Schema Manager**: Visual schema editor\
→ **Worker Editor**: Code editor for workers\
→ **Canvas**: Drag-and-drop composition\
→ **Examples**: Real-world implementations

---

**Welcome to declarative, reactive UI development. Welcome to STELS.** 🎨
