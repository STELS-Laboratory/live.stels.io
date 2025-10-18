# 🔒 Security Notes - Worker Logs SSE with Authentication

## ⚠️ CRITICAL: EventSource vs fetch + ReadableStream

### ❌ WRONG: EventSource (doesn't support custom headers)

```javascript
// ❌ НЕ ИСПОЛЬЗУЙТЕ EventSource для защищенных endpoints
const eventSource = new EventSource("/api/worker/logs/stream?sid=worker-123");

// EventSource не поддерживает custom headers!
// Нет способа передать stels-session token
// API вернет 401 Unauthorized
```

### ✅ CORRECT: fetch + ReadableStream (supports headers)

```javascript
// ✅ ПРАВИЛЬНО: fetch поддерживает headers для авторизации
const response = await fetch("/api/worker/logs/stream?sid=worker-123", {
  headers: {
    "stels-session": sessionToken, // ✅ Auth token в header
  },
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  // Process SSE data...
}
```

## 🔐 Authentication Flow

### 1. Get Session Token

```javascript
import { useAuthStore } from "@/stores/modules/auth.store.ts";

const { connectionSession } = useAuthStore();

if (!connectionSession) {
  // User not authenticated
  // Redirect to login or show error
  return;
}

// Use connectionSession.session for auth
const sessionToken = connectionSession.session;
```

### 2. Include in Headers

```javascript
const response = await fetch(streamUrl, {
  method: "GET",
  headers: {
    "stels-session": connectionSession.session, // Required!
  },
});
```

### 3. Handle Auth Errors

```javascript
if (!response.ok) {
  switch (response.status) {
    case 401:
      // Unauthorized - session expired or invalid
      setError("Session expired. Please reconnect.");
      break;
    case 403:
      // Forbidden - user doesn't have permissions
      setError("Access denied. Owner role required.");
      break;
    default:
      setError(`HTTP ${response.status}: ${response.statusText}`);
  }
  return;
}
```

## 🛡️ Security Best Practices

### 1. Never Expose Session Token

```javascript
// ❌ WRONG: Token in URL (visible in logs, history, etc.)
const url = `/api/worker/logs/stream?sid=worker-123&session=${token}`;

// ✅ CORRECT: Token in header (not logged, not cached)
const response = await fetch(url, {
  headers: { "stels-session": token },
});
```

### 2. Validate Session on Every Request

```javascript
const connect = async () => {
  // Always check session before connecting
  if (!connectionSession?.session) {
    setError("No active session");
    return;
  }

  // Session validation happens on server side
  // Server checks OWNERS list for worker logs access
};
```

### 3. Handle Session Expiration

```javascript
const connect = async () => {
  try {
    const response = await fetch(url, {
      headers: { "stels-session": connectionSession.session },
    });

    if (response.status === 401) {
      // Session expired - notify user to reconnect
      setError("Session expired. Please reconnect your wallet.");
      // Optional: trigger logout and redirect to wallet
      return;
    }

    // Continue with stream...
  } catch (err) {
    // Handle network errors
  }
};
```

### 4. Clean Up on Disconnect

```javascript
useEffect(() => {
  connect();

  return () => {
    // IMPORTANT: Cancel reader to close connection
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
  };
}, [workerId]);
```

## 🔍 Authorization Levels

### Worker Logs API Access

```
Required Role: Owner
Environment Variable: OWNERS

Example:
OWNERS=0x1234567890abcdef,0xfedcba0987654321
```

Only wallets in `OWNERS` list can:

- Stream worker logs (`GET /api/worker/logs/stream`)
- Get log info (`GET /api/worker/logs`)
- List workers (`POST /api with listWorkers`)
- Create/Update/Delete workers

## 📊 API Response Codes

### Success

- `200 OK` - Connection established, streaming started

### Client Errors

- `400 Bad Request` - Invalid worker ID or parameters
- `401 Unauthorized` - Missing or invalid session token
- `403 Forbidden` - Valid session but insufficient permissions
- `404 Not Found` - Worker or log file not found

### Server Errors

- `500 Internal Server Error` - Server-side issue
- `503 Service Unavailable` - Server overloaded or maintenance

## 🔄 Reconnection Strategy

### Automatic Reconnection

```javascript
const connectWithRetry = async (
  maxRetries: number = 3,
  delay: number = 1000,
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connect();
      return; // Success
    } catch (err) {
      if (attempt === maxRetries) {
        setError('Failed to connect after multiple attempts');
        return;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      );
    }
  }
};
```

### Session Refresh

```javascript
const connectWithSessionCheck = async () => {
  // Check if session is still valid
  if (!connectionSession?.session) {
    setError("Session expired. Please reconnect your wallet.");
    return;
  }

  // Optional: Check session age
  const sessionAge = Date.now() - (connectionSession.timestamp || 0);
  const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours

  if (sessionAge > MAX_SESSION_AGE) {
    setError("Session too old. Please reconnect your wallet.");
    return;
  }

  // Connect with valid session
  await connect();
};
```

## 🚨 Common Security Issues

### Issue 1: Session Token in URL

```javascript
// ❌ VULNERABLE: Token visible in browser history, logs, proxies
const url = `${baseUrl}/logs?token=${sessionToken}&sid=${workerId}`;
const eventSource = new EventSource(url);
```

**Solution:** Use headers

```javascript
// ✅ SECURE: Token in header, not visible in URL
const response = await fetch(url, {
  headers: { "stels-session": sessionToken },
});
```

### Issue 2: Missing Session Validation

```javascript
// ❌ BAD: Connecting without checking session
const connect = () => {
  const eventSource = new EventSource(url);
  // No session check!
};
```

**Solution:** Always validate

```javascript
// ✅ GOOD: Check session before connecting
const connect = async () => {
  if (!connectionSession?.session) {
    setError("Not authenticated");
    return;
  }
  // Connect with validated session...
};
```

### Issue 3: Not Handling Auth Errors

```javascript
// ❌ BAD: Generic error handling
const response = await fetch(url);
if (!response.ok) {
  setError("Failed to connect"); // Not helpful!
}
```

**Solution:** Specific error handling

```javascript
// ✅ GOOD: Specific error messages
if (!response.ok) {
  switch (response.status) {
    case 401:
      setError("Session expired. Please reconnect.");
      // Trigger logout flow
      break;
    case 403:
      setError("Access denied. Owner role required.");
      break;
    default:
      setError(`Connection failed: ${response.statusText}`);
  }
}
```

## 📚 References

- [MDN: ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Worker Logs API Documentation](../API/WORKER_LOGS_API.md)

---

**Remember:** Always prioritize security over convenience. Session tokens are
credentials!

**Last Updated:** 2025-10-18

**Security Review:** Required for production deployment
