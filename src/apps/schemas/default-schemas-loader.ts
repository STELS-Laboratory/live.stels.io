/**
 * Default Schemas Loader
 * Automatically loads base schemas from public/schemas/ on first app launch
 */

import type { UINode } from "@/lib/gui/ui.ts";
import type { SchemaProject } from "./types.ts";
import { generateSchemaId, getSchemaByWidgetKey, saveSchema } from "./db.ts";

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
    const response = await fetch(`/schemas/${filename}`);
    if (!response.ok) {
      console.warn(`[DefaultSchemas] Schema not found: ${filename}`);
      return null;
    }

    const uiSchema = (await response.json()) as UINode;

    // Extract widgetKey from filename
    const widgetKey = filename.replace(".json", "");

    // Get metadata
    const metadata = DEFAULT_SCHEMA_METADATA[widgetKey];
    if (!metadata) {
      console.warn(
        `[DefaultSchemas] No metadata for schema: ${widgetKey}`,
      );
      return null;
    }

    // Create SchemaProject
    const schema: SchemaProject = {
      id: generateSchemaId(),
      name: metadata.name,
      description: metadata.description,
      type: metadata.type,
      widgetKey: widgetKey,
      schema: uiSchema,
      channelKeys: metadata.channelKeys || [], // Use metadata channelKeys or empty for templates
      channelAliases: metadata.channelAliases || [],
      selfChannelKey: metadata.channelKeys?.[0] || null, // Use first channel as self if available
      nestedSchemas: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: true, // Mark as default schema
    };

    return schema;
  } catch (error) {
    console.error(`[DefaultSchemas] Failed to load ${filename}:`, error);
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
    return !!tokenSchema;
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
  console.log("[DefaultSchemas] Checking for default schemas...");

  // Check if already loaded
  const alreadyLoaded = await areDefaultSchemasLoaded();
  if (alreadyLoaded) {
    console.log("[DefaultSchemas] Default schemas already loaded, skipping");
    return { loaded: 0, skipped: DEFAULT_SCHEMA_FILES.length, failed: 0 };
  }

  console.log(
    `[DefaultSchemas] Loading ${DEFAULT_SCHEMA_FILES.length} default schemas...`,
  );

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
        console.log(`[DefaultSchemas] Schema already exists: ${widgetKey}`);
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
      console.log(`[DefaultSchemas] Loaded: ${schema.name} (${widgetKey})`);
      loaded++;
    } catch (error) {
      console.error(`[DefaultSchemas] Failed to load ${filename}:`, error);
      failed++;
    }
  }

  console.log(
    `[DefaultSchemas] Complete: ${loaded} loaded, ${skipped} skipped, ${failed} failed`,
  );

  return { loaded, skipped, failed };
}

/**
 * Force reload all default schemas (for development/updates)
 */
export async function reloadDefaultSchemas(): Promise<{
  loaded: number;
  failed: number;
}> {
  console.log("[DefaultSchemas] Force reloading default schemas...");

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
      console.log(`[DefaultSchemas] Reloaded: ${schema.name}`);
      loaded++;
    } catch (error) {
      console.error(`[DefaultSchemas] Failed to reload ${filename}:`, error);
      failed++;
    }
  }

  console.log(
    `[DefaultSchemas] Reload complete: ${loaded} loaded, ${failed} failed`,
  );

  return { loaded, failed };
}

