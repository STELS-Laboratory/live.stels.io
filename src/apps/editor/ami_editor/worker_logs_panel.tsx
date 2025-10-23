/**
 * Worker Logs Panel Component
 * Real-time log streaming with SSE support
 */

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Download,
  Pause,
  Play,
  RefreshCw,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useAuthStore } from "@/stores/modules/auth.store.ts";

interface WorkerLogsPanelProps {
  workerId: string;
  onClose?: () => void;
}

/**
 * Worker Logs Panel Component
 */
export function WorkerLogsPanel({
  workerId,
  onClose,
}: WorkerLogsPanelProps): React.ReactElement {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [following, setFollowing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { connectionSession } = useAuthStore();

  // Connect to log stream using fetch + ReadableStream (supports headers for auth)
  const connect = async (follow: boolean): Promise<void> => {
    if (!connectionSession) {
      setError("No active connection");
      return;
    }

    // Close existing connection
    disconnect();

    try {
      const url = new URL(connectionSession.api);
      const streamUrl =
        `${url.protocol}//${url.host}/api/worker/logs/stream?sid=${workerId}&follow=${follow}`;

      const response = await fetch(streamUrl, {
        method: "GET",
        headers: {
          "stels-session": connectionSession.session,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      setConnected(true);
      setError(null);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Store reader for cleanup
      readerRef.current = reader;

      // Read stream with buffer for incomplete messages
      const readStream = async (): Promise<void> => {
        let buffer = ""; // Buffer for incomplete SSE messages

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              setConnected(false);
              break;
            }

            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages (separated by \n\n)
            const messages = buffer.split("\n\n");

            // Keep last incomplete message in buffer
            buffer = messages.pop() || "";

            // Process complete messages
            for (const message of messages) {
              if (!message.trim()) continue; // Skip empty messages

              // SSE format: "data: {...}\n"
              const lines = message.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.substring(6));

                    switch (data.type) {
                      case "connected":
                        setConnected(true);
                        break;

                      case "log":
                        setLogs((prev) => [...prev, data.content]);
                        break;

                      case "complete":
                        setConnected(false);
                        reader.cancel();
                        return;

                      case "error":
                        setError(data.message);
                        setConnected(false);
                        reader.cancel();
                        return;
                    }
                  } catch (err) {
                    console.error("Failed to parse SSE data:", err, line);
                  }
                }
              }
            }
          }
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") {
            setError(err.message);
            setConnected(false);
          }
        }
      };

      readStream();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to log stream",
      );
      setConnected(false);
    }
  };

  // Disconnect from log stream
  const disconnect = (): void => {
    if (readerRef.current) {
      // Cancel the reader stream
      readerRef.current.cancel().catch(() => {
        // Ignore cancel errors
      });
      readerRef.current = null;
      setConnected(false);
    }
  };

  // Toggle follow mode
  const toggleFollow = (): void => {
    const newFollowState = !following;
    setFollowing(newFollowState);
    connect(newFollowState);
  };

  // Clear logs
  const clearLogs = (): void => {
    setLogs([]);
  };

  // Download logs
  const downloadLogs = (): void => {
    const blob = new Blob([logs.join("")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worker-${workerId}-${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  // Clear logs and reconnect when workerId changes
  useEffect(() => {
    // Clear previous worker's logs
    setLogs([]);
    setError(null);

    // Add separator message for new worker
    const separator =
      `# ─────────────────────────────────────────────────────────────────\n# Switched to worker: ${workerId}\n# Time: ${
        new Date().toISOString()
      }\n# ─────────────────────────────────────────────────────────────────\n`;
    setLogs([separator]);

    // Connect to new worker
    connect(following);

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  return (
    <Card className="bg-card flex flex-col h-full gap-0 p-0 m-0">
      <CardHeader className="pb-2 pt-2 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal
              className={cn(
                "h-3.5 w-3.5",
                connected ? "text-green-500" : "text-red-500",
              )}
            />
            <div>
              <CardTitle className="text-[11px] text-foreground font-semibold uppercase tracking-wide">
                Worker Logs
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">
                {workerId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                connected ? "bg-green-400 animate-pulse" : "bg-red-400",
              )}
              title={connected ? "Connected" : "Disconnected"}
            />

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Controls - Compact */}
        <div className="flex items-center gap-1 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFollow}
            className={cn(
              "h-5 w-5 p-0",
              following
                ? "text-green-700 dark:text-green-600"
                : "text-muted-foreground",
            )}
            title={following ? "Following" : "Paused"}
          >
            {following
              ? <Pause className="h-3 w-3" />
              : <Play className="h-3 w-3" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "h-5 w-5 p-0",
              autoScroll
                ? "text-blue-700 dark:text-blue-400"
                : "text-muted-foreground",
            )}
            title="Auto-scroll"
          >
            <RefreshCw
              className={cn("h-3 w-3", autoScroll && "animate-spin")}
            />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-red-700 dark:text-red-400"
            title="Clear logs"
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={downloadLogs}
            disabled={logs.length === 0}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-green-700 dark:text-green-600"
            title="Download logs"
          >
            <Download className="h-3 w-3" />
          </Button>

          <div className="ml-auto text-[10px] text-muted-foreground font-mono">
            {logs.length}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 min-h-0">
        {/* Error State */}
        {error && (
          <div className="p-3 mx-3 mb-3 bg-red-500/5 border border-red-500/30 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">
                  Stream Error
                </p>
                <p className="text-xs text-red-800 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logs Terminal - Linux Style */}
        <ScrollArea className="h-[100%] relative p-0 m-0" ref={scrollAreaRef}>
          {/* Terminal content */}
          <div className="relative bg-zinc-950 dark:bg-black p-3 font-mono text-[11px] leading-relaxed">
            {/* Terminal header */}
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-green-500/20">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/80" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                <div className="w-2 h-2 rounded-full bg-green-500/80" />
              </div>
              <span className="text-green-700 dark:text-green-600 text-[10px]">
                worker@stels:~/{workerId.slice(0, 8)}$
              </span>
            </div>

            {/* Terminal logs */}
            {logs.length === 0
              ? (
                <div className="text-green-700 dark:text-green-600/60 py-4">
                  {connected
                    ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse">●</span>
                        <span>Waiting for logs...</span>
                      </div>
                    )
                    : (
                      <div>
                        <span className="text-green-500">$</span>{" "}
                        No logs available. Start the worker to see logs.
                      </div>
                    )}
                </div>
              )
              : (
                <div className="space-y-0">
                  {logs.map((line, index) => {
                    // Parse log line for terminal styling
                    const isComment = line.startsWith("#");
                    const isError = line.includes("[ERROR]");
                    const isWarn = line.includes("[WARN]");
                    const isInfo = line.includes("[INFO]");
                    const isDebug = line.includes("[DEBUG]");

                    return (
                      <div
                        key={index}
                        className={cn(
                          "whitespace-pre-wrap break-all leading-relaxed",
                          // Terminal color scheme
                          isComment &&
                            "text-cyan-700 dark:text-cyan-400 font-bold", // Cyan for comments
                          isError &&
                            "text-red-700 dark:text-red-400 font-semibold", // Red for errors
                          isWarn && "text-yellow-700 dark:text-yellow-400", // Yellow for warnings
                          isInfo && "text-green-800 dark:text-green-300", // Green for info (classic terminal)
                          isDebug && "text-green-600/70", // Dim green for debug
                          !isComment &&
                            !isError &&
                            !isWarn &&
                            !isInfo &&
                            !isDebug &&
                            "text-green-700 dark:text-green-600", // Default terminal green
                        )}
                      >
                        {/* Add terminal prompt for non-comment lines */}
                        {!isComment && (
                          <span className="text-green-500/50 mr-2">›</span>
                        )}
                        {line}
                      </div>
                    );
                  })}

                  {/* Blinking cursor */}
                  {connected && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-green-500">$</span>
                      <span className="w-2 h-4 bg-green-400 animate-pulse" />
                    </div>
                  )}
                </div>
              )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
