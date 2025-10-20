/**
 * Schema Tree Component
 * Visual hierarchy viewer for nested schemas
 */

import { type ReactElement, useMemo } from "react";
import { Box, Database, Layers } from "lucide-react";
import type { SchemaProject } from "./types.ts";

interface SchemaTreeProps {
  schema: SchemaProject;
  allSchemas: SchemaProject[];
}

interface TreeNode {
  widgetKey: string;
  name: string;
  type: "static" | "dynamic";
  children: TreeNode[];
}

/**
 * Build tree structure from schema references
 */
function buildTree(
  schema: SchemaProject,
  allSchemas: SchemaProject[],
  visited: Set<string> = new Set(),
): TreeNode {
  // Prevent circular references
  if (visited.has(schema.widgetKey)) {
    return {
      widgetKey: schema.widgetKey,
      name: `${schema.name} (circular)`,
      type: schema.type,
      children: [],
    };
  }

  visited.add(schema.widgetKey);

  const children: TreeNode[] = [];

  if (schema.type === "static" && schema.nestedSchemas) {
    schema.nestedSchemas.forEach((widgetKey) => {
      const nestedSchema = allSchemas.find((s) => s.widgetKey === widgetKey);
      if (nestedSchema) {
        children.push(buildTree(nestedSchema, allSchemas, new Set(visited)));
      }
    });
  }

  return {
    widgetKey: schema.widgetKey,
    name: schema.name,
    type: schema.type,
    children,
  };
}

/**
 * Render tree node recursively
 */
function TreeNodeView({
  node,
  level = 0,
}: {
  node: TreeNode;
  level?: number;
}): ReactElement {
  const indent = level * 20;
  const Icon = node.type === "static" ? Box : Database;
  const color = node.type === "static" ? "text-purple-400" : "text-blue-400";

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 hover:bg-zinc-800/50 rounded transition-colors"
        style={{ paddingLeft: `${indent}px` }}
      >
        {level > 0 && (
          <span className="text-zinc-700">
            {level === 1 ? "└─" : "├─"}
          </span>
        )}
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="text-sm text-zinc-300">{node.name}</span>
        {node.children.length > 0 && (
          <span className="text-xs text-zinc-600">
            ({node.children.length})
          </span>
        )}
      </div>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNodeView key={idx} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Display schema hierarchy tree
 */
export default function SchemaTree({
  schema,
  allSchemas,
}: SchemaTreeProps): ReactElement {
  const tree = useMemo(() => {
    return buildTree(schema, allSchemas);
  }, [schema, allSchemas]);

  const totalNodes = useMemo(() => {
    let count = 0;
    const countNodes = (node: TreeNode): void => {
      count++;
      node.children.forEach(countNodes);
    };
    countNodes(tree);
    return count;
  }, [tree]);

  return (
    <div className="p-3 bg-zinc-900/50 rounded border border-zinc-800">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-zinc-300">
            Schema Hierarchy
          </span>
        </div>
        <span className="text-xs text-zinc-500">
          {totalNodes} node{totalNodes !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-0.5">
        <TreeNodeView node={tree} />
      </div>

      {tree.children.length === 0 && (
        <div className="text-xs text-zinc-500 italic mt-2">
          {schema.type === "static"
            ? "No nested schemas. Add them using Nested Schemas selector above."
            : "Dynamic schema - no nesting support"}
        </div>
      )}
    </div>
  );
}
