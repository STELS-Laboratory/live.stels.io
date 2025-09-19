# Panel Data Isolation

## Overview

Каждая панель теперь имеет полностью изолированное состояние, включая:

- Позиции и размеры виджетов
- Соединения между виджетами
- Позицию и масштаб viewport
- Все настройки и данные

## Key Features

### ✅ Полная изоляция данных

1. **Узлы (Nodes)** - каждая панель хранит свои собственные узлы
2. **Соединения (Edges)** - соединения изолированы между панелями
3. **Viewport** - позиция камеры и зум сохраняются отдельно для каждой панели
4. **Состояние узлов** - minimized/maximized состояния сохраняются

### ✅ Автоматическое сохранение

- **Debounced saving** - сохранение с задержкой 300ms для оптимизации
- **Селективное сохранение** - только при реальных изменениях
- **Immediate save** - немедленное сохранение при завершении действий

## Implementation Details

### Panel Data Structure

```typescript
interface PanelData {
  panelId: string;
  nodes: Node<FlowNodeData>[]; // Изолированные узлы
  edges: Edge[]; // Изолированные соединения
  viewport: { // Изолированный viewport
    x: number;
    y: number;
    zoom: number;
  };
}
```

### Debounced Save Functions

```typescript
// Viewport сохранение с задержкой
const debouncedSaveViewport = useCallback((viewport) => {
  if (viewportSaveTimeoutRef.current) {
    clearTimeout(viewportSaveTimeoutRef.current);
  }

  viewportSaveTimeoutRef.current = setTimeout(() => {
    if (activePanelId) {
      updatePanelData(activePanelId, { viewport });
    }
  }, 300);
}, [activePanelId, updatePanelData]);

// Узлы сохранение с задержкой
const debouncedSaveNodes = useCallback((currentNodes) => {
  // Аналогичная логика для узлов
}, [activePanelId, updatePanelData]);

// Соединения сохранение с задержкой
const debouncedSaveEdges = useCallback((currentEdges) => {
  // Аналогичная логика для соединений
}, [activePanelId, updatePanelData]);
```

### Panel Switching Logic

```typescript
// Загрузка данных панели при переключении
useEffect(() => {
  if (activePanelId) {
    const panelData = getPanelData(activePanelId);
    if (panelData) {
      // Загрузить узлы
      const nodesWithFunctions = panelData.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDelete: handleDeleteNode,
        },
      }));
      setNodes(nodesWithFunctions);
      setEdges(panelData.edges);

      // Восстановить viewport
      if (panelData.viewport && reactFlowInstance.current) {
        setTimeout(() => {
          reactFlowInstance.current?.setViewport(panelData.viewport, {
            duration: 0,
          });
        }, 100);
      }
    }
  }
}, [activePanelId, getPanelData]);
```

## Save Triggers

### Viewport Changes

```typescript
onMove={(_, viewport) => {
  // Debounced save during movement
  debouncedSaveViewport(viewport);
}}
onMoveEnd={(_, viewport) => {
  // Immediate save when movement ends
  if (activePanelId) {
    updatePanelData(activePanelId, { viewport });
  }
}}
```

### Node Changes

```typescript
onNodesChange={(changes) => {
  // Check if changes affect position or size
  const hasPositionOrSizeChanges = changes.some((change) => {
    return (
      change.type === "position" ||
      change.type === "dimensions" ||
      change.type === "select"
    );
  });

  // Debounced save only for position/size changes
  if (hasPositionOrSizeChanges) {
    debouncedSaveNodes(nodes);
  }
  
  onNodesChange(changes);
}}
```

### Edge Changes

```typescript
onEdgesChange={(changes) => {
  // Debounced save for all edge changes
  debouncedSaveEdges(edges);
  onEdgesChange(changes);
}}
```

## Performance Optimizations

### 1. Debounced Saving

- **300ms delay** для всех операций сохранения
- **Immediate save** при завершении действий (onMoveEnd)
- **Selective saving** только при реальных изменениях

### 2. Memory Management

- **Cleanup timeouts** при размонтировании компонента
- **Conditional updates** только при наличии activePanelId
- **Optimized re-renders** через useCallback

### 3. Data Structure Optimization

- **Function removal** перед сохранением (onDelete функции)
- **Shallow comparison** для предотвращения лишних обновлений
- **Lazy loading** данных панелей

## User Experience

### Seamless Panel Switching

1. **Instant switching** - переключение между панелями мгновенное
2. **State preservation** - все состояния сохраняются точно
3. **Visual feedback** - активная панель выделена в UI
4. **No data loss** - все изменения автоматически сохраняются

### Panel Isolation Benefits

1. **Independent workspaces** - каждая панель как отдельное рабочее пространство
2. **Project organization** - разные проекты в разных панелях
3. **Experiment safety** - можно экспериментировать без потери основного проекта
4. **Collaboration ready** - готовность к совместной работе

## Storage Structure

### localStorage Key Structure

```typescript
// Panel store data
{
  "panel-store": {
    "panels": [
      {
        "id": "panel-123",
        "name": "Trading Dashboard",
        "isActive": true,
        // ... panel metadata
      }
    ],
    "activePanelId": "panel-123",
    "panelData": {
      "panel-123": {
        "panelId": "panel-123",
        "nodes": [...],      // Изолированные узлы
        "edges": [...],      // Изолированные соединения  
        "viewport": {        // Изолированный viewport
          "x": 100,
          "y": 50,
          "zoom": 1.2
        }
      }
    }
  }
}
```

## Migration Notes

### From Global Persistence

- ✅ **Backward compatible** - существующие данные сохраняются
- ✅ **Automatic migration** - создается "Default Panel" при первом запуске
- ✅ **No data loss** - все существующие виджеты переносятся в Default Panel

### Breaking Changes

- ❌ **No breaking changes** - полная обратная совместимость
- ✅ **Enhanced functionality** - новые возможности без потери старого

## Testing

### Manual Testing Steps

1. **Create multiple panels**
2. **Add widgets to different panels**
3. **Move viewport in each panel**
4. **Switch between panels**
5. **Verify state isolation**
6. **Reload page and verify persistence**

### Expected Behavior

- ✅ Каждая панель сохраняет свое состояние
- ✅ Переключение между панелями мгновенное
- ✅ Данные восстанавливаются после перезагрузки
- ✅ Нет утечек данных между панелями
