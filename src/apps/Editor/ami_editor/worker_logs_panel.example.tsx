/**
 * WorkerLogsPanel - Usage Examples
 *
 * This file demonstrates various ways to use the WorkerLogsPanel component
 */

import { useState } from "react";
import { WorkerLogsPanel } from "./worker_logs_panel";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";

/**
 * Example 1: Basic Usage
 * Simplest way to show logs for a worker
 */
export function BasicExample(): React.ReactElement {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";

  return (
    <div className="h-screen p-4">
      <WorkerLogsPanel workerId={workerId} />
    </div>
  );
}

/**
 * Example 2: With Close Button
 * Add close functionality to the panel
 */
export function WithCloseExample(): React.ReactElement {
  const [showLogs, setShowLogs] = useState(true);
  const workerId = "550e8400-e29b-41d4-a716-446655440000";

  if (!showLogs) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Button onClick={() => setShowLogs(true)}>
          Show Logs
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen p-4">
      <WorkerLogsPanel
        workerId={workerId}
        onClose={() => setShowLogs(false)}
      />
    </div>
  );
}

/**
 * Example 3: Multiple Workers
 * Show logs for multiple workers with tabs
 */
export function MultipleWorkersExample(): React.ReactElement {
  const [selectedWorkerId, setSelectedWorkerId] = useState(
    "550e8400-e29b-41d4-a716-446655440000",
  );

  const workers = [
    { id: "550e8400-e29b-41d4-a716-446655440000", name: "Balance Monitor" },
    { id: "660e8400-e29b-41d4-a716-446655440001", name: "Market Maker" },
    { id: "770e8400-e29b-41d4-a716-446655440002", name: "Grid Trading" },
  ];

  return (
    <div className="h-screen p-4 flex flex-col gap-4">
      {/* Worker Selector */}
      <div className="flex gap-2">
        {workers.map((worker) => (
          <Button
            key={worker.id}
            variant={selectedWorkerId === worker.id ? "default" : "outline"}
            onClick={() => setSelectedWorkerId(worker.id)}
          >
            {worker.name}
          </Button>
        ))}
      </div>

      {/* Logs Panel */}
      <div className="flex-1">
        <WorkerLogsPanel workerId={selectedWorkerId} />
      </div>
    </div>
  );
}

/**
 * Example 4: Side-by-Side Logs
 * Compare logs from two workers simultaneously
 */
export function SideBySideExample(): React.ReactElement {
  const worker1 = "550e8400-e29b-41d4-a716-446655440000";
  const worker2 = "660e8400-e29b-41d4-a716-446655440001";

  return (
    <div className="h-screen p-4 grid grid-cols-2 gap-4">
      <WorkerLogsPanel workerId={worker1} />
      <WorkerLogsPanel workerId={worker2} />
    </div>
  );
}

/**
 * Example 5: Modal/Dialog Usage
 * Show logs in a modal dialog
 */
export function ModalExample(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const workerId = "550e8400-e29b-41d4-a716-446655440000";

  return (
    <div className="h-screen flex items-center justify-center">
      <Button onClick={() => setIsOpen(true)}>
        Open Logs
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="w-full max-w-4xl h-[80vh]">
            <WorkerLogsPanel
              workerId={workerId}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Embedded in Card
 * Integrate logs panel into existing layout
 */
export function EmbeddedExample(): React.ReactElement {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";

  return (
    <div className="h-screen p-4">
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Left side - Worker info */}
        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">Worker Information</h2>
          <div className="space-y-2">
            <p>
              <strong>ID:</strong> {workerId}
            </p>
            <p>
              <strong>Status:</strong> Active
            </p>
            <p>
              <strong>Mode:</strong> Leader
            </p>
            <p>
              <strong>Priority:</strong> High
            </p>
          </div>
        </Card>

        {/* Right side - Logs */}
        <WorkerLogsPanel workerId={workerId} />
      </div>
    </div>
  );
}

/**
 * Example 7: Custom Integration
 * Build your own log viewer with fetch + ReadableStream (supports auth headers)
 */
export function CustomSSEExample(): React.ReactElement {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const workerId = "550e8400-e29b-41d4-a716-446655440000";

  const connect = async (): Promise<void> => {
    try {
      // IMPORTANT: fetch supports custom headers (for stels-session auth)
      const response = await fetch(
        `/api/worker/logs/stream?sid=${workerId}&follow=true`,
        {
          headers: {
            "stels-session": "your-session-token", // Required for auth
          },
        },
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect");
      }

      setConnected(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; // CRITICAL: Buffer for incomplete SSE messages

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setConnected(false);
          break;
        }

        // Add chunk to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by \n\n)
        const messages = buffer.split("\n\n");

        // Keep last incomplete message in buffer
        buffer = messages.pop() || "";

        // Process complete messages
        for (const message of messages) {
          if (!message.trim()) continue;

          const lines = message.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.substring(6));
              if (data.type === "log") {
                setLogs((prev) => [...prev, data.content]);
              }
            }
          }
        }
      }
    } catch (err) {
      setConnected(false);
      console.error("Connection error:", err);
    }
  };

  return (
    <div className="h-screen p-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Custom Log Viewer</h2>
          <Button onClick={connect} disabled={connected}>
            {connected ? "Connected" : "Connect"}
          </Button>
        </div>

        <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-96 overflow-auto">
          {logs.map((log, index) => <div key={index}>{log}</div>)}
        </div>
      </Card>
    </div>
  );
}

/**
 * Tips & Best Practices
 *
 * 1. Authentication (CRITICAL):
 *    - ALWAYS use fetch + ReadableStream (NOT EventSource)
 *    - EventSource doesn't support custom headers
 *    - Session token MUST be in "stels-session" header
 *    - Use connectionSession from auth store
 *
 * 2. SSE Parsing (CRITICAL):
 *    - ALWAYS use buffer for incomplete messages
 *    - ReadableStream can split data at any byte
 *    - Without buffer, logs will duplicate or break
 *    - Keep last incomplete message in buffer
 *
 * 3. Memory Management:
 *    - Use Pause mode when not actively monitoring
 *    - Clear logs periodically for long-running sessions
 *    - Download logs before clearing if needed
 *
 * 4. Performance:
 *    - Disable auto-scroll when reading old logs
 *    - Use Follow mode only when actively debugging
 *    - Limit number of simultaneous log streams
 *
 * 5. User Experience:
 *    - Always provide close/minimize options
 *    - Show connection status clearly
 *    - Implement download functionality for audit trails
 *
 * 6. Error Handling:
 *    - Handle connection loss gracefully
 *    - Show error messages clearly
 *    - Provide reconnect functionality
 *    - Handle 401/403 auth errors
 *
 * 7. Integration:
 *    - Use in tabs for multiple workers
 *    - Combine with worker stats
 *    - Link to worker configuration
 */
