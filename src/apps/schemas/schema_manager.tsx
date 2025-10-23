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

    if (!formWidgetKey.trim()) {
      alert("Please enter a widget key");
      return;
    }

    const now = Date.now();
    const widgetKey = `widget.${formWidgetKey.trim()}`;

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
        className: "p-4 bg-card rounded border border-border",
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
      {/* Schema tabs - compact */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {schemas.map((schema) => {
          const typeIcon = schema.type === "static" ? "📦" : "📊";
          const count = schema.type === "static"
            ? (schema.nestedSchemas?.length || 0)
            : schema.channelKeys.length;

          return (
            <button
              key={schema.id}
              onClick={() => onSelectSchema(schema.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all whitespace-nowrap
                ${
                activeSchemaId === schema.id
                  ? "bg-amber-500/10 border-amber-500/30 text-foreground"
                  : "bg-muted/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
              `}
            >
              <span className="text-xs">{typeIcon}</span>
              <span className="text-xs font-medium">{schema.name}</span>
              {count > 0 && (
                <span className="text-[10px] px-1 py-0.5 bg-background/50 rounded">
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {schemas.length === 0 && (
          <div className="text-[11px] text-muted-foreground italic px-3 py-1.5">
            No schemas yet
          </div>
        )}
      </div>

      {/* Action buttons - compact icon bar */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCreateClick}
          className="h-6 px-2 text-[10px]"
        >
          <Plus className="w-3 h-3 mr-1" />
          New
        </Button>

        {activeSchema && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditClick}
              className="h-6 w-6 p-0"
              title="Edit schema info"
            >
              <Edit2 className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteClick}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 dark:text-red-400"
              title="Delete schema"
            >
              <Trash2 className="w-3 h-3" />
            </Button>

            <div className="flex-1" />

            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">
              {activeSchema.widgetKey}
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
              <Label className="text-sm font-medium text-foreground">
                Schema Type *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormType("dynamic")}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded border transition-all
                    ${
                    formType === "dynamic"
                      ? "bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400"
                      : "bg-card border-border text-muted-foreground hover:border-muted"
                  }
                  `}
                >
                  <Database className="w-6 h-6" />
                  <div className="text-center">
                    <div className="text-sm font-semibold">Dynamic</div>
                    <div className="text-xs text-muted-foreground">
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
                      ? "bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-400"
                      : "bg-card border-border text-muted-foreground hover:border-muted"
                  }
                  `}
                >
                  <Box className="w-6 h-6" />
                  <div className="text-center">
                    <div className="text-sm font-semibold">Static</div>
                    <div className="text-xs text-muted-foreground">
                      Container/Router
                    </div>
                  </div>
                </button>
              </div>
              <div className="p-3 bg-card rounded border border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  About this type:
                </div>
                <div className="text-xs text-muted-foreground">
                  {formType === "dynamic"
                    ? (
                      <>
                        <div className="mb-2">
                          📊 Dynamic schemas bind to session channels for
                          real-time data.
                        </div>
                        <div className="text-amber-700 dark:text-amber-400 font-semibold mb-1">
                          Two ways to use:
                        </div>
                        <div className="space-y-2 ml-2">
                          <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                            <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                              Universal (recommended):
                            </div>
                            <div>
                              Use{" "}
                              <code className="text-green-700 dark:text-green-600">
                                {"{"}self.raw.data.last{"}"}
                              </code>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              One schema works for any channel!
                            </div>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <div className="font-semibold text-foreground mb-1">
                              Multi-channel:
                            </div>
                            <div>
                              Select channels, set aliases, use{" "}
                              <code className="text-green-700 dark:text-green-600">
                                {"{"}btc_ticker.raw.data.last{"}"}
                              </code>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                    : (
                      <>
                        📦 Static schemas are containers for composing other
                        schemas. After creating, select nested schemas in the
                        Nested Schemas panel to build your layout.
                      </>
                    )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">
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
              <Label className="text-sm font-medium text-foreground">
                Description
              </Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description..."
                className="w-full min-h-[80px]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">
                Widget Key * (without 'widget.' prefix)
              </Label>
              <Input
                value={formWidgetKey}
                onChange={(e) => setFormWidgetKey(e.target.value)}
                placeholder={formType === "static"
                  ? "e.g., markets or dashboard.overview"
                  : "e.g., ticker.btc or custom.mywidget"}
                className="w-full font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground">
                Result:{" "}
                <span className="font-mono text-amber-700 dark:text-amber-400">
                  widget.{formWidgetKey || "..."}
                </span>
              </div>
              {formType === "dynamic" && (
                <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    <strong>Tip:</strong>{" "}
                    For universal widgets, use descriptive keys like{" "}
                    <code className="font-mono">ticker.universal</code> or{" "}
                    <code className="font-mono">book.viewer</code>
                  </p>
                </div>
              )}
            </div>

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
              <label className="text-sm font-medium text-foreground">
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
              <label className="text-sm font-medium text-foreground">
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
