# Миграция на новую систему хранения

## Обзор изменений

Новая система хранения предоставляет:
- ✅ Параллельные операции (Promise.all)
- - Асинхронный API для неблокирующих операций
- ✅ Автоматический выбор оптимального провайдера
- ✅ Обратная совместимость со старым кодом

## Быстрая миграция

### Вариант 1: Минимальные изменения (рекомендуется для начала)

Старый код продолжит работать без изменений благодаря адаптеру обратной совместимости:

```typescript
// Старый код - работает как раньше
import { getSessionStorageManager } from "@/lib/gui/ui";

const manager = getSessionStorageManager();
const data = manager.getData("channel"); // Синхронный
```

### Вариант 2: Постепенная миграция

Используйте async версию для лучшей производительности:

```typescript
import { getSessionStorageManager } from "@/lib/storage";

const manager = getSessionStorageManager();
const data = await manager.getDataAsync("channel"); // Асинхронный
```

### Вариант 3: Полная миграция (максимальная производительность)

Используйте новый StorageManager API:

```typescript
import { getStorageManager } from "@/lib/storage";

const storage = getStorageManager();

// Параллельные операции
const items = await storage.getItems(["channel1", "channel2", "channel3"]);

// Batch запись
const dataMap = new Map([
  ["channel1", data1],
  ["channel2", data2],
]);
await storage.setItems(dataMap);
```

## Примеры миграции

### Пример 1: Простое чтение

**До:**
```typescript
const manager = getSessionStorageManager();
const data = manager.getData("channel");
```

**После:**
```typescript
const storage = getStorageManager();
const item = await storage.getItem("channel");
const data = item?.data;
```

### Пример 2: Множественное чтение

**До:**
```typescript
const manager = getSessionStorageManager();
const channels = ["ch1", "ch2", "ch3"];
const results = {};
for (const channel of channels) {
  results[channel] = manager.getData(channel);
}
```

**После:**
```typescript
const storage = getStorageManager();
const channels = ["ch1", "ch2", "ch3"];
const results = await storage.getItems(channels);
// Параллельное выполнение автоматически!
```

### Пример 3: WebSocket батчинг

**До:**
```typescript
let messageBatch = {};
function scheduleMessageBatch() {
  requestAnimationFrame(() => {
    Object.entries(messageBatch).forEach(([channel, data]) => {
      sessionStorage.setItem(channel, data);
    });
    messageBatch = {};
  });
}
```

**После:**
```typescript
import { getWebSocketStorageBatcher } from "@/lib/storage";

const batcher = getWebSocketStorageBatcher();

// Добавление сообщений
batcher.addMessage("channel", data);

// Автоматическая обработка с параллелизмом
// Или принудительная обработка:
await batcher.flush();
```

### Пример 4: Подписка на обновления

**До:**
```typescript
const manager = getSessionStorageManager();
const unsubscribe = manager.subscribe("channel", (data) => {
  console.log(data);
});
```

**После:**
```typescript
// Вариант 1: Старый API (работает)
const manager = getSessionStorageManager();
const unsubscribe = manager.subscribe("channel", (data) => {
  console.log(data);
});

// Вариант 2: Новый подход с polling
const storage = getStorageManager();
useEffect(() => {
  const interval = setInterval(async () => {
    const item = await storage.getItem("channel");
    if (item) setData(item.data);
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

## Преимущества новой системы

### 1. Параллелизм

**Старый подход (последовательно):**
```typescript
for (const channel of channels) {
  await storage.setItem(channel, data); // 100ms × 100 = 10s
}
```

**Новый подход (параллельно):**
```typescript
await storage.setItems(new Map(channels.map(c => [c, data]))); // ~100ms
```

### 2. Автоматическая оптимизация

Система автоматически выбирает оптимальный провайдер:
- Маленькие данные (<10KB) → Memory (мгновенно)
- Средние данные (<100KB) → SessionStorage (быстро)
- Большие данные (>100KB) → IndexedDB (надежно)

### 3. Асинхронность

Все операции неблокирующие:
```typescript
// Не блокирует UI thread
await storage.setItem("channel", largeData);
```

## Рекомендации

1. **Начните с обратной совместимости** - старый код продолжит работать
2. **Мигрируйте постепенно** - обновляйте компоненты по одному
3. **Используйте параллельные операции** - для множественных данных используйте `getItems`/`setItems`
4. **Выбирайте правильный провайдер** - используйте `priority` опцию для оптимизации

## Обратная совместимость

Все существующие API продолжают работать:
- ✅ `getSessionStorageManager()` - работает как раньше
- ✅ `getData()` - синхронный метод
- ✅ `subscribe()` - подписка на обновления
- ✅ `invalidateCache()` - инвалидация кэша

Новые возможности доступны через:
- ✅ `getStorageManager()` - новый универсальный API
- ✅ `getDataAsync()` - асинхронная версия
- ✅ Параллельные операции через `getItems`/`setItems`

