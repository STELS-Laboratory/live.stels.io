/**
 * Hotkeys Dialog Component
 * Displays all keyboard shortcuts
 */

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Keyboard, RotateCcw, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHotkeysList, DEFAULT_HOTKEYS } from "../hooks/use-hotkeys";

interface HotkeysDialogProps {
  trigger?: React.ReactNode;
}

export function HotkeysDialog({ trigger }: HotkeysDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { hotkeys, setBinding, resetBindings, categories } = useHotkeysList();

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Start editing
  const handleStartEdit = useCallback((id: string, currentKey: string) => {
    setEditingId(id);
    setEditValue(currentKey);
  }, []);

  // Save edit
  const handleSaveEdit = useCallback(() => {
    if (editingId && editValue) {
      setBinding(editingId, editValue);
    }
    setEditingId(null);
    setEditValue("");
  }, [editingId, editValue, setBinding]);

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  // Handle key capture for editing
  const handleKeyCapture = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const key = e.key;
    
    // Ignore modifier keys alone
    if (["Control", "Alt", "Shift", "Meta"].includes(key)) {
      return;
    }
    
    setEditValue(key);
  }, []);

  // Group hotkeys by category
  const groupedHotkeys = categories.map((category) => ({
    category,
    items: hotkeys.filter((h) => h.category === category),
  }));

  // Category labels
  const categoryLabels: Record<string, string> = {
    trading: "Trading",
    navigation: "Navigation",
    ui: "Interface",
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={resetBindings}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 py-4">
            {groupedHotkeys.map(({ category, items }) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {categoryLabels[category]}
                </h3>
                <div className="space-y-2">
                  {items.map((hotkey) => (
                    <div
                      key={hotkey.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{hotkey.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {hotkey.description}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingId === hotkey.id ? (
                          // Editing mode
                          <div className="flex items-center gap-1">
                            <Input
                              className="w-20 h-7 text-center font-mono text-sm"
                              value={editValue}
                              onKeyDown={handleKeyCapture}
                              onChange={() => {}} // Read-only, using keydown
                              placeholder="Press key"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-green-500"
                              onClick={handleSaveEdit}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          // Display mode
                          <>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "font-mono min-w-[3rem] justify-center",
                                hotkey.isCustom && "border-primary/50"
                              )}
                            >
                              {formatKey(hotkey.currentKey)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                              onClick={() => handleStartEdit(hotkey.id, hotkey.currentKey)}
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Click the edit button to customize shortcuts. Press any key to set.
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Format key for display
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    " ": "Space",
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Enter: "↵",
    Backspace: "⌫",
    Tab: "⇥",
  };

  return keyMap[key] || key.toUpperCase();
}
