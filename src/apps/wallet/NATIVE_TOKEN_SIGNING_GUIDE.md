# Руководство по подписи транзакций для нативных токенов

## Проблема

При отправке транзакции для нативного токена (`native:mainnet`) вы получили
ошибку:

```
Invalid transaction signature. For native tokens, transactions must be signed using consensus format.
```

## Причина

Для **нативных токенов** (native tokens) транзакции должны быть подписаны в
**формате консенсуса**, а не в обычном формате asset transaction.

### Разница между форматами:

1. **Обычный формат** (для кастомных токенов):
   - Подписывается хеш asset transaction
   - Формула: `sign(domain:hash(transaction))`

2. **Формат консенсуса** (для нативных токенов):
   - Транзакция преобразуется в формат консенсуса
   - Создается signing view (исключая поля подписи)
   - Канонизируется через `deterministicStringify`
   - Добавляется domain prefix
   - Подписывается: `sign(domain:canonicalized_consensus_tx)`

## Решение

### Вариант 1: Использовать серверную функцию (рекомендуется)

Если у вас есть доступ к серверу, используйте функцию `createAssetTransaction`:

```typescript
import { createAssetTransaction } from "./utils/asset-transaction.ts";
import { getTokenGenesis } from "./utils/native-token.ts";

// Получить genesis для нативного токена
const tokenGenesis = await getTokenGenesis("native:mainnet", "mainnet");

// Создать и подписать транзакцию
const transaction = await createAssetTransaction(
  wallet,
  tokenGenesis,
  "gm72D2sUPhSQqm3Fwewn2uvbouuZs3qi77", // to
  "0.10000000", // amount
  "0.000015", // fee
);
```

### Вариант 2: Клиентская подпись (правильный алгоритм)

Если вы подписываете транзакцию на клиенте, следуйте этому алгоритму:

#### Шаг 1: Создать базовую транзакцию

```typescript
const transactionBase = {
  type: "asset.transfer",
  version: "smart-1.0",
  network: {
    id: "mainnet",
    chain_id: 1,
  },
  token_id: "native:mainnet",
  from: "ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv",
  to: "gm72D2sUPhSQqm3Fwewn2uvbouuZs3qi77",
  amount: "0.10000000",
  fee: "0.000015",
  currency: "SLI",
  timestamp: 1764921604413,
  prev_hash: null,
  signatures: [], // Временно пустой
};
```

#### Шаг 2: Преобразовать в формат консенсуса

```typescript
import { convertAssetTransactionToConsensus } from "./utils/asset-consensus-integration.ts";

const tokenDecimals = 8; // Для SLI
const consensusTx = convertAssetTransactionToConsensus(
  transactionBase,
  tokenDecimals,
);

// Результат будет выглядеть так:
// {
//   type: "smart",
//   method: "smart.exec",
//   args: {
//     ops: [{
//       op: "transfer",
//       to: "gm72D2sUPhSQqm3Fwewn2uvbouuZs3qi77",
//       amount: "10000000" // Конвертировано в base units (8 decimals)
//     }],
//   },
//   from: "ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv",
//   fee: "0.000015", // Остается в decimal формате
//   currency: "SLI",
//   timestamp: 1764921604413,
//   prev_hash: null,
//   signatures: [],
//   hash: "..."
// }
```

#### Шаг 3: Создать signing view

```typescript
// Исключить поля подписи из signing view
const signingView = { ...consensusTx };
const excludeFields = [
  "signature",
  "signatures",
  "cosigs",
  "verified",
  "status",
  "validators",
  "hash",
];

for (const field of excludeFields) {
  delete signingView[field];
}
```

#### Шаг 4: Канонизировать

```typescript
import { deterministicStringify } from "./utils/gliesereum/index.ts";

const canonicalData = deterministicStringify(signingView);
```

#### Шаг 5: Добавить domain prefix

```typescript
// Получить domain из genesis (обычно ["tx"] для нативных токенов)
const signDomain = ["tx"]; // Из genesis.protocol.sign_domains.tx
const domainStr = signDomain.map(String).join(":");
const messageToSign = `${domainStr}:${canonicalData}`;
```

#### Шаг 6: Подписать

```typescript
import { sign } from "./utils/gliesereum/crypto.ts";

const signature = sign(messageToSign, privateKey);
```

#### Шаг 7: Создать финальную транзакцию

```typescript
const finalTransaction = {
  ...transactionBase,
  signatures: [{
    kid: publicKey, // Полный публичный ключ (66 символов)
    alg: "ecdsa-secp256k1",
    sig: signature,
  }],
};
```

## Полный пример кода

```typescript
import { convertAssetTransactionToConsensus } from "./utils/asset-consensus-integration.ts";
import { deterministicStringify } from "./utils/gliesereum/index.ts";
import { sign } from "./utils/gliesereum/crypto.ts";

async function createNativeTokenTransaction(
  from: string,
  to: string,
  amount: string,
  fee: string,
  privateKey: string,
  publicKey: string,
  timestamp: number,
) {
  // 1. Создать базовую транзакцию
  const transactionBase = {
    type: "asset.transfer",
    version: "smart-1.0",
    network: {
      id: "mainnet",
      chain_id: 1,
    },
    token_id: "native:mainnet",
    from,
    to,
    amount,
    fee,
    currency: "SLI",
    timestamp,
    prev_hash: null,
    signatures: [],
  };

  // 2. Преобразовать в формат консенсуса
  const tokenDecimals = 8; // Для SLI
  const consensusTx = convertAssetTransactionToConsensus(
    transactionBase,
    tokenDecimals,
  );

  // 3. Создать signing view (исключить поля подписи)
  const signingView = { ...consensusTx };
  const excludeFields = [
    "signature",
    "signatures",
    "cosigs",
    "verified",
    "status",
    "validators",
    "hash",
  ];

  for (const field of excludeFields) {
    delete signingView[field];
  }

  // 4. Канонизировать
  const canonicalData = deterministicStringify(signingView);

  // 5. Добавить domain prefix
  const signDomain = ["tx"]; // Из genesis
  const domainStr = signDomain.map(String).join(":");
  const messageToSign = `${domainStr}:${canonicalData}`;

  // 6. Подписать
  const signature = sign(messageToSign, privateKey);

  // 7. Создать финальную транзакцию
  return {
    ...transactionBase,
    signatures: [{
      kid: publicKey,
      alg: "ecdsa-secp256k1",
      sig: signature,
    }],
  };
}

// Использование
const transaction = await createNativeTokenTransaction(
  "ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv",
  "gm72D2sUPhSQqm3Fwewn2uvbouuZs3qi77",
  "0.10000000",
  "0.000015",
  privateKey,
  publicKey,
  Date.now(),
);
```

## Важные замечания

1. **Amount конвертируется в base units**: `"0.10000000"` → `"10000000"` (8
   decimals)
2. **Fee остается в decimal формате**: `"0.000015"` не конвертируется
3. **Domain берется из genesis**: Обычно `["tx"]` для нативных токенов
4. **Signing view исключает поля подписи**: hash, signatures, verified и т.д.
5. **Канонизация критична**: Должна использовать `deterministicStringify` из
   gliesereum

## Проверка подписи

После создания транзакции, вы можете проверить подпись используя функцию
валидации:

```typescript
import { validateAssetTransactionSignature } from "./utils/asset-transaction.ts";
import { getTokenGenesis } from "./utils/native-token.ts";

const tokenGenesis = await getTokenGenesis("native:mainnet", "mainnet");
const result = await validateAssetTransactionSignature(
  transaction,
  tokenGenesis,
);

if (!result.isValid) {
  console.error("Signature validation failed:", result.errors);
}
```

## Отладка

Если подпись не проходит валидацию, проверьте:

1. **Правильно ли преобразована транзакция в формат консенсуса?**
   - Amount должен быть в base units (`"0.10000000"` → `"10000000"` для 8
     decimals)
   - Fee должен остаться в decimal формате (`"0.000015"` не конвертируется)
   - Транзакция должна быть преобразована в
     `{ type: "smart", method: "smart.exec", args: { ops: [...] } }`

2. **Правильно ли создан signing view?**
   - Все поля подписи должны быть исключены (signature, signatures, cosigs,
     verified, status, validators, hash)
   - Hash должен быть исключен

3. **Правильный ли domain используется?**
   - Для нативных токенов обычно `["tx"]`
   - Проверьте в genesis: `genesis.protocol.sign_domains.tx`
   - Domain должен быть массивом: `["tx"]`, а не строкой `"tx"`

4. **Правильно ли канонизированы данные?**
   - Должен использоваться `deterministicStringify` из gliesereum
   - Порядок полей важен
   - Подпись создается на основе **консенсус формата**, а не исходного
     `asset.transfer`

5. **Используете ли вы правильную функцию?**
   - **НЕ создавайте транзакцию вручную** для нативных токенов
   - Используйте `createAssetTransaction` из `@/hooks/use_create_transaction`
   - Функция автоматически определяет тип токена и применяет правильный алгоритм
     подписи

## Пример ошибки

Если вы получили ошибку:

```json
{
  "error": {
    "code": 400,
    "message": "Invalid transaction signature. For native tokens, transactions must be signed using consensus format."
  }
}
```

Это означает, что:

- Транзакция была подписана на основе `asset.transfer` формата
- Но для нативных токенов нужно подписывать **консенсус формат** (`smart`
  транзакцию)
- Используйте `createAssetTransaction` вместо ручного создания

## Правильный способ (React/TypeScript)

```typescript
import { useCreateTransaction } from "@/hooks/use_create_transaction";
import { usePublicAssetList } from "@/hooks/use_public_asset_list";
import { createNativeTokenFromGenesis } from "@/lib/token-normalizer";

function MyComponent() {
  const { createTransaction, submitTransaction } = useCreateTransaction();
  const { assets } = usePublicAssetList({ network: "mainnet" });

  // Найти genesis документ для нативного токена
  const genesisDoc = assets?.find((asset) =>
    asset.channel?.includes(".genesis:") &&
    asset.raw?.genesis?.genesis
  );

  // Создать native token из genesis
  const nativeToken = createNativeTokenFromGenesis(genesisDoc, "mainnet");

  // Создать и подписать транзакцию (автоматически использует консенсус формат)
  const transaction = createTransaction({
    wallet: myWallet,
    tokenGenesis: nativeToken.genesis, // TokenGenesisDocument
    to: "gm72D2sUPhSQqm3Fwewn2uvbouuZs3qi77",
    amount: "0.10000000",
    fee: "0.000015",
  });

  // Отправить транзакцию
  const result = await submitTransaction(transaction);
}
```

## Ссылки на код

- `src/hooks/use_create_transaction.ts` - функция `createAssetTransaction`
  (строки 292-408)
- `src/hooks/use_create_transaction.ts` - функция `convertToConsensusFormat`
  (строки 186-219)
- `src/hooks/use_create_transaction.ts` - функция `signNativeTokenTransaction`
  (строки 236-266)
