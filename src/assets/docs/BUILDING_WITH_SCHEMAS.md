# Building with Schemas

**Category:** Developer\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** UI Developers, Frontend Engineers

---

## What are Schemas?

**Schemas** in STELS are JSON-based UI definitions that describe how to
visualize data from network channels. They are **not** data validators—they are
blueprints for rendering real-time interfaces.

**Think of schemas as:**

- **HTML in JSON format**: Structure and layout
- **Data binding**: Connect to live channels
- **Composable components**: Build complex UIs from simple parts
- **Reactive**: Update automatically when data changes

---

## Schema Fundamentals

### Basic Schema Structure

```json
{
  "component": "div",
  "props": {
    "className": "p-4 bg-white rounded border"
  },
  "children": [
    {
      "component": "text",
      "data": "Hello, STELS!",
      "props": {
        "className": "text-xl font-bold"
      }
    }
  ]
}
```

**This renders as:**

```html
<div class="p-4 bg-white rounded border">
  <span class="text-xl font-bold">Hello, STELS!</span>
</div>
```

### Schema Node Properties

Every schema node can have:

```typescript
{
  component: string;      // Component type: "div", "text", "button"
  data?: string;          // Data binding or static content
  props?: object;         // Component properties (className, style, etc.)
  children?: SchemaNode[];// Nested children
  schemaRef?: string;     // Reference to another schema (nested)
  selfChannel?: string;   // Channel for nested schema's "self"
}
```

---

## Component Types

### 1. Container: `div`

Basic container element.

```json
{
  "component": "div",
  "props": {
    "className": "flex gap-4"
  },
  "children": [...]
}
```

### 2. Text: `text`

Display text content.

```json
{
  "component": "text",
  "data": "Price: $50,000",
  "props": {
    "className": "text-2xl font-bold"
  }
}
```

### 3. Image: `image`

Display images.

```json
{
  "component": "image",
  "data": "https://example.com/logo.png",
  "props": {
    "className": "w-16 h-16 rounded",
    "alt": "Logo"
  }
}
```

### 4. Button: `button`

Interactive button (Note: actions require worker integration).

```json
{
  "component": "button",
  "data": "Click Me",
  "props": {
    "className": "px-4 py-2 bg-amber-500 text-white rounded"
  }
}
```

---

## Data Binding

The most powerful feature of schemas is **data binding**—connecting UI to live
channel data.

### Syntax

Use curly braces with channel alias and JSON path:

```
{channelAlias.path.to.value}
```

### Example: Display Price

**Channel data:**

```json
// Channel: testnet.runtime.ticker.BTC/USDT
{
  "raw": {
    "last": 50123.45,
    "volume": 1234567,
    "high": 51000,
    "low": 49500
  }
}
```

**Schema with binding:**

```json
{
  "component": "div",
  "props": {
    "className": "p-4 bg-card rounded"
  },
  "children": [
    {
      "component": "text",
      "data": "Price: ${ticker.raw.last}",
      "props": {
        "className": "text-3xl font-bold text-green-500"
      }
    },
    {
      "component": "text",
      "data": "Volume: ${ticker.raw.volume}",
      "props": {
        "className": "text-sm text-muted-foreground"
      }
    }
  ]
}
```

**Result:**

```
Price: $50123.45
Volume: 1234567
```

### Using `self` Alias

The special alias `{self}` refers to the widget's own channel:

```json
{
  "component": "text",
  "data": "{self.raw.last}",
  "props": {
    "className": "text-2xl"
  }
}
```

This is especially useful for universal schemas that work with any channel.

---

## Schema Types

### 1. Static Schemas

**Purpose:** Layout containers and routers (no data binding).

**Characteristics:**

- No channel bindings
- Structure and navigation
- Compose other schemas

**Example: Dashboard Layout**

```json
{
  "component": "div",
  "props": {
    "className": "grid grid-cols-2 gap-4"
  },
  "children": [
    {
      "component": "div",
      "schemaRef": "widget.ticker.BTC",
      "props": {
        "className": "col-span-1"
      }
    },
    {
      "component": "div",
      "schemaRef": "widget.ticker.ETH",
      "props": {
        "className": "col-span-1"
      }
    }
  ]
}
```

### 2. Dynamic Schemas

**Purpose:** Widgets with live data binding.

**Characteristics:**

- Bound to specific channels
- Real-time data updates
- Interactive visualizations

**Example: Price Ticker**

```json
{
  "component": "div",
  "props": {
    "className": "p-6 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl border border-amber-500/20"
  },
  "children": [
    {
      "component": "div",
      "props": {
        "className": "flex items-baseline gap-2 mb-2"
      },
      "children": [
        {
          "component": "text",
          "data": "{self.raw.symbol}",
          "props": {
            "className": "text-sm font-medium text-muted-foreground"
          }
        },
        {
          "component": "text",
          "data": "{self.raw.exchange}",
          "props": {
            "className": "text-xs text-muted-foreground/50"
          }
        }
      ]
    },
    {
      "component": "text",
      "data": "${self.raw.last}",
      "props": {
        "className": "text-4xl font-bold text-foreground mb-1"
      }
    },
    {
      "component": "div",
      "props": {
        "className": "flex items-center gap-2"
      },
      "children": [
        {
          "component": "text",
          "data": "{self.raw.changePercent}%",
          "props": {
            "className": "text-sm font-medium text-green-500"
          }
        },
        {
          "component": "text",
          "data": "24h Vol: {self.raw.volume}",
          "props": {
            "className": "text-xs text-muted-foreground"
          }
        }
      ]
    }
  ]
}
```

---

## Channel Aliases

Aliases provide short names for channels, making schemas cleaner and more
readable.

### Without Aliases

```json
{
  "component": "text",
  "data": "{testnet.runtime.ticker.BTC/USDT.binance.spot.raw.last}"
}
```

### With Aliases

```json
// Schema configuration:
{
  "channelAliases": [
    { 
      "channelKey": "testnet.runtime.ticker.BTC/USDT.binance.spot",
      "alias": "ticker"
    }
  ]
}

// In schema:
{
  "component": "text",
  "data": "{ticker.raw.last}"
}
```

Much cleaner!

---

## Nested Schemas

Schemas can reference other schemas, creating composable UI components.

### Parent Schema (Container)

```json
{
  "widgetKey": "widget.dashboard.trading",
  "type": "static",
  "schema": {
    "component": "div",
    "props": {
      "className": "grid grid-cols-3 gap-4 p-4"
    },
    "children": [
      {
        "component": "div",
        "schemaRef": "widget.ticker.universal",
        "selfChannel": "testnet.runtime.ticker.BTC/USDT.binance.spot",
        "props": {
          "className": "col-span-1"
        }
      },
      {
        "component": "div",
        "schemaRef": "widget.ticker.universal",
        "selfChannel": "testnet.runtime.ticker.ETH/USDT.binance.spot",
        "props": {
          "className": "col-span-1"
        }
      },
      {
        "component": "div",
        "schemaRef": "widget.orderbook.universal",
        "selfChannel": "testnet.runtime.book.BTC/USDT.binance.spot",
        "props": {
          "className": "col-span-1"
        }
      }
    ]
  }
}
```

### Child Schema (Universal Ticker)

```json
{
  "widgetKey": "widget.ticker.universal",
  "type": "dynamic",
  "schema": {
    "component": "div",
    "props": {
      "className": "p-4 bg-card rounded border"
    },
    "children": [
      {
        "component": "text",
        "data": "{self.raw.last}",
        "props": {
          "className": "text-3xl font-bold"
        }
      }
    ]
  }
}
```

**How it works:**

1. Parent schema references child with `schemaRef`
2. Parent provides `selfChannel` for child's data source
3. Child uses `{self}` to access its channel data
4. Result: Reusable ticker component!

---

## Real-World Examples

### Example 1: Crypto Price Card

**Channel:** `testnet.runtime.ticker.SOL/USDT.bybit.spot`\
**Alias:** `ticker`

```json
{
  "widgetKey": "widget.asset.testnet.token",
  "type": "dynamic",
  "channelAliases": [
    {
      "channelKey": "testnet.runtime.ticker.SOL/USDT.bybit.spot",
      "alias": "ticker"
    }
  ],
  "schema": {
    "component": "div",
    "props": {
      "className": "relative p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all"
    },
    "children": [
      {
        "component": "div",
        "props": {
          "className": "flex items-start justify-between mb-4"
        },
        "children": [
          {
            "component": "div",
            "children": [
              {
                "component": "text",
                "data": "SOL",
                "props": {
                  "className": "text-2xl font-bold text-foreground"
                }
              },
              {
                "component": "text",
                "data": "Solana",
                "props": {
                  "className": "text-sm text-muted-foreground"
                }
              }
            ]
          },
          {
            "component": "image",
            "data": "https://cryptologos.cc/logos/solana-sol-logo.png",
            "props": {
              "className": "w-12 h-12 rounded-full"
            }
          }
        ]
      },
      {
        "component": "div",
        "props": {
          "className": "mb-4"
        },
        "children": [
          {
            "component": "text",
            "data": "${ticker.raw.last}",
            "props": {
              "className": "text-4xl font-bold text-foreground"
            }
          },
          {
            "component": "text",
            "data": "{ticker.raw.changePercent}%",
            "props": {
              "className": "text-lg font-medium text-green-500 ml-2"
            }
          }
        ]
      },
      {
        "component": "div",
        "props": {
          "className": "grid grid-cols-2 gap-4 text-sm"
        },
        "children": [
          {
            "component": "div",
            "children": [
              {
                "component": "text",
                "data": "24h High",
                "props": {
                  "className": "text-muted-foreground"
                }
              },
              {
                "component": "text",
                "data": "${ticker.raw.high}",
                "props": {
                  "className": "font-medium text-foreground"
                }
              }
            ]
          },
          {
            "component": "div",
            "children": [
              {
                "component": "text",
                "data": "24h Low",
                "props": {
                  "className": "text-muted-foreground"
                }
              },
              {
                "component": "text",
                "data": "${ticker.raw.low}",
                "props": {
                  "className": "font-medium text-foreground"
                }
              }
            ]
          },
          {
            "component": "div",
            "children": [
              {
                "component": "text",
                "data": "Volume",
                "props": {
                  "className": "text-muted-foreground"
                }
              },
              {
                "component": "text",
                "data": "{ticker.raw.volume}",
                "props": {
                  "className": "font-medium text-foreground"
                }
              }
            ]
          },
          {
            "component": "div",
            "children": [
              {
                "component": "text",
                "data": "Exchange",
                "props": {
                  "className": "text-muted-foreground"
                }
              },
              {
                "component": "text",
                "data": "{ticker.raw.exchange}",
                "props": {
                  "className": "font-medium text-foreground uppercase"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Example 2: Network Monitor

**Purpose:** Display heterogen health status.

```json
{
  "widgetKey": "widget.app.sonar",
  "type": "static",
  "channelKeys": ["testnet.runtime.sonar"],
  "schema": {
    "component": "div",
    "props": {
      "className": "p-6 bg-card rounded-xl border"
    },
    "children": [
      {
        "component": "div",
        "props": {
          "className": "flex items-center gap-3 mb-6"
        },
        "children": [
          {
            "component": "text",
            "data": "🌐",
            "props": {
              "className": "text-4xl"
            }
          },
          {
            "component": "div",
            "children": [
              {
                "component": "text",
                "data": "Network Status",
                "props": {
                  "className": "text-2xl font-bold"
                }
              },
              {
                "component": "text",
                "data": "Global Heterogen Health",
                "props": {
                  "className": "text-sm text-muted-foreground"
                }
              }
            ]
          }
        ]
      },
      {
        "component": "div",
        "props": {
          "className": "grid grid-cols-3 gap-4"
        },
        "children": [
          {
            "component": "div",
            "props": {
              "className": "text-center p-4 bg-green-500/10 rounded-lg"
            },
            "children": [
              {
                "component": "text",
                "data": "{sonar.raw.activeNodes}",
                "props": {
                  "className": "text-3xl font-bold text-green-500"
                }
              },
              {
                "component": "text",
                "data": "Active Nodes",
                "props": {
                  "className": "text-sm text-muted-foreground"
                }
              }
            ]
          },
          {
            "component": "div",
            "props": {
              "className": "text-center p-4 bg-amber-500/10 rounded-lg"
            },
            "children": [
              {
                "component": "text",
                "data": "{sonar.raw.totalWorkers}",
                "props": {
                  "className": "text-3xl font-bold text-amber-500"
                }
              },
              {
                "component": "text",
                "data": "Workers Running",
                "props": {
                  "className": "text-sm text-muted-foreground"
                }
              }
            ]
          },
          {
            "component": "div",
            "props": {
              "className": "text-center p-4 bg-blue-500/10 rounded-lg"
            },
            "children": [
              {
                "component": "text",
                "data": "{sonar.raw.avgLatency}ms",
                "props": {
                  "className": "text-3xl font-bold text-blue-500"
                }
              },
              {
                "component": "text",
                "data": "Avg Latency",
                "props": {
                  "className": "text-sm text-muted-foreground"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Creating Schemas in STELS

### Step 1: Open Schemas App

Press `Cmd+Shift+S` or click Schemas in navigation.

### Step 2: Create New Schema

Click **"Create New Schema"** button.

### Step 3: Configure Schema

```typescript
{
  name: "My Price Widget",
  widgetKey: "widget.price.custom",
  type: "dynamic",                    // or "static"
  channelKeys: [                      // Data sources
    "testnet.runtime.ticker.BTC/USDT"
  ],
  channelAliases: [                   // Short names
    {
      channelKey: "testnet.runtime.ticker.BTC/USDT",
      alias: "ticker"
    }
  ]
}
```

### Step 4: Design Schema

Use the JSON editor to define your UI structure.

### Step 5: Test in Canvas

1. Open Canvas (`Cmd+Shift+C`)
2. Add new widget
3. Search for your schema by widget key
4. Drag to canvas to test

### Step 6: Iterate

Edit schema → Save → Refresh canvas → Repeat until perfect!

---

## Best Practices

### 1. Use Tailwind Classes

```json
{
  "props": {
    "className": "p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow"
  }
}
```

**Common patterns:**

- Spacing: `p-4`, `m-2`, `gap-4`
- Layout: `flex`, `grid`, `grid-cols-3`
- Colors: `bg-card`, `text-foreground`, `border-border`
- Typography: `text-2xl`, `font-bold`, `leading-relaxed`

### 2. Responsive Design

```json
{
  "props": {
    "className": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  }
}
```

### 3. Conditional Styling

While schemas don't support complex logic, you can create multiple variants:

```json
// Positive change (separate schema)
{
  "component": "text",
  "data": "{ticker.raw.changePercent}%",
  "props": {
    "className": "text-green-500"
  }
}

// Negative change (separate schema)
{
  "component": "text",
  "data": "{ticker.raw.changePercent}%",
  "props": {
    "className": "text-red-500"
  }
}
```

### 4. Reusable Components

Create universal schemas that work with any channel:

```json
{
  "widgetKey": "widget.price.universal",
  "type": "dynamic",
  "schema": {
    "component": "div",
    "props": {
      "className": "p-4 bg-card rounded"
    },
    "children": [
      {
        "component": "text",
        "data": "{self.raw.symbol}",
        "props": {
          "className": "text-sm text-muted-foreground"
        }
      },
      {
        "component": "text",
        "data": "${self.raw.last}",
        "props": {
          "className": "text-3xl font-bold"
        }
      }
    ]
  }
}
```

Use it anywhere:

```json
{
  "schemaRef": "widget.price.universal",
  "selfChannel": "testnet.runtime.ticker.BTC/USDT"
}
```

### 5. Performance

- Keep schemas simple (avoid deep nesting)
- Use channel aliases to reduce path length
- Minimize number of nested schemas
- Use static schemas for layout, dynamic for data

---

## Data Binding Reference

### Syntax

```
{alias.path.to.value}
```

### Examples

```json
// Simple value
"{ticker.raw.last}"

// Nested object
"{ticker.raw.data.metrics.volume}"

// With prefix
"Price: ${ticker.raw.last}"

// Multiple values
"BTC/USDT: ${ticker.raw.last} (Vol: {ticker.raw.volume})"
```

### Special Alias: `self`

```json
// Always refers to widget's own channel
"{self.raw.last}"
"{self.raw.data.anything}"
```

---

## Channel Data Structure

Understanding the data structure helps with binding:

```typescript
{
  module: string;        // "connector", "trading", etc.
  channel: string;       // Full channel path
  widget: string;        // Widget type
  raw: {                 // Your actual data
    // ... varies by widget type
  },
  timestamp: number      // Update time
}
```

**Access patterns:**

- `{alias.raw.field}` - Most common
- `{alias.module}` - Module name
- `{alias.widget}` - Widget type
- `{alias.timestamp}` - Last update time

---

## Troubleshooting

### Schema Not Rendering

**Symptoms:** Widget shows nothing or error

**Solutions:**

- Check JSON syntax (use validator)
- Verify channel keys exist
- Confirm data binding paths are correct
- Check browser console for errors

### Data Not Showing

**Symptoms:** Static text shows, but bindings are empty

**Solutions:**

- Verify channel is publishing data
- Check alias names match configuration
- Confirm channel path is correct
- Test with `{self.raw}` to see all available data

### Styling Not Applied

**Symptoms:** Widget renders but looks wrong

**Solutions:**

- Check Tailwind class names (no typos)
- Use `className` not `class`
- Verify responsive classes work at your screen size
- Check for conflicting styles

---

## Advanced: Schema References

### Circular References

**Avoid circular schema references:**

```json
// ❌ BAD: Schema A references B, B references A
{
  "widgetKey": "schemaA",
  "schemaRef": "schemaB" // which refs back to schemaA
}
```

### Depth Limits

STELS limits nested schema depth to **10 levels** to prevent infinite recursion.

### Dynamic Nesting

You can nest schemas programmatically:

```json
{
  "component": "div",
  "children": [
    {
      "schemaRef": "widget.ticker.universal",
      "selfChannel": "testnet.runtime.ticker.BTC/USDT"
    },
    {
      "schemaRef": "widget.ticker.universal",
      "selfChannel": "testnet.runtime.ticker.ETH/USDT"
    }
    // Add more as needed
  ]
}
```

---

## Next Steps

- 🤖 **[Creating AMI Workers](CREATING_AMI_WORKERS.md)** - Generate data for
  your schemas
- 🌐 **[Network Deployment](NETWORK_DEPLOYMENT.md)** - Deploy schemas and
  workers
- 📚 **[API Reference](API_REFERENCE.md)** - Complete technical reference
- 🎨 **Canvas App** - Visual schema testing and composition

---

_© 2025 Gliesereum Ukraine. All rights reserved._
