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
  const color = node.type === "static" ? "text-purple-700 dark:text-purple-400" : "text-blue-700 dark:text-blue-400";

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1 hover:bg-muted/50 rounded transition-colors"
        style={{ paddingLeft: `${indent}px` }}
      >
        {level > 0 && (
          <span className="text-border text-[10px]">
            {level === 1 ? "└" : "├"}
          </span>
        )}
        <Icon className={`w-2.5 h-2.5 ${color}`} />
        <span className="text-[11px] text-foreground">{node.name}</span>
        {node.children.length > 0 && (
          <span className="text-[9px] text-muted-foreground">
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
    <div className="p-2 bg-card/10 rounded border border-border">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-amber-700 dark:text-amber-400" />
          <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">
            Hierarchy
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {totalNodes}
        </span>
      </div>

      <div className="space-y-0.5">
        <TreeNodeView node={tree} />
      </div>

      {tree.children.length === 0 && (
        <div className="text-[10px] text-muted-foreground italic mt-1">
          {schema.type === "static" ? "No nested schemas" : "No nesting"}
        </div>
      )}
    </div>
  );
}
