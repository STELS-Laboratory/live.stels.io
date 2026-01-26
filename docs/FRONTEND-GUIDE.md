# Frontend Developer Guide

## Overview

This guide explains the key concepts and workflows for frontend developers integrating with the STELS Agentic AI Platform API.

## Table of Contents

1. [Agent-Account Security Model](#agent-account-security-model)
2. [Strategy System](#strategy-system)
3. [UI Components Recommendations](#ui-components-recommendations)
4. [API Examples](#api-examples)
5. [Agent Chat System](#agent-chat-system)
6. [Conversation History API](#conversation-history-api)

---

## Agent-Account Security Model

### Key Concept: Agents Only Access Explicitly Connected Accounts

**IMPORTANT**: Agents do NOT have automatic access to all user accounts. Each account must be explicitly connected to an agent with specific permissions (scopes).

```
┌─────────────────────────────────────────────────────────────┐
│  User                                                        │
│    │                                                         │
│    ├── Account 1 (Binance)                                  │
│    │     │                                                   │
│    │     │ connectAccountToAgent(agentId, scopes)           │
│    │     ▼                                                   │
│    │   Agent A ◄── has access with scopes: [read, trade]   │
│    │                                                         │
│    ├── Account 2 (Bybit)                                    │
│    │     │                                                   │
│    │     │ NOT connected to any agent                       │
│    │     ▼                                                   │
│    │   ❌ No agent can access this account                  │
│    │                                                         │
│    └── Account 3 (OKX)                                      │
│          │                                                   │
│          │ connectAccountToAgent(agentId, scopes)           │
│          ▼                                                   │
│        Agent A ◄── has access with scopes: [read]          │
│        Agent B ◄── has access with scopes: [read, trade]   │
└─────────────────────────────────────────────────────────────┘
```

### Account Binding Flow

1. **User connects exchange account** via `connectAccount`
2. **User selects an agent** to grant access
3. **User specifies scopes** (permissions):
   - `read` - View balance, orders, trades
   - `trade` - Create/cancel orders
   - `balance` - View balance
   - `orders` - View/manage orders
   - `history` - View trade history

4. **System creates binding** via `connectAccountToAgent`

### API Methods

```javascript
// List all user accounts
const accounts = await rpc("listAccounts", {});

// Get agent with connected accounts
const agent = await rpc("getAgent", { agentId });
// Returns: { ...agent, connectedAccounts: [...] }

// Connect account to agent
await rpc("connectAccountToAgent", {
  agentId: "agent-uuid",
  accountId: "account-nid",
  grantedScopes: ["read", "trade", "balance"],
});

// Disconnect account from agent
await rpc("disconnectAccountFromAgent", {
  agentId: "agent-uuid",
  accountId: "account-nid",
});
```

### UI Recommendations

1. **Agent Settings Page**
   - Show list of connected accounts
   - Allow adding/removing account connections
   - Display granted scopes for each account

2. **Account Connection Dialog**
   - Show available accounts (not yet connected)
   - Checkboxes for scope selection
   - Warning about trade permission

```tsx
// Example: Account Connection Dialog
<Dialog title="Connect Account to Agent">
  <Select
    label="Select Account"
    options={availableAccounts.map((acc) => ({
      value: acc.nid,
      label: `${acc.name} (${acc.exchange})`,
    }))}
  />

  <CheckboxGroup label="Permissions">
    <Checkbox value="read" label="View balances and orders" defaultChecked />
    <Checkbox value="trade" label="Create and cancel orders" />
    <Checkbox value="balance" label="View balance" defaultChecked />
  </CheckboxGroup>

  <Alert type="warning" show={scopes.includes("trade")}>
    Warning: Trade permission allows the agent to execute trades on this
    account.
  </Alert>
</Dialog>;
```

---

## Strategy System

### Key Concept: Strategies Are Bound to Agents

A strategy is a pre-configured set of automated tasks. Each strategy is bound to a specific agent and can only use accounts that are connected to that agent.

```
┌─────────────────────────────────────────────────────────────┐
│  Strategy Creation Flow                                      │
│                                                              │
│  1. User selects Strategy Template (e.g., "DCA Bot")        │
│                                                              │
│  2. User selects Agent to run the strategy                  │
│     └── Agent must have connected accounts                  │
│                                                              │
│  3. User configures strategy:                               │
│     └── accountId dropdown shows ONLY agent's accounts      │
│     └── symbol dropdown shows pairs from selected exchange  │
│     └── Other parameters (amount, frequency, etc.)          │
│                                                              │
│  4. System validates:                                        │
│     └── accountId is in agent's connectedAccounts?          │
│     └── account has required scopes (trade)?                │
│                                                              │
│  5. Strategy created with tasks                             │
└─────────────────────────────────────────────────────────────┘
```

### Available Strategy Templates

| Template        | Description                                           | Difficulty   | Risk   |
| --------------- | ----------------------------------------------------- | ------------ | ------ |
| `dca-strategy`  | Dollar Cost Averaging - buy fixed amounts on schedule | Beginner     | Low    |
| `market-making` | Market Making - provide liquidity, earn spread        | Advanced     | High   |
| `grid-trading`  | Grid Trading - profit from price oscillations         | Intermediate | Medium |

### Strategy API Methods

```javascript
// List available templates
const templates = await rpc("listStrategyTemplates", {
  domain: "trading",
  includeFull: false, // Summary only
});

// Get full template with config schema
const template = await rpc("getStrategyTemplate", {
  templateId: "dca-strategy",
});

// Create strategy instance (bound to agent)
const strategy = await rpc("createStrategy", {
  templateId: "dca-strategy",
  name: "My BTC DCA",
  agentId: "agent-uuid", // REQUIRED - strategy runs through this agent
  ownerId: "user-id",
  config: {
    accountId: "binance-main", // MUST be in agent's connectedAccounts
    symbol: "BTC/USDT",
    amountPerBuy: 100,
    frequency: "daily",
  },
  autoStart: false,
});

// List user's strategies
const strategies = await rpc("listStrategies", {
  ownerId: "user-id",
  status: "running",
});

// Start/Stop strategy
await rpc("startStrategy", { strategyId: "strategy-uuid" });
await rpc("stopStrategy", { strategyId: "strategy-uuid" });

// Delete strategy
await rpc("deleteStrategy", { strategyId: "strategy-uuid" });
```

### Dynamic Configuration Form

Strategy templates include a `configSchema` that defines the configuration form:

```javascript
const template = await rpc("getStrategyTemplate", {
  templateId: "dca-strategy",
});

// configSchema contains:
// - fields: Array of field definitions
// - groups: Logical groupings for UI

// Field types:
// - string, number, boolean, select, multiselect
// - account: Shows ONLY agent's connected accounts
// - symbol: Shows trading pairs from selected exchange
// - cron: Cron expression input

// Conditional fields (showIf):
// Some fields only show based on other field values
```

### UI Recommendations

```tsx
// Strategy Creation Wizard
<Wizard>
  {/* Step 1: Select Template */}
  <Step title="Choose Strategy">
    <StrategyTemplateGrid
      templates={templates}
      onSelect={setSelectedTemplate}
    />
  </Step>

  {/* Step 2: Select Agent */}
  <Step title="Select Agent">
    <AgentSelector
      agents={agents}
      onSelect={setSelectedAgent}
      requiredPermissions={["trade"]} // Filter agents with trade-enabled accounts
    />

    {selectedAgent && (
      <ConnectedAccountsList accounts={selectedAgent.connectedAccounts} />
    )}
  </Step>

  {/* Step 3: Configure */}
  <Step title="Configure Strategy">
    <DynamicForm
      schema={template.configSchema}
      agent={selectedAgent}
      onChange={setConfig}
    />
  </Step>

  {/* Step 4: Review & Create */}
  <Step title="Review">
    <StrategySummary
      template={template}
      agent={selectedAgent}
      config={config}
    />
    <Button onClick={createStrategy}>Create Strategy</Button>
  </Step>
</Wizard>;
```

### Account Selector Component

When rendering `type: "account"` fields, show only the agent's connected accounts:

```tsx
function AccountSelector({ agent, field, value, onChange }) {
  // Filter agent's accounts by field requirements
  const availableAccounts = agent.connectedAccounts.filter((acc) => {
    // Check exchange filter
    if (field.accountFilter?.exchanges) {
      if (!field.accountFilter.exchanges.includes(acc.exchange)) return false;
    }

    // Check required permissions
    if (field.accountFilter?.permissions) {
      const hasPermissions = field.accountFilter.permissions.every(
        (perm) => acc.grantedScopes.includes(perm),
      );
      if (!hasPermissions) return false;
    }

    return true;
  });

  if (availableAccounts.length === 0) {
    return (
      <Alert type="warning">
        No accounts with required permissions connected to this agent.
        <Link to={`/agents/${agent.id}/settings`}>Connect an account</Link>
      </Alert>
    );
  }

  return (
    <Select
      label={field.name}
      description={field.description}
      value={value}
      onChange={onChange}
      options={availableAccounts.map((acc) => ({
        value: acc.nid,
        label: `${acc.name} (${acc.exchange})`,
        description: `Permissions: ${acc.grantedScopes.join(", ")}`,
      }))}
    />
  );
}
```

---

## UI Components Recommendations

### Agent Status Badge

```tsx
function AgentStatusBadge({ agent }) {
  const { connectedAccounts } = agent;

  const hasTradeAccess = connectedAccounts.some(
    (acc) => acc.grantedScopes.includes("trade"),
  );

  return (
    <div>
      <Badge color={agent.status === "active" ? "green" : "gray"}>
        {agent.status}
      </Badge>

      <Tooltip content={`${connectedAccounts.length} connected accounts`}>
        <Badge color={connectedAccounts.length > 0 ? "blue" : "gray"}>
          {connectedAccounts.length} accounts
        </Badge>
      </Tooltip>

      {hasTradeAccess && <Badge color="orange">Trading enabled</Badge>}
    </div>
  );
}
```

### Strategy Card

```tsx
function StrategyCard({ strategy, template }) {
  return (
    <Card>
      <CardHeader>
        <Icon>{template.icon}</Icon>
        <Title>{strategy.name}</Title>
        <StatusBadge status={strategy.status} />
      </CardHeader>

      <CardBody>
        <Stat label="Template" value={template.name} />
        <Stat label="Account" value={strategy.config.accountId} />
        <Stat label="Symbol" value={strategy.config.symbol} />

        {strategy.stats && (
          <>
            <Stat label="Executions" value={strategy.stats.totalExecutions} />
            <Stat
              label="Success Rate"
              value={`${
                strategy.stats.successfulExecutions /
                strategy.stats.totalExecutions * 100
              }%`}
            />
          </>
        )}
      </CardBody>

      <CardFooter>
        {strategy.status === "running"
          ? <Button onClick={() => stopStrategy(strategy.id)}>Stop</Button>
          : <Button onClick={() => startStrategy(strategy.id)}>Start</Button>}
        <Button variant="danger" onClick={() => deleteStrategy(strategy.id)}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## API Examples

### Complete Strategy Creation Flow

```javascript
// 1. Get user's agents
const { agents } = await rpc("listAgents", {});

// 2. Get agent with connected accounts
const { agent } = await rpc("getAgent", { agentId: agents[0].id });
console.log("Connected accounts:", agent.connectedAccounts);

// 3. Get strategy template
const { template } = await rpc("getStrategyTemplate", {
  templateId: "dca-strategy",
});

// 4. Validate account is connected to agent
const accountId = "binance-main";
const isAccountConnected = agent.connectedAccounts.some(
  (acc) => acc.nid === accountId || acc.accountId === accountId,
);

if (!isAccountConnected) {
  // Connect account first
  await rpc("connectAccountToAgent", {
    agentId: agent.id,
    accountId: accountId,
    grantedScopes: ["read", "trade", "balance"],
  });
}

// 5. Create strategy
const { strategy } = await rpc("createStrategy", {
  templateId: "dca-strategy",
  name: "Daily BTC DCA",
  agentId: agent.id,
  ownerId: "user-id",
  config: {
    accountId: "binance-main",
    symbol: "BTC/USDT",
    amountPerBuy: 50,
    frequency: "daily",
    executionTime: "09:00",
    smartDcaEnabled: false,
    notificationsEnabled: true,
    notificationChannel: "telegram",
  },
  autoStart: true,
});

console.log("Strategy created:", strategy.id);
console.log("Tasks created:", strategy.taskIds.length);
```

### Error Handling

```javascript
try {
  const result = await rpc('createStrategy', { ... });
  
  if (!result.success) {
    // Validation error
    if (result.validation?.errors) {
      result.validation.errors.forEach(err => {
        console.error(`Field ${err.field}: ${err.message}`);
      });
    }
    
    // Account not connected error
    if (result.error?.includes('not connected to agent')) {
      showDialog('Account Not Connected', {
        message: 'Please connect this account to the agent first.',
        action: () => navigateTo(`/agents/${agentId}/settings`)
      });
    }
    
    return;
  }
  
  // Success
  showToast('Strategy created successfully!');
  
} catch (error) {
  showToast('Failed to create strategy', 'error');
}
```

---

## Important Notes

1. **Agents don't auto-access all accounts** - Each account must be explicitly connected to an agent with specific scopes.

2. **Strategies are bound to agents** - A strategy can only use accounts connected to its assigned agent.

3. **Account selector should filter by agent** - When showing account dropdown in strategy config, only show accounts from `agent.connectedAccounts`.

4. **Check permissions** - Before allowing strategy creation, verify the selected account has required permissions (usually `trade`).

5. **All API text is in English** - Tool descriptions, error messages, and prompts are all in English.

---

## Questions?

- API Documentation: `/docs/openapi/README.md`
- OpenAPI Spec: `/docs/openapi/openapi.yaml`
- Strategy Schemas: `/docs/openapi/schemas/strategies.yaml`

---

## Agent Chat System

### Key Concept: Conversation Context Persistence

**IMPORTANT**: To maintain conversation context (so the agent remembers what was discussed), the frontend MUST:

1. Extract `conversationId` from the first response
2. Store it in state
3. Pass it in all subsequent messages

Without `conversationId`, each message starts a NEW conversation and the agent loses context.

```
┌─────────────────────────────────────────────────────────────┐
│  Conversation Flow                                          │
│                                                              │
│  Message 1: "Sell 1 SOL at price 131"                       │
│  Response:  conversationId: "abc-123"                       │
│             "Do you confirm the order?"                     │
│             ▼                                                │
│  Message 2: conversationId: "abc-123" ◄── REQUIRED!        │
│             "Yes, I confirm"                                 │
│             ▼                                                │
│  Agent remembers: "User asked to sell 1 SOL at 131"        │
│  Response: "Order created successfully!"                    │
│                                                              │
│  WITHOUT conversationId:                                    │
│  Message 2: "Yes, I confirm"                                │
│             ▼                                                │
│  Agent: "What do you want to confirm?" ❌ Lost context!    │
└─────────────────────────────────────────────────────────────┘
```

### Chat API Method

```javascript
// First message (no conversationId)
const response = await rpc("chatWithAgent", {
  agentId: "agent-uuid",
  message: "Sell 1 SOL at price 131",
  stream: true, // or false for non-streaming
});

// Response includes conversationId
// {
//   conversationId: "abc-123-def-456",
//   response: "Do you want to place a limit sell order..."
// }

// Subsequent messages MUST include conversationId
const response2 = await rpc("chatWithAgent", {
  agentId: "agent-uuid",
  message: "Yes, I confirm",
  conversationId: "abc-123-def-456", // ◄── CRITICAL!
  stream: true,
});
```

### Streaming Response Handling

When using `stream: true`, the response comes as Server-Sent Events (SSE). The `conversationId` is included in the SSE chunks:

```javascript
// SSE Stream handling
async function handleStreamingChat(agentId, message, conversationId) {
  const response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stels-session": sessionId,
    },
    body: JSON.stringify({
      webfix: "1.0",
      method: "chatWithAgent",
      body: {
        agentId,
        message,
        conversationId, // Pass if continuing conversation
        stream: true,
      },
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let currentConversationId = conversationId;
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const chunk = JSON.parse(data);

          // Extract conversationId from first chunk
          if (chunk.conversationId && !currentConversationId) {
            currentConversationId = chunk.conversationId;
            // Store for subsequent messages
            saveConversationId(agentId, currentConversationId);
          }

          // Extract content
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            fullContent += delta.content;
            // Update UI with streaming content
            updateChatUI(fullContent);
          }
        } catch (e) {
          // Ignore non-JSON lines
        }
      }
    }
  }

  return { conversationId: currentConversationId, content: fullContent };
}
```

### Non-Streaming Response Handling

```javascript
async function handleNonStreamingChat(agentId, message, conversationId) {
  const response = await rpc("chatWithAgent", {
    agentId,
    message,
    conversationId, // Pass if continuing conversation
    stream: false,
  });

  // Response format:
  // {
  //   success: true,
  //   response: "Agent's reply...",
  //   conversationId: "abc-123-def-456",
  //   messageCount: 4,
  //   inferenceMethod: "agent_route"
  // }

  // Store conversationId for next message
  saveConversationId(agentId, response.conversationId);

  return response;
}
```

### React Hook Example

```tsx
import { useCallback, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function useChatWithAgent(agentId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message to UI
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await rpc("chatWithAgent", {
        agentId,
        message: content,
        conversationId, // Pass existing conversationId (or null for first message)
        stream: false,
      });

      // Save conversationId for next message
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Add assistant message to UI
      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      // Handle error - maybe show retry button
    } finally {
      setIsLoading(false);
    }
  }, [agentId, conversationId]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null); // New conversation on next message
  }, []);

  return {
    messages,
    sendMessage,
    clearConversation,
    isLoading,
    conversationId,
  };
}

// Usage in component
function ChatComponent({ agentId }: { agentId: string }) {
  const { messages, sendMessage, clearConversation, isLoading } =
    useChatWithAgent(agentId);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat with Agent</h3>
        <button onClick={clearConversation}>New Conversation</button>
      </div>

      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="loading">Agent is thinking...</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

### Conversation Persistence Strategies

#### Option 1: In-Memory (Per Session)

```javascript
// Simple: conversationId lost on page refresh
const conversationIds = new Map(); // agentId -> conversationId

function saveConversationId(agentId, conversationId) {
  conversationIds.set(agentId, conversationId);
}
```

#### Option 2: LocalStorage (Persistent)

```javascript
// Better: conversation persists across page refreshes
function saveConversationId(agentId, conversationId) {
  const key = `chat_conversation_${agentId}`;
  localStorage.setItem(key, conversationId);
}

function loadConversationId(agentId) {
  const key = `chat_conversation_${agentId}`;
  return localStorage.getItem(key);
}
```

#### Option 3: URL Parameter (Shareable)

```javascript
// Best for shareable chat links
function updateURL(conversationId) {
  const url = new URL(window.location);
  url.searchParams.set("conversation", conversationId);
  window.history.replaceState({}, "", url);
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("conversation");
}
```

### Agent Tool Execution Flow

When an agent needs to perform actions (like checking balance or creating orders), it may require multiple steps:

```
User: "Sell 1 SOL at 131"
                │
                ▼
Agent: "Checking your SOL balance..."
       [Executes getAccountBalance tool]
                │
                ▼
Agent: "You have 3188 SOL. Creating sell order..."
       [Executes createOrder tool]
                │
                ▼
Agent: "Limit sell order created: 1 SOL at 131 USDT"
```

This multi-step flow happens automatically on the backend. The frontend receives the final response.

### Error Handling

```javascript
try {
  const response = await rpc("chatWithAgent", {
    agentId,
    message,
    conversationId,
  });

  if (!response.success) {
    // Handle specific errors
    switch (response.code) {
      case "AGENT_NOT_FOUND":
        showError("Agent not found");
        break;
      case "AGENT_INACTIVE":
        showError("Agent is not active");
        break;
      case "RATE_LIMITED":
        showError("Too many requests. Please wait.");
        break;
      default:
        showError(response.message || "Chat failed");
    }
    return;
  }

  // Success - update UI
  addMessage(response.response);
} catch (error) {
  showError("Network error. Please try again.");
}
```

### UI Best Practices

1. **Show conversation ID** (optional) - Useful for debugging
2. **"New Conversation" button** - Clears conversationId and starts fresh
3. **Loading indicator** - Agent may take 5-20 seconds for tool execution
4. **Markdown support** - Agent responses may contain markdown formatting
5. **Error retry** - Allow retrying failed messages
6. **Scroll to bottom** - Auto-scroll on new messages

```tsx
// Example chat UI structure
<ChatContainer>
  <ChatHeader>
    <AgentAvatar agent={agent} />
    <AgentName>{agent.name}</AgentName>
    <NewChatButton onClick={clearConversation} />
  </ChatHeader>

  <MessageList ref={scrollRef}>
    {messages.map(renderMessage)}
    {isLoading && <TypingIndicator />}
  </MessageList>

  <InputArea>
    <TextInput
      value={input}
      onChange={setInput}
      onKeyDown={handleKeyDown}
      placeholder="Ask anything..."
    />
    <SendButton onClick={sendMessage} disabled={isLoading} />
  </InputArea>
</ChatContainer>;
```

---

## Conversation History API

### Getting Conversation History

When the client app loads or refreshes, it can retrieve the full conversation history using `getConversation`:

```javascript
// Load existing conversation on app start
const conversationId = localStorage.getItem(`chat_conversation_${agentId}`);

if (conversationId) {
  const response = await rpc("getConversation", { conversationId });

  if (response.success) {
    // Restore messages to UI
    const { conversation } = response;
    setMessages(conversation.messages);
    // conversation also contains:
    // - id, agentId, userId
    // - messageCount
    // - createdAt, updatedAt
  }
}
```

### Listing All Conversations

Get a list of all user's conversations (useful for conversation sidebar/history):

```javascript
// List all conversations for the user
const response = await rpc("listConversations", {
  agentId: "optional-agent-uuid", // Filter by specific agent
  limit: 20,
  offset: 0,
});

// Response:
// {
//   success: true,
//   conversations: [
//     {
//       id: "conv-uuid",
//       agentId: "agent-uuid",
//       userId: "user-id",
//       messageCount: 15,
//       lastMessage: {
//         role: "assistant",
//         content: "Order created successfully...",
//         timestamp: 1705849200000
//       },
//       createdAt: 1705848000000,
//       updatedAt: 1705849200000
//     },
//     ...
//   ],
//   total: 45,
//   limit: 20,
//   offset: 0,
//   hasMore: true
// }
```

### Complete Implementation Example

```tsx
import { useCallback, useEffect, useState } from "react";

interface Conversation {
  id: string;
  agentId: string;
  messageCount: number;
  lastMessage?: {
    role: string;
    content: string;
    timestamp: number;
  };
  createdAt: number;
  updatedAt: number;
}

function useChatWithHistory(agentId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversation list on mount
  useEffect(() => {
    loadConversations();
  }, [agentId]);

  // Load specific conversation from localStorage
  useEffect(() => {
    const savedConversationId = localStorage.getItem(
      `chat_conversation_${agentId}`,
    );
    if (savedConversationId) {
      loadConversation(savedConversationId);
    }
  }, [agentId]);

  const loadConversations = async () => {
    const response = await rpc("listConversations", { agentId });
    if (response.success) {
      setConversations(response.conversations);
    }
  };

  const loadConversation = async (convId: string) => {
    setIsLoading(true);
    try {
      const response = await rpc("getConversation", { conversationId: convId });
      if (response.success) {
        setConversationId(convId);
        setMessages(response.conversation.messages);
        localStorage.setItem(`chat_conversation_${agentId}`, convId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    const userMessage = { role: "user", content, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await rpc("chatWithAgent", {
        agentId,
        message: content,
        conversationId, // Pass existing conversationId or null
        stream: false,
      });

      if (response.success) {
        // Save conversationId for future messages
        if (response.conversationId) {
          setConversationId(response.conversationId);
          localStorage.setItem(
            `chat_conversation_${agentId}`,
            response.conversationId,
          );
        }

        const assistantMessage = {
          role: "assistant",
          content: response.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Refresh conversation list to update lastMessage
        loadConversations();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem(`chat_conversation_${agentId}`);
  };

  const switchConversation = (convId: string) => {
    loadConversation(convId);
  };

  return {
    messages,
    sendMessage,
    isLoading,
    conversationId,
    conversations,
    startNewConversation,
    switchConversation,
    loadConversations,
  };
}
```

### UI with Conversation Sidebar

```tsx
function ChatWithSidebar({ agentId }: { agentId: string }) {
  const {
    messages,
    sendMessage,
    isLoading,
    conversationId,
    conversations,
    startNewConversation,
    switchConversation,
  } = useChatWithHistory(agentId);

  return (
    <div className="chat-layout">
      {/* Sidebar - Conversation History */}
      <aside className="conversation-sidebar">
        <button onClick={startNewConversation} className="new-chat-btn">
          + New Conversation
        </button>

        <div className="conversation-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${
                conv.id === conversationId ? "active" : ""
              }`}
              onClick={() => switchConversation(conv.id)}
            >
              <div className="conv-preview">
                {conv.lastMessage?.content || "Empty conversation"}
              </div>
              <div className="conv-meta">
                {conv.messageCount} messages • {formatDate(conv.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <MessageList messages={messages} />
        {isLoading && <TypingIndicator />}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </main>
    </div>
  );
}
```

### API Reference

| Method              | Description                    | Auth Required |
| ------------------- | ------------------------------ | ------------- |
| `chatWithAgent`     | Send message, receive response | Yes           |
| `getConversation`   | Get full conversation by ID    | Yes           |
| `listConversations` | List user's conversations      | Yes           |

#### `getConversation` Parameters

| Parameter        | Type   | Required | Description              |
| ---------------- | ------ | -------- | ------------------------ |
| `conversationId` | string | Yes      | UUID of the conversation |

#### `listConversations` Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `agentId` | string | No       | Filter by specific agent       |
| `limit`   | number | No       | Max results (default: 50)      |
| `offset`  | number | No       | Pagination offset (default: 0) |

---

## ⚠️ v2.12.0 Breaking Change: Unified Response Format

**All API responses now use the `raw` field for data payload.**

See `/docs/WEBFIX-MIGRATION-GUIDE.md` for complete migration instructions.

### Quick Migration

```typescript
// Before (v2.11.x)
const response = await rpc("listOrders", { nid: "g-vld" });
const orders = response.data.orders;
const balance = response.data;
const agent = response.agent;

// After (v2.12.0)
const response = await rpc("listOrders", { nid: "g-vld" });
const orders = response.raw.orders;
const balance = response.raw;
const agent = response.raw.agent;
```

---

## New Trading Methods (v2.12.0)

### accountId vs nid

New trading methods accept `accountId` (UUID) instead of `nid`:
- **accountId**: UUID from `listAccounts` response (`account.aid`) or `connectAccount`
- **nid**: Legacy network identifier (e.g., "g-vld", "binance-main")

Both old and new methods continue to work. Use new methods for better type safety.

### fetchPositions - Get Open Positions

```typescript
const result = await rpc<Position[]>("fetchPositions", {
  accountId: "uuid-string",
  symbol: "BTC/USDT" // optional
});

if (result.success && result.raw) {
  result.raw.forEach(position => {
    console.log(`${position.symbol}: ${position.side} ${position.amount}`);
    console.log(`  Entry: ${position.entryPrice}, Mark: ${position.markPrice}`);
    console.log(`  PnL: ${position.unrealizedPnl} (${position.percentage}%)`);
  });
}

interface Position {
  symbol: string;
  side: "long" | "short";
  amount: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  percentage: number;
}
```

### fetchBalance - Get Balance by accountId

```typescript
const result = await rpc<BalanceResponse>("fetchBalance", {
  accountId: "uuid-string"
});

// Same response format as getBalance
```

### fetchOpenOrders - Get Open Orders

```typescript
const result = await rpc<Order[]>("fetchOpenOrders", {
  accountId: "uuid-string",
  symbol: "BTC/USDT" // optional
});
```

### fetchOrderHistory - Get Order History

```typescript
const result = await rpc<Order[]>("fetchOrderHistory", {
  accountId: "uuid-string",
  symbol: "BTC/USDT",    // optional
  since: 1705000000000,  // optional: timestamp
  limit: 50              // optional: 1-1000, default 50
});
```

### fetchTrades - Get Trade History

```typescript
const result = await rpc<Trade[]>("fetchTrades", {
  accountId: "uuid-string",
  symbol: "BTC/USDT",    // optional
  since: 1705000000000,  // optional
  limit: 50              // optional: 1-1000
});
```

### setLeverage - Set Futures Leverage

```typescript
const result = await rpc<{ leverage: number; symbol?: string }>("setLeverage", {
  accountId: "uuid-string",
  leverage: 10,           // 1-125
  symbol: "BTC/USDT"      // optional: specific symbol or all
});

if (result.success) {
  console.log(`Leverage set to ${result.raw.leverage}x`);
}
```

### transferFunds - Internal Transfer

```typescript
const result = await rpc<TransferResult>("transferFunds", {
  accountId: "uuid-string",
  currency: "USDT",
  amount: 1000.00,
  fromAccount: "spot",     // spot | margin | futures | funding
  toAccount: "futures"
});

if (result.success) {
  console.log(`Transfer ${result.raw.transferId}: ${result.raw.amount} ${result.raw.currency}`);
}
```

### createBatchOrders - Batch Orders

```typescript
const result = await rpc<BatchOrdersResult>("createBatchOrders", {
  accountId: "uuid-string",
  orders: [
    {
      symbol: "BTC/USDT",
      side: "buy",
      type: "limit",
      amount: 0.01,
      price: 42000.00,
      timeInForce: "GTC"
    },
    {
      symbol: "BTC/USDT",
      side: "sell",
      type: "limit",
      amount: 0.01,
      price: 45000.00
    }
  ]
});

if (result.success && result.raw) {
  console.log(`Total: ${result.raw.total}, Success: ${result.raw.successful}, Failed: ${result.raw.failed}`);
  result.raw.results.forEach(r => {
    if (r.success) {
      console.log(`Order ${r.data.id} created`);
    } else {
      console.log(`Order failed: ${r.error}`);
    }
  });
}

interface BatchOrdersResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    order: BatchOrderParams;
    success: boolean;
    data: Order | null;
    error: string | null;
  }>;
  timestamp: number;
}
```

### createConditionalOrder - Conditional Orders

```typescript
const result = await rpc<ConditionalOrderResult>("createConditionalOrder", {
  accountId: "uuid-string",
  condition: {
    type: "price",           // price | time | indicator
    operator: "gte",         // gt | lt | eq | gte | lte
    value: 45000.00,
    symbol: "BTC/USDT"       // required for price type
  },
  order: {
    symbol: "BTC/USDT",
    side: "buy",
    type: "market",
    amount: 0.01
  },
  expiresAt: 1705100000000   // optional
});

if (result.success && result.raw) {
  console.log(`Conditional order ${result.raw.conditionalOrderId}: ${result.raw.status}`);
}
```

---

## TypeScript Types Reference

```typescript
// Base API Response (v2.12.0)
interface ApiResponse<T = unknown> {
  success: boolean;
  raw?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    httpStatus?: number;
  };
  channel?: string;
  module?: string;
  requestId?: string;
  timestamp?: number;
}

// Trading Types
type OrderSide = "buy" | "sell";
type PositionSide = "long" | "short";
type OrderType = "market" | "limit" | "stop" | "stop_limit" | "trailing_stop" | "take_profit" | "take_profit_limit";
type OrderStatus = "pending" | "open" | "partial" | "filled" | "cancelled" | "rejected" | "expired";
type AccountType = "spot" | "margin" | "futures" | "funding";
type TimeInForce = "GTC" | "IOC" | "FOK" | "GTD" | "PO";

interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price?: number;
  amount: number;
  filled: number;
  remaining: number;
  cost?: number;
  average?: number;
  timestamp: number;
}

interface Position {
  symbol: string;
  side: PositionSide;
  amount: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  percentage: number;
}

interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  price: number;
  amount: number;
  cost: number;
  fee?: { cost: number; currency: string };
  timestamp: number;
}
```

---

## Multi-Market Trading Support (v2.13.0)

### Overview

The platform now supports multiple market types within a single account, allowing users to switch between different trading instruments:

- **spot** - Spot trading (buy/sell actual assets)
- **linear** - USDT-margined perpetual futures
- **inverse** - Coin-margined perpetual futures
- **option** - Options trading

### Getting Available Market Types

Use `getAccountMarketTypes` to get the list of available market types for an account:

```javascript
const marketTypes = await rpc("getAccountMarketTypes", {
  accountId: "account-uuid"  // or nid: "g-my-account"
});

// Response:
{
  "success": true,
  "raw": {
    "accountId": "g-my-bybit",
    "exchange": "bybit",
    "exchangeSupportedTypes": ["spot", "linear", "inverse", "option"],
    "availableMarketTypes": ["spot", "linear", "inverse", "option"],
    "defaultMarketType": "spot",
    "marketTypes": [
      {
        "type": "spot",
        "name": "Spot Trading",
        "description": "Buy and sell actual assets at current market prices",
        "isDefault": true,
        "isAvailable": true,
        "availableMethods": [
          "getBalance", "fetchBalanceById", "getTicker", "getOrderBook",
          "createOrder", "cancelOrder", "getOrder",
          "listOrders", "fetchOpenOrders", "fetchOrderHistory",
          "listTrades", "fetchTradesById", "createBatchOrders"
        ]
      },
      {
        "type": "linear",
        "name": "USDT Perpetual Futures",
        "description": "USDT-margined perpetual contracts with leverage",
        "isDefault": false,
        "isAvailable": true,
        "availableMethods": [
          "getBalance", "fetchBalanceById", "getTicker", "getOrderBook",
          "createOrder", "cancelOrder", "getOrder",
          "listOrders", "fetchOpenOrders", "fetchOrderHistory",
          "listTrades", "fetchTradesById", "createBatchOrders",
          "fetchPositions", "setLeverage", "createConditionalOrder", "transferFunds"
        ]
      }
    ]
  }
}
```

### Exchange Support Matrix

| Exchange | spot | linear | inverse | option |
|----------|------|--------|---------|--------|
| Bybit | ✅ | ✅ | ✅ | ✅ |
| Binance | ✅ | ✅ | ✅ | ❌ |
| OKX | ✅ | ✅ | ❌ | ✅ |
| Gate | ✅ | ✅ | ❌ | ❌ |
| KuCoin | ✅ | ✅ | ❌ | ❌ |
| Bitget | ✅ | ✅ | ❌ | ❌ |
| MEXC | ✅ | ✅ | ❌ | ❌ |
| Coinbase | ✅ | ❌ | ❌ | ❌ |

### UI Implementation

#### Market Type Selector Component

```tsx
// Example: Market Type Selector
function MarketTypeSelector({ accountId, onChange }) {
  const [marketTypes, setMarketTypes] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function loadMarketTypes() {
      const response = await rpc("getAccountMarketTypes", { accountId });
      if (response.success) {
        setMarketTypes(response.raw.marketTypes.filter(t => t.isAvailable));
        setSelected(response.raw.defaultMarketType);
      }
    }
    loadMarketTypes();
  }, [accountId]);

  return (
    <div className="market-type-selector">
      {marketTypes.map(mt => (
        <button
          key={mt.type}
          className={selected === mt.type ? "active" : ""}
          onClick={() => {
            setSelected(mt.type);
            onChange(mt.type, mt.availableMethods);
          }}
        >
          {mt.name}
        </button>
      ))}
    </div>
  );
}
```

#### Conditional UI Based on Available Methods

```tsx
// Show/hide UI elements based on available methods
function TradingTerminal({ marketType, availableMethods }) {
  const hasPositions = availableMethods.includes("fetchPositions");
  const hasLeverage = availableMethods.includes("setLeverage");
  const hasTransfer = availableMethods.includes("transferFunds");

  return (
    <div className="trading-terminal">
      {/* Always show */}
      <OrderForm />
      <OrderBook />
      <TradeHistory />

      {/* Only show for derivatives */}
      {hasPositions && <PositionsPanel />}
      
      {/* Only show for futures */}
      {hasLeverage && <LeverageSlider />}
      {hasTransfer && <TransferButton />}
    </div>
  );
}
```

### Trading Methods with Market Type Override

When calling trading methods, you can override the market type per-request:

```javascript
// Fetch positions for linear futures (even if account default is spot)
const positions = await rpc("fetchPositions", {
  accountId: "account-uuid",
  marketType: "linear"  // Override market type
});

// Fetch balance for inverse futures
const balance = await rpc("fetchBalanceById", {
  accountId: "account-uuid",
  marketType: "inverse"
});
```

### RPC Methods per Market Type

| Method | spot | linear | inverse | option |
|--------|------|--------|---------|--------|
| getBalance | ✅ | ✅ | ✅ | ✅ |
| getTicker | ✅ | ✅ | ✅ | ✅ |
| getOrderBook | ✅ | ✅ | ✅ | ✅ |
| createOrder | ✅ | ✅ | ✅ | ✅ |
| cancelOrder | ✅ | ✅ | ✅ | ✅ |
| listOrders | ✅ | ✅ | ✅ | ✅ |
| listTrades | ✅ | ✅ | ✅ | ✅ |
| createBatchOrders | ✅ | ✅ | ✅ | ✅ |
| fetchPositions | ❌ | ✅ | ✅ | ✅ |
| setLeverage | ❌ | ✅ | ✅ | ❌ |
| createConditionalOrder | ❌ | ✅ | ✅ | ✅ |
| transferFunds | ❌ | ✅ | ✅ | ❌ |

---


## System Metrics API (v2.14.0)

### Overview

The `getMetrics` RPC method provides comprehensive system metrics including workers, RPC calls, system resources, and more. This is useful for building admin dashboards, monitoring tools, and debugging.

### Getting Metrics

```javascript
const metrics = await rpc("getMetrics", {
  format: "json",           // "json" | "prometheus"
  includeSystem: true,      // Memory, uptime, Deno info
  includeRpc: true,         // RPC calls stats
  includeTracing: true,     // Tracing spans
  includeApplication: true, // Agents, tasks, chains
  includeWorkers: true      // Worker statistics
});
```

### Worker Metrics (v2.14.0)

Worker metrics now include detailed breakdown by scope (local vs network):

```javascript
{
  "workers": {
    // Total counts
    "totalWorkers": 23,
    "runningWorkers": 1,
    "stoppedWorkers": 22,

    // Local workers (scope: "local", stored in local KV)
    "local": {
      "total": 15,      // Total local workers in KV
      "active": 5,      // Workers with active=true flag
      "running": 3      // Actually running on this node
    },

    // Network workers (scope: "network", stored in distributed KV)
    "network": {
      "total": 8,       // Total network workers
      "active": 2,      // Active in network
      "running": 1      // Running on this node (as leader/parallel)
    },

    // Execution statistics
    "totalExecutions": 48,
    "totalErrors": 0,
    "networkErrors": 0,
    "criticalErrors": 0,
    "errorRate": 0,

    // Capacity limits
    "capacity": {
      "current": 1,           // Currently running
      "maxRecommended": 100,  // Max recommended per node
      "utilizationPercent": 1 // Current utilization
    },

    // Error thresholds (when worker stops)
    "thresholds": {
      "maxConsecutiveNetworkErrors": 20,
      "maxCriticalErrors": 10,
      "maxConsecutiveErrors": 50,
      "networkErrorPauseMs": 300000
    },

    // Function cache stats
    "cache": {
      "functions": 1,
      "loggers": 1,
      "hitRate": 0,
      "totalHits": 0
    },

    // Top 10 workers by executions
    "topWorkers": [
      {
        "sid": "9948e72a-f9af-4cab-ad8f-a7ce3cad7429",
        "isRunning": true,
        "scope": "local",   // "local" | "network"
        "executions": 48,
        "errors": 0,
        "errorRate": 0,
        "uptime": 3600000,
        "lastRun": 1737561234567
      }
    ]
  }
}
```

### Worker Scope Explanation

| Scope | Description |
|-------|-------------|
| `local` | Workers stored in local KV, visible only on this node. Always executed locally. |
| `network` | Workers stored in distributed KV, visible across all nodes. Execution depends on `executionMode`. |

### Worker States

| State | Description |
|-------|-------------|
| `total` | All workers in KV (including inactive) |
| `active` | Workers with `active: true` flag (should be running) |
| `running` | Actually executing on this node right now |

### UI Example: Workers Dashboard

```tsx
function WorkersDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const result = await rpc("getMetrics", { includeWorkers: true });
      if (result.success) {
        setMetrics(result.raw.workers);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="workers-dashboard">
      {/* Summary Cards */}
      <div className="cards">
        <Card title="Total Workers" value={metrics.totalWorkers} />
        <Card title="Running" value={metrics.runningWorkers} color="green" />
        <Card title="Stopped" value={metrics.stoppedWorkers} color="gray" />
      </div>

      {/* By Scope */}
      <div className="scope-breakdown">
        <h3>Local Workers</h3>
        <Progress 
          value={metrics.local.running} 
          max={metrics.local.active}
          label={`${metrics.local.running}/${metrics.local.active} running`}
        />
        
        <h3>Network Workers</h3>
        <Progress 
          value={metrics.network.running} 
          max={metrics.network.active}
          label={`${metrics.network.running}/${metrics.network.active} running`}
        />
      </div>

      {/* Capacity */}
      <div className="capacity">
        <h3>Capacity Utilization</h3>
        <ProgressBar
          percent={metrics.capacity.utilizationPercent}
          label={`${metrics.capacity.current}/${metrics.capacity.maxRecommended}`}
        />
      </div>

      {/* Execution Stats */}
      <div className="stats">
        <Stat label="Total Executions" value={metrics.totalExecutions} />
        <Stat label="Total Errors" value={metrics.totalErrors} />
        <Stat 
          label="Error Rate" 
          value={`${metrics.errorRate}%`}
          color={metrics.errorRate > 5 ? "red" : "green"}
        />
      </div>

      {/* Top Workers Table */}
      <table className="workers-table">
        <thead>
          <tr>
            <th>Worker ID</th>
            <th>Scope</th>
            <th>Status</th>
            <th>Executions</th>
            <th>Errors</th>
            <th>Uptime</th>
          </tr>
        </thead>
        <tbody>
          {metrics.topWorkers.map(worker => (
            <tr key={worker.sid}>
              <td>{worker.sid.slice(0, 8)}...</td>
              <td>
                <Badge type={worker.scope === "local" ? "blue" : "purple"}>
                  {worker.scope}
                </Badge>
              </td>
              <td>
                <StatusDot active={worker.isRunning} />
                {worker.isRunning ? "Running" : "Stopped"}
              </td>
              <td>{worker.executions}</td>
              <td>{worker.errors}</td>
              <td>{formatDuration(worker.uptime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Prometheus Format

For Grafana/Prometheus integration, request with `format: "prometheus"`:

```javascript
const response = await rpc("getMetrics", { format: "prometheus" });
// Returns plain text Prometheus format
```

Key worker metrics in Prometheus format:
```
# Total workers
stels_workers_total 23
stels_workers_running 1
stels_workers_stopped 22

# Local workers
stels_workers_local_total 15
stels_workers_local_active 5
stels_workers_local_running 3

# Network workers
stels_workers_network_total 8
stels_workers_network_active 2
stels_workers_network_running 1

# Execution stats
stels_worker_executions_total 48
stels_worker_errors_total 0
stels_worker_error_rate_percent 0

# Capacity
stels_worker_capacity_current 1
stels_worker_capacity_max 100
stels_worker_capacity_utilization_percent 1

# Per-worker (top 10)
stels_worker_executions{sid="9948e72a-...",scope="local",running="true"} 48
stels_worker_errors{sid="9948e72a-...",scope="local"} 0
```

---

## Professional Trading Terminal API (v2.15.0)

### Overview

The platform now includes a comprehensive Professional Trading API designed for building advanced trading terminals. This API provides full order management, position control, and risk management capabilities with priority support for Bybit.

### API Categories

```
┌─────────────────────────────────────────────────────────────┐
│  Professional Trading API                                    │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Order Management│  │Position Control │  │ Risk Mgmt    │ │
│  │                 │  │                 │  │              │ │
│  │ • editOrder     │  │ • setMarginMode │  │ • fetchLever │ │
│  │ • cancelAll     │  │ • closePosition │  │   ageTiers   │ │
│  │ • createWithTpSl│  │ • setPosition   │  │ • fetchFund  │ │
│  │ • createStop    │  │   Mode          │  │   ingRate    │ │
│  │   Order         │  │ • modifyMargin  │  │ • fetchMy    │ │
│  │                 │  │                 │  │   Liquidations│ │
│  └─────────────────┘  └─────────────────┘  │ • fetchGreeks│ │
│                                             └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

### Order Management

#### Edit Order

Modify an existing order's price or amount:

```javascript
const result = await rpc("editOrder", {
  accountId: "account-uuid",
  orderId: "order-id",
  symbol: "BTC/USDT",
  amount: 0.5,              // New amount
  price: 45000,             // New price
  positionIdx: 0            // Bybit: 0=one-way, 1=buy hedge, 2=sell hedge
});

// Response:
{
  "success": true,
  "raw": {
    "orderId": "order-id",
    "symbol": "BTC/USDT",
    "amount": 0.5,
    "price": 45000,
    "status": "open",
    "timestamp": 1706000000000
  }
}
```

#### Cancel All Orders

Cancel all open orders for a symbol or all symbols:

```javascript
const result = await rpc("cancelAllOrders", {
  accountId: "account-uuid",
  symbol: "BTC/USDT",           // Optional - if omitted, cancels all
  marketType: "linear",          // Optional: spot, linear, inverse, option
  orderFilter: "Order"           // Bybit: "Order", "StopOrder", "tpslOrder"
});

// Response:
{
  "success": true,
  "raw": {
    "canceledCount": 5,
    "canceledOrders": [...],
    "symbol": "BTC/USDT",
    "timestamp": 1706000000000
  }
}
```

#### Create Order with Take Profit / Stop Loss

Create an order with attached TP/SL:

```javascript
const result = await rpc("createOrderWithTpSl", {
  accountId: "account-uuid",
  symbol: "BTC/USDT",
  type: "limit",
  side: "buy",
  amount: 0.1,
  price: 44000,
  takeProfitPrice: 48000,
  stopLossPrice: 42000,
  // Bybit-specific options
  tpTriggerBy: "MarkPrice",      // "LastPrice", "MarkPrice", "IndexPrice"
  slTriggerBy: "MarkPrice",
  tpslMode: "Full",              // "Full" or "Partial"
  positionIdx: 0,                // For hedge mode
  reduceOnly: false,
  timeInForce: "GTC"             // "GTC", "IOC", "FOK", "PostOnly"
});
```

#### Create Stop Order

Create stop/trigger orders:

```javascript
const result = await rpc("createStopOrder", {
  accountId: "account-uuid",
  symbol: "BTC/USDT",
  stopOrderType: "stop_loss",    // See types below
  side: "sell",
  amount: 0.1,
  triggerPrice: 43000,
  price: 42900,                  // For limit stop orders
  triggerBy: "MarkPrice",
  positionIdx: 0,
  reduceOnly: true
});
```

**Stop Order Types:**
| Type | Description |
|------|-------------|
| `stop_loss` | Market sell when price falls below trigger |
| `take_profit` | Market sell when price rises above trigger |
| `stop_loss_limit` | Limit sell when price falls below trigger |
| `take_profit_limit` | Limit sell when price rises above trigger |
| `trailing_stop` | Dynamic stop that follows price movement |

---

### Position Management

#### Set Margin Mode

Switch between cross and isolated margin:

```javascript
await rpc("setMarginMode", {
  accountId: "account-uuid",
  marginMode: "isolated",        // "cross" or "isolated"
  symbol: "BTC/USDT"
});
```

#### Close Position

Close an open position:

```javascript
const result = await rpc("closePosition", {
  accountId: "account-uuid",
  symbol: "BTC/USDT",
  amount: 0.05,                  // Optional - closes full position if omitted
  positionIdx: 0,                // For hedge mode
  price: 45000                   // Optional - market close if omitted
});

// Response includes closed position details
{
  "success": true,
  "raw": {
    "orderId": "close-order-id",
    "symbol": "BTC/USDT",
    "side": "sell",
    "amount": 0.1,
    "status": "closed",
    "closedPosition": {
      "side": "long",
      "contracts": 0.1
    }
  }
}
```

#### Set Position Mode

Switch between one-way and hedge mode:

```javascript
await rpc("setPositionMode", {
  accountId: "account-uuid",
  hedged: true,                  // true = hedge mode, false = one-way
  symbol: "BTC/USDT"             // Optional for some exchanges
});
```

#### Modify Margin

Add or reduce margin for isolated positions:

```javascript
await rpc("modifyMargin", {
  accountId: "account-uuid",
  symbol: "BTC/USDT",
  amount: 100,                   // Amount in quote currency
  action: "add",                 // "add" or "reduce"
  positionIdx: 0                 // For hedge mode
});
```

---

### Risk Management

#### Fetch Leverage Tiers

Get leverage tier information:

```javascript
const result = await rpc("fetchLeverageTiers", {
  accountId: "account-uuid",
  symbol: "BTC/USDT",            // Or symbols: ["BTC/USDT", "ETH/USDT"]
  marketType: "linear"
});

// Response:
{
  "success": true,
  "raw": {
    "tiers": {
      "BTC/USDT": [
        {
          "tier": 1,
          "minNotional": 0,
          "maxNotional": 2000000,
          "maintenanceMarginRate": 0.004,
          "maxLeverage": 125
        },
        {
          "tier": 2,
          "minNotional": 2000000,
          "maxNotional": 10000000,
          "maintenanceMarginRate": 0.005,
          "maxLeverage": 100
        }
      ]
    }
  }
}
```

#### Fetch Funding Rate

Get current and historical funding rates:

```javascript
// Current funding rate
const current = await rpc("fetchFundingRate", {
  accountId: "account-uuid",
  symbol: "BTC/USDT"
});

// Historical funding rates
const history = await rpc("fetchFundingRate", {
  accountId: "account-uuid",
  symbol: "BTC/USDT",
  history: true,
  since: Date.now() - 7 * 24 * 60 * 60 * 1000,  // Last 7 days
  limit: 100
});

// Response:
{
  "success": true,
  "raw": {
    "fundingRate": {
      "symbol": "BTC/USDT",
      "fundingRate": 0.0001,
      "fundingTimestamp": 1706000000000,
      "nextFundingTimestamp": 1706028800000,
      "nextFundingRate": 0.00012,
      "markPrice": 45000,
      "indexPrice": 44995
    }
  }
}
```

#### Fetch Liquidation History

Get user's liquidation history:

```javascript
const result = await rpc("fetchMyLiquidations", {
  accountId: "account-uuid",
  symbol: "BTC/USDT",            // Optional
  since: Date.now() - 30 * 24 * 60 * 60 * 1000,
  limit: 50
});

// Response:
{
  "success": true,
  "raw": {
    "liquidations": [
      {
        "id": "liq-123",
        "symbol": "BTC/USDT",
        "timestamp": 1705900000000,
        "price": 42000,
        "contracts": 0.5,
        "side": "long",
        "quoteValue": 21000
      }
    ],
    "total": 1
  }
}
```

#### Fetch Greeks (Options)

Get option Greeks for options trading:

```javascript
// Single option
const greeks = await rpc("fetchGreeks", {
  accountId: "account-uuid",
  symbol: "BTC-31JAN25-50000-C"
});

// All options for base currency
const allGreeks = await rpc("fetchGreeks", {
  accountId: "account-uuid",
  baseCurrency: "BTC"
});

// Response:
{
  "success": true,
  "raw": {
    "greeks": {
      "symbol": "BTC-31JAN25-50000-C",
      "delta": 0.45,
      "gamma": 0.00012,
      "vega": 25.5,
      "theta": -15.2,
      "rho": 0.08,
      "markIv": 0.65,
      "underlyingPrice": 45000,
      "markPrice": 1250
    }
  }
}
```

---

### Bybit-Specific Parameters

Bybit has additional parameters supported across all endpoints:

| Parameter | Values | Description |
|-----------|--------|-------------|
| `positionIdx` | `0`, `1`, `2` | 0=one-way, 1=buy side hedge, 2=sell side hedge |
| `tpslMode` | `"Full"`, `"Partial"` | TP/SL applies to full position or partial |
| `triggerBy` | `"LastPrice"`, `"MarkPrice"`, `"IndexPrice"` | Price type for triggers |
| `orderFilter` | `"Order"`, `"StopOrder"`, `"tpslOrder"` | Filter for cancelAllOrders |

---

### UI Implementation: Professional Trading Terminal

```tsx
function ProfessionalTradingTerminal({ accountId }) {
  const [positions, setPositions] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [leverageTiers, setLeverageTiers] = useState({});
  const [fundingRate, setFundingRate] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    Promise.all([
      rpc("fetchPositions", { accountId }),
      rpc("fetchOpenOrders", { accountId }),
      rpc("fetchLeverageTiers", { accountId }),
      rpc("fetchFundingRate", { accountId, symbol: "BTC/USDT" })
    ]).then(([pos, orders, tiers, funding]) => {
      setPositions(pos.raw);
      setOpenOrders(orders.raw.orders);
      setLeverageTiers(tiers.raw.tiers);
      setFundingRate(funding.raw.fundingRate);
    });
  }, [accountId]);

  return (
    <div className="trading-terminal">
      {/* Header: Account Info & Funding Rate */}
      <header>
        <FundingRateDisplay rate={fundingRate} />
        <AccountBalance accountId={accountId} />
      </header>

      {/* Main Trading Area */}
      <div className="trading-grid">
        {/* Order Form with TP/SL */}
        <OrderFormWithTpSl 
          accountId={accountId}
          onOrderCreated={refreshOrders}
        />

        {/* Order Book */}
        <OrderBook accountId={accountId} symbol="BTC/USDT" />

        {/* Positions Panel */}
        <PositionsPanel
          positions={positions}
          onClosePosition={handleClosePosition}
          onModifyMargin={handleModifyMargin}
        />

        {/* Open Orders with Edit/Cancel */}
        <OpenOrdersPanel
          orders={openOrders}
          onEditOrder={handleEditOrder}
          onCancelOrder={handleCancelOrder}
          onCancelAll={handleCancelAll}
        />
      </div>

      {/* Bottom: Leverage Tiers & Risk Info */}
      <footer>
        <LeverageTiersTable tiers={leverageTiers["BTC/USDT"]} />
        <RiskMetrics accountId={accountId} />
      </footer>
    </div>
  );
}
```

### Position Row with Actions

```tsx
function PositionRow({ position, onClose, onModifyMargin }) {
  return (
    <tr className={position.side === "long" ? "bg-green-50" : "bg-red-50"}>
      <td>{position.symbol}</td>
      <td className={position.side === "long" ? "text-green-600" : "text-red-600"}>
        {position.side.toUpperCase()}
      </td>
      <td>{position.amount}</td>
      <td>${position.entryPrice.toFixed(2)}</td>
      <td>${position.markPrice.toFixed(2)}</td>
      <td className={position.unrealizedPnl >= 0 ? "text-green-600" : "text-red-600"}>
        ${position.unrealizedPnl.toFixed(2)} ({position.percentage.toFixed(2)}%)
      </td>
      <td>${position.liquidationPrice.toFixed(2)}</td>
      <td>{position.leverage}x</td>
      <td>
        <button onClick={() => onClose(position)}>Close</button>
        <button onClick={() => onModifyMargin(position, "add")}>+Margin</button>
        <button onClick={() => onModifyMargin(position, "reduce")}>-Margin</button>
      </td>
    </tr>
  );
}
```

---

### API Methods Summary (v2.15.0)

| Category | Method | Description |
|----------|--------|-------------|
| **Order Mgmt** | `editOrder` | Edit existing order |
| | `cancelAllOrders` | Cancel all orders for symbol |
| | `createOrderWithTpSl` | Create order with TP/SL |
| | `createStopOrder` | Create stop/trigger order |
| **Position** | `setMarginMode` | Set cross/isolated margin |
| | `closePosition` | Close open position |
| | `setPositionMode` | Set one-way/hedge mode |
| | `modifyMargin` | Add/reduce position margin |
| **Risk** | `fetchLeverageTiers` | Get leverage tier info |
| | `fetchFundingRate` | Get funding rate data |
| | `fetchMyLiquidations` | Get liquidation history |
| | `fetchGreeks` | Get option Greeks |

