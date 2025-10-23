/**
 * Type definitions for the Schema Constructor application
 */

import type { UINode } from "@/lib/gui/ui.ts";

/**
 * Schema type: static (container) or dynamic (data-bound widget)
 */
export type SchemaType = "static" | "dynamic";

/**
 * Channel alias mapping for easier data access
 */
export interface ChannelAlias {
  channelKey: string;
  alias: string; // e.g., "ticker", "book", "trades"
}

/**
 * Schema project with channel bindings
 * Stored in IndexedDB
 */
export interface SchemaProject {
  id: string;
  name: string;
  description: string;
  type: SchemaType; // static = container/router, dynamic = widget with data
  widgetKey: string; // e.g., widget.markets or widget.testnet.runtime.book.SOL/USDT.bybit.spot
  channelKeys: string[]; // Empty for static schemas, populated for dynamic
  channelAliases?: ChannelAlias[]; // Short names for channels (e.g., ticker, book)
  selfChannelKey?: string | null; // Channel to use as "self" for universal schemas
  nestedSchemas?: string[]; // Widget keys of nested schemas (for static schemas)
  schema: UINode;
  createdAt: number;
  updatedAt: number;
}

/**
 * Session data entry from sessionStorage
 */
export interface SessionDataEntry {
  key: string;
  value: {
    channel: string;
    module: string;
    widget: string;
    ui: UINode;
    raw: Record<string, unknown>;
    active: boolean;
    timestamp: number;
  };
}

/**
 * Channel data for multi-channel schemas
 */
export interface ChannelData {
  key: string;
  data: Record<string, unknown>;
}

/**
 * Editor validation error
 */
export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}
