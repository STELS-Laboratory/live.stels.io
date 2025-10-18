# Worker Logs API

Система продвинутого логирования воркеров с записью в файлы и потоковым чтением в реальном времени.

## 📋 Особенности

- **Triple Logging**: Логи воркеров записываются одновременно в:
  - Console (для разработки)
  - Deno KV Brain (для быстрого доступа, TTL 30 мин)
  - File System (`./logs/workers/[SID].log`)

- **Log Rotation**: Автоматическая ротация файлов при достижении 10 MB
- **Real-time Streaming**: Server-Sent Events (SSE) для потокового чтения логов
- **Persistence**: Логи хранятся в файлах постоянно (не удаляются после TTL)

## 🔐 Аутентификация и авторизация

**Все endpoints требуют:**
1. ✅ Валидную сессию в header `stels-session`
2. ✅ Wallet с правами `developer` или `owner`

**Проверка прав:**
- Wallet должен быть в списке `DEVELOPERS` или `OWNERS` в env-переменных
- Сессия валидируется через blockchain транзакцию
- При отсутствии прав возвращается `403 Forbidden`

## 📡 API Endpoints

### 1. Stream Worker Logs (Real-time)

Получение логов воркера в режиме реального времени через SSE.

```http
GET /api/worker/logs/stream?sid={WORKER_SID}&follow={true|false}
Headers:
  stels-session: {SESSION_UUID}
```

**Query Parameters:**

- `sid` (required): Worker ID (UUID)
- `follow` (optional): Режим `tail -f` (default: false)
  - `true` - продолжает читать новые логи по мере их записи
  - `false` - читает существующие логи и завершается

**Headers:**
- `stels-session` (required): Session UUID (получен через `connectionNode`)

**Response:** `text/event-stream`

**Event Types:**

1. **Connected Event**

```json
{
  "type": "connected",
  "sid": "worker-uuid"
}
```

2. **Log Event**

```json
{
  "type": "log",
  "content": "[2025-01-15T10:30:45.123Z] [INFO] Worker started\n"
}
```

3. **Complete Event**

```json
{
  "type": "complete"
}
```

4. **Error Event**

```json
{
  "type": "error",
  "message": "Log file not found for worker: worker-uuid"
}
```

**Example (JavaScript):**

```javascript
// Note: EventSource doesn't support custom headers directly
// Use fetch API with ReadableStream instead

const sessionId = "your-session-uuid"; // From connectionNode

const response = await fetch(
  `http://localhost:9000/api/worker/logs/stream?sid=worker-123&follow=true`,
  {
    headers: {
      "stels-session": sessionId,
    },
  }
);

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      
      switch (data.type) {
        case 'connected':
          console.log('Connected to worker logs:', data.sid);
          break;
        case 'log':
          document.getElementById('terminal').innerHTML += data.content;
          break;
        case 'complete':
          console.log('Stream completed');
          reader.releaseLock();
          return;
        case 'error':
          console.error('Stream error:', data.message);
          reader.releaseLock();
          return;
      }
    }
  }
}
```

**Alternative with EventSource (через proxy):**

```javascript
// Server-side proxy that adds session header
const eventSource = new EventSource(
  "http://localhost:9000/api/worker/logs/stream?sid=worker-123&follow=true",
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "connected":
      console.log("Connected to worker logs:", data.sid);
      break;
    case "log":
      document.getElementById("terminal").innerHTML += data.content;
      break;
    case "complete":
      console.log("Stream completed");
      eventSource.close();
      break;
    case "error":
      console.error("Stream error:", data.message);
      eventSource.close();
      break;
  }
};

eventSource.onerror = (error) => {
  console.error("SSE Error:", error);
  eventSource.close();
};
```

**Example (curl):**

```bash
# Set session from connectionNode response
SESSION_ID="your-session-uuid"

# Read all logs and exit
curl -H "stels-session: $SESSION_ID" \
  "http://localhost:9000/api/worker/logs/stream?sid=worker-123"

# Follow logs in real-time (like tail -f)
curl -H "stels-session: $SESSION_ID" \
  "http://localhost:9000/api/worker/logs/stream?sid=worker-123&follow=true"
```

---

### 2. Get Worker Logs Info

Получение информации о логах воркеров.

#### 2.1. List All Worker Logs

```http
GET /api/worker/logs
Headers:
  stels-session: {SESSION_UUID}
```

**Response:**

```json
{
  "total": 3,
  "logs": [
    {
      "sid": "worker-uuid-1",
      "exists": true,
      "size": 1048576,
      "sizeFormatted": "1.00 MB",
      "modified": "2025-01-15T10:30:45.123Z",
      "lines": 12453
    },
    {
      "sid": "worker-uuid-2",
      "exists": true,
      "size": 524288,
      "sizeFormatted": "512.00 KB",
      "modified": "2025-01-15T09:15:30.456Z",
      "lines": 5678
    }
  ]
}
```

#### 2.2. Get Specific Worker Log Info

```http
GET /api/worker/logs?sid={WORKER_SID}
Headers:
  stels-session: {SESSION_UUID}
```

**Response:**

```json
{
  "sid": "worker-uuid-1",
  "exists": true,
  "size": 1048576,
  "sizeFormatted": "1.00 MB",
  "modified": "2025-01-15T10:30:45.123Z",
  "lines": 12453
}
```

**Error Response (404):**

```json
{
  "error": "Log file not found",
  "sid": "worker-uuid-1"
}
```

---

## 📁 Файловая структура

```
./logs/workers/
├── worker-uuid-1.log
├── worker-uuid-1.log.1    # Ротация
├── worker-uuid-1.log.2
├── worker-uuid-2.log
└── worker-uuid-3.log
```

### Log Rotation

- **Max File Size**: 10 MB
- **Rotation Count**: 5 файлов (`.log`, `.log.1`, `.log.2`, `.log.3`, `.log.4`)
- **Total Max Size**: 60 MB на воркер

При достижении лимита:

1. `.log` → `.log.1`
2. `.log.1` → `.log.2`
3. ...
4. `.log.4` → удаляется

---

## 🔧 Программный доступ

### Из Worker Script

```javascript
// Worker автоматически получает logger
logger.info("Worker started");
logger.debug("Processing data", { count: 100 });
logger.warn("Low memory warning");
logger.error("Failed to connect", error);
```

### Из Deno Runtime

```typescript
import {
  deleteWorkerLogFile,
  getWorkerLogFiles,
  getWorkerLogInfo,
  streamWorkerLogs,
} from "./src/utils/logger.ts";

// Stream logs
for await (const line of streamWorkerLogs("worker-123", true)) {
  console.log(line);
}

// Get all worker log files
const sids = await getWorkerLogFiles();
console.log("Workers with logs:", sids);

// Get log info
const info = await getWorkerLogInfo("worker-123");
console.log(`Size: ${info.size}, Lines: ${info.lines}`);

// Delete log file
await deleteWorkerLogFile("worker-123");
```

---

## 🌐 Web Terminal Integration

### HTML Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Worker Logs Terminal</title>
    <style>
      #terminal {
        background: #000;
        color: #0f0;
        font-family: "Courier New", monospace;
        padding: 20px;
        height: 600px;
        overflow-y: auto;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <div id="terminal"></div>

    <script>
      const terminal = document.getElementById("terminal");
      const workerId = "worker-uuid";

      const eventSource = new EventSource(
        `http://localhost:9000/api/worker/logs/stream?sid=${workerId}&follow=true`,
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "log") {
          terminal.innerHTML += data.content;
          terminal.scrollTop = terminal.scrollHeight;
        } else if (data.type === "error") {
          terminal.innerHTML +=
            `<span style="color:red;">ERROR: ${data.message}</span>\n`;
        }
      };
    </script>
  </body>
</html>
```

### React Component Example

```typescript
import { useEffect, useState } from "react";

interface WorkerLogsTerminalProps {
  workerId: string;
  sessionId: string;
  follow?: boolean;
}

export function WorkerLogsTerminal(
  { workerId, sessionId, follow = true }: WorkerLogsTerminalProps,
) {
  const [logs, setLogs] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    const abortController = new AbortController();

    const streamLogs = async () => {
      try {
        const response = await fetch(
          `/api/worker/logs/stream?sid=${workerId}&follow=${follow}`,
          {
            headers: {
              "stels-session": sessionId,
            },
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        setConnected(true);

        while (!aborted) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));
              
              switch (data.type) {
                case 'log':
                  setLogs(prev => prev + data.content);
                  break;
                case 'error':
                  setError(data.message);
                  break;
              }
            }
          }
        }
      } catch (err) {
        if (!aborted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setConnected(false);
        }
      }
    };

    streamLogs();

    return () => {
      aborted = true;
      abortController.abort();
    };
  }, [workerId, sessionId, follow]);

  return (
    <div>
      <div>
        Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}
        {error && <span style={{ color: 'red' }}> | Error: {error}</span>}
      </div>
      <pre
        style={{
          background: "#000",
          color: "#0f0",
          padding: "20px",
          height: "600px",
          overflow: "auto",
        }}
      >
        {logs}
      </pre>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Log file not found

```json
{
  "type": "error",
  "message": "Log file not found for worker: worker-123"
}
```

**Причины:**

- Воркер еще не создан или не запущен
- Воркер был удален
- Логи были вручную удалены из `./logs/workers/`

**Решение:**

- Проверьте, что воркер существует: `GET /api/worker/logs`
- Запустите воркер: `POST /api/worker/start`

### Connection dropped

EventSource автоматически переподключается. Для контроля:

```javascript
eventSource.onerror = (error) => {
  console.error("Connection error:", error);

  if (eventSource.readyState === EventSource.CLOSED) {
    // Reconnect logic
    setTimeout(() => {
      // Recreate EventSource
    }, 5000);
  }
};
```

### High memory usage

При `follow=true` логи накапливаются в браузере. Используйте circular buffer:

```javascript
const MAX_LINES = 1000;
let logLines = [];

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "log") {
    logLines.push(data.content);

    if (logLines.length > MAX_LINES) {
      logLines = logLines.slice(-MAX_LINES);
    }

    terminal.innerHTML = logLines.join("");
  }
};
```

---

## 📊 Performance

### Benchmarks

- **File Write**: ~2-5ms per log entry
- **Log Rotation**: ~50-100ms (10 MB file)
- **Stream Read**: ~0.1ms per line
- **SSE Latency**: ~10-50ms (real-time)

### Limits

- **Max File Size**: 10 MB per file
- **Max Total Size**: 60 MB per worker (6 files with rotation)
- **Max Concurrent Streams**: Ограничено системой (обычно ~1000)
- **Line Length**: Unlimited (автоматический wrap)

---

## 🔒 Security

1. **Authentication**: Все endpoints требуют валидную сессию в header `stels-session`
2. **Authorization**: Только `developers` и `owners` могут читать логи (проверка через wallet list)
3. **Path Traversal Protection**: SID валидируется (только UUID формат)
4. **Rate Limiting**: Рекомендуется добавить rate limiting для streaming endpoints
5. **Session Validation**: Сессия проверяется через blockchain транзакцию

---

## 📝 Changelog

### v2.0.0 (Current)

- ✅ Triple logging (console + brain + file)
- ✅ Automatic log rotation (10 MB limit)
- ✅ Real-time streaming via SSE
- ✅ REST API for log info
- ✅ Worker-specific log files

### Future Plans

- [ ] Log compression (gzip для ротированных файлов)
- [ ] Log search/filter API
- [ ] Log analytics (errors rate, patterns)
- [ ] Export logs (download as .log or .txt)
- [ ] Webhooks для критических ошибок
