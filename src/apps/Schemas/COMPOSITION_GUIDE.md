# Schema Composition Guide

Руководство по композиции и вложению схем в STELS UI Engine.

## Концепция

STELS поддерживает **бесконечную композицию схем** - возможность вкладывать
схемы друг в друга на любую глубину.

### Два Типа Схем

#### 📊 Dynamic (Динамические)

- Привязаны к session каналам
- Отображают real-time данные
- Используются как виджеты
- **Не могут** содержать вложенные схемы

**Пример:**

```
Widget Key: widget.testnet.runtime.ticker.BTC/USDT.bybit.spot
Channels: [testnet.runtime.ticker.BTC/USDT.bybit.spot]
Type: dynamic
```

#### 📦 Static (Статические)

- Не привязаны к каналам
- Контейнеры для других схем
- Используются как роутеры/dashboards
- **Могут** содержать вложенные схемы

**Пример:**

```
Widget Key: widget.markets
Channels: []
Nested Schemas: [widget.markets.ticker, widget.markets.orderbook]
Type: static
```

## Создание Композиции

### Шаг 1: Создать Динамические Виджеты

Создайте несколько динамических схем с данными:

```typescript
// Schema 1: BTC Ticker
{
  name: "BTC Ticker",
  type: "dynamic",
  widgetKey: "widget.markets.btc.ticker",
  channels: ["testnet.runtime.ticker.BTC/USDT.bybit.spot"],
  schema: {
    type: "div",
    className: "p-4 bg-zinc-900 rounded",
    children: [
      {
        type: "div",
        text: "${data.last}",
        format: { type: "number", decimals: 2 }
      }
    ]
  }
}

// Schema 2: BTC Order Book
{
  name: "BTC Order Book",
  type: "dynamic",
  widgetKey: "widget.markets.btc.orderbook",
  channels: ["testnet.runtime.book.BTC/USDT.bybit.spot"],
  schema: { ... }
}
```

### Шаг 2: Создать Статический Контейнер

```
1. Click "Create Schema"
2. Select Type: "Static" (📦 Container/Router)
3. Enter Name: "Markets Dashboard"
4. Enter Widget Key: "markets"
   → Result: widget.markets
5. Click "Create Schema"
```

### Шаг 3: Добавить Вложенные Схемы

В разделе **Nested Schemas**:

```
☑ 📊 BTC Ticker (widget.markets.btc.ticker)
☑ 📊 BTC Order Book (widget.markets.btc.orderbook)
☑ 📊 SOL Ticker (widget.markets.sol.ticker)
```

### Шаг 4: Собрать Композицию

В JSON редакторе используйте `schemaRef`:

```json
{
  "type": "div",
  "className": "grid grid-cols-3 gap-4 p-6",
  "children": [
    {
      "type": "div",
      "schemaRef": "widget.markets.btc.ticker"
    },
    {
      "type": "div",
      "schemaRef": "widget.markets.btc.orderbook"
    },
    {
      "type": "div",
      "schemaRef": "widget.markets.sol.ticker"
    }
  ]
}
```

### Шаг 5: Сохранить

`Cmd/Ctrl + S` или кнопка "Save Schema"

## Примеры Композиции

### 1. Simple Dashboard

```json
{
  "type": "div",
  "className": "flex flex-col gap-4 p-4",
  "children": [
    {
      "type": "h1",
      "text": "Markets Overview",
      "className": "text-2xl font-bold"
    },
    {
      "type": "div",
      "className": "grid grid-cols-2 gap-4",
      "children": [
        {
          "type": "div",
          "schemaRef": "widget.ticker.btc"
        },
        {
          "type": "div",
          "schemaRef": "widget.ticker.sol"
        }
      ]
    }
  ]
}
```

### 2. Multi-Level Nesting

```json
{
  "type": "div",
  "className": "flex flex-col gap-6",
  "children": [
    {
      "type": "section",
      "className": "border-b pb-4",
      "children": [
        {
          "type": "h2",
          "text": "Top Markets",
          "className": "text-xl font-bold mb-4"
        },
        {
          "type": "div",
          "schemaRef": "widget.dashboard.top-markets"
        }
      ]
    },
    {
      "type": "section",
      "children": [
        {
          "type": "h2",
          "text": "Order Books",
          "className": "text-xl font-bold mb-4"
        },
        {
          "type": "div",
          "schemaRef": "widget.dashboard.orderbooks"
        }
      ]
    }
  ]
}
```

где `widget.dashboard.top-markets` сама является статической схемой с вложенными
виджетами.

### 3. Conditional Nesting

```json
{
  "type": "div",
  "condition": {
    "key": "showDetails",
    "operator": "===",
    "value": true
  },
  "children": [
    {
      "type": "div",
      "schemaRef": "widget.details.full"
    }
  ]
}
```

## Schema Hierarchy

Визуализация в Schema Tree:

```
📦 Markets Dashboard
├─ 📊 BTC Ticker
├─ 📊 BTC Order Book
└─ 📦 Altcoins Section
   ├─ 📊 SOL Ticker
   ├─ 📊 ETH Ticker
   └─ 📊 DOT Ticker
```

## Правила Композиции

### ✅ Можно:

- Вкладывать dynamic схемы в static
- Вкладывать static схемы в static (многоуровнево)
- Смешивать обычные UI элементы и schemaRef
- Применять условия и итерации к schemaRef

### ❌ Нельзя:

- Вкладывать схемы в dynamic (только static может содержать вложенные)
- Создавать циклические ссылки (A → B → A)
- Превышать глубину вложенности 10 уровней

## API

### UINode с schemaRef

```typescript
interface UINode {
  type: string;
  schemaRef?: string; // Widget key of nested schema
  // ... other properties
}
```

### Resolver

```typescript
import { resolveSchemaRefs } from "@/lib/gui/schema-resolver";

// Автоматически резолвится в SchemaPreview
const resolved = await resolveSchemaRefs(schema, schemaStore);
```

### SchemaProject

```typescript
interface SchemaProject {
  type: "static" | "dynamic";
  channelKeys: string[]; // For dynamic schemas
  nestedSchemas?: string[]; // For static schemas
}
```

## Workflow Примеры

### Создание Market Dashboard

```
1. Создать виджеты:
   - widget.markets.btc.ticker (dynamic)
   - widget.markets.btc.book (dynamic)
   - widget.markets.sol.ticker (dynamic)

2. Создать контейнер:
   - widget.markets (static)
   - Nested: [btc.ticker, btc.book, sol.ticker]

3. Собрать layout:
{
  "type": "div",
  "className": "grid grid-cols-3 gap-4",
  "children": [
    { "schemaRef": "widget.markets.btc.ticker" },
    { "schemaRef": "widget.markets.btc.book" },
    { "schemaRef": "widget.markets.sol.ticker" }
  ]
}

4. Сохранить → Готово!
```

### Многоуровневая Композиция

```
widget.app (static)
└─ schemaRef: widget.dashboard

widget.dashboard (static)
├─ schemaRef: widget.markets
└─ schemaRef: widget.portfolio

widget.markets (static)
├─ schemaRef: widget.ticker.btc
├─ schemaRef: widget.ticker.sol
└─ schemaRef: widget.ticker.eth

widget.ticker.btc (dynamic)
└─ channels: [testnet.runtime.ticker.BTC/USDT...]
```

## Преимущества

### 🎯 Модульность

- Создавайте переиспользуемые компоненты
- Обновление в одном месте → меняется везде

### 🔧 Гибкость

- Комбинируйте виджеты как конструктор
- Создавайте сложные layouts без копирования кода

### 📊 Масштабируемость

- Добавляйте новые виджеты без изменения контейнеров
- Бесконечная глубина вложенности

### 🎨 Чистота

- Разделение контейнеров (layout) и виджетов (data)
- Легко тестировать и поддерживать

## Performance

- ✅ Lazy loading схем
- ✅ Кэширование resolved schemas (TODO)
- ✅ Защита от циклических ссылок
- ✅ Максимальная глубина 10 уровней

## Error Handling

### Schema Not Found

```json
{
  "schemaRef": "widget.nonexistent"
}
```

Отображается:

```
┌────────────────────────────────┐
│ Schema not found:              │
│ widget.nonexistent             │
└────────────────────────────────┘
```

### Circular Reference

```
widget.a → widget.b → widget.a
```

Автоматически прерывается на уровне 10 вложенности.

## Best Practices

### 1. Naming Convention

```
✅ widget.markets
✅ widget.markets.btc.ticker
✅ widget.dashboard.overview
✅ widget.portfolio.summary

❌ widget.schema1
❌ widget.test
❌ widget.temp
```

### 2. Logical Grouping

```
widget.markets/
├─ widget.markets.btc/
│  ├─ widget.markets.btc.ticker
│  ├─ widget.markets.btc.book
│  └─ widget.markets.btc.trades
└─ widget.markets.sol/
   ├─ widget.markets.sol.ticker
   └─ widget.markets.sol.book
```

### 3. Separation of Concerns

- **Static** = Layout, structure, routing
- **Dynamic** = Data display, real-time updates

### 4. Performance Optimization

- Не вкладывайте слишком много схем в один контейнер
- Используйте условный рендеринг для больших dashboards
- Ограничивайте глубину 3-4 уровнями

## Troubleshooting

### Схема не отображается

1. Проверьте widget key в schemaRef
2. Убедитесь, что схема сохранена в IndexedDB
3. Проверьте Schema Tree для визуализации

### Данные не передаются

- Данные доступны только в dynamic схемах
- Static схемы не имеют доступа к channel data
- Используйте dynamic схемы для отображения данных

### Циклическая ссылка

- Избегайте A → B → A
- Используйте Schema Tree для проверки структуры
- Максимальная глубина: 10 уровней

## Example: Full Application

```typescript
// 1. Dynamic widgets
widget.ticker.btc    → BTC ticker data
widget.ticker.sol    → SOL ticker data
widget.book.btc      → BTC order book
widget.trades.btc    → BTC trades

// 2. Section containers
widget.sections.tickers (static)
  └─ [widget.ticker.btc, widget.ticker.sol]

widget.sections.details (static)
  └─ [widget.book.btc, widget.trades.btc]

// 3. Main dashboard
widget.dashboard (static)
  └─ [widget.sections.tickers, widget.sections.details]

// 4. App root
widget.app (static)
  └─ [widget.dashboard]
```

## Visual Editor

Schema Tree автоматически показывает структуру:

```
📦 App Root
└─ 📦 Dashboard
   ├─ 📦 Tickers Section
   │  ├─ 📊 BTC Ticker (1 channel)
   │  └─ 📊 SOL Ticker (1 channel)
   └─ 📦 Details Section
      ├─ 📊 BTC Order Book (1 channel)
      └─ 📊 BTC Trades (1 channel)
```

## Integration

### В Workers

Workers создают dynamic схемы:

```javascript
const payload = {
  channel: "testnet.runtime.ticker.BTC/USDT.bybit.spot",
  widget: "widget.testnet.runtime.ticker.BTC/USDT.bybit.spot",
  ui: { ... },
  raw: { ... }
};
```

### В Constructor

Разработчик создаёт static контейнеры и композирует виджеты:

```
1. Create static: widget.markets
2. Add nested: [widget.ticker.btc, widget.book.btc]
3. Layout с schemaRef
4. Save → Ready!
```

## Future Enhancements

- [ ] Schema marketplace / templates
- [ ] Visual drag-and-drop composer
- [ ] Hot reload on nested schema updates
- [ ] Performance monitoring
- [ ] Schema caching
- [ ] Circular reference detection UI

---

**Created:** October 19, 2025\
**Version:** 1.0.0\
**Status:** Production Ready
