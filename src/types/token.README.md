# Unified Token Type System

## Overview

Все токены в приложении теперь используют единый тип `Token` из `@/types/token`. Это обеспечивает консистентность данных и упрощает работу с токенами в разных частях приложения.

## Основные типы

### `Token`
Единый интерфейс для всех токенов, включающий:
- Метаданные (название, символ, decimals, описание, иконка)
- Экономику (supply, distribution, fee structure)
- Информацию об эмитенте
- Параметры сети
- Протокол и безопасность

### `RawAssetData`
Сырые данные из API до нормализации. Используется только для входящих данных.

## Использование

### Нормализация токенов

```typescript
import { normalizeToken, normalizeTokens } from "@/lib/token-normalizer";
import type { Token, RawAssetData } from "@/types/token";

// Нормализация одного токена
const rawAsset: RawAssetData = { /* ... */ };
const token: Token | null = normalizeToken(rawAsset);

// Нормализация массива токенов
const rawAssets: RawAssetData[] = [ /* ... */ ];
const tokens: Token[] = normalizeTokens(rawAssets);
```

### Создание нативного токена из genesis документа

```typescript
import { createNativeTokenFromGenesis } from "@/lib/token-normalizer";

const genesisDoc: RawAssetData = { /* ... */ };
const nativeToken = createNativeTokenFromGenesis(genesisDoc, "testnet");
```

### Проверка типов

```typescript
import { isGenesisDocument, isValidToken } from "@/types/token";

// Проверка, является ли asset genesis документом сети
if (isGenesisDocument(asset)) {
  // Это не токен, а документ сети
}

// Проверка, является ли asset валидным токеном
if (isValidToken(asset)) {
  // Это валидный токен
}
```

## Компоненты

Все компоненты для работы с токенами теперь используют тип `Token`:

- `TokenListItem` - принимает `Token`
- `TokenDetailModal` - принимает `Token`
- `TokenList` - использует `normalizeTokens` для нормализации

## Миграция

При обновлении существующего кода:

1. Замените локальные интерфейсы на `Token` из `@/types/token`
2. Используйте `normalizeToken` или `normalizeTokens` для нормализации данных из API
3. Удалите проверки формата данных - нормализатор обрабатывает оба формата автоматически

## Примеры

### До нормализации

```typescript
// Старый код с проверками формата
const metadata = token.raw?.genesis?.token?.metadata || token.metadata || {
  name: "Unknown Token",
  symbol: "UNKNOWN",
  decimals: 6,
};
```

### После нормализации

```typescript
// Новый код с единым типом
const token = normalizeToken(rawAsset);
if (token) {
  const metadata = token.metadata; // Всегда доступно
}
```

