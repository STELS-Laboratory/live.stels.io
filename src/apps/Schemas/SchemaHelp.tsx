/**
 * Schema Help Component
 * Quick reference guide with code snippets
 */

import { type ReactElement, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";

interface Snippet {
  title: string;
  description: string;
  code: string;
}

const SNIPPETS: Snippet[] = [
  {
    title: "Universal Schema (self)",
    description: "Reusable schema for any channel with same structure",
    code: `{
  "type": "div",
  "className": "bg-zinc-900 p-4 w-[300px]",
  "children": [
    {
      "type": "div",
      "className": "flex gap-4",
      "children": [
        {"type": "div", "text": "$\{self.raw.exchange}", "className": "uppercase text-pink-500"},
        {"type": "div", "text": "$\{self.raw.market}", "className": "text-zinc-100"}
      ]
    },
    {
      "type": "div",
      "text": "$\{self.raw.data.last}",
      "className": "text-2xl font-bold",
      "format": {"type": "number", "decimals": 2}
    }
  ]
}`,
  },
  {
    title: "Basic Text",
    description: "Display simple text or interpolated data",
    code: `{
  "type": "div",
  "text": "{market} - {exchange}",
  "className": "text-white font-bold"
}`,
  },
  {
    title: "Formatted Number",
    description: "Format numbers with decimals",
    code: `{
  "type": "div",
  "text": "$\{data.price}",
  "format": {
    "type": "number",
    "decimals": 2
  }
}`,
  },
  {
    title: "Conditional Color",
    description: "Dynamic color based on condition",
    code: `{
  "type": "span",
  "text": "$\{data.change}",
  "style": {
    "color": {
      "condition": {
        "key": "data.change",
        "operator": ">",
        "value": 0
      },
      "true": "#00C853",
      "false": "#D50000"
    }
  }
}`,
  },
  {
    title: "Array Iteration",
    description: "Loop over array items",
    code: `{
  "type": "div",
  "iterate": {
    "source": "data.items",
    "limit": 10
  },
  "children": [
    {
      "type": "span",
      "text": "{$item.name}"
    }
  ]
}`,
  },
  {
    title: "Grid Layout",
    description: "Responsive grid with Tailwind",
    code: `{
  "type": "div",
  "className": "grid grid-cols-3 gap-4 p-4",
  "children": [...]
}`,
  },
  {
    title: "Single Channel Data",
    description: "Access data using channel alias",
    code: `{
  "type": "div",
  "text": "$\{btc_ticker.raw.data.last}",
  "format": {"type": "number", "decimals": 2}
}`,
  },
  {
    title: "Exchange and Market Info",
    description: "Access metadata from raw object",
    code: `{
  "type": "div",
  "text": "$\{btc_ticker.raw.exchange} - $\{btc_ticker.raw.market}",
  "className": "text-sm text-zinc-400"
}`,
  },
  {
    title: "Math Operations",
    description: "Calculate values with +, -, *, /, %, ()",
    code: `{
  "type": "div",
  "text": "$\{btc_ticker.raw.data.last * 2}",
  "className": "text-2xl text-green-500",
  "format": {"type": "number", "decimals": 2}
}`,
  },
  {
    title: "Complex Math Expressions",
    description: "Multi-channel calculations",
    code: `{
  "type": "div",
  "text": "$\{sol_ticker.raw.data.last - (btc_ticker.raw.data.last / 2)}",
  "className": "text-xl font-bold",
  "format": {"type": "number", "decimals": 4}
}`,
  },
  {
    title: "Multiple Channels (BTC + SOL)",
    description: "Combine data from different channels",
    code: `{
  "type": "div",
  "className": "grid grid-cols-2 gap-4",
  "children": [
    {
      "type": "div",
      "children": [
        {"type": "div", "text": "BTC: $\{btc_ticker.raw.data.last}"},
        {"type": "div", "text": "$\{btc_ticker.raw.exchange}", "className": "text-xs"}
      ]
    },
    {
      "type": "div",
      "children": [
        {"type": "div", "text": "SOL: $\{sol_ticker.raw.data.last}"},
        {"type": "div", "text": "$\{sol_ticker.raw.market}", "className": "text-xs"}
      ]
    }
  ]
}`,
  },
  {
    title: "Cross-Channel Condition",
    description: "Use data from one channel in conditional style",
    code: `{
  "type": "div",
  "text": "$\{btc_ticker.raw.data.change}",
  "style": {
    "color": {
      "condition": {
        "key": "btc_ticker.raw.data.change",
        "operator": ">",
        "value": 0
      },
      "true": "#00C853",
      "false": "#D50000"
    }
  }
}`,
  },
  {
    title: "Nested Schema (Composition)",
    description: "Reference another schema by widget key",
    code: `{
  "type": "div",
  "className": "grid grid-cols-2 gap-4",
  "children": [
    {
      "type": "div",
      "schemaRef": "widget.markets.ticker"
    },
    {
      "type": "div",
      "schemaRef": "widget.markets.orderbook"
    }
  ]
}`,
  },
  {
    title: "Nested Schema with Styling",
    description: "Apply className and style to nested schema",
    code: `{
  "type": "div",
  "className": "bg-zinc-800 p-6 rounded-lg border border-zinc-700",
  "schemaRef": "widget.custom.ticker",
  "style": {
    "borderWidth": "2px",
    "borderColor": "#f59e0b"
  }
}`,
  },
];

/**
 * Collapsible help panel with code snippets
 */
export default function SchemaHelp(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null);

  const handleCopy = async (code: string, index: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippet(index);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="border border-zinc-800 rounded bg-zinc-900/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen
            ? <ChevronDown className="w-4 h-4 text-zinc-400" />
            : <ChevronRight className="w-4 h-4 text-zinc-400" />}
          <span className="text-sm font-medium text-zinc-300">
            Quick Reference
          </span>
          <span className="text-xs text-zinc-500">
            Code snippets & examples
          </span>
        </div>
        <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
          {SNIPPETS.length} snippets
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-zinc-800 p-3 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {SNIPPETS.map((snippet, idx) => (
              <div
                key={idx}
                className="p-3 bg-zinc-950 rounded border border-zinc-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-zinc-300">
                      {snippet.title}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {snippet.description}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(snippet.code, idx)}
                    className="text-zinc-500 hover:text-amber-400 transition-colors p-1"
                    title="Copy snippet"
                  >
                    {copiedSnippet === idx
                      ? <Check className="w-4 h-4 text-green-500" />
                      : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="text-xs text-zinc-400 font-mono bg-zinc-900 p-2 rounded overflow-x-auto">
                  {snippet.code}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
