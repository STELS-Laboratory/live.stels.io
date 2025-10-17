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
  - [Мигрировать воркер](#7-мигрировать-воркер)
- [Примеры использования](#примеры-использования)
  - [Миграция с новым SID](#миграция-с-новым-sid-local--network)
- [Типы данных](#типы-данных)
- [Коды ошибок](#коды-ошибок)
- [Краткая справка](#краткая-справка-по-scope--execution-mode)

---

## Обзор

Worker API предоставляет управление распределенными воркерами в Heterogen
Runtime. Воркеры представляют собой JavaScript скрипты, выполняемые на узлах
сети с поддержкой двух уровней видимости:

### Scope (Область видимости)

- **local** — воркер хранится в локальной KV базе данных, виден только на
  текущем узле (по умолчанию)
- **network** — воркер хранится в распределенной KV базе данных, виден всем
  узлам в сети

### Execution Mode (Режим выполнения)

- **parallel** — выполняется на всех узлах одновременно (только
  `scope: "network"`)
- **leader** — выполняется только на одном узле-лидере (работает с `local` и
  `network`)
- **exclusive** — выполняется только на назначенном узле (только
  `scope: "network"`)

### ⚠️ Важные ограничения Scope + Execution Mode

| Scope     | parallel | leader | exclusive |
| --------- | -------- | ------ | --------- |
| `local`   | ❌       | ✅     | ❌        |
| `network` | ✅       | ✅     | ✅        |

**Правило:** Локальные воркеры (`scope: "local"`) могут использовать **только
режим `leader`**, так как они выполняются на одном узле и не могут быть
параллельными с другими узлами или назначены на конкретный узел.

### Конфигурация WORKERS

Переменная окружения `WORKERS` контролирует обработку **только сетевых
воркеров** (`scope: "network"`):

- **`WORKERS=0`** (рекомендуется для разработки):
  - ✅ Локальные воркеры (`scope: "local"`) работают **всегда**
  - ❌ Сетевые воркеры (`scope: "network"`) игнорируются
  - Идеально для локальной разработки и тестирования

- **`WORKERS=1`** (для продакшн):
  - ✅ Локальные воркеры работают
  - ✅ Сетевые воркеры обрабатываются
  - Полная функциональность

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

Создает новый воркер и сохраняет его в локальном или распределенном KV store.

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
    "scope": "local",
    "executionMode": "leader",
    "priority": "normal",
    "accountId": "account-uuid"
  }
}
```

#### Request Parameters

| Параметр        | Тип      | Обязательный | По умолчанию                                         | Описание                                                                          |
| --------------- | -------- | ------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `scriptContent` | string   | Нет          | `"\nlogger.info(\"Worker script initialized!\");\n"` | JavaScript код воркера                                                            |
| `dependencies`  | string[] | Нет          | ["gliesereum"]                                       | Список зависимостей                                                               |
| `version`       | string   | Нет          | "1.19.2"                                             | Версия воркера                                                                    |
| `scope`         | string   | Нет          | "local"                                              | Область видимости: `local` (только этот узел), `network` (вся сеть)               |
| `executionMode` | string   | Нет          | "leader"                                             | Режим выполнения: `leader` (для local), `parallel`/`leader`/`exclusive` (network) |
| `priority`      | string   | Нет          | "normal"                                             | Приоритет: `critical`, `high`, `normal`, `low`                                    |
| `accountId`     | string   | Нет          | -                                                    | ID связанного аккаунта                                                            |
| `assignedNode`  | string   | Условно      | -                                                    | Обязателен для `exclusive` режима                                                 |

> **⚠️ Важно:** Для `scope: "local"` доступен только `executionMode: "leader"`.
> При попытке использовать `parallel` или `exclusive` с local scope будет
> возвращена ошибка.

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
      "scope": "local",
      "executionMode": "leader",
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
  "error": "Local scope workers can only use leader execution mode"
}
```

```json
{
  "error": "Parallel execution mode requires network scope"
}
```

```json
{
  "error": "Exclusive execution mode requires network scope"
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

**Scope и Execution Mode:**

- **`scope: "local"`** (по умолчанию):
  - Воркер виден только на текущем узле, не реплицируется в сеть
  - ✅ Доступен только режим `executionMode: "leader"` (single node execution)
  - ❌ Режимы `parallel` и `exclusive` недоступны

- **`scope: "network"`**:
  - Воркер виден всем узлам в сети
  - ✅ Доступны все режимы: `parallel`, `leader`, `exclusive`
  - Требует `WORKERS=1` для активации на узлах

**Рекомендации:**

- 🧪 Используйте `scope: "local"` для разработки и тестирования
- 🚀 Используйте `scope: "network"` для production воркеров
- 🔄 Для миграции local → network создавайте новый воркер с новым UUID

---

### 2. Список воркеров

Получает список всех воркеров из локального и распределенного KV store.

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
- Воркеры возвращаются из **обоих источников**: локальных и сетевых
- Каждый entry содержит полную информацию о воркере
- Поле `_source` указывает источник: `"local"` или `"network"`
- Поле `scope` в `raw` указывает область видимости воркера
- `versionstamp` используется для оптимистичной блокировки при обновлении

---

### 3. Обновить воркер

Обновляет существующий воркер (например, активирует/деактивирует или меняет
скрипт).

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

> **⚠️ Важно:** Параметр `raw` должен содержать **полный объект WorkerScript**,
> а не частичный! Все поля обязательны, иначе они будут потеряны.

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

- ⚠️ **КРИТИЧНО:** `updateWorker` делает **ПОЛНУЮ ЗАМЕНУ** объекта `raw`, а НЕ
  частичное обновление!
- Вы ДОЛЖНЫ передать ВСЕ поля `WorkerScript` в параметре `raw`, иначе
  непереданные поля будут потеряны
- Рекомендуется сначала получить текущие данные через `listWorkers`, затем
  изменить нужные поля и передать полный объект
- Использует оптимистичную блокировку через `versionstamp` (защита от race
  conditions)
- При изменении `active: false → true` воркер автоматически запускается на узлах
- При изменении `active: true → false` воркер останавливается
- При изменении `script` происходит hot reload (перезапуск с новым кодом)
- **При изменении `scope`** воркер автоматически мигрирует между локальным и
  сетевым хранилищем
- Миграция воркера: удаляет из старого источника и создает в новом атомарно

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
- `scriptHash` — короткий хеш скрипта (первые 8 символов) для отслеживания
  изменений
- Воркеры в режиме `leader` показывают статистику только на узле-лидере

---

### 6. Информация о лидере

Получает информацию о текущем лидере для воркера в режиме
`executionMode: "leader"`.

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

### 7. Мигрировать воркер

Перемещает воркер между локальным и сетевым хранилищем (`local` ↔ `network`).

**Method:** `POST`

**WebFIX Method:** `migrateWorker`

#### Request

```json
{
  "webfix": "1.0",
  "method": "migrateWorker",
  "body": {
    "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000",
    "targetScope": "local"
  }
}
```

#### Request Parameters

| Параметр      | Тип    | Обязательный | Описание                                             |
| ------------- | ------ | ------------ | ---------------------------------------------------- |
| `channel`     | string | Да           | Путь к воркеру в формате `ami.worker.{sid}`          |
| `targetScope` | string | Да           | Целевая область видимости: `"local"` или `"network"` |

#### Response (200 OK) - Успешная миграция

```json
{
  "message": "Worker migrated successfully",
  "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000",
  "from": "network",
  "to": "local",
  "worker": {
    "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000",
    "module": "worker",
    "widget": "widget.ami.worker.550e8400-e29b-41d4-a716-446655440000",
    "raw": {
      "sid": "550e8400-e29b-41d4-a716-446655440000",
      "nid": "s-0001",
      "active": true,
      "mode": "loop",
      "scope": "local",
      "executionMode": "parallel",
      "priority": "normal",
      "note": "Migrated worker",
      "script": "logger.info('Hello from worker!');",
      "dependencies": ["gliesereum"],
      "version": "1.19.2",
      "timestamp": 1760250000000
    },
    "timestamp": 1760250000000
  }
}
```

#### Response (200 OK) - Уже в целевой области

```json
{
  "message": "Worker is already in local scope",
  "scope": "local",
  "channel": "ami.worker.550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response (400 Bad Request)

```json
{
  "error": "Missing required fields: channel and targetScope"
}
```

```json
{
  "error": "Invalid targetScope. Must be 'local' or 'network'"
}
```

#### Response (404 Not Found)

```json
{
  "error": "Worker not found"
}
```

#### Response (500 Internal Server Error)

```json
{
  "error": "Migration failed: could not create worker in target"
}
```

```json
{
  "error": "Internal Server Error"
}
```

#### Важные детали

- Миграция выполняется атомарно: создается в новом месте, затем удаляется из
  старого
- Автоматически обновляется поле `scope` в `WorkerScript`
- Сохраняются все остальные параметры воркера (активность, скрипт, режим и т.д.)
- Если воркер уже в целевом `scope`, операция возвращает успех без изменений
- **Альтернатива**: можно использовать `updateWorker` с изменением `scope` для
  той же цели
- При миграции с `network` → `local`: воркер перестает быть виден другим узлам
- При миграции с `local` → `network`: воркер становится доступен всем узлам в
  сети
- Если воркер активен, он будет перезапущен после миграции

#### Примеры использования

**Миграция из сети в локальное хранилище:**

```javascript
// Сделать воркер локальным (скрыть от сети)
await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({
    webfix: "1.0",
    method: "migrateWorker",
    body: {
      channel: "ami.worker.550e8400-e29b-41d4-a716-446655440000",
      targetScope: "local",
    },
  }),
});
```

**Миграция из локального в сетевое хранилище:**

```javascript
// Сделать воркер видимым в сети
await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({
    webfix: "1.0",
    method: "migrateWorker",
    body: {
      channel: "ami.worker.550e8400-e29b-41d4-a716-446655440000",
      targetScope: "network",
    },
  }),
});
```

### Миграция с новым SID (Local → Network)

Для миграции локального воркера в сеть с **новым UUID** (рекомендуется для
production):

```javascript
// 1. Получить локальный воркер
const workersResponse = await fetch("http://localhost:3000", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stels-session": sessionToken,
  },
  body: JSON.stringify({ webfix: "1.0", method: "listWorkers" }),
});
const workers = await workersResponse.json();
const localWorker = workers.find(
  (w) => w.value.raw.sid === "local-worker-id",
);

// 2. Создать новый воркер с network scope
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
      scriptContent: localWorker.value.raw.script,
      dependencies: localWorker.value.raw.dependencies,
      version: localWorker.value.raw.version,
      scope: "network", // Мигрируем в сеть
      executionMode: localWorker.value.raw.executionMode,
      priority: localWorker.value.raw.priority,
      mode: localWorker.value.raw.mode,
      note: `[Migrated] ${localWorker.value.raw.note}`,
    },
  }),
});

// 3. Новый воркер создан с новым UUID в network scope
// 4. Проверить работу, затем удалить старый локальный воркер если нужно
```

**Преимущества миграции с новым SID:**

- ✅ Новый UUID предотвращает конфликты
- ✅ Старый локальный воркер остается нетронутым (можно откатиться)
- ✅ Безопасная миграция без downtime
- ✅ Возможность тестирования перед удалением старого

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
  scope?: "local" | "network"; // Область видимости (по умолчанию "local")
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

### WorkerScope

Область видимости воркера (где он хранится и кто его видит).

```typescript
type WorkerScope = "local" | "network";
```

- **`local`** — Воркер хранится в локальной KV базе данных, виден только на
  текущем узле (по умолчанию)
- **`network`** — Воркер хранится в распределенной KV базе данных, виден всем
  узлам в сети

### ExecutionMode

Режим распределения выполнения по узлам.

```typescript
type ExecutionMode = "parallel" | "leader" | "exclusive";
```

- **`parallel`** — Воркер выполняется параллельно на всех узлах (только
  `scope: "network"`)
- **`leader`** — Выполняется только на одном узле (работает с `local` и
  `network`)
  - Для `scope: "local"` — единственный доступный режим (single node execution)
  - Для `scope: "network"` — distributed consensus с leader election
- **`exclusive`** — Выполняется только на узле, указанном в `assignedNode`
  (только `scope: "network"`)

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

### Создание leader-режим воркера (local scope)

```javascript
// Локальный воркер (только на этом узле)
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
        // Этот скрипт выполняется только на локальном узле
        logger.info('Local worker started on:', Stels.config.nid);

        // Локальная задача для этого узла
        await performLocalTask();

        async function performLocalTask() {
          logger.info('Performing local task...');
          await Stels.sleep(5000);
          logger.info('Local task complete');
        }
      `,
      scope: "local", // Только на этом узле
      executionMode: "leader", // Единственный доступный для local
      priority: "normal",
    },
  }),
});
```

### Создание leader-режим воркера (network scope)

```javascript
// Сетевой воркер с distributed consensus
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
        // Этот скрипт выполнится только на одном узле-лидере из всей сети
        logger.info('I am the network leader!');

        const { config, net } = Stels;
        logger.info('Leader node:', config.nid);

        // Выполняем глобальную задачу для всей сети
        await performGlobalTask();

        async function performGlobalTask() {
          logger.info('Performing global task...');
          await Stels.sleep(5000);
          logger.info('Global task complete');
        }
      `,
      scope: "network", // Виден всей сети
      executionMode: "leader", // Distributed leader election
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

### 2. Выбор scope и режима выполнения

#### Scope (Область видимости)

- **`scope: "local"`** (по умолчанию) — для разработки, тестирования и задач,
  специфичных для узла:
  - Тестирование новых стратегий
  - Отладка без влияния на сеть
  - Приватные воркеры
  - Локальные утилиты и мониторинг

- **`scope: "network"`** — для продакшн воркеров, используемых всей сетью:
  - Распределенные задачи
  - Воркеры с leader election
  - Общие сервисы
  - Синхронизированная работа по сети

#### Execution Mode (Режим выполнения)

- **`executionMode: "parallel"`** (только `scope: "network"`):
  - Задачи на каждом узле сети
  - Мониторинг локальных ресурсов на всех узлах
  - Независимые операции на всех узлах
  - ❌ Не доступен для локальных воркеров

- **`executionMode: "leader"`** (работает с `local` и `network`):
  - ✅ **Единственный доступный режим для `scope: "local"`**
  - Выполнение на одном узле (local) или лидере сети (network)
  - Глобальные задачи (один раз на всю сеть для network scope)
  - Агрегация данных
  - Рассылка уведомлений
  - Distributed consensus (только для network scope)

- **`executionMode: "exclusive"`** (только `scope: "network"`):
  - Задачи для конкретного назначенного узла
  - Работа с локальными файлами на определенном узле
  - Узлоспецифичные операции
  - ❌ Не доступен для локальных воркеров

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

### v2.2.0 (2025-10-17)

- ✨ **BREAKING:** Локальные воркеры теперь поддерживают только
  `executionMode: "leader"`
- ✨ Режимы `parallel` и `exclusive` доступны только для `scope: "network"`
- ✨ Добавлена автоматическая коррекция: при выборе `scope: "local"`
  автоматически устанавливается `executionMode: "leader"`
- ✨ Добавлена валидация при создании/обновлении воркеров
- ✨ Добавлен функционал миграции local → network с генерацией нового UUID
- 📚 Обновлена документация с таблицей совместимости scope/executionMode
- 🔥 UI теперь автоматически блокирует недоступные режимы в зависимости от scope

### v2.1.0 (2025-10-17)

- ✨ Добавлена поддержка `scope: "local" | "network"` для контроля видимости
  воркеров
- ✨ **По умолчанию воркеры создаются локально** (`scope: "local"`) и
  выполняются только на текущем узле
- ✨ **Локальные воркеры работают всегда**, даже при `WORKERS=0` в конфигурации
- ✨ Параметр `WORKERS` теперь контролирует только сетевые воркеры
  (`scope: "network"`)
- ✨ Добавлен endpoint `migrateWorker` для перемещения воркеров между local и
  network
- ✨ `updateWorker` теперь поддерживает автоматическую миграцию при изменении
  `scope`
- ✨ `listWorkers` возвращает воркеры из обоих источников (local + network)
- ✨ `stopAllWorkers` останавливает воркеры в обоих хранилищах
- 🔥 Worker Engine читает и запускает воркеры из обоих источников

### v2.0.0 (2025-10-15)

- ✨ Добавлен режим `executionMode: "leader"` с distributed consensus
- ✨ Добавлен режим `executionMode: "exclusive"` для узлов
- ✨ Добавлен endpoint `getLeaderInfo`
- ✨ Добавлен endpoint `getWorkerStats` с расширенной статистикой
- 🔥 Улучшена обработка ошибок с разделением на network/critical
- 🔥 Добавлен автоматический hot reload при изменении скриптов
- 🔥 Добавлена система приоритетов воркеров

---

**Документация актуальна для:** Heterogen Runtime v2.2.0

**Автор:** STELS Laboratory

**Контакт:** support@stels.dev

---

## Краткая справка по Scope + Execution Mode

| Scope     | Parallel | Leader           | Exclusive |
| --------- | -------- | ---------------- | --------- |
| `local`   | ❌       | ✅ (only option) | ❌        |
| `network` | ✅       | ✅               | ✅        |

**Ключевые правила:**

- 🔵 **Local scope** → только `leader` mode (single node, no distribution)
- 🟢 **Network scope** → все режимы (`parallel`/`leader`/`exclusive`)
- 🔄 **Миграция** local → network создает новый воркер с новым UUID
- ⚙️ **WORKERS=0** → локальные работают, сетевые игнорируются
- ⚙️ **WORKERS=1** → все воркеры активны
