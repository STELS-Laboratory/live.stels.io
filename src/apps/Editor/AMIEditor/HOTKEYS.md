# ⌨️ Keyboard Shortcuts (Hotkeys)

## 🎯 Overview

AMI Editor поддерживает горячие клавиши для быстрой работы с кодом воркеров.

## 📋 Available Shortcuts

### Code Editor

| Shortcut        | Action       | Description                                          | Context                            |
| --------------- | ------------ | ---------------------------------------------------- | ---------------------------------- |
| `⌘S` / `Ctrl+S` | **Save All** | Сохраняет все изменения (код, заметки, конфигурация) | Когда есть несохраненные изменения |

## 🔧 Implementation Details

### Save All Hotkey

```typescript
// AMIEditor.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent): void => {
    // Check for Cmd+S (Mac) or Ctrl+S (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault(); // Prevent browser's save dialog

      // Only save if there are changes
      if (selectedWorker && (isEditing || isEditingNote || isEditingConfig)) {
        handleSaveAll();
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [selectedWorker, isEditing, isEditingNote, isEditingConfig]);
```

### Key Features

1. **Cross-platform support**
   - `⌘S` на macOS (metaKey)
   - `Ctrl+S` на Windows/Linux (ctrlKey)

2. **Smart detection**
   - Срабатывает только когда есть изменения
   - Проверяет `isEditing`, `isEditingNote`, `isEditingConfig`
   - Требует выбранного воркера

3. **Browser override**
   - `e.preventDefault()` блокирует стандартный диалог браузера "Сохранить
     страницу"

4. **Clean up**
   - Event listener удаляется при unmount компонента

## 💡 Usage Examples

### Scenario 1: Editing Code

```
1. Select a worker from the list
2. Go to "Code" tab
3. Edit the script
4. Press ⌘S (Mac) or Ctrl+S (Windows)
5. ✅ Changes saved automatically
```

### Scenario 2: Editing Configuration

```
1. Select a worker
2. Go to "Config" tab
3. Change priority from "normal" to "high"
4. Press ⌘S / Ctrl+S
5. ✅ Configuration saved
```

### Scenario 3: Multiple Changes

```
1. Edit code in "Code" tab
2. Add notes in "Notes" tab
3. Change config in "Config" tab
4. Press ⌘S / Ctrl+S from any tab
5. ✅ All changes saved at once
```

## 🚫 When Hotkey Doesn't Work

The hotkey is **disabled** when:

1. **No worker selected**
   ```
   Left panel: No worker selected
   Result: Hotkey does nothing
   ```

2. **No changes detected**
   ```
   Worker selected but no edits made
   Result: Hotkey does nothing (nothing to save)
   ```

3. **Save in progress**
   ```
   Currently saving (updating state)
   Result: Hotkey ignored to prevent duplicate saves
   ```

## 🎨 Visual Indicators

### Button Tooltip

Hover over "Save All" button to see:

```
Save all changes (⌘S / Ctrl+S)
```

### Button State

- **Enabled** - Amber background, clickable
- **Disabled** - Gray background, not clickable
- **Saving** - Spinner animation

## 🔮 Future Hotkeys

Planned keyboard shortcuts:

| Shortcut               | Action                     | Status     |
| ---------------------- | -------------------------- | ---------- |
| `⌘K` / `Ctrl+K`        | Focus search               | 🔜 Planned |
| `⌘N` / `Ctrl+N`        | New worker                 | 🔜 Planned |
| `⌘E` / `Ctrl+E`        | Toggle worker (start/stop) | 🔜 Planned |
| `⌘/` / `Ctrl+/`        | Toggle comment             | 🔜 Planned |
| `⌘D` / `Ctrl+D`        | Duplicate line             | 🔜 Planned |
| `Esc`                  | Close dialogs              | 🔜 Planned |
| `⌘⇧P` / `Ctrl+Shift+P` | Command palette            | 🔜 Planned |

## 📚 Best Practices

### 1. Save Often

```
Edit code → ⌘S → Continue editing → ⌘S
```

Привычка сохранять часто предотвращает потерю изменений.

### 2. Visual Feedback

```
Before save: "Save All" button visible
After ⌘S: Brief flash or success indicator
```

Всегда следите за визуальными индикаторами сохранения.

### 3. Multi-tab Workflow

```
Code tab → edit → switch to Notes → edit → ⌘S saves both
```

Одна горячая клавиша сохраняет изменения во всех вкладках.

## 🐛 Troubleshooting

### Hotkey Not Working

**Problem:** `⌘S` не сохраняет изменения

**Solutions:**

1. Проверьте, что воркер выбран
   ```
   Left panel should show selected worker with amber border
   ```

2. Убедитесь, что есть изменения
   ```
   "Save All" button should be visible in top right
   ```

3. Проверьте браузер
   ```
   Some browser extensions may intercept ⌘S
   Try disabling extensions or use incognito mode
   ```

4. Check focus
   ```
   Click inside the editor first to ensure focus
   ```

### Browser Save Dialog Appears

**Problem:** Браузер показывает "Save Page" диалог

**Solution:** This should NOT happen (we call `preventDefault()`). If it does:

1. Report as bug
2. Temporarily use "Save All" button instead
3. Check browser console for errors

## 🔐 Security

### Sensitive Data

При сохранении через `⌘S`:

- Session token проверяется автоматически
- Требуется активная сессия
- Недействительная сессия → ошибка сохранения

### Prevention

Hotkey НЕ может:

- Сохранить без авторизации
- Bypass validation
- Save invalid configuration

## 📊 Performance

### Debouncing

Hotkey НЕ debounced специально, но:

- Кнопка disabled во время сохранения
- Предотвращает множественные одновременные saves
- Быстрые повторные нажатия игнорируются

### Network

Каждое сохранение = 1 API запрос:

```
POST /api
Method: updateWorker
Body: { channel, raw: {...} }
```

## 💻 Platform Specifics

### macOS

```
⌘ (Command) + S
```

### Windows/Linux

```
Ctrl + S
```

### Detection Logic

```typescript
if ((e.metaKey || e.ctrlKey) && e.key === "s") {
  // macOS: metaKey = true, ctrlKey = false
  // Windows/Linux: metaKey = false, ctrlKey = true
}
```

## 🎓 Tips & Tricks

### 1. Muscle Memory

Используйте `⌘S` регулярно, как в любом текстовом редакторе:

- После каждого значимого изменения
- Перед переключением воркеров
- Перед тестированием

### 2. Combine with Auto-save (Future)

```
⌘S = Manual save (immediate)
Auto-save = Background save (every 30s)
```

### 3. Check Status

```
Before closing:
1. Press ⌘S to save
2. Check "Save All" button disappears
3. Safe to close
```

---

**Version:** 1.0 **Last Updated:** 2025-10-18 **Platform:** AMI Editor v2.1.0

**Status:** ✅ Production Ready
