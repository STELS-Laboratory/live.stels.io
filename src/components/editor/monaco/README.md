# Monaco Editor Setup for Heterogen Runtime Workers

Профессиональная настройка автокомплита для редактирования worker скриптов.

## Установка

```bash
npm install monaco-editor @monaco-editor/react
# или
yarn add monaco-editor @monaco-editor/react
```

## Быстрый старт

### React Component

```tsx
import React, { useRef } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import {
  setupWorkerMonacoEditor,
  WORKER_TEMPLATES,
} from "./monaco/autocomplete";

export function WorkerEditor() {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor"),
  ) {
    editorRef.current = editor;

    // Setup Worker SDK autocomplete
    const { editorOptions, disposables } = setupWorkerMonacoEditor(monaco, {
      theme: "vs-dark",
      fontSize: 14,
      minimap: true,
    });

    // Store disposables for cleanup
    editor.onDidDispose(() => {
      disposables.forEach((d) => d.dispose());
    });
  }

  return (
    <Editor
      height="600px"
      defaultLanguage="javascript"
      defaultValue={WORKER_TEMPLATES.simple}
      onMount={handleEditorDidMount}
      options={{
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 14,
        wordWrap: "on",
        theme: "vs-dark",
      }}
    />
  );
}
```

### Ручная настройка

```typescript
import * as monaco from "monaco-editor";
import {
  configureWorkerEditor,
  loadWorkerSDKTypes,
  registerWorkerCompletionProvider,
} from "./monaco/autocomplete";

// 1. Загрузить типы SDK
loadWorkerSDKTypes(monaco);

// 2. Получить конфигурацию редактора
const editorConfig = configureWorkerEditor(monaco, {
  theme: "vs-dark",
  fontSize: 14,
  minimap: true,
});

// 3. Зарегистрировать completion provider
const completionDisposable = registerWorkerCompletionProvider(monaco);

// 4. Создать редактор
const editor = monaco.editor.create(document.getElementById("editor")!, {
  value: WORKER_TEMPLATES.simple,
  language: "javascript",
  ...editorConfig,
});

// Cleanup
editor.onDidDispose(() => {
  completionDisposable.dispose();
});
```

## Доступные глобальные объекты

При написании worker скриптов доступны следующие глобальные объекты с **полным
автокомплитом**:

### `Stels` - Главный контекст

```javascript
// Автокомплит для всех свойств:
Stels.config.nid          // Node ID
Stels.net                 // Distributed KV
Stels.local               // Local KV
Stels.runtime.cex.binance // Exchange instance
Stels.wallet.address      // Wallet address
Stels.blockchain          // Blockchain SDK (Gliesereum)
Stels.sleep(1000)         // Sleep function
Stels.webfix({...})       // KV operations
```

### `Stels.blockchain` - Gliesereum SDK

```javascript
// Wallet management
const wallet = Stels.blockchain.createWallet();
const imported = Stels.blockchain.importWallet(privateKey);
const isValid = Stels.blockchain.validateAddress(address);
const cardNum = Stels.blockchain.cardNumber(wallet.address);

// Transactions
const tx = Stels.blockchain.createSignedTransaction(
  wallet,
  toAddress,
  amount,
  fee,
  data
);

// Smart transactions
const smartTx = Stels.blockchain.createSmartTransaction(
  wallet,
  [
    { op: 'transfer', to: address, amount: '0.001000', memo: 'Payment' },
    { op: 'emit.event', kind: 'payment.sent', data: { ... } }
  ],
  '0.000100',
  'Memo'
);

// Validation
Stels.blockchain.validateTransaction(tx);
Stels.blockchain.validateSmartTransaction(smartTx);
Stels.blockchain.validateFeeFormat('0.000100');

// Cryptography
const signature = Stels.blockchain.sign(data, privateKey);
const verified = Stels.blockchain.verify(data, signature, publicKey);
```

### `logger` - Логирование

```javascript
logger.info("Message", data);
logger.warn("Warning", data);
logger.error("Error", error);
logger.debug("Debug", data);
```

### `config` - Конфигурация (shorthand)

```javascript
config.nid; // Node ID
config.network; // Network name
config.workers; // Workers enabled
```

### `shouldStop()` - Проверка остановки

```javascript
while (!shouldStop()) {
  // Work loop
  await Stels.sleep(1000);
}
```

### `signal` - Abort Signal

```javascript
if (signal.aborted) {
  return; // Stop immediately
}
```

## Шаблоны скриптов

Используйте предопределенные шаблоны:

```typescript
import { WORKER_TEMPLATES } from "./monaco/autocomplete";

// Простой воркер
WORKER_TEMPLATES.simple;

// Воркер с graceful shutdown
WORKER_TEMPLATES.gracefulShutdown;

// Exchange data fetcher
WORKER_TEMPLATES.exchangeFetcher;

// Balance checker
WORKER_TEMPLATES.balanceChecker;

// Order book watcher
WORKER_TEMPLATES.orderBookWatcher;

// Advanced worker with metrics
WORKER_TEMPLATES.advanced;

// Blockchain wallet creator
WORKER_TEMPLATES.blockchainWallet;

// Smart transaction builder
WORKER_TEMPLATES.smartTransaction;

// Trading bot (CCXT)
WORKER_TEMPLATES.tradingBot;

// Market maker (CCXT Grid Trading)
WORKER_TEMPLATES.marketMaker;
```

## Автокомплит возможности

### IntelliSense для Exchange API (CCXT Pro)

```javascript
const exchange = Stels.runtime.cex.binance;

// Market Data с полными типами
const ticker = await exchange.fetchTicker("BTC/USDT");
// ticker.last, ticker.bid, ticker.ask, ticker.volume - все доступны с типами

const orderBook = await exchange.fetchOrderBook("BTC/USDT", 100);
// orderBook.bids, orderBook.asks - [price, amount][]

const trades = await exchange.fetchTrades("BTC/USDT");
// trades[0].price, trades[0].amount, trades[0].side

const candles = await exchange.fetchOHLCV("BTC/USDT", "1h");
// [timestamp, open, high, low, close, volume][]

// Account
const balance = await exchange.fetchBalance();
// balance.free.BTC, balance.used.BTC, balance.total.BTC

// Trading с type-safe параметрами
const order = await exchange.createLimitOrder(
  "BTC/USDT",
  "buy", // type: "buy" | "sell"
  0.001, // amount
  50000, // price
);
// order.id, order.status, order.filled, order.remaining

const marketOrder = await exchange.createMarketBuyOrder("BTC/USDT", 0.001);

// Order management
const openOrders = await exchange.fetchOpenOrders("BTC/USDT");
await exchange.cancelOrder(order.id, "BTC/USDT");
await exchange.cancelAllOrders("BTC/USDT");

// WebSocket (CCXT Pro) - real-time updates
while (!shouldStop()) {
  const ticker = await exchange.watchTicker("BTC/USDT");
  const orderBook = await exchange.watchOrderBook("BTC/USDT");
  const trades = await exchange.watchTrades("BTC/USDT");
}
```

### IntelliSense для KV Operations

```javascript
// Автокомплит для методов и параметров
await Stels.webfix({
  brain: Stels.local, // или Stels.net
  method: "set", // 'get' | 'set' | 'update' | 'delete'
  channel: ["my", "key"], // Массив строк
  module: "worker",
  raw: { data: 123 },
  timestamp: Date.now(),
  expireIn: 60000, // optional
});
```

### IntelliSense для Blockchain API

```javascript
// Автокомплит для всех методов Gliesereum SDK
const wallet = Stels.blockchain.createWallet();
// wallet.address, wallet.publicKey, wallet.number доступны

// Create transaction с автокомплитом параметров
const tx = Stels.blockchain.createSignedTransaction(
  Stels.wallet,
  "g-recipient-address",
  1000000, // amount (integer)
  100, // fee (integer)
  "optional data",
);

// Smart transactions с типизированными операциями
const smartTx = Stels.blockchain.createSmartTransaction(
  Stels.wallet,
  [
    {
      op: "transfer",
      to: "g-address",
      amount: "0.001000",
      memo: "Payment",
    },
    {
      op: "assert.balance",
      address: "g-address",
      gte: "0.000100",
    },
    {
      op: "emit.event",
      kind: "payment.completed",
      data: { orderId: "123" },
    },
  ],
  "0.000150", // fee
  "Multi-operation transaction",
);

// Validation с boolean returns
const isValidAddress = Stels.blockchain.validateAddress("g-...");
const isValidTx = Stels.blockchain.validateTransaction(tx);
const isValidFee = Stels.blockchain.validateFeeFormat("0.000100");
```

### Code Snippets

Встроенные сниппеты доступны через автокомплит:

**Logger:**

- `logger.info` → `logger.info("message", data);`
- `logger.error` → `logger.error("message", error);`
- `logger.warn` → `logger.warn("message", data);`
- `logger.debug` → `logger.debug("message", data);`

**Control Flow:**

- `while-shouldStop` → Цикл с graceful shutdown
- `try-catch-worker` → Try-catch с logger

**KV Operations:**

- `Stels.webfix-set` → KV set операция
- `Stels.webfix-get` → KV get операция

**Exchange API (CCXT Pro):**

- `exchange-fetchTicker` → Fetch ticker template
- `exchange-fetchBalance` → Fetch balance template
- `exchange-createLimitOrder` → Create limit order
- `exchange-createMarketOrder` → Create market order
- `exchange-fetchOpenOrders` → Get open orders
- `exchange-cancelOrder` → Cancel order by ID
- `exchange-fetchOHLCV` → Fetch candles (OHLCV)
- `exchange-watchOrderBook` → WebSocket order book stream

**Blockchain (Gliesereum):**

- `Stels.blockchain-createWallet` → Create new wallet
- `Stels.blockchain-importWallet` → Import from private key
- `Stels.blockchain-createTransaction` → Sign transaction
- `Stels.blockchain-smartTransaction` → Create smart tx
- `Stels.blockchain-validateAddress` → Validate address

**Utilities:**

- `Stels.sleep` → `await Stels.sleep(1000);`

## Кастомизация

### Темы

```typescript
setupWorkerMonacoEditor(monaco, {
  theme: "vs-dark", // или 'vs-light'
});
```

### Размер шрифта

```typescript
setupWorkerMonacoEditor(monaco, {
  fontSize: 16, // default: 14
});
```

### Minimap

```typescript
setupWorkerMonacoEditor(monaco, {
  minimap: false, // default: true
});
```

## TypeScript Definitions

Полный файл типов доступен в `worker-sdk.d.ts`. Он включает:

- ✅ Stels global object
- ✅ Logger interface
- ✅ Config interface
- ✅ WebFIX types
- ✅ CCXT Exchange types
- ✅ Blockchain SDK types
- ✅ Utility types (OrderSide, OrderType, Timeframe, etc.)

## Пример полной интеграции

```tsx
import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import {
  setupWorkerMonacoEditor,
  WORKER_TEMPLATES,
} from "@/monaco/autocomplete";

export function WorkerScriptEditor() {
  const [code, setCode] = useState(WORKER_TEMPLATES.simple);
  const [selectedTemplate, setSelectedTemplate] = useState("simple");

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco,
  ) {
    // Setup autocomplete
    const { disposables } = setupWorkerMonacoEditor(monacoInstance);

    // Format on paste
    editor.onDidPaste(() => {
      editor.getAction("editor.action.formatDocument")?.run();
    });

    // Cleanup
    editor.onDidDispose(() => {
      disposables.forEach((d) => d.dispose());
    });
  }

  function loadTemplate(template: keyof typeof WORKER_TEMPLATES) {
    setCode(WORKER_TEMPLATES[template]);
    setSelectedTemplate(template);
  }

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <label>Template:</label>
        <select
          value={selectedTemplate}
          onChange={(e) => loadTemplate(e.target.value as any)}
        >
          <option value="simple">Simple</option>
          <option value="gracefulShutdown">Graceful Shutdown</option>
          <option value="exchangeFetcher">Exchange Fetcher</option>
          <option value="balanceChecker">Balance Checker</option>
          <option value="orderBookWatcher">Order Book Watcher</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <Editor
        height="600px"
        language="javascript"
        value={code}
        onChange={(value) => setCode(value || "")}
        onMount={handleEditorDidMount}
        options={{
          theme: "vs-dark",
          fontSize: 14,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
```

## Troubleshooting

### Автокомплит не работает

1. Убедитесь что `loadWorkerSDKTypes(monaco)` вызван ДО создания редактора
2. Проверьте что язык установлен как `javascript` или `typescript`
3. Проверьте browser console на ошибки

### Типы не загружаются

```typescript
// Проверьте что типы добавлены:
monaco.languages.typescript.javascriptDefaults.getExtraLibs();
// Должен содержать 'file:///worker-sdk.d.ts'
```

### Сниппеты не появляются

```typescript
// Убедитесь что completion provider зарегистрирован:
const provider = registerWorkerCompletionProvider(monaco);

// И не забудьте cleanup:
editor.onDidDispose(() => provider.dispose());
```

## Best Practices

1. ✅ **Всегда загружайте типы перед созданием редактора**
2. ✅ **Используйте темную тему для лучшей читаемости кода**
3. ✅ **Включите minimap для навигации по длинным скриптам**
4. ✅ **Добавьте форматирование на paste**
5. ✅ **Очищайте disposables при unmount**

## License

MIT © STELS Laboratory

## Support

support@stels.dev
