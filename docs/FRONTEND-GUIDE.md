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
const accounts = await rpc('listAccounts', {});

// Get agent with connected accounts
const agent = await rpc('getAgent', { agentId });
// Returns: { ...agent, connectedAccounts: [...] }

// Connect account to agent
await rpc('connectAccountToAgent', {
  agentId: 'agent-uuid',
  accountId: 'account-nid',
  grantedScopes: ['read', 'trade', 'balance']
});

// Disconnect account from agent
await rpc('disconnectAccountFromAgent', {
  agentId: 'agent-uuid',
  accountId: 'account-nid'
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
    options={availableAccounts.map(acc => ({
      value: acc.nid,
      label: `${acc.name} (${acc.exchange})`
    }))}
  />
  
  <CheckboxGroup label="Permissions">
    <Checkbox value="read" label="View balances and orders" defaultChecked />
    <Checkbox value="trade" label="Create and cancel orders" />
    <Checkbox value="balance" label="View balance" defaultChecked />
  </CheckboxGroup>
  
  <Alert type="warning" show={scopes.includes('trade')}>
    Warning: Trade permission allows the agent to execute trades on this account.
  </Alert>
</Dialog>
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

| Template | Description | Difficulty | Risk |
|----------|-------------|------------|------|
| `dca-strategy` | Dollar Cost Averaging - buy fixed amounts on schedule | Beginner | Low |
| `market-making` | Market Making - provide liquidity, earn spread | Advanced | High |
| `grid-trading` | Grid Trading - profit from price oscillations | Intermediate | Medium |

### Strategy API Methods

```javascript
// List available templates
const templates = await rpc('listStrategyTemplates', {
  domain: 'trading',
  includeFull: false  // Summary only
});

// Get full template with config schema
const template = await rpc('getStrategyTemplate', {
  templateId: 'dca-strategy'
});

// Create strategy instance (bound to agent)
const strategy = await rpc('createStrategy', {
  templateId: 'dca-strategy',
  name: 'My BTC DCA',
  agentId: 'agent-uuid',  // REQUIRED - strategy runs through this agent
  ownerId: 'user-id',
  config: {
    accountId: 'binance-main',  // MUST be in agent's connectedAccounts
    symbol: 'BTC/USDT',
    amountPerBuy: 100,
    frequency: 'daily'
  },
  autoStart: false
});

// List user's strategies
const strategies = await rpc('listStrategies', {
  ownerId: 'user-id',
  status: 'running'
});

// Start/Stop strategy
await rpc('startStrategy', { strategyId: 'strategy-uuid' });
await rpc('stopStrategy', { strategyId: 'strategy-uuid' });

// Delete strategy
await rpc('deleteStrategy', { strategyId: 'strategy-uuid' });
```

### Dynamic Configuration Form

Strategy templates include a `configSchema` that defines the configuration form:

```javascript
const template = await rpc('getStrategyTemplate', { templateId: 'dca-strategy' });

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
      requiredPermissions={['trade']}  // Filter agents with trade-enabled accounts
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
</Wizard>
```

### Account Selector Component

When rendering `type: "account"` fields, show only the agent's connected accounts:

```tsx
function AccountSelector({ agent, field, value, onChange }) {
  // Filter agent's accounts by field requirements
  const availableAccounts = agent.connectedAccounts.filter(acc => {
    // Check exchange filter
    if (field.accountFilter?.exchanges) {
      if (!field.accountFilter.exchanges.includes(acc.exchange)) return false;
    }
    
    // Check required permissions
    if (field.accountFilter?.permissions) {
      const hasPermissions = field.accountFilter.permissions.every(
        perm => acc.grantedScopes.includes(perm)
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
      options={availableAccounts.map(acc => ({
        value: acc.nid,
        label: `${acc.name} (${acc.exchange})`,
        description: `Permissions: ${acc.grantedScopes.join(', ')}`
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
    acc => acc.grantedScopes.includes('trade')
  );

  return (
    <div>
      <Badge color={agent.status === 'active' ? 'green' : 'gray'}>
        {agent.status}
      </Badge>
      
      <Tooltip content={`${connectedAccounts.length} connected accounts`}>
        <Badge color={connectedAccounts.length > 0 ? 'blue' : 'gray'}>
          {connectedAccounts.length} accounts
        </Badge>
      </Tooltip>
      
      {hasTradeAccess && (
        <Badge color="orange">Trading enabled</Badge>
      )}
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
            <Stat label="Success Rate" value={`${strategy.stats.successfulExecutions / strategy.stats.totalExecutions * 100}%`} />
          </>
        )}
      </CardBody>
      
      <CardFooter>
        {strategy.status === 'running' ? (
          <Button onClick={() => stopStrategy(strategy.id)}>Stop</Button>
        ) : (
          <Button onClick={() => startStrategy(strategy.id)}>Start</Button>
        )}
        <Button variant="danger" onClick={() => deleteStrategy(strategy.id)}>Delete</Button>
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
const { agents } = await rpc('listAgents', {});

// 2. Get agent with connected accounts
const { agent } = await rpc('getAgent', { agentId: agents[0].id });
console.log('Connected accounts:', agent.connectedAccounts);

// 3. Get strategy template
const { template } = await rpc('getStrategyTemplate', { 
  templateId: 'dca-strategy' 
});

// 4. Validate account is connected to agent
const accountId = 'binance-main';
const isAccountConnected = agent.connectedAccounts.some(
  acc => acc.nid === accountId || acc.accountId === accountId
);

if (!isAccountConnected) {
  // Connect account first
  await rpc('connectAccountToAgent', {
    agentId: agent.id,
    accountId: accountId,
    grantedScopes: ['read', 'trade', 'balance']
  });
}

// 5. Create strategy
const { strategy } = await rpc('createStrategy', {
  templateId: 'dca-strategy',
  name: 'Daily BTC DCA',
  agentId: agent.id,
  ownerId: 'user-id',
  config: {
    accountId: 'binance-main',
    symbol: 'BTC/USDT',
    amountPerBuy: 50,
    frequency: 'daily',
    executionTime: '09:00',
    smartDcaEnabled: false,
    notificationsEnabled: true,
    notificationChannel: 'telegram'
  },
  autoStart: true
});

console.log('Strategy created:', strategy.id);
console.log('Tasks created:', strategy.taskIds.length);
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
const response = await rpc('chatWithAgent', {
  agentId: 'agent-uuid',
  message: 'Sell 1 SOL at price 131',
  stream: true  // or false for non-streaming
});

// Response includes conversationId
// {
//   conversationId: "abc-123-def-456",
//   response: "Do you want to place a limit sell order..."
// }

// Subsequent messages MUST include conversationId
const response2 = await rpc('chatWithAgent', {
  agentId: 'agent-uuid',
  message: 'Yes, I confirm',
  conversationId: 'abc-123-def-456',  // ◄── CRITICAL!
  stream: true
});
```

### Streaming Response Handling

When using `stream: true`, the response comes as Server-Sent Events (SSE). The `conversationId` is included in the SSE chunks:

```javascript
// SSE Stream handling
async function handleStreamingChat(agentId, message, conversationId) {
  const response = await fetch('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stels-session': sessionId
    },
    body: JSON.stringify({
      webfix: '1.0',
      method: 'chatWithAgent',
      body: {
        agentId,
        message,
        conversationId,  // Pass if continuing conversation
        stream: true
      }
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let currentConversationId = conversationId;
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

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
  const response = await rpc('chatWithAgent', {
    agentId,
    message,
    conversationId,  // Pass if continuing conversation
    stream: false
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
import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
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
      role: 'user',
      content,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await rpc('chatWithAgent', {
        agentId,
        message: content,
        conversationId,  // Pass existing conversationId (or null for first message)
        stream: false
      });

      // Save conversationId for next message
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Add assistant message to UI
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      // Handle error - maybe show retry button
    } finally {
      setIsLoading(false);
    }
  }, [agentId, conversationId]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);  // New conversation on next message
  }, []);

  return {
    messages,
    sendMessage,
    clearConversation,
    isLoading,
    conversationId
  };
}

// Usage in component
function ChatComponent({ agentId }: { agentId: string }) {
  const { messages, sendMessage, clearConversation, isLoading } = useChatWithAgent(agentId);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
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
  url.searchParams.set('conversation', conversationId);
  window.history.replaceState({}, '', url);
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('conversation');
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
  const response = await rpc('chatWithAgent', {
    agentId,
    message,
    conversationId
  });

  if (!response.success) {
    // Handle specific errors
    switch (response.code) {
      case 'AGENT_NOT_FOUND':
        showError('Agent not found');
        break;
      case 'AGENT_INACTIVE':
        showError('Agent is not active');
        break;
      case 'RATE_LIMITED':
        showError('Too many requests. Please wait.');
        break;
      default:
        showError(response.message || 'Chat failed');
    }
    return;
  }

  // Success - update UI
  addMessage(response.response);
  
} catch (error) {
  showError('Network error. Please try again.');
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
</ChatContainer>
```


---

## Conversation History API

### Getting Conversation History

When the client app loads or refreshes, it can retrieve the full conversation history using `getConversation`:

```javascript
// Load existing conversation on app start
const conversationId = localStorage.getItem(`chat_conversation_${agentId}`);

if (conversationId) {
  const response = await rpc('getConversation', { conversationId });
  
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
const response = await rpc('listConversations', {
  agentId: 'optional-agent-uuid',  // Filter by specific agent
  limit: 20,
  offset: 0
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
import { useState, useEffect, useCallback } from 'react';

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
    const savedConversationId = localStorage.getItem(`chat_conversation_${agentId}`);
    if (savedConversationId) {
      loadConversation(savedConversationId);
    }
  }, [agentId]);

  const loadConversations = async () => {
    const response = await rpc('listConversations', { agentId });
    if (response.success) {
      setConversations(response.conversations);
    }
  };

  const loadConversation = async (convId: string) => {
    setIsLoading(true);
    try {
      const response = await rpc('getConversation', { conversationId: convId });
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
    const userMessage = { role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await rpc('chatWithAgent', {
        agentId,
        message: content,
        conversationId,  // Pass existing conversationId or null
        stream: false
      });

      if (response.success) {
        // Save conversationId for future messages
        if (response.conversationId) {
          setConversationId(response.conversationId);
          localStorage.setItem(`chat_conversation_${agentId}`, response.conversationId);
        }

        const assistantMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
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
    loadConversations
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
    switchConversation
  } = useChatWithHistory(agentId);

  return (
    <div className="chat-layout">
      {/* Sidebar - Conversation History */}
      <aside className="conversation-sidebar">
        <button onClick={startNewConversation} className="new-chat-btn">
          + New Conversation
        </button>
        
        <div className="conversation-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === conversationId ? 'active' : ''}`}
              onClick={() => switchConversation(conv.id)}
            >
              <div className="conv-preview">
                {conv.lastMessage?.content || 'Empty conversation'}
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

| Method | Description | Auth Required |
|--------|-------------|---------------|
| `chatWithAgent` | Send message, receive response | Yes |
| `getConversation` | Get full conversation by ID | Yes |
| `listConversations` | List user's conversations | Yes |

#### `getConversation` Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | string | Yes | UUID of the conversation |

#### `listConversations` Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | No | Filter by specific agent |
| `limit` | number | No | Max results (default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

