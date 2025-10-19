const exchangeId = "bybit";
const category = "spot";
const symbol = "BTCUSDT".toUpperCase();
const depth = "200";
const endpoint = "wss://stream.bybit.com";
const url = `${endpoint}/v5/public/${category}`;
const topicOrderbook = `orderbook.${depth}.${symbol}`;

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

  function arrays() {
    const b = [...bids.entries()].sort((a, b) => b[0] - a[0]).map(([p, s]) => [
      p,
      s,
    ]);
    const a = [...asks.entries()].sort((a, b) => a[0] - b[0]).map(([p, s]) => [
      p,
      s,
    ]);
    return { bids: b, asks: a };
  }

  return { snapshot, delta, arrays };
}

function buildBookData({ orderBook, ts }) {
  const BOOK_SESSION_KEY = [
    Stels.config.network,
    "runtime",
    "book",
    marketWithSlash(symbol),
    exchangeId,
    category,
  ].filter(Boolean);

  const { bids, asks } = orderBook.arrays();
  const sumBids = bids.reduce((acc, [, size]) => acc + Number(size || 0), 0);
  const sumAsks = asks.reduce((acc, [, size]) => acc + Number(size || 0), 0);

  const Timestamp = typeof ts === "number" ? ts : nowMs();

  return {
    channel: BOOK_SESSION_KEY.join("."),
    module: "book",
    widget: `widget.${BOOK_SESSION_KEY.join(".")}`,
    ui: {
      type: "div",
      refreshInterval: 100,
      className:
        "flex flex-col gap-0 p-5 bg-zinc-900 rounded-lg border border-zinc-700 font-mono min-w-[400px]",
      children: [
        {
          type: "div",
          className:
            "flex justify-between items-center pb-3 border-b border-zinc-700 mb-3",
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
            "grid grid-cols-3 gap-2 py-2 text-xs text-zinc-600 border-b border-zinc-800",
          children: [
            {
              type: "span",
              text: "Price",
              className: "text-right",
            },
            {
              type: "span",
              text: "Amount",
              className: "text-right",
            },
            {
              type: "span",
              text: "Total",
              className: "text-right",
            },
          ],
        },
        {
          type: "div",
          iterate: {
            source: "data.asks",
            limit: 10,
            reverse: true,
          },
          className: "flex relative py-1",
          children: [
            {
              type: "div",
              className: "absolute top-0 right-0 bottom-0 bg-red-500/8",
              style: {
                width: {
                  calculate: "percentage",
                  value: "{$item[1]}",
                  max: "{data.volume[1]}",
                },
              },
            },
            {
              type: "div",
              className: "grid grid-cols-3 gap-2 relative z-10 w-full",
              children: [
                {
                  type: "span",
                  text: "${$item[0]}",
                  format: {
                    type: "number",
                    decimals: 2,
                  },
                  className: "text-right text-red-600 text-[13px]",
                },
                {
                  type: "span",
                  text: "{$item[1]}",
                  format: {
                    type: "number",
                    decimals: 4,
                  },
                  className: "text-right text-zinc-300 text-[13px]",
                },
                {
                  type: "span",
                  text: "{$item[0] * $item[1]}",
                  format: {
                    type: "number",
                    decimals: 2,
                  },
                  className: "text-right text-zinc-500 text-[13px]",
                },
              ],
            },
          ],
        },
        {
          type: "div",
          className:
            "py-3 text-center text-base font-semibold text-amber-500 border-t border-b border-zinc-800 bg-zinc-850",
          children: [
            {
              type: "span",
              text: "Spread: ${data.asks[0][0] - data.bids[0][0]}",
              format: {
                type: "number",
                decimals: 2,
              },
            },
          ],
        },
        {
          type: "div",
          iterate: {
            source: "data.bids",
            limit: 10,
          },
          className: "flex relative py-1",
          children: [
            {
              type: "div",
              className: "absolute top-0 right-0 bottom-0 bg-green-500/8",
              style: {
                width: {
                  calculate: "percentage",
                  value: "{$item[1]}",
                  max: "{data.volume[0]}",
                },
              },
            },
            {
              type: "div",
              className: "grid grid-cols-3 gap-2 relative z-10 w-full",
              children: [
                {
                  type: "span",
                  text: "${$item[0]}",
                  format: {
                    type: "number",
                    decimals: 2,
                  },
                  className: "text-right text-green-500 text-[13px]",
                },
                {
                  type: "span",
                  text: "{$item[1]}",
                  format: {
                    type: "number",
                    decimals: 4,
                  },
                  className: "text-right text-zinc-300 text-[13px]",
                },
                {
                  type: "span",
                  text: "{$item[0] * $item[1]}",
                  format: {
                    type: "number",
                    decimals: 2,
                  },
                  className: "text-right text-zinc-500 text-[13px]",
                },
              ],
            },
          ],
        },
        {
          type: "div",
          className:
            "flex justify-between pt-3 border-t border-zinc-700 text-xs text-zinc-600 mt-2",
          children: [
            {
              type: "div",
              className: "flex gap-4",
              children: [
                {
                  type: "span",
                  text: "Bid Vol: {data.volume[0]}",
                  format: {
                    type: "volume",
                    decimals: 2,
                  },
                  className: "text-green-500",
                },
                {
                  type: "span",
                  text: "Ask Vol: {data.volume[1]}",
                  format: {
                    type: "volume",
                    decimals: 2,
                  },
                  className: "text-red-600",
                },
              ],
            },
            {
              type: "span",
              text: "{latency}ms",
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
        bids: bids.slice(0, 200),
        asks: asks.slice(0, 200),
        volume: [sumBids, sumAsks],
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
          args: [topicOrderbook],
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

      const serverTs = typeof msg.ts === "number"
        ? msg.ts
        : typeof msg.TS === "number"
          ? msg.TS
          : undefined;

      // Orderbook snapshot
      if (msg.topic === topicOrderbook && msg.type === "snapshot") {
        const bids = msg.data &&
          (msg.data.b || msg.data.bids || msg.data.bid || []);
        const asks = msg.data &&
          (msg.data.a || msg.data.asks || msg.data.ask || []);
        book.snapshot(bids || [], asks || []);
        const payload = buildBookData({ orderBook: book, ts: serverTs });

        await Stels.local.set(payload.channel.split("."), payload);
        return;
      }

      // Orderbook delta
      if (
        msg.topic === topicOrderbook &&
        (msg.type === "delta" || msg.type === "update" ||
          (!msg.type && msg.data))
      ) {
        const bids = msg.data && (msg.data.b || msg.data.bids || []);
        const asks = msg.data && (msg.data.a || msg.data.asks || []);
        if ((bids && bids.length) || (asks && asks.length)) {
          book.delta(bids || [], asks || []);
          const payload = buildBookData({ orderBook: book, ts: serverTs });

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
