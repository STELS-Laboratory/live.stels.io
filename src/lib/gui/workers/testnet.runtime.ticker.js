const exchangeId = "bybit";
const category = "spot";
const symbol = "SOLUSDT".toUpperCase();
const depth = "200";
const endpoint = "wss://stream.bybit.com";
const url = `${endpoint}/v5/public/${category}`;
const topicOrderbook = `orderbook.${depth}.${symbol}`;
const topicTicker = `tickers.${symbol}`;

const marketWithSlash = (s) =>
  s
    .replace(/USDT$/i, "/USDT")
    .replace(/USD$/i, "/USD")
    .replace(/USDC$/i, "/USDC");

function nowMs() {
  return Date.now();
}

function makeOrderBook(limit) {
  let bids = new Map();
  let asks = new Map();

  function reset() {
    bids.clear();
    asks.clear();
  }

  function set(side, price, size) {
    const book = side === "b" ? bids : asks;
    if (size === 0) book.delete(price);
    else book.set(price, size);
  }

  function snapshot(bArr, aArr) {
    reset();
    for (const [p, s] of bArr) set("b", Number(p), Number(s));
    for (const [p, s] of aArr) set("a", Number(p), Number(s));
    trim();
  }

  function delta(bArr, aArr) {
    for (const [p, s] of bArr) set("b", Number(p), Number(s));
    for (const [p, s] of aArr) set("a", Number(p), Number(s));
    trim();
  }

  function trim() {
    const sb = [...bids.entries()].sort((a, b) => b[0] - a[0]).slice(0, limit);
    const sa = [...asks.entries()].sort((a, b) => a[0] - b[0]).slice(0, limit);
    bids = new Map(sb);
    asks = new Map(sa);
  }

  function tops(n) {
    const b = [...bids.entries()].sort((a, b) => b[0] - a[0]).slice(0, n).map(
      ([p, s]) => [p, s],
    );
    const a = [...asks.entries()].sort((a, b) => a[0] - b[0]).slice(0, n).map(
      ([p, s]) => [p, s],
    );
    return { bids: b, asks: a };
  }

  return { snapshot, delta, tops };
}

function buildTickerData({ orderBook, lastPrice, tickerInfo, ts }) {
  const TICKER_SESSION_KEY = [
    Stels.config.network,
    "runtime",
    "ticker",
    marketWithSlash(symbol),
    exchangeId,
    category,
  ].filter(Boolean);

  const Timestamp = typeof ts === "number" ? ts : nowMs();

  const { bids, asks } = orderBook.tops(1);
  const bid = bids.length > 0 ? bids[0][0] : null;
  const ask = asks.length > 0 ? asks[0][0] : null;

  let change = null;
  let percentage = null;
  if (tickerInfo) {
    const last = tickerInfo.lastPrice
      ? Number(tickerInfo.lastPrice)
      : lastPrice;
    const prev = tickerInfo.prevPrice24h
      ? Number(tickerInfo.prevPrice24h)
      : null;

    if (last && prev) {
      change = last - prev;
      percentage = (change / prev) * 100;
    } else if (tickerInfo.price24hPcnt) {
      percentage = Number(tickerInfo.price24hPcnt) * 100;
    }
  }

  return {
    channel: TICKER_SESSION_KEY.join("."),
    module: "ticker",
    widget: `widget.${TICKER_SESSION_KEY.join(".")}`,
    ui: {
      type: "div",
      refreshInterval: 100,
      className:
        "flex flex-col gap-4 p-4 bg-zinc-950 rounded border font-mono",
      children: [
        {
          type: "div",
          className:
            "flex justify-between items-center pb-3 border-b",
          children: [
            {
              type: "div",
              className: "flex items-center gap-2",
              children: [
                {
                  type: "span",
                  text: "{market}",
                  className: "text-lg font-bold text-white",
                },
                {
                  type: "span",
                  text: " • {exchange}",
                  className: "text-sm text-zinc-500",
                },
              ],
            },
            {
              type: "span",
              text: "●",
              condition: {
                key: "active",
                operator: "===",
                value: true,
              },
              className: "text-xs text-green-500",
            },
          ],
        },
        {
          type: "div",
          className:
            "flex flex-col gap-2 py-4 cursor-pointer hover:bg-zinc-800/50 rounded-lg transition-colors",
          events: {
            onClick: {
              type: "openModal",
              payload: {
                channel: [
                  Stels.config.network,
                  "runtime",
                  "book",
                  marketWithSlash(symbol),
                  exchangeId,
                  category,
                ]
                  .filter(Boolean)
                  .join("."),
                modalId: `orderbook-${marketWithSlash(symbol)}-${exchangeId}`,
                width: "500px",
                height: "auto",
                maxHeight: "80vh",
                backdrop: "dark",
                closeOnBackdrop: true,
              },
            },
          },
          children: [
            {
              type: "div",
              className: "flex items-baseline gap-3",
              children: [
                {
                  type: "span",
                  text: "${data.last}",
                  format: {
                    type: "number",
                    decimals: 2,
                  },
                  className: "text-[32px] font-bold text-white",
                },
                {
                  type: "span",
                  text: "${data.change}",
                  format: {
                    type: "number",
                    decimals: 2,
                  },
                  className: "text-base font-semibold",
                  style: {
                    color: {
                      condition: {
                        key: "data.change",
                        operator: ">",
                        value: 0,
                      },
                      true: "#00C853",
                      false: "#D50000",
                    },
                  },
                },
                {
                  type: "span",
                  text: "({data.percentage}%)",
                  format: {
                    type: "number",
                    decimals: 2,
                  },
                  className: "text-base",
                  style: {
                    color: {
                      condition: {
                        key: "data.percentage",
                        operator: ">",
                        value: 0,
                      },
                      true: "#00C853",
                      false: "#D50000",
                    },
                  },
                },
              ],
            },
            {
              type: "div",
              className: "flex items-center gap-2 mt-1",
              children: [
                {
                  type: "span",
                  text: "📊 Click to view Order Book",
                  className:
                    "text-xs text-zinc-500 hover:text-amber-500 transition-colors",
                },
              ],
            },
          ],
        },
        {
          type: "div",
          className: "grid grid-cols-2 gap-3",
          children: [
            {
              type: "div",
              className:
                "flex flex-col gap-1 p-3 bg-green-500/5 rounded border border-green-500/20",
              children: [
                {
                  type: "span",
                  text: "Bid",
                  className: "text-xs text-zinc-500",
                },
                {
                  type: "span",
                  text: "${data.bid}",
                  format: {
                    type: "number",
                    decimals: 2,
                  },
                  className: "text-lg font-semibold text-green-500",
                },
              ],
            },
            {
              type: "div",
              className:
                "flex flex-col gap-1 p-3 bg-red-500/5 rounded border border-red-500/20",
              children: [
                {
                  type: "span",
                  text: "Ask",
                  className: "text-xs text-zinc-500",
                },
                {
                  type: "span",
                  text: "${data.ask}",
                  format: {
                    type: "number",
                    decimals: 2,
                  },
                  className: "text-lg font-semibold text-red-600",
                },
              ],
            },
          ],
        },
        {
          type: "div",
          className: "grid grid-cols-2 gap-3",
          children: [
            {
              type: "div",
              className: "flex flex-col gap-1",
              children: [
                {
                  type: "span",
                  text: "Volume (Base)",
                  className: "text-xs text-zinc-500",
                },
                {
                  type: "span",
                  text: "{data.baseVolume}",
                  format: {
                    type: "volume",
                    decimals: 2,
                  },
                  className: "text-sm text-white",
                },
              ],
            },
            {
              type: "div",
              className: "flex flex-col gap-1",
              children: [
                {
                  type: "span",
                  text: "Volume (Quote)",
                  className: "text-xs text-zinc-500",
                },
                {
                  type: "span",
                  text: "$${data.quoteVolume}",
                  format: {
                    type: "volume",
                    decimals: 2,
                  },
                  className: "text-sm text-white",
                },
              ],
            },
          ],
        },
        {
          type: "div",
          className:
            "flex justify-between pt-3 border-t border-zinc-700 text-xs text-zinc-600",
          children: [
            {
              type: "span",
              text: "Updated: {timestamp}",
              format: {
                type: "datetime",
              },
            },
            {
              type: "span",
              text: "Latency: {latency}ms",
              format: {
                type: "number",
                decimals: 0,
              },
            },
          ],
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
        baseVolume: tickerInfo?.volume24h ? Number(tickerInfo.volume24h) : null,
        quoteVolume: tickerInfo?.turnover24h
          ? Number(tickerInfo.turnover24h)
          : null,
      },
      timestamp: Timestamp,
      latency: Math.max(0, nowMs() - Timestamp),
    },
    active: true,
    timestamp: Timestamp,
  };
}

async function main() {
  const book = makeOrderBook(Number(depth));
  let ws = null;
  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let lastPrice = null;
  let tickerInfo = null;

  let isShuttingDown = false;

  function shouldStop() {
    return isShuttingDown || (signal && signal.aborted);
  }

  function cleanup() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (ws) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (
          ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING
        ) {
          ws.close();
        }
      } catch (e) {
        logger.warn("[WS] Error during close:", e.message);
      }
      ws = null;
    }

    logger.info("[WS] cleanup completed");
  }

  function scheduleReconnect() {
    if (shouldStop()) {
      logger.info("[WS] worker stopped, skipping reconnect");
      return;
    }

    const backoff = Math.min(
      10000,
      1000 * Math.pow(2, Math.max(0, reconnectAttempt - 1)),
    );
    logger.info(`[WS] reconnect in ${Math.round(backoff / 1000)}s ...`);
    reconnectTimer = setTimeout(() => {
      if (!shouldStop()) {
        connect();
      }
    }, backoff);
  }

  function connect() {
    if (shouldStop()) {
      logger.info("[WS] worker stopped, aborting connect");
      return;
    }

    reconnectAttempt++;
    logger.info(`[WS] connecting to ${url} ...`);
    ws = new WebSocket(url);

    ws.onopen = () => {
      if (shouldStop()) {
        logger.info("[WS] worker stopped during open, closing connection");
        ws.close();
        return;
      }

      reconnectAttempt = 0;
      logger.info("[WS] open");

      ws.send(
        JSON.stringify({
          req_id: `sub_${Date.now()}`,
          op: "subscribe",
          args: [topicOrderbook, topicTicker],
        }),
      );
    };

    ws.onmessage = async (ev) => {
      if (shouldStop()) {
        return;
      }

      if (!ev.data || ev.data === "") {
        logger.warn("[WS] Received empty message");
        return;
      }

      let msg;
      const rawData = String(ev.data);
      try {
        msg = JSON.parse(rawData);
      } catch (e) {
        logger.warn(
          "[WS] JSON parse error:",
          e.message,
          "Data:",
          rawData.substring(0, 100),
        );
        return;
      }

      if (typeof msg !== "object" || msg === null) {
        return;
      }

      // Handle ping/pong
      if (msg.op === "ping") {
        if (!shouldStop() && ws && ws.readyState === WebSocket.OPEN) {
          try {
            const pongMsg = { op: "pong" };
            if (msg.req_id) {
              pongMsg.req_id = msg.req_id;
            }
            ws.send(JSON.stringify(pongMsg));
          } catch (e) {
            logger.warn("[WS] Failed to send pong:", e.message);
          }
        }
        return;
      }

      if (
        msg.op === "pong" ||
        (msg.success === true && msg.ret_msg === "pong")
      ) {
        return;
      }

      if (msg.success === true && msg.op === "subscribe") {
        logger.info(`[WS] Subscribed successfully, conn_id: ${msg.conn_id}`);
        return;
      }

      if (msg.event === "subscribed") {
        logger.info("[WS] Subscription confirmed");
        return;
      }

      if (msg.event === "error" || msg.code) {
        logger.warn("[WS] server error:", msg);
        return;
      }

      if (msg.success === false) {
        logger.error("[WS] Operation failed:", msg);
        return;
      }

      const serverTs =
        typeof msg.ts === "number"
          ? msg.ts
          : typeof msg.TS === "number"
            ? msg.TS
            : undefined;

      // Orderbook snapshot (для bid/ask)
      if (msg.topic === topicOrderbook && msg.type === "snapshot") {
        const bids =
          msg.data && (msg.data.b || msg.data.bids || msg.data.bid || []);
        const asks =
          msg.data && (msg.data.a || msg.data.asks || msg.data.ask || []);
        book.snapshot(bids || [], asks || []);

        if (lastPrice) {
          const payload = buildTickerData({
            orderBook: book,
            lastPrice,
            tickerInfo,
            ts: serverTs,
          });
          await Stels.local.set(payload.channel.split("."), payload);
        }
        return;
      }

      // Orderbook delta (для bid/ask)
      if (
        msg.topic === topicOrderbook &&
        (msg.type === "delta" || msg.type === "update" || (!msg.type && msg.data))
      ) {
        const bids = msg.data && (msg.data.b || msg.data.bids || []);
        const asks = msg.data && (msg.data.a || msg.data.asks || []);
        if ((bids && bids.length) || (asks && asks.length)) {
          book.delta(bids || [], asks || []);

          if (lastPrice) {
            const payload = buildTickerData({
              orderBook: book,
              lastPrice,
              tickerInfo,
              ts: serverTs,
            });
            await Stels.local.set(payload.channel.split("."), payload);
          }
        }
        return;
      }

      // Ticker data
      if (
        msg.topic === topicTicker &&
        (msg.type === "snapshot" || msg.type === "delta")
      ) {
        tickerInfo = msg.data;

        // Используем lastPrice из ticker если есть
        if (tickerInfo?.lastPrice) {
          lastPrice = Number(tickerInfo.lastPrice);
        }

        if (book && lastPrice) {
          const payload = buildTickerData({
            orderBook: book,
            lastPrice,
            tickerInfo,
            ts: serverTs,
          });
          await Stels.local.set(payload.channel.split("."), payload);
        }
        return;
      }
    };

    ws.onerror = (ev) => {
      logger.warn("[WS] error:", ev);
    };

    ws.onclose = () => {
      logger.warn("[WS] closed");
      if (!shouldStop()) {
        scheduleReconnect();
      } else {
        logger.info("[WS] worker stopped, not reconnecting");
      }
    };
  }

  if (signal) {
    signal.addEventListener(
      "abort",
      () => {
        logger.info("[WS] abort signal received, shutting down...");
        isShuttingDown = true;
        cleanup();
      },
      { once: true },
    );
  }

  await connect();

  while (!shouldStop()) {
    await Stels.sleep(1000);
  }

  logger.info("[WS] worker shutting down gracefully");
  isShuttingDown = true;
  cleanup();
}

main().catch((e) => {
  logger.error("Fatal error:", e);
});

