/**
 * Schema Actions Component
 * Quick actions toolbar for schema operations
 */

import { type ReactElement, useRef } from "react";
import { Button } from "@/components/ui";
import { Copy, Download, FileJson, Keyboard, Upload } from "lucide-react";
import type { SchemaProject } from "./types.ts";
import { collectNestedSchemasForExport } from "./db.ts";

interface SchemaActionsProps {
  activeSchema: SchemaProject | null;
  schemaJson: string;
  isValid: boolean;
  onExport: (schemas: SchemaProject[]) => void;
  onImport: (schemas: SchemaProject[]) => void;
  onCopyJson: () => void;
  onError: (message: string) => void;
}

/**
 * Action buttons for schema management
 */
export default function SchemaActions({
  activeSchema,
  schemaJson,
  isValid,
  onExport,
  onImport,
  onCopyJson,
  onError,
}: SchemaActionsProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async (): Promise<void> => {
    if (!activeSchema) return;

    try {
      // Collect all nested schemas recursively
      const allSchemas = await collectNestedSchemasForExport(
        activeSchema.widgetKey,
      );

      // Export format with metadata
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        mainSchema: activeSchema.widgetKey,
        schemas: allSchemas,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;

      // Better filename with schema count
      const schemaCount = allSchemas.length;
      const suffix = schemaCount > 1 ? `+${schemaCount - 1}-nested` : "";
      link.download = `schema-${
        activeSchema.name
          .toLowerCase()
          .replace(/\s+/g, "-")
      }${suffix}.json`;

      link.click();
      URL.revokeObjectURL(url);

      onExport(allSchemas);
    } catch (error) {
      console.error("Failed to export schemas:", error);
      onError("Failed to export schemas. Please try again.");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content) as
          | SchemaProject
          | { version?: string; schemas: SchemaProject[] };

        let schemasToImport: SchemaProject[] = [];

        // Check if it's new export format with metadata
        if (
          typeof imported === "object" &&
          "schemas" in imported &&
          Array.isArray(imported.schemas)
        ) {
          schemasToImport = imported.schemas;
        } else if (
          typeof imported === "object" &&
          "id" in imported &&
          "name" in imported &&
          "schema" in imported
        ) {
          // Legacy single schema format
          schemasToImport = [imported as SchemaProject];
        } else {
          throw new Error("Invalid schema format");
        }

        // Validate all schemas
        for (const schema of schemasToImport) {
          if (!schema.id || !schema.name || !schema.schema) {
            throw new Error("Invalid schema structure");
          }
        }

        onImport(schemasToImport);
      } catch (error) {
        onError("Failed to import schema. Please check the file format.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Keyboard shortcuts hint */}
      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800/50 rounded border border-zinc-700">
        <Keyboard className="w-3 h-3 text-zinc-500" />
        <span className="text-xs text-zinc-500">
          <kbd className="px-1 py-0.5 bg-zinc-900 rounded border border-zinc-600 text-zinc-400">
            ⌘S
          </kbd>{" "}
          to save
        </span>
      </div>

      {/* Copy JSON */}
      <Button
        variant="outline"
        size="sm"
        onClick={onCopyJson}
        disabled={!schemaJson}
        className="flex items-center gap-2"
        title="Copy schema JSON to clipboard"
      >
        <Copy className="w-4 h-4" />
        Copy JSON
      </Button>

      {/* Export */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={!activeSchema || !isValid}
        className="flex items-center gap-2"
        title="Export schema to JSON file"
      >
        <Download className="w-4 h-4" />
        Export
      </Button>

      {/* Import */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2"
        title="Import schema from JSON file"
      >
        <Upload className="w-4 h-4" />
        Import
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
        />
      </Button>

      {/* Schema info */}
      {activeSchema && (
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800/50 rounded border border-zinc-700">
          <FileJson className="w-3 h-3 text-zinc-500" />
          <span className="text-xs text-zinc-400">
            {schemaJson.length} chars
          </span>
        </div>
      )}
    </div>
  );
}
