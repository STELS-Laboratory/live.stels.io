const exchangeId = "bybit";
const category = "spot";
const symbol = "SOLUSDT".toUpperCase();
const endpoint = "wss://stream.bybit.com";
const url = `${endpoint}/v5/public/${category}`;
const topicTrades = `publicTrade.${symbol}`;

const MAX_TRADES = 20;

const marketWithSlash = (s) =>
    s
        .replace(/USDT$/i, "/USDT")
        .replace(/USD$/i, "/USD")
        .replace(/USDC$/i, "/USDC");

function nowMs() {
    return Date.now();
}

function buildTradesData({ tradesArray, ts }) {
    const TRADES_SESSION_KEY = [
        Stels.config.network,
        "runtime",
        "trades",
        marketWithSlash(symbol),
        exchangeId,
        category,
    ].filter(Boolean);

    const Timestamp = typeof ts === "number" ? ts : nowMs();

    return {
        channel: TRADES_SESSION_KEY.join("."),
        module: "trades",
        widget: `widget.${TRADES_SESSION_KEY.join(".")}`,
        ui: {
            type: "div",
            refreshInterval: 100,
            className:
                "flex flex-col gap-0 p-5 bg-zinc-900 rounded border border-zinc-700 font-mono min-w-[600px]",
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
                    type: "table",
                    className: "w-full border-collapse",
                    children: [
                        {
                            type: "thead",
                            children: [
                                {
                                    type: "tr",
                                    className: "border-b border-zinc-800",
                                    children: [
                                        {
                                            type: "th",
                                            text: "Time",
                                            className:
                                                "text-left px-1 py-2 text-xs text-zinc-600 font-medium",
                                        },
                                        {
                                            type: "th",
                                            text: "Side",
                                            className:
                                                "text-center px-1 py-2 text-xs text-zinc-600 font-medium",
                                        },
                                        {
                                            type: "th",
                                            text: "Price",
                                            className:
                                                "text-right px-1 py-2 text-xs text-zinc-600 font-medium",
                                        },
                                        {
                                            type: "th",
                                            text: "Amount",
                                            className:
                                                "text-right px-1 py-2 text-xs text-zinc-600 font-medium",
                                        },
                                        {
                                            type: "th",
                                            text: "Total",
                                            className:
                                                "text-right px-1 py-2 text-xs text-zinc-600 font-medium",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "tbody",
                            children: [
                                {
                                    type: "tr",
                                    iterate: {
                                        source: "data",
                                        limit: 20,
                                    },
                                    className:
                                        "border-b border-zinc-850 transition-colors duration-300",
                                    children: [
                                        {
                                            type: "td",
                                            text: "{$item.timestamp}",
                                            format: {
                                                type: "time",
                                            },
                                            className: "px-1 py-1.5 text-xs text-zinc-500",
                                        },
                                        {
                                            type: "td",
                                            className: "px-1 py-1.5 text-center",
                                            children: [
                                                {
                                                    type: "span",
                                                    text: "{$item.side}",
                                                    className:
                                                        "px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase",
                                                    style: {
                                                        backgroundColor: {
                                                            condition: {
                                                                key: "$item.side",
                                                                operator: "===",
                                                                value: "buy",
                                                            },
                                                            true: "rgba(0, 200, 83, 0.15)",
                                                            false: "rgba(213, 0, 0, 0.15)",
                                                        },
                                                        color: {
                                                            condition: {
                                                                key: "$item.side",
                                                                operator: "===",
                                                                value: "buy",
                                                            },
                                                            true: "#00C853",
                                                            false: "#D50000",
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            type: "td",
                                            text: "${$item.price}",
                                            format: {
                                                type: "number",
                                                decimals: 2,
                                            },
                                            className:
                                                "px-1 py-1.5 text-right text-[13px] font-semibold",
                                            style: {
                                                color: {
                                                    condition: {
                                                        key: "$item.side",
                                                        operator: "===",
                                                        value: "buy",
                                                    },
                                                    true: "#00C853",
                                                    false: "#D50000",
                                                },
                                            },
                                        },
                                        {
                                            type: "td",
                                            text: "{$item.amount}",
                                            format: {
                                                type: "number",
                                                decimals: 4,
                                            },
                                            className:
                                                "px-1 py-1.5 text-right text-[13px] text-zinc-300",
                                        },
                                        {
                                            type: "td",
                                            text: "${$item.cost}",
                                            format: {
                                                type: "number",
                                                decimals: 2,
                                            },
                                            className:
                                                "px-1 py-1.5 text-right text-[13px] text-zinc-500",
                                        },
                                    ],
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
                                    text: "Trades: {data.length}",
                                    className: "text-amber-500",
                                },
                                {
                                    type: "span",
                                    text: "Updated: {timestamp}",
                                    format: {
                                        type: "datetime",
                                    },
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
            data: tradesArray,
            timestamp: Timestamp,
            latency: Math.max(0, nowMs() - Timestamp),
        },
        active: true,
        timestamp: Timestamp,
    };
}

async function main() {
    let ws = null;
    let reconnectAttempt = 0;
    let reconnectTimer = null;
    let tradesHistory = [];

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
                    args: [topicTrades],
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

            // Trades data
            if (
                msg.topic === topicTrades &&
                (msg.type === "snapshot" || msg.type === "delta")
            ) {
                const rawTrades = msg.data || [];

                if (rawTrades.length > 0) {
                    const trades = rawTrades.map((trade) => ({
                        id: trade.i || String(trade.T),
                        timestamp: Number(trade.T),
                        datetime: new Date(Number(trade.T)).toISOString(),
                        symbol: marketWithSlash(symbol),
                        side: trade.S === "Buy" ? "buy" : "sell",
                        price: Number(trade.p),
                        amount: Number(trade.v),
                        cost: Number(trade.p) * Number(trade.v),
                    }));

                    tradesHistory.push(...trades);

                    if (tradesHistory.length > MAX_TRADES) {
                        tradesHistory = tradesHistory.slice(-MAX_TRADES);
                    }

                    const payload = buildTradesData({
                        tradesArray: tradesHistory,
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
