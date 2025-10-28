# Building Your First Agent

**Category:** Developer\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** Developers building autonomous agents

---

## Introduction

In this hands-on tutorial, you'll create your first **autonomous web agent**
using STELS. By the end, you'll have a functioning agent that:

- Monitors real-time market data
- Makes autonomous decisions
- Executes operations across the heterogeneous network
- Reports status and metrics

**Prerequisites:**

- Completed [Developer Onboarding](DEVELOPER_ONBOARDING.md)
- Development environment set up
- Basic understanding of TypeScript and React

**Estimated time:** 45-60 minutes

---

## What is an Agent?

In STELS, an **agent** is an autonomous application that:

1. **Observes**: Monitors data sources (markets, sensors, APIs)
2. **Decides**: Applies logic to determine actions
3. **Acts**: Executes operations via the network
4. **Reports**: Provides status and metrics
5. **Adapts**: Learns from results and adjusts behavior

Agents operate **autonomously** once deployed, requiring minimal human
intervention.

---

## Tutorial: Market Monitor Agent

We'll build a **Market Monitor Agent** that:

- Watches cryptocurrency prices in real-time
- Detects significant price movements
- Alerts when thresholds are crossed
- Records historical data

---

## Step 1: Define the Agent Schema

First, we define what data our agent works with using JSON Schema.

### Create Schema File

Create `/public/schemas/agent.market.monitor.json`:

```json
{
  "$id": "agent.market.monitor",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Market Monitor Agent",
  "description": "Autonomous agent for monitoring cryptocurrency markets",
  "type": "object",
  "properties": {
    "config": {
      "type": "object",
      "properties": {
        "symbol": {
          "type": "string",
          "description": "Trading pair to monitor (e.g., BTC/USD)"
        },
        "interval": {
          "type": "number",
          "description": "Check interval in milliseconds",
          "minimum": 1000
        },
        "thresholds": {
          "type": "object",
          "properties": {
            "priceChangePercent": {
              "type": "number",
              "description": "Alert when price changes by this percent"
            },
            "volumeThreshold": {
              "type": "number",
              "description": "Alert when volume exceeds this value"
            }
          },
          "required": ["priceChangePercent", "volumeThreshold"]
        }
      },
      "required": ["symbol", "interval", "thresholds"]
    },
    "state": {
      "type": "object",
      "properties": {
        "isActive": {
          "type": "boolean",
          "description": "Whether agent is actively monitoring"
        },
        "lastPrice": {
          "type": "number",
          "description": "Last recorded price"
        },
        "lastCheck": {
          "type": "number",
          "description": "Timestamp of last check"
        },
        "alertCount": {
          "type": "number",
          "description": "Number of alerts triggered"
        }
      }
    },
    "history": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "timestamp": {
            "type": "number"
          },
          "price": {
            "type": "number"
          },
          "volume": {
            "type": "number"
          },
          "alert": {
            "type": "boolean"
          }
        }
      }
    }
  },
  "required": ["config", "state", "history"]
}
```

**Key concepts:**

- **config**: Agent configuration (what to monitor)
- **state**: Current operational state
- **history**: Historical data for analysis

---

## Step 2: Create Type Definitions

Generate TypeScript types from the schema:

```typescript
// src/apps/agents/market-monitor/types.ts

/**
 * Market Monitor Agent Configuration
 */
export interface AgentConfig {
  symbol: string;
  interval: number;
  thresholds: {
    priceChangePercent: number;
    volumeThreshold: number;
  };
}

/**
 * Market Monitor Agent State
 */
export interface AgentState {
  isActive: boolean;
  lastPrice: number;
  lastCheck: number;
  alertCount: number;
}

/**
 * Price Data Point
 */
export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  alert: boolean;
}

/**
 * Complete Agent Data
 */
export interface MarketMonitorAgent {
  config: AgentConfig;
  state: AgentState;
  history: PriceDataPoint[];
}

/**
 * Alert Notification
 */
export interface PriceAlert {
  type: "price_change" | "volume_spike";
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}
```

---

## Step 3: Create Agent Store

Use Zustand to manage agent state:

```typescript
// src/apps/agents/market-monitor/store.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  AgentConfig,
  MarketMonitorAgent,
  PriceAlert,
  PriceDataPoint,
} from "./types";

interface MarketMonitorStore extends MarketMonitorAgent {
  // Actions
  updateConfig: (config: Partial<AgentConfig>) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  recordDataPoint: (dataPoint: PriceDataPoint) => void;
  triggerAlert: (alert: PriceAlert) => void;
  clearHistory: () => void;
}

export const useMarketMonitorStore = create<MarketMonitorStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        config: {
          symbol: "BTC/USD",
          interval: 5000, // 5 seconds
          thresholds: {
            priceChangePercent: 2.0, // 2%
            volumeThreshold: 1000000, // $1M
          },
        },
        state: {
          isActive: false,
          lastPrice: 0,
          lastCheck: 0,
          alertCount: 0,
        },
        history: [],

        // Actions
        updateConfig: (config) => {
          set((state) => ({
            config: { ...state.config, ...config },
          }));
        },

        startMonitoring: () => {
          set((state) => ({
            state: {
              ...state.state,
              isActive: true,
            },
          }));
        },

        stopMonitoring: () => {
          set((state) => ({
            state: {
              ...state.state,
              isActive: false,
            },
          }));
        },

        recordDataPoint: (dataPoint) => {
          set((state) => ({
            state: {
              ...state.state,
              lastPrice: dataPoint.price,
              lastCheck: dataPoint.timestamp,
            },
            history: [...state.history, dataPoint].slice(-1000), // Keep last 1000
          }));
        },

        triggerAlert: (alert) => {
          set((state) => ({
            state: {
              ...state.state,
              alertCount: state.state.alertCount + 1,
            },
          }));

          // Log alert
          console.log("[Agent] Alert triggered:", alert);
        },

        clearHistory: () => {
          set({ history: [] });
        },
      }),
      {
        name: "market-monitor-agent",
        partialize: (state) => ({
          config: state.config,
          history: state.history.slice(-100), // Persist last 100
        }),
      },
    ),
    { name: "Market Monitor Agent" },
  ),
);
```

---

## Step 4: Implement Agent Logic

Create the core agent logic:

```typescript
// src/apps/agents/market-monitor/agent.ts
import type { PriceAlert, PriceDataPoint } from "./types";
import { useMarketMonitorStore } from "./store";

/**
 * Market Monitor Agent Logic
 */
export class MarketMonitorAgent {
  private intervalId: number | null = null;

  /**
   * Start the agent
   */
  start(): void {
    const store = useMarketMonitorStore.getState();

    if (store.state.isActive) {
      console.warn("[Agent] Already active");
      return;
    }

    store.startMonitoring();
    console.log("[Agent] Started monitoring", store.config.symbol);

    // Start monitoring loop
    this.intervalId = window.setInterval(() => {
      this.checkMarket();
    }, store.config.interval);

    // Immediate first check
    this.checkMarket();
  }

  /**
   * Stop the agent
   */
  stop(): void {
    const store = useMarketMonitorStore.getState();

    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    store.stopMonitoring();
    console.log("[Agent] Stopped monitoring");
  }

  /**
   * Check market data
   */
  private async checkMarket(): Promise<void> {
    const store = useMarketMonitorStore.getState();

    try {
      // Fetch current market data
      const marketData = await this.fetchMarketData(store.config.symbol);

      // Record data point
      const dataPoint: PriceDataPoint = {
        timestamp: Date.now(),
        price: marketData.price,
        volume: marketData.volume,
        alert: false,
      };

      // Analyze for alerts
      const alert = this.analyzeForAlerts(marketData, store);

      if (alert) {
        dataPoint.alert = true;
        store.triggerAlert(alert);
      }

      // Record in history
      store.recordDataPoint(dataPoint);
    } catch (error) {
      console.error("[Agent] Error checking market:", error);
    }
  }

  /**
   * Fetch market data (simulated for tutorial)
   */
  private async fetchMarketData(symbol: string): Promise<{
    price: number;
    volume: number;
  }> {
    // In production, fetch from real API
    // For now, simulate with random data

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate price fluctuation around $50,000 for BTC
    const basePrice = 50000;
    const fluctuation = (Math.random() - 0.5) * 2000; // ±$1000
    const price = basePrice + fluctuation;

    // Simulate volume
    const volume = Math.random() * 2000000; // 0-2M

    return { price, volume };
  }

  /**
   * Analyze data for alert conditions
   */
  private analyzeForAlerts(
    currentData: { price: number; volume: number },
    store: ReturnType<typeof useMarketMonitorStore.getState>,
  ): PriceAlert | null {
    const { lastPrice } = store.state;
    const { thresholds } = store.config;

    // Skip if no previous price
    if (lastPrice === 0) return null;

    // Calculate price change
    const priceChange = currentData.price - lastPrice;
    const changePercent = (priceChange / lastPrice) * 100;

    // Check price change threshold
    if (Math.abs(changePercent) >= thresholds.priceChangePercent) {
      return {
        type: "price_change",
        symbol: store.config.symbol,
        currentPrice: currentData.price,
        previousPrice: lastPrice,
        changePercent,
        volume: currentData.volume,
        timestamp: Date.now(),
      };
    }

    // Check volume threshold
    if (currentData.volume >= thresholds.volumeThreshold) {
      return {
        type: "volume_spike",
        symbol: store.config.symbol,
        currentPrice: currentData.price,
        previousPrice: lastPrice,
        changePercent,
        volume: currentData.volume,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Get agent status
   */
  getStatus(): {
    isActive: boolean;
    uptime: number;
    checksPerformed: number;
    alertsTriggered: number;
  } {
    const store = useMarketMonitorStore.getState();

    return {
      isActive: store.state.isActive,
      uptime: store.state.isActive ? Date.now() - store.state.lastCheck : 0,
      checksPerformed: store.history.length,
      alertsTriggered: store.state.alertCount,
    };
  }
}

// Singleton instance
export const marketMonitorAgent = new MarketMonitorAgent();
```

---

## Step 5: Create Agent UI

Build the React component to control and visualize the agent:

```typescript
// src/apps/agents/market-monitor/index.tsx
import React, { useEffect } from "react";
import {
  AlertTriangle,
  Play,
  Settings,
  Square,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMarketMonitorStore } from "./store";
import { marketMonitorAgent } from "./agent";

/**
 * Market Monitor Agent Interface
 */
export function MarketMonitorAgentApp(): React.ReactElement {
  const { config, state, history, updateConfig } = useMarketMonitorStore();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isActive) {
        marketMonitorAgent.stop();
      }
    };
  }, [state.isActive]);

  const handleStart = (): void => {
    marketMonitorAgent.start();
  };

  const handleStop = (): void => {
    marketMonitorAgent.stop();
  };

  const recentHistory = history.slice(-20);
  const alertHistory = history.filter((point) => point.alert);

  return (
    <div className="h-full overflow-auto bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Market Monitor Agent</h1>
            <p className="text-muted-foreground">
              Autonomous cryptocurrency price monitoring
            </p>
          </div>
          <Badge variant={state.isActive ? "default" : "secondary"}>
            {state.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Agent Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={handleStart}
                disabled={state.isActive}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Start Agent
              </Button>
              <Button
                onClick={handleStop}
                disabled={!state.isActive}
                variant="destructive"
                className="gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Agent
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Symbol</label>
                <Input
                  value={config.symbol}
                  onChange={(e) => updateConfig({ symbol: e.target.value })}
                  disabled={state.isActive}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Price Change Alert (%)
                </label>
                <Input
                  type="number"
                  value={config.thresholds.priceChangePercent}
                  onChange={(e) =>
                    updateConfig({
                      thresholds: {
                        ...config.thresholds,
                        priceChangePercent: Number(e.target.value),
                      },
                    })}
                  disabled={state.isActive}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Check Interval (ms)
                </label>
                <Input
                  type="number"
                  value={config.interval}
                  onChange={(e) =>
                    updateConfig({ interval: Number(e.target.value) })}
                  disabled={state.isActive}
                  min={1000}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-2xl font-bold">
                    ${state.lastPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Alerts Triggered
                  </p>
                  <p className="text-2xl font-bold">{state.alertCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Data Points</p>
                  <p className="text-2xl font-bold">{history.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Price Data</CardTitle>
          </CardHeader>
          <CardContent>
            {recentHistory.length === 0
              ? (
                <p className="text-center text-muted-foreground py-8">
                  No data yet. Start the agent to begin monitoring.
                </p>
              )
              : (
                <div className="space-y-2">
                  {recentHistory.reverse().map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded border"
                    >
                      <div>
                        <p className="font-mono text-sm">
                          {new Date(point.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-mono font-semibold">
                          ${point.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vol: ${(point.volume / 1000000).toFixed(2)}M
                        </p>
                        {point.alert && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Alert
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Alert History */}
        {alertHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Alert History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertHistory.slice(-10).reverse().map((point, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded border border-red-500/20 bg-red-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm">
                        {new Date(point.timestamp).toLocaleString()}
                      </p>
                      <p className="font-mono font-semibold">
                        ${point.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

## Step 6: Register the Agent

Now integrate your agent into STELS:

**1. Add to allowed routes:**

```typescript
// src/stores/modules/app.store.ts
const allowedRoutes = [
  // ... existing
  "market-monitor-agent",
];
```

**2. Add to navigation:**

```typescript
// src/components/main/layout.tsx
import { Activity } from "lucide-react";

const systemNav: NavItem[] = [
  // ... existing
  { key: "market-monitor-agent", label: "Market Monitor", icon: Activity },
];
```

**3. Configure routing:**

```typescript
// src/App.tsx
const routes = {
  // ... existing
  "market-monitor-agent": () => import("@/apps/agents/market-monitor"),
};
```

---

## Step 7: Test Your Agent

### Start the Agent

1. Run dev server: `npm run dev`
2. Navigate to Market Monitor Agent
3. Click "Start Agent"
4. Watch real-time monitoring begin

### Verify Functionality

**Check that:**

- ✅ Agent starts without errors
- ✅ Price data updates every interval
- ✅ Alerts trigger on threshold crossings
- ✅ History accumulates correctly
- ✅ Agent stops cleanly
- ✅ State persists across page reloads

### Debug Common Issues

**Agent not starting:**

- Check console for errors
- Verify interval is >= 1000ms
- Ensure store is initialized

**No data appearing:**

- Check fetchMarketData implementation
- Verify network connectivity
- Check browser console

**Alerts not triggering:**

- Verify thresholds are reasonable
- Check analyzeForAlerts logic
- Review console logs

---

## Step 8: Enhance Your Agent

Now that you have a working agent, enhance it:

### Add Real Market Data

Replace simulated data with real API:

```typescript
private async fetchMarketData(symbol: string): Promise<{
  price: number;
  volume: number;
}> {
  const response = await fetch(
    `https://api.exchange.com/ticker/${symbol}`
  );
  const data = await response.json();
  
  return {
    price: data.last,
    volume: data.volume
  };
}
```

### Add Notifications

Integrate with toast system:

```typescript
import { useToastStore } from "@/stores/modules/toast.store";

// In alert handler
const toast = useToastStore.getState();
toast.addToast({
  title: "Price Alert!",
  description: `${symbol} changed by ${changePercent.toFixed(2)}%`,
  variant: "destructive",
});
```

### Add Charts

Visualize price history:

```typescript
import { Line } from "react-chartjs-2";

const chartData = {
  labels: history.map((p) => new Date(p.timestamp).toLocaleTimeString()),
  datasets: [{
    label: "Price",
    data: history.map((p) => p.price),
    borderColor: "#f59e0b",
  }],
};

<Line data={chartData} />;
```

### Add Machine Learning

Predict price movements:

```typescript
import * as tf from "@tensorflow/tfjs";

async function predictNextPrice(history: number[]): Promise<number> {
  // Load or train model
  const model = await tf.loadLayersModel("model.json");

  // Prepare input
  const input = tf.tensor2d([history.slice(-20)]);

  // Predict
  const prediction = model.predict(input) as tf.Tensor;
  const value = await prediction.data();

  return value[0];
}
```

---

## Next Steps

### Advanced Topics

- **Multi-Agent Coordination**: Have agents communicate
- **Distributed Execution**: Deploy across heterogen network
- **Complex Strategies**: Implement trading algorithms
- **Risk Management**: Add position sizing and limits
- **Backtesting**: Test strategies on historical data

### Documentation

- 📚 **[API Reference](API_REFERENCE.md)** - Detailed API docs
- ⚡ **[Performance Guide](PERFORMANCE_GUIDE.md)** - Optimize agents
- 🔒 **[Security Best Practices](SECURITY_GUIDE.md)** - Secure operations
- 🌐 **[Network Integration](NETWORK_GUIDE.md)** - Deploy to heterogens

---

## Summary

You've successfully created your first autonomous agent! You learned:

- ✅ How to define agent schemas
- ✅ How to implement agent logic
- ✅ How to manage agent state
- ✅ How to build agent interfaces
- ✅ How to test and debug agents

This is just the beginning. STELS enables you to build sophisticated autonomous
systems that operate at scale across the heterogeneous network.

---

**Congratulations on building your first STELS agent! Keep building and
exploring.**

---

_© 2025 Gliesereum Ukraine. All rights reserved._
