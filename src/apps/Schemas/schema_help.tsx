/**
 * Schema Help Component
 * API Reference Documentation Sidebar
 */

import { type ReactElement, useState } from "react";
import { Book, Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Snippet {
  title: string;
  description: string;
  code: string;
  category?: string;
}

interface SchemaHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_REFERENCE: Snippet[] = [
  // Basic Structure
  {
    title: "Basic Node Structure",
    description: "Every UI node requires type and optional className",
    category: "Basics",
    code: `{
  "type": "div",
  "className": "p-4 bg-card rounded",
  "text": "Hello World"
}`,
  },
  {
    title: "Text Interpolation",
    description: "Access data using {key} or {path.to.value}",
    category: "Basics",
    code: `{
  "type": "div",
  "text": "{channel_alias.raw.market}",
  "className": "text-foreground font-bold"
}`,
  },
  {
    title: "Children Nodes",
    description: "Nest UI nodes for complex layouts",
    category: "Basics",
    code: `{
  "type": "div",
  "className": "flex gap-2",
  "children": [
    {"type": "span", "text": "Label:"},
    {"type": "span", "text": "{value}"}
  ]
}`,
  },

  // Data Access
  {
    title: "Universal Schema (self)",
    description: "Use 'self' to create reusable schemas for any channel",
    category: "Data Access",
    code: `{
  "type": "div",
  "className": "p-4 bg-card border rounded",
  "children": [
    {"type": "div", "text": "{self.raw.market}"},
    {"type": "div", "text": "$\\{self.raw.data.last}", "format": {"type": "number", "decimals": 2}}
  ]
}`,
  },
  {
    title: "Channel Alias Access",
    description: "Access specific channel data using alias",
    category: "Data Access",
    code: `{
  "type": "div",
  "text": "$\\{btc_ticker.raw.data.last}",
  "format": {"type": "number", "decimals": 2}
}`,
  },
  {
    title: "Nested Data Paths",
    description: "Access deep nested properties with dot notation",
    category: "Data Access",
    code: `{
  "type": "div",
  "text": "{channel.raw.data.bids[0][0]}"
}`,
  },

  // Formatting
  {
    title: "Number Formatting",
    description: "Format numbers with specific decimal places",
    category: "Formatting",
    code: `{
  "type": "div",
  "text": "$\\{data.price}",
  "format": {
    "type": "number",
    "decimals": 2
  }
}`,
  },
  {
    title: "Volume Formatting",
    description: "Auto format large numbers (K, M, B)",
    category: "Formatting",
    code: `{
  "type": "div",
  "text": "{data.volume}",
  "format": {
    "type": "volume",
    "decimals": 2
  }
}`,
  },
  {
    title: "DateTime Formatting",
    description: "Format timestamps to readable dates",
    category: "Formatting",
    code: `{
  "type": "div",
  "text": "{timestamp}",
  "format": {"type": "datetime"}
}`,
  },
  {
    title: "Time Formatting",
    description: "Format timestamps to time only",
    category: "Formatting",
    code: `{
  "type": "div",
  "text": "{timestamp}",
  "format": {"type": "time"}
}`,
  },

  // Math Operations
  {
    title: "Math Expressions",
    description: "Use +, -, *, /, %, () in interpolations",
    category: "Math",
    code: `{
  "type": "div",
  "text": "$\\{btc.raw.data.last * 2 + 100}",
  "format": {"type": "number", "decimals": 2}
}`,
  },
  {
    title: "Cross-Channel Math",
    description: "Calculate using multiple channel data",
    category: "Math",
    code: `{
  "type": "div",
  "text": "$\\{sol.raw.data.last / btc.raw.data.last}",
  "className": "text-lg font-bold"
}`,
  },

  // Conditionals
  {
    title: "Conditional Rendering",
    description: "Show/hide nodes based on conditions",
    category: "Conditionals",
    code: `{
  "type": "div",
  "text": "Price is rising!",
  "condition": {
    "key": "data.change",
    "operator": ">",
    "value": 0
  }
}`,
  },
  {
    title: "Conditional Styling",
    description: "Dynamic colors based on value",
    category: "Conditionals",
    code: `{
  "type": "span",
  "text": "$\\{data.change}",
  "style": {
    "color": {
      "condition": {
        "key": "data.change",
        "operator": ">",
        "value": 0
      },
      "true": "#22c55e",
      "false": "#ef4444"
    }
  }
}`,
  },

  // Iteration
  {
    title: "Array Iteration",
    description: "Loop through arrays with $item accessor",
    category: "Iteration",
    code: `{
  "type": "div",
  "iterate": {
    "source": "data.bids",
    "limit": 10
  },
  "children": [
    {"type": "span", "text": "$\\{$item[0]}"}
  ]
}`,
  },
  {
    title: "Reversed Iteration",
    description: "Iterate in reverse order",
    category: "Iteration",
    code: `{
  "type": "div",
  "iterate": {
    "source": "data.asks",
    "limit": 10,
    "reverse": true
  },
  "children": [
    {"type": "div", "text": "{$item.price}"}
  ]
}`,
  },
  {
    title: "Item Properties",
    description: "Access nested properties in iteration",
    category: "Iteration",
    code: `{
  "type": "div",
  "iterate": {"source": "trades"},
  "children": [
    {"type": "div", "text": "{$item.price} x {$item.amount}"}
  ]
}`,
  },

  // Advanced
  {
    title: "Nested Schema Reference",
    description: "Compose schemas using schemaRef with widget key",
    category: "Advanced",
    code: `{
  "type": "div",
  "className": "grid grid-cols-2 gap-4",
  "children": [
    {"schemaRef": "widget.ticker.btc"},
    {"schemaRef": "widget.ticker.sol"}
  ]
}`,
  },
  {
    title: "Auto Refresh",
    description: "Re-render component every N milliseconds",
    category: "Advanced",
    code: `{
  "type": "div",
  "refreshInterval": 100,
  "text": "{data.last}"
}`,
  },
  {
    title: "Event Handlers",
    description: "Open modals on click with channel data",
    category: "Events",
    code: `{
  "type": "div",
  "className": "cursor-pointer",
  "text": "View Details",
  "events": {
    "onClick": {
      "type": "openModal",
      "payload": {
        "channel": "runtime.book.BTC/USDT",
        "modalId": "orderbook-modal",
        "width": "600px",
        "backdrop": "blur",
        "closeOnBackdrop": true
      }
    }
  }
}`,
  },
  {
    title: "Percentage Calculation",
    description: "Calculate width as percentage for progress bars",
    category: "Advanced",
    code: `{
  "type": "div",
  "className": "bg-green-500/20",
  "style": {
    "width": {
      "calculate": "percentage",
      "value": "{$item.size}",
      "max": "{maxVolume}"
    }
  }
}`,
  },

  // Operators
  {
    title: "Comparison Operators",
    description: "Available: ===, >, <, >=, <=",
    category: "Operators",
    code: `// Equal
{"key": "price", "operator": "===", "value": 100}

// Greater than
{"key": "volume", "operator": ">", "value": 1000}

// Less or equal
{"key": "change", "operator": "<=", "value": 0}`,
  },
];

/**
 * API Reference Sidebar
 */
export default function SchemaHelp(
  { isOpen, onClose }: SchemaHelpProps,
): ReactElement {
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleCopy = async (code: string, index: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippet(index);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const categories = Array.from(
    new Set(API_REFERENCE.map((s) => s.category).filter(Boolean)),
  ) as string[];

  if (!isOpen) return <></>;

  return (
    <div className="fixed right-0 top-0 bottom-0 h-[100%] overflow-hidden w-1/3 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Book className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            API Reference
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Categories */}
      <div className="px-2 py-2 border-b border-border bg-muted/10 flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveCategory(null)}
          className={`h-6 px-2 text-[10px] ${
            activeCategory === null
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
              : "text-muted-foreground"
          }`}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant="ghost"
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className={`h-6 px-2 text-[10px] ${
              activeCategory === cat
                ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                : "text-muted-foreground"
            }`}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Snippets */}
      <ScrollArea className="border block relative overflow-y-scroll">
        <div className="w-[80%] relative p-2 space-y-2">
          {API_REFERENCE
            .filter((s) => !activeCategory || s.category === activeCategory)
            .map((snippet, idx) => (
              <div
                key={idx}
                className="w-auto p-2 bg-background/50 rounded border border-border hover:border-amber-500/30 transition-colors"
              >
                {snippet.category && (
                  <div className="text-[9px] text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wide mb-0.5">
                    {snippet.category}
                  </div>
                )}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold text-foreground">
                      {snippet.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {snippet.description}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(snippet.code, idx)}
                    className="text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors p-1 ml-2"
                    title="Copy snippet"
                  >
                    {copiedSnippet === idx
                      ? (
                        <Check className="w-3.5 h-3.5 text-green-700 dark:text-green-500" />
                      )
                      : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="text-[10px] text-foreground/80 font-mono bg-muted/50 p-2 rounded overflow-x-auto border border-border/50 mt-1">
                {snippet.code}
                </pre>
              </div>
            ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border bg-muted/10">
        <div className="text-[9px] text-muted-foreground">
          <span className="font-semibold text-foreground">
            {API_REFERENCE.filter((s) =>
              !activeCategory || s.category === activeCategory
            ).length}
          </span>{" "}
          snippets
        </div>
      </div>
    </div>
  );
}
