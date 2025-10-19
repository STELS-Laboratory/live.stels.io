/**
 * Schema Resolver
 * Resolves nested schema references for composition
 */

import type { UINode } from "./ui.ts";

/**
 * Schema project minimal interface for resolver
 */
export interface ResolvedSchemaData {
  schema: UINode;
  channelKeys: string[];
  channelAliases?: Array<{ channelKey: string; alias: string }>;
}

/**
 * Schema store interface for dependency injection
 */
export interface SchemaStore {
  getSchemaByWidgetKey: (widgetKey: string) => Promise<ResolvedSchemaData | null>;
}

/**
 * Collect all required channels from schema tree
 */
export async function collectRequiredChannels(
  node: UINode,
  store: SchemaStore,
  collected: Set<string> = new Set(),
  depth: number = 0,
  maxDepth: number = 10
): Promise<Array<{ channelKey: string; alias: string }>> {
  if (depth >= maxDepth) return [];

  // If node has schemaRef, get its channels
  if (node.schemaRef) {
    try {
      const schemaData = await store.getSchemaByWidgetKey(node.schemaRef);
      
      if (schemaData) {
        // Add this schema's channels
        if (schemaData.channelKeys && schemaData.channelKeys.length > 0) {
          schemaData.channelKeys.forEach((key) => collected.add(key));
        }

        // Recursively collect from nested schema
        await collectRequiredChannels(schemaData.schema, store, collected, depth + 1, maxDepth);
      }
    } catch (error) {
      console.error(`[SchemaResolver] Failed to collect channels from ${node.schemaRef}:`, error);
    }
  }

  // Recursively collect from children
  if (node.children && node.children.length > 0) {
    await Promise.all(
      node.children.map((child) =>
        collectRequiredChannels(child, store, collected, depth, maxDepth)
      )
    );
  }

  return Array.from(collected).map((key) => ({ channelKey: key, alias: key }));
}

/**
 * Resolve schema references recursively
 * Replaces schemaRef nodes with actual schema content
 */
export async function resolveSchemaRefs(
  node: UINode,
  store: SchemaStore,
  depth: number = 0,
  maxDepth: number = 10
): Promise<UINode> {
  // Prevent infinite recursion
  if (depth >= maxDepth) {
    console.warn(`[SchemaResolver] Max depth ${maxDepth} reached, stopping recursion`);
    return node;
  }

  // If node has schemaRef, resolve it
  if (node.schemaRef) {
    try {
      const schemaData = await store.getSchemaByWidgetKey(node.schemaRef);
      
      if (!schemaData) {
        console.warn(`[SchemaResolver] Schema not found: ${node.schemaRef}`);
        // Return placeholder
        return {
          type: "div",
          className: "p-4 bg-red-500/10 border border-red-500/20 rounded",
          text: `Schema not found: ${node.schemaRef}`,
        };
      }

      // Recursively resolve the loaded schema
      return await resolveSchemaRefs(schemaData.schema, store, depth + 1, maxDepth);
    } catch (error) {
      console.error(`[SchemaResolver] Failed to resolve schema ${node.schemaRef}:`, error);
      return {
        type: "div",
        className: "p-4 bg-red-500/10 border border-red-500/20 rounded",
        text: `Error loading schema: ${node.schemaRef}`,
      };
    }
  }

  // Recursively resolve children
  if (node.children && node.children.length > 0) {
    const resolvedChildren = await Promise.all(
      node.children.map((child) =>
        resolveSchemaRefs(child, store, depth, maxDepth)
      )
    );

    return {
      ...node,
      children: resolvedChildren,
    };
  }

  return node;
}

