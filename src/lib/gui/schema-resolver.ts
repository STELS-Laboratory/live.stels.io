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
 * Collect all required channels with their aliases from schema tree
 * Returns ALL channelKey+alias pairs (not unique channels)
 */
export async function collectRequiredChannels(
  node: UINode,
  store: SchemaStore,
  collected: Array<{ channelKey: string; alias: string }> = [],
  depth: number = 0,
  maxDepth: number = 10
): Promise<Array<{ channelKey: string; alias: string }>> {
  if (depth >= maxDepth) return collected;

  // If node has schemaRef, get its channels with aliases
  if (node.schemaRef) {
    try {
      const schemaData = await store.getSchemaByWidgetKey(node.schemaRef);
      
      if (schemaData) {
        // Add this schema's channels WITH their aliases
        if (schemaData.channelAliases && schemaData.channelAliases.length > 0) {
          schemaData.channelAliases.forEach((aliasObj) => {
            // Add this alias (even if channel already exists under different alias)
            collected.push(aliasObj);
          });
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

  return collected;
}

/**
 * Resolve schema references recursively
 * Replaces schemaRef nodes with actual schema content
 */
export async function resolveSchemaRefs(
  node: UINode,
  store: SchemaStore,
  depth: number = 0,
  maxDepth: number = 10,
  parentSelfChannel?: string
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

      // Determine self channel for nested schema
      const nestedSelfChannel = node.selfChannel || parentSelfChannel;

      // Recursively resolve the loaded schema
      const resolvedChild = await resolveSchemaRefs(
        schemaData.schema,
        store,
        depth + 1,
        maxDepth,
        nestedSelfChannel
      );

      // Merge parent node's className and style with resolved schema
      const merged: UINode = {
        ...resolvedChild,
      };

      // Apply parent's className (append to child's className)
      if (node.className) {
        merged.className = node.className + (resolvedChild.className ? ` ${resolvedChild.className}` : "");
      }

      // Apply parent's style (merge with child's style)
      if (node.style) {
        merged.style = {
          ...resolvedChild.style,
          ...node.style, // Parent style takes precedence
        };
      }

      return merged;
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
        resolveSchemaRefs(child, store, depth, maxDepth, parentSelfChannel)
      )
    );

    return {
      ...node,
      children: resolvedChildren,
    };
  }

  return node;
}

