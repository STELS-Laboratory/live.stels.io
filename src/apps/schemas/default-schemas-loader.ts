/**
 * Default Schemas Loader
 * Automatically loads base schemas from public/schemas/ on first app launch
 */

import type { UINode } from "@/lib/gui/ui.ts";
import type { SchemaProject } from "./types.ts";
import { generateSchemaId, getSchemaByWidgetKey, saveSchema } from "./db.ts";
import { getBodySessionId } from "@/lib/session_manager";
import { useNetworkStore } from "@/stores/modules/network.store";

/**
 * List of default schema files to load from public/schemas/
 */
const DEFAULT_SCHEMA_FILES = [
  "widget.asset.testnet.token.json",
  "widget.tickers.live.json",
  "widget.app.sonar.json",
  // Add more default schemas here as needed
] as const;

/**
 * Metadata for default schemas (if not present in JSON file)
 */
const DEFAULT_SCHEMA_METADATA: Record<
  string,
  {
    name: string;
    description: string;
    type: "static" | "dynamic";
    channelKeys?: string[];
    channelAliases?: Array<{ channelKey: string; alias: string }>;
  }
> = {
  "widget.asset.testnet.token": {
    name: "Token Display Template",
    description:
      "Professional token certificate display with live market data integration",
    type: "static",
    channelAliases: [
      {
        channelKey: "testnet.runtime.ticker.BTC/USDT.bybit.spot",
        alias: "btc_ticker",
      },
      {
        channelKey: "testnet.runtime.ticker.ETH/USDT.bybit.spot",
        alias: "eth_ticker",
      },
      {
        channelKey: "testnet.runtime.ticker.SOL/USDT.bybit.spot",
        alias: "sol_ticker",
      },
    ],
  },
  "widget.tickers.live": {
    name: "Live Price Ticker",
    description: "Real-time cryptocurrency price display with bid/ask and volume",
    type: "static",
  },
  "widget.app.sonar": {
    name: "SONAR Network Monitor",
    description: "Real-time network health and performance metrics",
    type: "static",
    channelKeys: ["testnet.runtime.sonar"],
  },
};

/**
 * Load a single schema from public/schemas/
 */
async function loadSchemaFromPublic(
  filename: string,
): Promise<SchemaProject | null> {
  try {
    // Get session ID for cache busting
    const sessionId = getBodySessionId();

    const url = sessionId 
      ? `/schemas/${filename}?session=${sessionId}`
      : `/schemas/${filename}`;

    const response = await fetch(url);

    if (!response.ok) {

      return null;
    }

    const uiSchema = (await response.json()) as UINode;

    // Extract widgetKey from filename
    const widgetKey = filename.replace(".json", "");

    // Get metadata
    const metadata = DEFAULT_SCHEMA_METADATA[widgetKey];
    if (!metadata) {

      return null;
    }

    // Get current network ID and update channelKeys dynamically
    const networkStore = useNetworkStore.getState();
    const currentNetworkId = networkStore.currentNetworkId;
    
    // Update channelKeys and channelAliases with current network
    let channelKeys = metadata.channelKeys || [];
    let channelAliases = metadata.channelAliases || [];
    
    // Replace testnet/mainnet in channelKeys
    if (channelKeys.length > 0) {
      channelKeys = channelKeys.map((key) => 
        key.replace(/^(testnet|mainnet)\./, `${currentNetworkId}.`)
      );
    }
    
    // Replace testnet/mainnet in channelAliases
    if (channelAliases.length > 0) {
      channelAliases = channelAliases.map((alias) => ({
        ...alias,
        channelKey: alias.channelKey.replace(/^(testnet|mainnet)\./, `${currentNetworkId}.`),
      }));
    }

    // Create SchemaProject
    const schema: SchemaProject = {
      id: generateSchemaId(),
      name: metadata.name,
      description: metadata.description,
      type: metadata.type,
      widgetKey: widgetKey,
      schema: uiSchema,
      channelKeys: channelKeys, // Use updated channelKeys with current network
      channelAliases: channelAliases, // Use updated channelAliases with current network
      selfChannelKey: channelKeys[0] || null, // Use first channel as self if available
      nestedSchemas: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: true, // Mark as default schema
    };

    return schema;
  } catch {

    return null;
  }
}

/**
 * Check if default schemas are already loaded
 */
async function areDefaultSchemasLoaded(): Promise<boolean> {
  try {
    // Check if token template schema exists
    const tokenSchema = await getSchemaByWidgetKey(
      "widget.asset.testnet.token",
    );
    const result = !!tokenSchema;

    return result;
  } catch {

    return false;
  }
}

/**
 * Load all default schemas from public/schemas/
 * Only loads if not already present in IndexedDB
 */
export async function loadDefaultSchemas(): Promise<{
  loaded: number;
  skipped: number;
  failed: number;
}> {

  // Check if already loaded
  const alreadyLoaded = await areDefaultSchemasLoaded();

  if (alreadyLoaded) {

    return { loaded: 0, skipped: DEFAULT_SCHEMA_FILES.length, failed: 0 };
  }

  let loaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of DEFAULT_SCHEMA_FILES) {
    try {
      // Extract widgetKey from filename
      const widgetKey = filename.replace(".json", "");

      // Check if schema already exists
      const existing = await getSchemaByWidgetKey(widgetKey);
      if (existing) {

        skipped++;
        continue;
      }

      // Load schema from public/
      const schema = await loadSchemaFromPublic(filename);
      if (!schema) {
        failed++;
        continue;
      }

      // Save to IndexedDB
      await saveSchema(schema);

      loaded++;
    } catch {

      failed++;
    }
  }

  return { loaded, skipped, failed };
}

/**
 * Force reload all default schemas (for development/updates)
 */
export async function reloadDefaultSchemas(): Promise<{
  loaded: number;
  failed: number;
}> {

  let loaded = 0;
  let failed = 0;

  for (const filename of DEFAULT_SCHEMA_FILES) {
    try {
      const widgetKey = filename.replace(".json", "");

      // Load schema from public/
      const schema = await loadSchemaFromPublic(filename);
      if (!schema) {
        failed++;
        continue;
      }

      // Check if exists and preserve ID
      const existing = await getSchemaByWidgetKey(widgetKey);
      if (existing) {
        schema.id = existing.id; // Preserve existing ID
        schema.createdAt = existing.createdAt; // Preserve creation date
      }

      // Save to IndexedDB (will update if exists)
      await saveSchema(schema);

      loaded++;
    } catch {

      failed++;
    }
  }

  return { loaded, failed };
}
