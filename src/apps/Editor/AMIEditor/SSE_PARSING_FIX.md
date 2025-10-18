# 🔧 SSE Parsing Fix - Log Duplication Issue

## 🐛 Problem

Worker logs were duplicating in the UI:

```
[2025-10-18T02:00:20.498Z] [INFO] 1760752820498
[2025-10-18T02:00:20.498Z] [INFO] 1760752820498  ← DUPLICATE
[2025-10-18T02:00:21.502Z] [INFO] 1760752821502
[2025-10-18T02:00:21.502Z] [INFO] 1760752821502  ← DUPLICATE
```

Server logs were correct (no duplication).

## 🔍 Root Cause

**ReadableStream splits data at arbitrary byte boundaries.**

### Wrong Implementation (Before)

```typescript
// ❌ WRONG: No buffer for incomplete messages
const chunk = decoder.decode(value, { stream: true });
const lines = chunk.split("\n\n");

for (const line of lines) {
  if (line.startsWith("data: ")) {
    const data = JSON.parse(line.substring(6));
    setLogs((prev) => [...prev, data.content]);
  }
}
```

### Why It Failed

SSE format: `data: {...}\n\n`

ReadableStream can split at any byte:

**Chunk 1:**

```
data: {"type":"log","content":"A"}\n
```

**Chunk 2:**

```
\ndata: {"type":"log","content":"B"}\n\n
```

When we `split("\n\n")` on Chunk 1:

- Result: `["data: {...}\n"]`
- We process it ✅

When we `split("\n\n")` on Chunk 2:

- Result: `["", "data: {...}\n"]`
- Empty string + same message again!
- **DUPLICATE LOG** ❌

## ✅ Solution

### Correct Implementation (After)

```typescript
// ✅ CORRECT: Buffer for incomplete SSE messages
let buffer = ""; // Persistent buffer

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  // Add chunk to buffer
  buffer += decoder.decode(value, { stream: true });

  // Process complete SSE messages (separated by \n\n)
  const messages = buffer.split("\n\n");

  // Keep last incomplete message in buffer
  buffer = messages.pop() || "";

  // Process complete messages
  for (const message of messages) {
    if (!message.trim()) continue; // Skip empty

    const lines = message.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = JSON.parse(line.substring(6));
        setLogs((prev) => [...prev, data.content]);
      }
    }
  }
}
```

### How It Works

1. **Accumulate chunks in buffer:**
   ```
   Buffer: "data: {...}\n"
   + Chunk: "\ndata: {...}\n\n"
   = "data: {...}\n\ndata: {...}\n\n"
   ```

2. **Split by message delimiter (`\n\n`):**
   ```
   ["data: {...}\n", "data: {...}\n", ""]
   ```

3. **Keep last item (incomplete) in buffer:**
   ```
   messages = ["data: {...}\n", "data: {...}\n"]
   buffer = ""  // Empty string (complete message boundary)
   ```

4. **Process only complete messages:**
   - First message: `data: {...}\n` ✅
   - Second message: `data: {...}\n` ✅
   - No duplicates! ✅

## 🎯 Key Points

### 1. ReadableStream Behavior

```typescript
// ReadableStream can split at ANY byte!
"data: {\"type\":\"log\",\"content\":\"Hello\"}\n\n"
       ↑ Can split here
             ↑ Or here
                  ↑ Or here
                        ↑ Or anywhere!
```

### 2. SSE Message Format

```
data: {"type":"log","content":"..."}\n
\n
```

- Message starts with `data:`
- Followed by JSON
- Single `\n` after JSON
- Double `\n\n` separates messages

### 3. Buffer Pattern

```typescript
let buffer = ""; // Persistent across chunks

// On each chunk:
buffer += newChunk; // Accumulate
const messages = buffer.split("\n\n"); // Split
buffer = messages.pop() || ""; // Keep incomplete
// Process messages...
```

## 📊 Comparison

### Before (Wrong)

```
Chunk 1: "data: A\n"
  → Process: "data: A\n" ✅

Chunk 2: "\ndata: B\n\n"
  → Process: "" (skip) + "data: B\n" ✅
  
Chunk 3: "data: C\n\nda"
  → Process: "data: C\n" ✅ + "da" ❌ (breaks JSON parse)

Result: Duplicates + Errors ❌
```

### After (Correct)

```
Buffer: ""
Chunk 1: "data: A\n"
  → Buffer: "data: A\n"
  → Messages: [] (no complete messages)
  → Process: nothing

Chunk 2: "\ndata: B\n\n"
  → Buffer: "data: A\n\ndata: B\n\n"
  → Messages: ["data: A\n", "data: B\n"]
  → Process: A ✅, B ✅

Chunk 3: "data: C\n\nda"
  → Buffer: "data: C\n\nda"
  → Messages: ["data: C\n"]
  → Buffer: "da" (kept incomplete)
  → Process: C ✅

Chunk 4: "ta: D\n\n"
  → Buffer: "data: D\n\n"
  → Messages: ["data: D\n"]
  → Process: D ✅

Result: No duplicates, no errors ✅
```

## 🔧 Implementation Details

### 1. Buffer Initialization

```typescript
// Inside readStream function
let buffer = ""; // Fresh buffer for each connection
```

### 2. Chunk Processing

```typescript
// Add to buffer
buffer += decoder.decode(value, { stream: true });

// IMPORTANT: { stream: true } tells decoder that more chunks coming
```

### 3. Message Extraction

```typescript
const messages = buffer.split("\n\n");
buffer = messages.pop() || "";

// .pop() removes and returns last element
// This ensures incomplete messages stay in buffer
```

### 4. Empty Message Handling

```typescript
for (const message of messages) {
  if (!message.trim()) continue; // Skip empty messages
  // Process message...
}
```

## 📚 References

### SSE Specification

- [MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [W3C: Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html)

### ReadableStream

- [MDN: ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [Streams API](https://streams.spec.whatwg.org/)

### Parsing Patterns

- [SSE Parser Implementation](https://github.com/EventSource/eventsource)
- [Chunked Transfer Encoding](https://en.wikipedia.org/wiki/Chunked_transfer_encoding)

## 🎓 Lessons Learned

1. **Never assume complete messages in chunks**
   - ReadableStream splits arbitrarily
   - Always use buffer for incomplete data

2. **Test with different chunk sizes**
   - Network conditions affect chunk boundaries
   - Buffer pattern handles all cases

3. **Handle edge cases**
   - Empty messages
   - Multi-line SSE events
   - Connection interruptions

4. **Follow standards**
   - SSE format is well-defined
   - Proper parsing prevents bugs

## 🔄 Worker Switching

When switching between workers, logs are automatically cleared with a separator:

```
# ─────────────────────────────────────────────────────────────────
# Switched to worker: 52e72aac-7bd4-4cbf-9a3f-689eca7d3d36
# Time: 2025-10-18T02:11:33.385Z
# ─────────────────────────────────────────────────────────────────
```

**Benefits:**

- ✅ Clear visual separation
- ✅ No confusion from previous logs
- ✅ Amber color highlight

---

**Fixed:** 2025-10-18 **Component:** `WorkerLogsPanel.tsx` **Impact:** ✅ No
duplicate logs | ✅ Clean switching
