# Universal Storage System

Универсальная система хранения данных с поддержкой множественных провайдеров, параллелизма и обратной совместимости.

## Возможности

- ✅ **Множественные провайдеры**: Memory, SessionStorage, IndexedDB, Hybrid
- ✅ **Параллельные операции**: Batch чтение/запись с Promise.all
- ✅ **Автоматический выбор**: Оптимальный провайдер на основе размера данных
- ✅ **Обратная совместимость**: Адаптер для существующего кода
- ✅ **Асинхронность**: Полностью async API для неблокирующих операций
- ✅ **TTL поддержка**: Автоматическая очистка устаревших данных
- ✅ **Кэширование**: In-memory кэш для быстрого доступа

## Использование

### Базовое использование

```typescript
import { getStorageManager } from "@/lib/storage";

const storage = getStorageManager();

// Сохранение данных
await storage.setItem("channel", { data: "value" });

// Получение данных
const item = await storage.getItem("channel");

// Параллельное получение множественных данных
const items = await storage.getItems(["channel1", "channel2", "channel3"]);

// Параллельное сохранение множественных данных
const dataMap = new Map([
  ["channel1", { data: "value1" }],
  ["channel2", { data: "value2" }],
]);
await storage.setItems(dataMap);
```

### Переключение провайдеров

```typescript
import { getStorageManager } from "@/lib/storage";

const storage = getStorageManager();

// Переключение на memory (быстрый, но не персистентный)
storage.switchProvider("memory");

// Переключение на sessionStorage
storage.switchProvider("session");

// Переключение на IndexedDB (для больших данных)
storage.switchProvider("indexeddb");

// Использование hybrid (автоматический выбор)
storage.switchProvider("hybrid");
```

### Использование с опциями

```typescript
import { getStorageManager } from "@/lib/storage";

const storage = getStorageManager();

// Сохранение с TTL (24 часа)
await storage.setItem("channel", data, {
  ttl: 24 * 60 * 60 * 1000,
});

// Приоритет производительности (использует memory)
await storage.setItem("channel", data, {
  priority: "performance",
});

// Приоритет персистентности (использует IndexedDB)
await storage.setItem("channel", data, {
  priority: "persistence",
});
```

### Обратная совместимость

```typescript
import { getSessionStorageManager } from "@/lib/storage";

// Старый API (синхронный)
const manager = getSessionStorageManager();
const data = manager.getData("channel");

// Новый API (асинхронный, рекомендуется)
const data = await manager.getDataAsync("channel");

// Подписка на обновления (совместимо со старым API)
const unsubscribe = manager.subscribe("channel", (data) => {
  console.log("Data updated:", data);
});
```

### Параллельные операции

```typescript
import { getStorageManager } from "@/lib/storage";

const storage = getStorageManager();

// Параллельное чтение множественных каналов
const channels = ["channel1", "channel2", "channel3", "channel4"];
const results = await storage.getItems(channels);

// Параллельная запись множественных каналов
const dataMap = new Map([
  ["channel1", data1],
  ["channel2", data2],
  ["channel3", data3],
]);

await storage.setItems(dataMap, {
  ttl: 3600000,
  priority: "balance",
});
```

## Провайдеры

### Memory Provider
- **Скорость**: ⚡⚡⚡ Очень быстро
- **Персистентность**: ❌ Нет (очищается при перезагрузке)
- **Лимит**: Настраиваемый (по умолчанию 100MB)
- **Использование**: Временные данные, горячий кэш

### Session Storage Provider
- **Скорость**: ⚡⚡ Быстро
- **Персистентность**: ✅ Да (до закрытия вкладки)
- **Лимит**: ~5-10MB
- **Использование**: Средние данные, сессионные данные

### IndexedDB Provider
- **Скорость**: ⚡ Средне
- **Персистентность**: ✅✅ Да (постоянное хранение)
- **Лимит**: До 50% дискового пространства
- **Использование**: Большие данные, долгосрочное хранение

### Hybrid Provider (Рекомендуется)
- **Скорость**: ⚡⚡⚡ Автоматическая оптимизация
- **Персистентность**: ✅✅ Да
- **Лимит**: Комбинированный
- **Использование**: Универсальное решение

## Миграция существующего кода

### До (старый код)

```typescript
import { getSessionStorageManager } from "@/lib/gui/ui";

const manager = getSessionStorageManager();
const data = manager.getData("channel");
```

### После (новый код)

```typescript
// Вариант 1: Полная миграция (рекомендуется)
import { getStorageManager } from "@/lib/storage";

const storage = getStorageManager();
const item = await storage.getItem("channel");
const data = item?.data;

// Вариант 2: Обратная совместимость (без изменений)
import { getSessionStorageManager } from "@/lib/storage";

const manager = getSessionStorageManager();
const data = await manager.getDataAsync("channel"); // Async версия
```

## Производительность

### Параллельные операции

Новая система использует `Promise.all` для параллельного выполнения операций:

```typescript
// Старый подход (последовательно)
for (const channel of channels) {
  await storage.setItem(channel, data);
}

// Новый подход (параллельно)
await storage.setItems(new Map(channels.map(c => [c, data])));
```

### Batch операции

Операции автоматически батчатся для оптимизации:

- **Memory**: Нет батчинга (мгновенный доступ)
- **SessionStorage**: Батчи по 10 элементов
- **IndexedDB**: Батчи по 50 элементов
- **Hybrid**: Адаптивный батчинг

## API Reference

### StorageManager

```typescript
class StorageManager {
  // Переключение провайдера
  switchProvider(type: StorageType): void;
  
  // Получение текущего провайдера
  getCurrentProvider(): StorageType;
  
  // Получение провайдера
  getProvider(type?: StorageType): IStorageProvider;
  
  // Операции с данными
  getItem<T>(channel: string, providerType?: StorageType): Promise<StoredItem<T> | null>;
  setItem<T>(channel: string, data: T, options?: StorageOptions, providerType?: StorageType): Promise<void>;
  removeItem(channel: string, providerType?: StorageType): Promise<void>;
  
  // Параллельные операции
  getItems<T>(channels: string[], providerType?: StorageType): Promise<Map<string, StoredItem<T> | null>>;
  setItems<T>(items: Map<string, T>, options?: StorageOptions, providerType?: StorageType): Promise<void>;
  removeItems(channels: string[], providerType?: StorageType): Promise<void>;
  
  // Утилиты
  getAllKeys(providerType?: StorageType): Promise<string[]>;
  clear(providerType?: StorageType): Promise<void>;
  getSize(providerType?: StorageType): Promise<number>;
  has(channel: string, providerType?: StorageType): Promise<boolean>;
  
  // Информация
  getAvailableProviders(): StorageType[];
}
```

## Примеры использования

### WebSocket интеграция

```typescript
import { getStorageManager } from "@/lib/storage";

const storage = getStorageManager();

// Батчинг сообщений от WebSocket
const messageBatch = new Map<string, unknown>();

function scheduleMessageBatch() {
  if (messageBatch.size === 0) return;
  
  // Параллельная запись всех сообщений
  storage.setItems(messageBatch, {
    priority: "balance",
    ttl: 24 * 60 * 60 * 1000,
  }).then(() => {
    messageBatch.clear();
  });
}
```

### Компонент с подпиской

```typescript
import { useEffect, useState } from "react";
import { getStorageManager } from "@/lib/storage";

function useChannelData(channel: string) {
  const [data, setData] = useState<unknown>(null);
  const storage = getStorageManager();

  useEffect(() => {
    // Начальная загрузка
    storage.getItem(channel).then((item) => {
      if (item) setData(item.data);
    });

    // Подписка на обновления
    const interval = setInterval(async () => {
      const item = await storage.getItem(channel);
      if (item) setData(item.data);
    }, 1000);

    return () => clearInterval(interval);
  }, [channel]);

  return data;
}
```

## Конфигурация

```typescript
import { getStorageManager } from "@/lib/storage";

const storage = getStorageManager({
  defaultProvider: "hybrid", // "memory" | "session" | "indexeddb" | "hybrid"
  enableHybrid: true,
  memoryLimit: 100 * 1024 * 1024, // 100MB
});
```

