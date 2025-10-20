# Schema Constructor Application

Professional UI Schema Builder с IndexedDB и мульти-канальной поддержкой.

## Обзор

Schema Constructor — это конструктор UI схем с возможностью:

- Создания и редактирования схем UI
- Привязки схем к нескольким каналам из session storage
- Сохранения схем локально в IndexedDB
- Объединения данных из разных источников в одну UI

## Возможности

### 1. **IndexedDB Storage**

Все схемы сохраняются локально в браузере:

```typescript
interface SchemaProject {
  id: string; // Уникальный ID
  name: string; // Название схемы
  description: string; // Описание
  widgetKey: string; // widget.testnet.runtime.book.SOL/USDT.bybit.spot
  channelKeys: string[]; // [testnet.runtime.book.SOL/USDT.bybit.spot, ...]
  schema: UINode; // JSON схема UI
  createdAt: number; // Timestamp создания
  updatedAt: number; // Timestamp обновления
}
```

### 2. **Табы для Схем**

Каждая схема отображается как отдельная вкладка:

- Переключение между схемами
- Показ количества привязанных каналов
- Активная схема подсвечивается

### 3. **CRUD Операции**

**Создать схему:**

1. Выберите один или несколько каналов
2. Нажмите "Create Schema"
3. Введите название и описание
4. Схема автоматически сохранится в IndexedDB

**Редактировать схему:**

- Изменяйте JSON в редакторе
- Нажмите "Save Schema" для сохранения
- Или "Edit Info" для изменения названия/описания

**Удалить схему:**

- Нажмите "Delete" на активной схеме
- Подтвердите удаление

### 4. **Мульти-канальная Поддержка**

Выбирайте несколько каналов для одной схемы:

```
Channels (Multi-select):
☑ testnet.runtime.ticker.BTC/USDT.bybit.spot
☑ testnet.runtime.book.BTC/USDT.bybit.spot  
☑ testnet.runtime.trades.BTC/USDT.bybit.spot
```

Данные из всех каналов объединяются в один контекст:

```typescript
mergedData = {
  // Данные первого канала доступны напрямую
  exchange: "bybit",
  market: "BTC/USDT",
  data: {...},
  
  // Данные каждого канала доступны по ключу
  "testnet.runtime.ticker.BTC/USDT.bybit.spot": {...},
  "testnet.runtime.book.BTC/USDT.bybit.spot": {...},
  "testnet.runtime.trades.BTC/USDT.bybit.spot": {...},
}
```

### 5. **Live Preview**

Real-time превью с реальными данными:

- Автоматическое обновление при изменении схемы
- Показ активных каналов
- Индикаторы live data

## Использование

### Создание Схемы

1. **Выберите каналы:**
   - В левой панели выберите один или несколько каналов
   - Используйте "Select All" для выбора всех
   - Или "Clear" для сброса

2. **Создайте схему:**
   - Нажмите "Create Schema"
   - Введите название (обязательно)
   - Добавьте описание (опционально)
   - Нажмите "Create Schema"

3. **Редактируйте UI:**
   - В JSON редакторе создайте вашу схему
   - Используйте данные из выбранных каналов
   - Нажмите "Save Schema"

### Универсальные Схемы с `self`

**Для переиспользования схемы на разных каналах используйте переменную `self`:**

Одна схема, много виджетов:

```json
{
  "type": "div",
  "className": "bg-zinc-900 p-4 w-[300px]",
  "children": [
    {
      "type": "div",
      "className": "flex gap-4",
      "children": [
        {
          "type": "div",
          "text": "{self.raw.exchange}",
          "className": "uppercase text-pink-500"
        },
        {
          "type": "div",
          "text": "{self.raw.market}",
          "className": "text-zinc-100"
        }
      ]
    },
    {
      "type": "div",
      "text": "${self.raw.data.last}",
      "className": "text-2xl font-bold",
      "format": { "type": "number", "decimals": 2 }
    }
  ]
}
```

**Применение:**

- ✅ widget.custom.1760935149260 для BTC/USDT
- ✅ widget.custom.1760935149260 для SOL/USDT
- ✅ widget.custom.1760935149260 для ETH/USDT

Одна схема автоматически адаптируется под любой канал!

### Работа с Данными из Нескольких Каналов

**Структура данных в session:**

```json
{
  "channel": "testnet.runtime.ticker.SOL/USDT.bybit.spot",
  "module": "ticker",
  "widget": "widget.testnet.runtime.ticker.SOL/USDT.bybit.spot",
  "raw": {
    "exchange": "bybit",
    "market": "SOL/USDT",
    "data": {
      "last": 191.56,
      "bid": 191.56,
      "ask": 191.57,
      "change": 4.67,
      "percentage": 2.49
    },
    "timestamp": 1760934787416
  },
  "active": true,
  "timestamp": 1760934787416
}
```

**Доступ через alias:**

```json
{
  "type": "div",
  "children": [
    {
      "type": "div",
      "text": "{btc_ticker.raw.data.last}",
      "comment": "Доступ к данным из raw.data"
    },
    {
      "type": "div",
      "text": "{btc_ticker.raw.exchange} - {btc_ticker.raw.market}",
      "comment": "Доступ к метаданным из raw"
    },
    {
      "type": "div",
      "text": "Active: {btc_ticker.active}",
      "comment": "Доступ к полям верхнего уровня"
    }
  ]
}
```

**Пример комбинирования данных:**

```json
{
  "type": "div",
  "className": "grid grid-cols-3 gap-4 p-4",
  "children": [
    {
      "type": "div",
      "className": "flex flex-col gap-2",
      "children": [
        {
          "type": "div",
          "text": "Price: ${btc_ticker.raw.data.last}",
          "format": { "type": "number", "decimals": 2 },
          "className": "text-2xl font-bold"
        },
        {
          "type": "div",
          "text": "{btc_ticker.raw.exchange} - {btc_ticker.raw.market}",
          "className": "text-xs text-zinc-500"
        }
      ]
    },
    {
      "type": "div",
      "text": "Bid: ${btc_book.raw.data.bids[0][0]}",
      "format": { "type": "number", "decimals": 2 }
    },
    {
      "type": "div",
      "text": "Last Trade: ${btc_trades.raw.data[0].price}",
      "format": { "type": "number", "decimals": 2 }
    }
  ]
}
```

## Структура Widget Key

Widget key генерируется автоматически на основе первого выбранного канала:

```
Channel:  testnet.runtime.book.SOL/USDT.bybit.spot
         ↓
Widget:   widget.testnet.runtime.book.SOL/USDT.bybit.spot
```

Этот ключ используется для идентификации виджета в системе.

## API

### IndexedDB Functions

```typescript
// Получить все схемы
const schemas = await getAllSchemas();

// Получить схему по ID
const schema = await getSchema(id);

// Сохранить схему (create/update)
await saveSchema(schema);

// Удалить схему
await deleteSchema(id);

// Генерация ключей
const widgetKey = generateWidgetKey(channelKeys);
const schemaId = generateSchemaId();
```

## Schema Format

### Basic Structure

```json
{
  "type": "div",
  "className": "p-4 bg-zinc-900 rounded",
  "children": [...]
}
```

### Text with Formatting

```json
{
  "text": "${data.price}",
  "format": {
    "type": "number",
    "decimals": 2
  }
}
```

### Conditional Rendering

```json
{
  "condition": {
    "key": "active",
    "operator": "===",
    "value": true
  }
}
```

### Iteration (Loops)

```json
{
  "iterate": {
    "source": "data.items",
    "limit": 10,
    "reverse": false
  }
}
```

### Dynamic Styles

```json
{
  "style": {
    "color": {
      "condition": {
        "key": "data.change",
        "operator": ">",
        "value": 0
      },
      "true": "#00C853",
      "false": "#D50000"
    }
  }
}
```

## Best Practices

### 1. Именование Схем

```
✅ "BTC/USDT Full Dashboard"
✅ "SOL Market Overview"
❌ "schema1"
❌ "test"
```

### 2. Выбор Каналов

- Выбирайте только нужные каналы
- Для одного виджета обычно достаточно 1-3 каналов
- Проверяйте, что каналы активны (данные поступают)

### 3. Структура Схемы

```json
{
  "type": "div",
  "className": "flex flex-col gap-4 p-4 bg-zinc-900 rounded",
  "children": [
    {
      "type": "div",
      "className": "text-lg font-bold",
      "text": "Header"
    },
    {
      "type": "div",
      "className": "grid grid-cols-2 gap-2",
      "children": [...]
    }
  ]
}
```

### 4. Валидация

- Всегда проверяйте JSON валидность перед сохранением
- Зелёный индикатор = схема валидна
- Красный индикатор = есть ошибки

## Troubleshooting

### Schema не сохраняется

- Проверьте JSON валидность
- Убедитесь, что выбраны каналы
- Проверьте консоль браузера

### Данные не отображаются

- Убедитесь, что каналы активны
- Проверьте структуру данных в превью
- Убедитесь, что воркеры запущены

### Схема не загружается

- Очистите IndexedDB через DevTools
- Перезагрузите страницу
- Создайте схему заново

## Architecture

```
Schemas/
├── Schemas.tsx              # Главный компонент-оркестратор
├── SchemaManager.tsx        # CRUD операции и табы
├── SchemaEditor.tsx         # Monaco JSON редактор
├── SchemaPreview.tsx        # Live превью с UIRenderer
├── MultiChannelSelector.tsx # Выбор нескольких каналов
├── db.ts                    # IndexedDB service
├── types.ts                 # TypeScript definitions
└── index.tsx               # Public exports
```

## Data Flow

```
IndexedDB → SchemaManager → Schemas.tsx
                                ↓
         ┌──────────────────────┴──────────────────────┐
         ↓                                              ↓
  SchemaEditor                                  SchemaPreview
         ↓                                              ↓
    JSON Schema                                   UIRenderer
         ↓                                              ↑
         └───────────────────┬────────────────────────┘
                             ↓
                    MultiChannelSelector
                             ↓
                      Session Storage
```

## Примеры

### Dashboard с Ticker, Book и Trades

```json
{
  "type": "div",
  "className": "grid grid-cols-3 gap-4 p-4",
  "children": [
    {
      "type": "div",
      "className": "p-4 bg-zinc-900 rounded border border-zinc-800",
      "children": [
        {
          "type": "div",
          "text": "Price",
          "className": "text-xs text-zinc-500"
        },
        {
          "type": "div",
          "text": "${btc_ticker.raw.data.last}",
          "format": { "type": "number", "decimals": 2 },
          "className": "text-2xl font-bold text-white"
        },
        {
          "type": "div",
          "text": "{btc_ticker.raw.exchange} - {btc_ticker.raw.market}",
          "className": "text-xs text-zinc-600 mt-1"
        }
      ]
    },
    {
      "type": "div",
      "className": "p-4 bg-zinc-900 rounded border border-zinc-800",
      "children": [
        {
          "type": "div",
          "text": "Bid/Ask",
          "className": "text-xs text-zinc-500"
        },
        {
          "type": "div",
          "text": "${btc_book.raw.data.bids[0][0]} / ${btc_book.raw.data.asks[0][0]}",
          "className": "text-sm text-white"
        }
      ]
    },
    {
      "type": "div",
      "className": "p-4 bg-zinc-900 rounded border border-zinc-800",
      "children": [
        {
          "type": "div",
          "text": "Last Trade",
          "className": "text-xs text-zinc-500"
        },
        {
          "type": "div",
          "text": "${btc_trades.raw.data[0].price}",
          "format": { "type": "number", "decimals": 2 },
          "className": "text-sm text-white"
        }
      ]
    }
  ]
}
```

## Future Enhancements

- [ ] Drag-and-drop schema builder
- [ ] Template library
- [ ] Schema export/import
- [ ] Schema sharing
- [ ] Version control
- [ ] Visual editor
- [ ] Component library

## Related Documentation

- [UI Engine Documentation](../../lib/gui/IMPLEMENTATION_NOTES.md)
- [Architecture Guide](../../../docs/ARCHITECTURE.md)

## Support

For issues:

1. Check browser console
2. Verify channel data structure
3. Test schema JSON validity
4. Check IndexedDB state in DevTools
