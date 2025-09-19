# Flow Persistence System

## Overview

Система персистентности обеспечивает сохранение и восстановление состояния
ReactFlow canvas при перезагрузке страницы или браузера.

## Features

### ✅ Что сохраняется:

1. **Позиции узлов** - точные координаты каждого узла
2. **Размеры узлов** - ширина, высота, состояние maximize/minimize
3. **Соединения** - все edges между узлами
4. **Viewport** - позиция камеры, зум, панорамирование
5. **Состояние узлов** - minimized/maximized состояние

### ✅ Автоматическое сохранение:

- **Debounced saving** - сохранение происходит с задержкой для оптимизации
- **Position changes** - автоматическое сохранение при перемещении узлов
- **Size changes** - сохранение при изменении размеров (maximize/minimize)
- **Edge changes** - сохранение при добавлении/удалении соединений
- **Viewport changes** - сохранение позиции камеры

## Architecture

### Core Components

1. **`useFlowPersistence` hook** - основной хук для управления персистентностью
2. **Enhanced Flow.tsx** - интеграция с ReactFlow
3. **Enhanced MacOSNode.tsx** - сохранение состояния узлов
4. **PersistenceDebug** - компонент для отладки

### Storage Keys

```typescript
const STORAGE_KEYS = {
  NODES: "stels-canvas-nodes",
  EDGES: "stels-canvas-edges",
  VIEWPORT: "stels-canvas-viewport",
};
```

### Data Structure

```typescript
// Node data with state
interface FlowNodeData {
  channel: string;
  label: string;
  onDelete: (nodeId: string) => void;
  sessionData?: SessionWidgetData;
  nodeState?: NodeState; // NEW: для сохранения состояния
}

// Node state
interface NodeState {
  minimized: boolean;
  maximized: boolean;
}
```

## Usage

### Basic Integration

```typescript
import { useFlowPersistence } from "@/hooks/useFlowPersistence";

function Flow() {
  const {
    loadNodes,
    loadEdges,
    loadViewport,
    handleNodeChanges,
    handleEdgeChanges,
    handleViewportChange,
  } = useFlowPersistence();

  // Load data on mount
  useEffect(() => {
    const nodes = loadNodes();
    const edges = loadEdges();
    // ... restore state
  }, []);

  return (
    <ReactFlow
      onNodesChange={(changes) => {
        handleNodeChanges(changes, nodes);
        onNodesChange(changes);
      }}
      onEdgesChange={(changes) => {
        handleEdgeChanges(changes, edges);
        onEdgesChange(changes);
      }}
      onMove={(_, viewport) => {
        handleViewportChange(viewport);
      }}
    />
  );
}
```

### Debug Component

Добавлен компонент `PersistenceDebug` для тестирования:

```typescript
import { PersistenceDebug } from "@/components/debug/PersistenceDebug";

// В Flow.tsx
<PersistenceDebug />;
```

**Features debug компонента:**

- Показывает количество сохраненных узлов/соединений
- Отображает состояние viewport
- Кнопка для очистки данных
- Логирование в консоль

## Performance Optimizations

### Debouncing

```typescript
// Debounced save functions
const debouncedSaveNodes = useCallback(
  debounce(saveNodes, 300),
  [saveNodes],
);

const debouncedSaveViewport = useCallback(
  debounce(saveViewport, 500),
  [saveViewport],
);
```

### Selective Saving

- **Nodes**: сохраняются только при изменении позиции/размера
- **Edges**: сохраняются при любом изменении
- **Viewport**: сохраняется при движении камеры

## Error Handling

### Graceful Degradation

```typescript
try {
  const loadedNodes = loadNodes();
  setNodes(loadedNodes);
} catch (error) {
  console.error("Failed to load nodes:", error);
  // Fallback to default state
  setNodes(defaultNodes);
}
```

### Data Validation

```typescript
// Validate loaded data
return parsed.filter((node) => {
  return (
    node &&
    typeof node.id === "string" &&
    node.data &&
    typeof node.data.channel === "string"
  );
});
```

## Testing

### Manual Testing

1. **Добавьте виджеты** на canvas
2. **Переместите их** в разные позиции
3. **Измените размеры** (maximize/minimize)
4. **Создайте соединения** между узлами
5. **Перезагрузите страницу**
6. **Проверьте восстановление** состояния

### Debug Tools

- **PersistenceDebug** - визуальный мониторинг
- **Console logs** - детальная информация о сохранении
- **Clear & Reload** - сброс для тестирования

## Browser Support

- ✅ Chrome/Edge - полная поддержка
- ✅ Firefox - полная поддержка
- ✅ Safari - полная поддержка
- ✅ Mobile browsers - базовая поддержка

## Limitations

1. **localStorage quota** - ограничение ~5-10MB
2. **Cross-tab sync** - изменения не синхронизируются между вкладками
3. **Data migration** - нет автоматической миграции структуры данных

## Future Improvements

1. **IndexedDB** - для больших объемов данных
2. **Cross-tab sync** - синхронизация между вкладками
3. **Data compression** - сжатие данных для экономии места
4. **Version migration** - автоматическая миграция старых версий
5. **Cloud sync** - синхронизация между устройствами
