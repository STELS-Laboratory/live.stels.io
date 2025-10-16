# Worker API Documentation

## Оглавление

- [Обзор](#обзор)
- [Аутентификация](#аутентификация)
- [Endpoints](#endpoints)
  - [Создать воркер](#1-создать-воркер)
  - [Список воркеров](#2-список-воркеров)
  - [Обновить воркер](#3-обновить-воркер)
  - [Остановить все воркеры](#4-остановить-все-воркеры)
  - [Статистика воркеров](#5-статистика-воркеров)
  - [Информация о лидере](#6-информация-о-лидере)
- [Типы данных](#типы-данных)
- [Коды ошибок](#коды-ошибок)

---

## Обзор

Worker API предоставляет управление распределенными воркерами в Heterogen Runtime. Воркеры представляют собой JavaScript скрипты, выполняемые на узлах сети с поддержкой трех режимов:

- **parallel** — выполняется на всех узлах одновременно
- **leader** — выполняется только на одном узле-лидере (distributed consensus)
- **exclusive** — выполняется только на назначенном узле

**Base URL:** `http://{hostname}:{port}`

**Protocol:** WebFIX 1.0

---

## Аутентификация

Все Worker API endpoints требуют:

1. **Blockchain-аутентификации через метод `connectionNode`**
2. **Session токена в заголовке** `stels-session`
3. **Роль Owner** (wallet должен быть в списке `OWNERS`)

### Пример заголовков

```http
Content-Type: application/json
stels-session: {session_uuid}
```

### Процесс аутентификации

1. Создать транзакцию через `connectionNode` (см. API.md)
2. Получить session token
3. Использовать session token во всех Worker API запросах

---

## Endpoints

### 1. Создать воркер

Создает новый воркер и сохраняет его в распределенном KV store.

**Method:** `POST`

**WebFIX Method:** `setWorker`

#### Request

```json
{
  "webfix": "1.0",
  "method": "setWorker",
  "body": {
    "scriptContent": "logger.info('Hello from worker!'); await Stels.sleep(1000);",
    "dependencies": ["gliesereum"],
    "version": "1.19.2",
    "executionMode": "parallel",
    "priority": "normal",
    "accountId": "account-uuid",
    "assignedNode": "s-0001"
  }
}
```

#### Request Parameters

| Параметр        | Тип      | Обязательный | По умолчанию                                         | Описание                                            |
| --------------- | -------- | ------------ | ---------------------------------------------------- | --------------------------------------------------- |
| `scriptContent` | string   | Нет          | `"\nlogger.info(\"Worker script initialized!\");\n"` | JavaScript код воркера                              |
| `dependencies`  | string[] | Нет          | ["gliesereum"]                                       | Список зависимостей                                 |
| `version`       | string   | Нет          | "1.19.2"                                             | Версия воркера                                      |
| `executionMode` | string   | Нет          | "parallel"                                           | Режим выполнения: `parallel`, `leader`, `exclusive` |
| `priority`      | string   | Нет          | "normal"                                             | Приоритет: `critical`, `high`, `normal`, `low`      |
| `accountId`     | string   | Нет          | -                                                    | ID связанного аккаунта                              |
| `assignedNode`  | string   | Условно      | -                                                    | Обязателен для `exclusive` режима                   |

#### Response (200 OK)

```json
{
  "key": ["ami", "worker", "550e8400-e29b-41d4-a716-446655440000"],
  "value": {
    "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000",
    "module": "worker",
    "widget": "widget.ami.worker.{sid}",
    "raw": {
      "sid": "550e8400-e29b-41d4-a716-446655440000",
      "nid": "s-0001",
      "active": false,
      "mode": "loop",
      "executionMode": "parallel",
      "priority": "normal",
      "accountId": "account-uuid",
      "assignedNode": null,
      "note": "Worker script Stels SDK 550e8400-e29b-41d4-a716-446655440000 - 2025-10-15T12:00:00.000Z",
      "script": "logger.info('Hello from worker!');await Stels.sleep(1000);",
      "dependencies": ["gliesereum"],
      "version": "1.19.2",
      "timestamp": 1760245826876
    },
    "timestamp": 1760245826876
  },
  "versionstamp": "00000000000000010000"
}
```

#### Response (400 Bad Request)

```json
{
  "error": "Invalid script content"
}
```

```json
{
  "error": "Exclusive mode requires assignedNode parameter"
}
```

```json
{
  "error": "Script minification failed"
}
```

#### Response (500 Internal Server Error)

```json
{
  "error": "Internal server error"
}
```

#### Важные детали

- Скрипт автоматически минифицируется перед сохранением
- Генерируется уникальный UUID (`sid`)
- По умолчанию воркер создается в состоянии `active: false` (не запущен)
- **Поле `mode` всегда устанавливается в `"loop"`** (не параметр запроса)
- Для запуска нужно обновить воркер с `active: true`
- В `exclusive` режиме обязательно указать `assignedNode`

---

### 2. Список воркеров

Получает список всех воркеров из распределенного KV store.

**Method:** `POST`

**WebFIX Method:** `listWorkers`

#### Request

```json
{
  "webfix": "1.0",
  "method": "listWorkers"
}
```

#### Response (200 OK)

```json
[
  {
    "key": ["ami", "worker", "550e8400-e29b-41d4-a716-446655440000"],
    "value": {
      "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000",
      "module": "worker",
      "widget": "widget.ami.worker.{sid}",
      "raw": {
        "sid": "550e8400-e29b-41d4-a716-446655440000",
        "nid": "s-0001",
        "active": true,
        "mode": "loop",
        "executionMode": "parallel",
        "priority": "high",
        "accountId": "account-uuid",
        "assignedNode": null,
        "note": "Balance checker worker",
        "script": "logger.info('Checking balances...');",
        "dependencies": ["gliesereum"],
        "version": "1.19.2",
        "timestamp": 1760245826876
      },
      "timestamp": 1760245826876
    },
    "versionstamp": "00000000000000010000"
  },
  {
    "key": ["ami", "worker", "660e8400-e29b-41d4-a716-446655440001"],
    "value": {
      "channel": "ami.worker.660e8400-e29b-41d4-a716-446655440001",
      "module": "worker",
      "widget": "widget.ami.worker.{sid}",
      "raw": {
        "sid": "660e8400-e29b-41d4-a716-446655440001",
        "nid": "s-0001",
        "active": false,
        "mode": "single",
        "executionMode": "leader",
        "priority": "critical",
        "accountId": null,
        "assignedNode": null,
        "note": "Market maker support",
        "script": "while(true){logger.info('MM running...');await Stels.sleep(5000);}",
        "dependencies": ["gliesereum"],
        "version": "1.19.2",
        "timestamp": 1760245826876
      },
      "timestamp": 1760245826876
    },
    "versionstamp": "00000000000000020000"
  }
]
```

#### Response (500 Internal Server Error)

```json
{
  "error": "Internal Server Error"
}
```

#### Важные детали

- Возвращает все воркеры независимо от их статуса (`active: true/false`)
- Каждый entry содержит полную информацию о воркере
- `versionstamp` используется для оптимистичной блокировки при обновлении

---

### 3. Обновить воркер

Обновляет существующий воркер (например, активирует/деактивирует или меняет скрипт).

**Method:** `POST`

**WebFIX Method:** `updateWorker`

#### Request

```json
{
  "webfix": "1.0",
  "method": "updateWorker",
  "body": {
    "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000",
    "raw": {
      "active": true,
      "priority": "high",
      "script": "logger.info('Updated worker script!');"
    }
  }
}
```

#### Request Parameters

| Параметр     | Тип     | Обязательный | Описание                                         |
| ------------ | ------- | ------------ | ------------------------------------------------ |
| `channel`    | string  | Да           | Путь к воркеру в формате `ami.worker.{sid}`      |
| `raw`        | object  | Да           | **Полный объект для замены** (см. важные детали) |
| `raw.active` | boolean | Да*          | Активировать/деактивировать воркер               |
| `raw.script` | string  | Да*          | Код воркера                                      |
| `raw.sid`    | string  | Да*          | ID воркера                                       |
| `raw.nid`    | string  | Да*          | Node ID                                          |
| `raw.mode`   | string  | Да*          | Режим: "loop" или "single"                       |
| `raw.*`      | any     | Да*          | Все остальные поля `WorkerScript` (*)            |

> **⚠️ Важно:** Параметр `raw` должен содержать **полный объект WorkerScript**, а не частичный! Все поля обязательны, иначе они будут потеряны.

#### Response (200 OK)

```json
{
  "key": ["ami", "worker", "550e8400-e29b-41d4-a716-446655440000"],
  "value": {
    "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000",
    "module": "worker",
    "widget": "widget.ami.worker.{sid}",
    "raw": {
      "sid": "550e8400-e29b-41d4-a716-446655440000",
      "nid": "s-0001",
      "active": true,
      "mode": "loop",
      "executionMode": "parallel",
      "priority": "high",
      "accountId": "account-uuid",
      "assignedNode": null,
      "note": "Worker script Stels SDK 550e8400-e29b-41d4-a716-446655440000",
      "script": "logger.info('Updated worker script!');",
      "dependencies": ["gliesereum"],
      "version": "1.19.2",
      "timestamp": 1760245999999
    },
    "timestamp": 1760245999999
  },
  "versionstamp": "00000000000000020000"
}
```

#### Response (400 Bad Request)

```json
{
  "error": "Invalid request body"
}
```

```json
{
  "error": "Invalid request Protocol"
}
```

#### Response (409 Conflict)

```json
{
  "error": "Update Worker Error: version mismatch or not found"
}
```

#### Response (500 Internal Server Error)

```json
{
  "error": "Internal Server Error"
}
```

#### Важные детали

- ⚠️ **КРИТИЧНО:** `updateWorker` делает **ПОЛНУЮ ЗАМЕНУ** объекта `raw`, а НЕ частичное обновление!
- Вы ДОЛЖНЫ передать ВСЕ поля `WorkerScript` в параметре `raw`, иначе непереданные поля будут потеряны
- Рекомендуется сначала получить текущие данные через `listWorkers`, затем изменить нужные поля и передать полный объект
- Использует оптимистичную блокировку через `versionstamp` (защита от race conditions)
- При изменении `active: false → true` воркер автоматически запускается на узлах
- При изменении `active: true → false` воркер останавливается
- При изменении `script` происходит hot reload (перезапуск с новым кодом)

**Пример правильного использования:**

```javascript
// 1. Получить текущие данные
const workersResponse = await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({ webfix: "1.0", method: "listWorkers" }),
});
const workers = await workersResponse.json();
const worker = workers.find((w) => w.key[2] === workerId);

// 2. Изменить нужные поля
const updatedRaw = {
  ...worker.value.raw, // ВСЕ старые поля
  active: true, // Изменить только active
  priority: "high", // И priority
};

// 3. Отправить полный объект
await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({
    webfix: "1.0",
    method: "updateWorker",
    body: {
      channel: `ami.worker.${workerId}`,
      raw: updatedRaw, // Полный объект!
    },
  }),
});
```

---

### 4. Остановить все воркеры

Останавливает все активные воркеры в системе (устанавливает `active: false`).

**Method:** `POST`

**WebFIX Method:** `stopAllWorkers`

#### Request

```json
{
  "webfix": "1.0",
  "method": "stopAllWorkers"
}
```

#### Response (200 OK) - Все остановлено

```json
{
  "total": 5,
  "stopped": 5,
  "failed": 0,
  "errors": [],
  "workers": [
    {
      "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000",
      "status": "stopped"
    },
    {
      "channel": "ami.worker.660e8400-e29b-41d4-a716-446655440001",
      "status": "already_stopped"
    },
    {
      "channel": "ami.worker.770e8400-e29b-41d4-a716-446655440002",
      "status": "stopped"
    },
    {
      "channel": "ami.worker.880e8400-e29b-41d4-a716-446655440003",
      "status": "stopped"
    },
    {
      "channel": "ami.worker.990e8400-e29b-41d4-a716-446655440004",
      "status": "stopped"
    }
  ]
}
```

#### Response (207 Multi-Status) - Частичный успех

```json
{
  "total": 3,
  "stopped": 2,
  "failed": 1,
  "errors": [
    {
      "channel": "ami.worker.880e8400-e29b-41d4-a716-446655440003",
      "error": "Failed to stop worker"
    }
  ],
  "workers": [
    {
      "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000",
      "status": "stopped"
    },
    {
      "channel": "ami.worker.660e8400-e29b-41d4-a716-446655440001",
      "status": "stopped"
    },
    {
      "channel": "ami.worker.880e8400-e29b-41d4-a716-446655440003",
      "status": "failed"
    }
  ]
}
```

#### Response (200 OK) - Нет воркеров

```json
{
  "message": "No workers found",
  "total": 0,
  "stopped": 0,
  "failed": 0,
  "workers": []
}
```

#### Response (500 Internal Server Error)

```json
{
  "error": "Internal Server Error",
  "message": "Database connection failed"
}
```

#### Статусы воркеров

| Статус            | Описание                       |
| ----------------- | ------------------------------ |
| `stopped`         | Воркер успешно остановлен      |
| `already_stopped` | Воркер уже был остановлен      |
| `failed`          | Не удалось остановить воркер   |
| `error`           | Произошла ошибка при остановке |

#### Важные детали

- Операция массовая и атомарная для каждого воркера
- Воркеры со статусом `active: false` пропускаются (статус `already_stopped`)
- При ошибках возвращается код `207` вместо `200`
- Все ошибки собираются в массив `errors`

---

### 5. Статистика воркеров

Получает детальную статистику выполнения всех воркеров на текущем узле.

**Method:** `POST`

**WebFIX Method:** `getWorkerStats`

#### Request

```json
{
  "webfix": "1.0",
  "method": "getWorkerStats"
}
```

#### Response (200 OK)

```json
{
  "totalWorkers": 3,
  "runningWorkers": 2,
  "stoppedWorkers": 1,
  "totalExecutions": 15847,
  "totalErrors": 12,
  "totalNetworkErrors": 8,
  "totalCriticalErrors": 4,
  "workers": [
    {
      "sid": "550e8400-e29b-41d4-a716-446655440000",
      "started": 1760245826876,
      "uptime": 3600000,
      "executions": 10000,
      "errors": 5,
      "networkErrors": 3,
      "criticalErrors": 2,
      "consecutiveErrors": 0,
      "errorRate": "0.05%",
      "lastError": "RequestTimeout: Connection timeout",
      "lastErrorType": "network",
      "lastRun": 1760249426876,
      "lastRunAgo": 150,
      "scriptHash": "1a2b3c4d",
      "isRunning": true
    },
    {
      "sid": "660e8400-e29b-41d4-a716-446655440001",
      "started": 1760245826900,
      "uptime": 3599900,
      "executions": 5847,
      "errors": 7,
      "networkErrors": 5,
      "criticalErrors": 2,
      "consecutiveErrors": 2,
      "errorRate": "0.12%",
      "lastError": "RateLimitExceeded",
      "lastErrorType": "network",
      "lastRun": 1760249426700,
      "lastRunAgo": 326,
      "scriptHash": "5e6f7g8h",
      "isRunning": true
    },
    {
      "sid": "770e8400-e29b-41d4-a716-446655440002",
      "started": 1760245000000,
      "uptime": 4426876,
      "executions": 0,
      "errors": 0,
      "networkErrors": 0,
      "criticalErrors": 0,
      "consecutiveErrors": 0,
      "errorRate": "0%",
      "lastError": null,
      "lastErrorType": null,
      "lastRun": null,
      "lastRunAgo": null,
      "scriptHash": "9i0j1k2l",
      "isRunning": false
    }
  ],
  "timestamp": 1760249426876
}
```

#### Response Fields

##### Summary Fields

| Поле                  | Тип    | Описание                          |
| --------------------- | ------ | --------------------------------- |
| `totalWorkers`        | number | Общее количество воркеров         |
| `runningWorkers`      | number | Количество запущенных воркеров    |
| `stoppedWorkers`      | number | Количество остановленных воркеров |
| `totalExecutions`     | number | Сумма всех выполнений             |
| `totalErrors`         | number | Сумма всех ошибок                 |
| `totalNetworkErrors`  | number | Сумма сетевых ошибок              |
| `totalCriticalErrors` | number | Сумма критических ошибок          |
| `timestamp`           | number | Timestamp ответа                  |

##### Worker Stats Fields

| Поле                | Тип                             | Описание                           |
| ------------------- | ------------------------------- | ---------------------------------- |
| `sid`               | string                          | Уникальный ID воркера              |
| `started`           | number                          | Timestamp запуска                  |
| `uptime`            | number                          | Время работы в миллисекундах       |
| `executions`        | number                          | Количество выполнений              |
| `errors`            | number                          | Общее количество ошибок            |
| `networkErrors`     | number                          | Количество сетевых ошибок          |
| `criticalErrors`    | number                          | Количество критических ошибок      |
| `consecutiveErrors` | number                          | Количество последовательных ошибок |
| `errorRate`         | string                          | Процент ошибок от выполнений       |
| `lastError`         | string \| null                  | Последняя ошибка                   |
| `lastErrorType`     | "network" \| "critical" \| null | Тип последней ошибки               |
| `lastRun`           | number \| null                  | Timestamp последнего запуска       |
| `lastRunAgo`        | number \| null                  | Миллисекунды с последнего запуска  |
| `scriptHash`        | string                          | Хеш текущего скрипта               |
| `isRunning`         | boolean                         | Запущен ли воркер                  |

#### Response (500 Internal Server Error)

```json
{
  "error": "Internal server error"
}
```

#### Важные детали

- Статистика собирается только для воркеров, запущенных на **текущем узле**
- `consecutiveErrors` сбрасывается после успешного выполнения
- `errorRate` вычисляется как `(errors / executions) * 100`
- `scriptHash` — короткий хеш скрипта (первые 8 символов) для отслеживания изменений
- Воркеры в режиме `leader` показывают статистику только на узле-лидере

---

### 6. Информация о лидере

Получает информацию о текущем лидере для воркера в режиме `executionMode: "leader"`.

**Method:** `POST`

**WebFIX Method:** `getLeaderInfo`

#### Request

```json
{
  "webfix": "1.0",
  "method": "getLeaderInfo",
  "body": {
    "workerId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Request Parameters

| Параметр   | Тип    | Обязательный | Описание           |
| ---------- | ------ | ------------ | ------------------ |
| `workerId` | string | Да           | UUID воркера (sid) |

#### Response (200 OK) - Лидер найден

```json
{
  "workerId": "550e8400-e29b-41d4-a716-446655440000",
  "hasLeader": true,
  "leader": "s-0001",
  "timestamp": 1760245826876,
  "expiresAt": 1760245886876,
  "renewedAt": 1760245856876,
  "expiresIn": 30000,
  "isExpired": false
}
```

#### Response (200 OK) - Лидер не найден

```json
{
  "workerId": "550e8400-e29b-41d4-a716-446655440000",
  "hasLeader": false,
  "message": "No leader elected yet"
}
```

#### Response Fields

| Поле        | Тип     | Описание                        |
| ----------- | ------- | ------------------------------- |
| `workerId`  | string  | UUID воркера                    |
| `hasLeader` | boolean | Есть ли активный лидер          |
| `leader`    | string  | Node ID лидера                  |
| `timestamp` | number  | Timestamp выбора лидера         |
| `expiresAt` | number  | Timestamp истечения lease       |
| `renewedAt` | number  | Timestamp последнего обновления |
| `expiresIn` | number  | Миллисекунды до истечения lease |
| `isExpired` | boolean | Истек ли lease                  |

#### Response (400 Bad Request)

```json
{
  "error": "Invalid workerId"
}
```

#### Response (500 Internal Server Error)

```json
{
  "error": "Internal server error"
}
```

#### Важные детали

- Актуально только для воркеров с `executionMode: "leader"`
- Lease автоматически продлевается каждые 30 секунд
- Lease действителен 60 секунд (см. `LEADER_ELECTION_CONFIG.LEASE_DURATION_MS`)
- Если лидер падает, через 60 секунд будет выбран новый лидер
- `expiresIn` показывает оставшееся время до переизбрания

---

## Типы данных

### WorkerScript

Полная структура воркера в системе.

```typescript
interface WorkerScript {
  sid: string; // Уникальный UUID воркера
  nid: string; // Node ID создавшего узла
  active: boolean; // Активен ли воркер
  mode: "loop" | "single"; // Режим выполнения
  executionMode?: "parallel" | "leader" | "exclusive";
  priority?: "critical" | "high" | "normal" | "low";
  accountId?: string; // Связанный ID аккаунта
  assignedNode?: string; // Назначенный узел (для exclusive)
  note: string; // Описание воркера
  script: string; // Минифицированный JavaScript код
  dependencies: string[]; // Список зависимостей
  version: string; // Версия воркера
  timestamp: number; // Timestamp создания/обновления
}
```

### WorkerMode

Режим управления циклом выполнения.

```typescript
type WorkerMode = "loop" | "single";
```

- **`loop`** — Engine автоматически повторяет выполнение скрипта в цикле
- **`single`** — Скрипт выполняется один раз (должен содержать собственный цикл)

### ExecutionMode

Режим распределения выполнения по узлам.

```typescript
type ExecutionMode = "parallel" | "leader" | "exclusive";
```

- **`parallel`** — Воркер выполняется параллельно на всех узлах
- **`leader`** — Выполняется только на одном узле-лидере (distributed consensus)
- **`exclusive`** — Выполняется только на узле, указанном в `assignedNode`

### WorkerPriority

Приоритет выполнения воркера.

```typescript
type WorkerPriority = "critical" | "high" | "normal" | "low";
```

### WorkerData

KV storage обертка воркера.

```typescript
interface WorkerData {
  channel: string; // Путь в KV: "ami.worker.{sid}"
  module: string; // Всегда "worker"
  widget: string; // Всегда ""
  raw: WorkerScript; // Данные воркера
  timestamp: number; // Timestamp операции
}
```

### WorkerKVEntry

Entry из KV storage.

```typescript
interface WorkerKVEntry {
  key: string[]; // ["ami", "worker", "{sid}"]
  value: WorkerData; // Данные воркера
  versionstamp: string; // Версия для оптимистичной блокировки
}
```

### LeaderLease

Информация о lease лидера.

```typescript
interface LeaderLease {
  leader: string; // Node ID лидера
  workerId: string; // UUID воркера
  timestamp: number; // Timestamp выбора
  expiresAt: number; // Timestamp истечения
  renewedAt: number; // Timestamp последнего обновления
}
```

---

## Коды ошибок

### HTTP Status Codes

| Код   | Описание              | Причина                           |
| ----- | --------------------- | --------------------------------- |
| `200` | OK                    | Успешный запрос                   |
| `207` | Multi-Status          | Частичный успех (stopAllWorkers)  |
| `400` | Bad Request           | Невалидные параметры запроса      |
| `401` | Unauthorized          | Отсутствует или невалидная сессия |
| `403` | Forbidden             | Wallet не в списке Owners         |
| `409` | Conflict              | Version mismatch при обновлении   |
| `500` | Internal Server Error | Внутренняя ошибка сервера         |

### WebFIX Error Codes

При ошибках возвращается объект:

```json
{
  "webfix": "1.0",
  "error": {
    "code": 13,
    "message": "WebFIX method not found"
  }
}
```

| Код   | Описание                         |
| ----- | -------------------------------- |
| `13`  | WebFIX method not found          |
| `400` | Invalid WebFIX request structure |

### Worker Error Types

В статистике воркеров различаются типы ошибок:

#### Network Errors

Сетевые ошибки (временные, retry возможен):

- `RequestTimeout` — таймаут запроса
- `NetworkError` — сетевая ошибка
- `RateLimitExceeded` — превышен лимит запросов
- `InvalidAccessError` — ошибка доступа
- `AbortError` — запрос отменен
- `ExchangeNotAvailable` — биржа недоступна
- Ошибки WebSocket
- CloudFront ошибки
- 403 Forbidden / 451 Unavailable For Legal Reasons

#### Critical Errors

Критические ошибки (проблема в коде):

- Все остальные ошибки JavaScript
- Syntax errors
- Reference errors
- Type errors

### Error Handling

#### Для Network Errors:

- Exponential backoff: 5s → 7.5s → 11.25s → ... (max 60s)
- После 20 последовательных сетевых ошибок — пауза 5 минут
- Счетчик `consecutiveErrors` сбрасывается после успешного выполнения

#### Для Critical Errors:

- Exponential backoff: 1s → 2s → 4s → 8s → 10s (max)
- После 10 критических ошибок — остановка воркера
- После 50 последовательных ошибок любого типа — остановка воркера

---

## Примеры использования

### Создание и запуск простого воркера

```javascript
// 1. Создать воркер
const createResponse = await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({
    webfix: "1.0",
    method: "setWorker",
    body: {
      scriptContent: `
        logger.info('Worker started!');
        const { config } = Stels;
        logger.info('Node ID:', config.nid);
        await Stels.sleep(10000);
        logger.info('Worker iteration complete');
      `,
      executionMode: "parallel",
      priority: "normal",
    },
  }),
});

const worker = await createResponse.json();
const workerId = worker.value.raw.sid;

// 2. Активировать воркер
await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({
    webfix: "1.0",
    method: "updateWorker",
    body: {
      channel: `ami.worker.${workerId}`,
      raw: { active: true },
    },
  }),
});
```

### Создание leader-режим воркера

```javascript
await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({
    webfix: "1.0",
    method: "setWorker",
    body: {
      scriptContent: `
        // Этот скрипт выполнится только на одном узле
        logger.info('I am the leader!');

        const { config, net } = Stels;
        logger.info('Leader node:', config.nid);

        // Выполняем глобальную задачу
        await performGlobalTask();

        async function performGlobalTask() {
          logger.info('Performing global task...');
          await Stels.sleep(5000);
          logger.info('Global task complete');
        }
      `,
      executionMode: "leader",
      priority: "high",
    },
  }),
});
```

### Мониторинг статистики

```javascript
// Получить статистику
const statsResponse = await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({
    webfix: "1.0",
    method: "getWorkerStats",
  }),
});

const stats = await statsResponse.json();

// Найти воркеры с высоким error rate
const problematicWorkers = stats.workers.filter((w) =>
  parseFloat(w.errorRate) > 1.0
);

console.log("Problematic workers:", problematicWorkers);
```

### Graceful shutdown

```javascript
// Остановить все воркеры
const stopResponse = await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({
    webfix: "1.0",
    method: "stopAllWorkers",
  }),
});

const result = await stopResponse.json();
console.log(`Stopped ${result.stopped}/${result.total} workers`);

if (result.failed > 0) {
  console.error("Failed to stop:", result.errors);
}
```

---

## Лучшие практики

### 1. Структура скриптов

✅ **Правильно:**

```javascript
// Используйте logger вместо console
logger.info("Starting balance check");

// Обрабатывайте ошибки
try {
  await checkBalances();
} catch (error) {
  logger.error("Balance check failed", error);
}

// Используйте Stels.sleep для задержек
await Stels.sleep(5000);
```

❌ **Неправильно:**

```javascript
// НЕ используйте console.*
console.log("Starting"); // НЕ будет логироваться

// НЕ используйте setTimeout
setTimeout(() => {}, 5000); // Может работать некорректно

// НЕ забывайте await
Stels.sleep(5000); // Не будет ждать!
```

### 2. Режимы выполнения

- **`parallel`** — для задач, которые нужно выполнять на каждом узле (мониторинг локальных ресурсов)
- **`leader`** — для глобальных задач, которые должны выполняться один раз (агрегация данных, рассылка уведомлений)
- **`exclusive`** — для задач, привязанных к конкретному узлу (работа с локальными файлами)

### 3. Обработка ошибок

```javascript
// Различайте network и critical ошибки
try {
  const data = await fetchFromExchange();
} catch (error) {
  if (error.name === "RequestTimeout" || error.name === "RateLimitExceeded") {
    // Network error - система сделает retry автоматически
    throw error;
  } else {
    // Critical error - проблема в коде
    logger.error("Critical error in logic", error);
    throw error;
  }
}
```

### 4. Оптимизация производительности

```javascript
// ✅ Используйте адаптивные задержки
const { config } = Stels;
const delay = config.workers > 10 ? 1000 : 500;
await Stels.sleep(delay);

// ✅ Логируйте только важные события
if (iteration % 100 === 0) {
  logger.info(`Processed ${iteration} iterations`);
}

// ❌ НЕ логируйте на каждой итерации
logger.info("Iteration", iteration); // Слишком много логов!
```

### 5. Dependencies

```javascript
// Всегда указывайте зависимости
{
  dependencies: ['gliesereum'],  // Blockchain SDK
  version: '1.19.2'
}
```

---

## Ограничения

- **Max concurrent connections:** 100,000 WebSocket соединений
- **Script size:** Рекомендуется < 50 KB (после минификации)
- **KV entry size:** 64 KB (скрипты автоматически проверяются)
- **Leader lease duration:** 60 секунд
- **Leader renewal interval:** 30 секунд
- **Max consecutive network errors:** 20 (затем пауза 5 минут)
- **Max critical errors:** 10 (затем остановка воркера)
- **Max consecutive errors:** 50 (затем остановка воркера)

---

## Changelog

### v2.0.0 (2025-10-15)

- ✨ Добавлен режим `executionMode: "leader"` с distributed consensus
- ✨ Добавлен режим `executionMode: "exclusive"` для узлов
- ✨ Добавлен endpoint `getLeaderInfo`
- ✨ Добавлен endpoint `getWorkerStats` с расширенной статистикой
- 🔥 Улучшена обработка ошибок с разделением на network/critical
- 🔥 Добавлен автоматический hot reload при изменении скриптов
- 🔥 Добавлена система приоритетов воркеров

---

**Документация актуальна для:** Heterogen Runtime v2.0.0

**Автор:** STELS Laboratory

**Контакт:** support@stels.dev
