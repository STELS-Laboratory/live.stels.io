/**
 * Schema Manager Component
 * CRUD operations for schemas with tabs interface
 */

import { type ReactElement, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { Box, Database, Edit2, Plus, Save, Trash2 } from "lucide-react";
import type { SchemaProject, SchemaType } from "./types.ts";
import { generateSchemaId } from "./db.ts";

interface SchemaManagerProps {
  schemas: SchemaProject[];
  activeSchemaId: string | null;
  triggerCreateDialog?: boolean;
  onCreateDialogOpen?: () => void;
  onSelectSchema: (id: string) => void;
  onCreateSchema: (schema: SchemaProject) => void;
  onUpdateSchema: (schema: SchemaProject) => void;
  onDeleteSchema: (id: string) => void;
}

/**
 * Schema management interface with tabs
 * Create, edit, delete schemas
 */
export default function SchemaManager({
  schemas,
  activeSchemaId,
  triggerCreateDialog = false,
  onCreateDialogOpen,
  onSelectSchema,
  onCreateSchema,
  onUpdateSchema,
  onDeleteSchema,
}: SchemaManagerProps): ReactElement {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSchema, setEditingSchema] = useState<SchemaProject | null>(
    null,
  );

  // Handle external trigger to open create dialog
  useEffect(() => {
    if (triggerCreateDialog) {
      setShowCreateDialog(true);
      if (onCreateDialogOpen) {
        onCreateDialogOpen();
      }
    }
  }, [triggerCreateDialog, onCreateDialogOpen]);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<SchemaType>("dynamic");
  const [formWidgetKey, setFormWidgetKey] = useState("");

  const activeSchema = schemas.find((s) => s.id === activeSchemaId);

  const handleCreateClick = (): void => {
    setFormName("");
    setFormDescription("");
    setFormType("dynamic");
    setFormWidgetKey("");
    setShowCreateDialog(true);
  };

  const handleCreateSubmit = (): void => {
    if (!formName.trim()) {
      alert("Please enter a schema name");
      return;
    }

    if (formType === "static" && !formWidgetKey.trim()) {
      alert("Please enter a widget key for static schema");
      return;
    }

    const now = Date.now();
    const widgetKey = formType === "static"
      ? `widget.${formWidgetKey.trim()}`
      : `widget.custom.${Date.now()}`;

    const newSchema: SchemaProject = {
      id: generateSchemaId(),
      name: formName.trim(),
      description: formDescription.trim(),
      type: formType,
      widgetKey,
      channelKeys: [],
      nestedSchemas: [],
      schema: {
        type: "div",
        className: "p-4 bg-zinc-900 rounded border border-zinc-700",
        children: [
          {
            type: "div",
            text: formType === "static"
              ? "Static container - add nested schemas in editor"
              : "Your widget content here",
            className: "text-white",
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
    };

    onCreateSchema(newSchema);
    setShowCreateDialog(false);
  };

  const handleEditClick = (): void => {
    if (!activeSchema) return;

    setEditingSchema(activeSchema);
    setFormName(activeSchema.name);
    setFormDescription(activeSchema.description);
    setShowEditDialog(true);
  };

  const handleEditSubmit = (): void => {
    if (!editingSchema) return;
    if (!formName.trim()) {
      alert("Please enter a schema name");
      return;
    }

    const updatedSchema: SchemaProject = {
      ...editingSchema,
      name: formName.trim(),
      description: formDescription.trim(),
      updatedAt: Date.now(),
    };

    onUpdateSchema(updatedSchema);
    setShowEditDialog(false);
    setEditingSchema(null);
  };

  const handleDeleteClick = (): void => {
    if (!activeSchema) return;

    if (
      confirm(
        `Delete schema "${activeSchema.name}"?\n\nThis action cannot be undone.`,
      )
    ) {
      onDeleteSchema(activeSchema.id);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Schema tabs */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {schemas.map((schema) => {
          const typeIcon = schema.type === "static" ? "📦" : "📊";
          const typeColor = schema.type === "static"
            ? "text-purple-400"
            : "text-blue-400";
          const count = schema.type === "static"
            ? (schema.nestedSchemas?.length || 0)
            : schema.channelKeys.length;

          return (
            <button
              key={schema.id}
              onClick={() => onSelectSchema(schema.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-t border-b-2 transition-all whitespace-nowrap
                ${
                activeSchemaId === schema.id
                  ? "bg-zinc-900 border-amber-500 text-white"
                  : "bg-zinc-800/50 border-transparent text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
              }
              `}
            >
              <span className="text-sm">{typeIcon}</span>
              <span className="text-sm font-medium">{schema.name}</span>
              <span
                className={`text-xs ${
                  activeSchemaId === schema.id ? typeColor : "text-zinc-500"
                }`}
              >
                ({count})
              </span>
            </button>
          );
        })}

        {schemas.length === 0 && (
          <div className="text-sm text-zinc-500 italic px-4 py-2">
            No schemas yet. Create one to get started.
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded border border-zinc-800">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCreateClick}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Schema
        </Button>

        {activeSchema && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEditClick}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Info
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteClick}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 border-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>

            <div className="flex-1" />

            <div className="text-xs text-zinc-500">
              Widget Key:{" "}
              <span className="font-mono text-zinc-400">
                {activeSchema.widgetKey}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Schema</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {/* Schema Type Selection */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-zinc-300">
                Schema Type *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormType("dynamic")}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded border transition-all
                    ${
                    formType === "dynamic"
                      ? "bg-blue-500/20 border-blue-500 text-blue-400"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }
                  `}
                >
                  <Database className="w-6 h-6" />
                  <div className="text-center">
                    <div className="text-sm font-semibold">Dynamic</div>
                    <div className="text-xs text-zinc-500">
                      Widget with data
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setFormType("static")}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded border transition-all
                    ${
                    formType === "static"
                      ? "bg-purple-500/20 border-purple-500 text-purple-400"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }
                  `}
                >
                  <Box className="w-6 h-6" />
                  <div className="text-center">
                    <div className="text-sm font-semibold">Static</div>
                    <div className="text-xs text-zinc-500">
                      Container/Router
                    </div>
                  </div>
                </button>
              </div>
              <div className="p-3 bg-zinc-900 rounded border border-zinc-700">
                <div className="text-xs text-zinc-400 mb-1">
                  About this type:
                </div>
                <div className="text-xs text-zinc-500">
                  {formType === "dynamic"
                    ? (
                      <>
                        <div className="mb-2">
                          📊 Dynamic schemas bind to session channels for
                          real-time data.
                        </div>
                        <div className="text-amber-400 font-semibold mb-1">
                          After creating:
                        </div>
                        <div className="space-y-1 ml-2">
                          <div>
                            1. Open Channel Selection panel (opens
                            automatically)
                          </div>
                          <div>
                            2. Select one or more data channels (ticker, book,
                            trades)
                          </div>
                          <div>
                            3. Set aliases for data access (auto-generated)
                          </div>
                          <div>
                            4. Use aliases in your schema:{" "}
                            <code className="text-green-400">
                              {"{"}btc_ticker.data.last{"}"}
                            </code>
                          </div>
                        </div>
                      </>
                    )
                    : "📦 Static schemas are containers for composing other schemas. After creating, select nested schemas in the Nested Schemas panel to build your layout."}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-zinc-300">
                Schema Name *
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={formType === "static"
                  ? "e.g., Markets Dashboard"
                  : "e.g., BTC/USDT Widget"}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-zinc-300">
                Description
              </Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description..."
                className="w-full min-h-[80px]"
              />
            </div>

            {formType === "static" && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-zinc-300">
                  Widget Key * (without 'widget.' prefix)
                </Label>
                <Input
                  value={formWidgetKey}
                  onChange={(e) => setFormWidgetKey(e.target.value)}
                  placeholder="e.g., markets or dashboard.overview"
                  className="w-full font-mono text-sm"
                />
                <div className="text-xs text-zinc-500">
                  Result:{" "}
                  <span className="font-mono text-amber-400">
                    widget.{formWidgetKey || "..."}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateSubmit}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Schema
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schema Info</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">
                Schema Name *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Schema name"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">
                Description
              </label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description..."
                className="w-full min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingSchema(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEditSubmit}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
