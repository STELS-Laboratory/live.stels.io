/**
 * Batch Order Dialog Component
 * Dialog for creating multiple orders at once
 */

import { useState, useCallback } from "react";
import { useTradingStore } from "../store";
import type { BatchOrderItem, OrderSide, OrderType, TimeInForce } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Trash2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  defaultSymbol?: string;
}

const ORDER_TYPES: OrderType[] = ["market", "limit", "stop", "stop_limit"];
const TIME_IN_FORCE: TimeInForce[] = ["GTC", "IOC", "FOK", "PO"];

interface BatchOrderItemForm {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  amount: string;
  price: string;
  stopPrice: string;
  timeInForce: TimeInForce;
}

// Generate unique ID with fallback for browsers without crypto.randomUUID
const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: generate UUID-like string
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const createEmptyOrder = (symbol: string): BatchOrderItemForm => ({
  id: generateId(),
  symbol,
  side: "buy",
  type: "limit",
  amount: "",
  price: "",
  stopPrice: "",
  timeInForce: "GTC",
});

export function BatchOrderDialog({
  open,
  onOpenChange,
  accountId,
  defaultSymbol = "BTC/USDT",
}: BatchOrderDialogProps) {
  const { createBatchOrders, batchOrdersCreating } = useTradingStore();

  const [orders, setOrders] = useState<BatchOrderItemForm[]>([
    createEmptyOrder(defaultSymbol),
  ]);

  const addOrder = useCallback(() => {
    setOrders((prev) => [...prev, createEmptyOrder(defaultSymbol)]);
  }, [defaultSymbol]);

  const removeOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const updateOrder = useCallback((id: string, updates: Partial<BatchOrderItemForm>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate and convert orders
    const validOrders: BatchOrderItem[] = orders
      .filter((o) => o.amount && parseFloat(o.amount) > 0)
      .map((o) => ({
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        amount: parseFloat(o.amount),
        price: o.type !== "market" && o.price ? parseFloat(o.price) : undefined,
        stopPrice: o.stopPrice ? parseFloat(o.stopPrice) : undefined,
        timeInForce: o.type !== "market" ? o.timeInForce : undefined,
      }));

    if (validOrders.length === 0) return;

    const results = await createBatchOrders({
      accountId,
      orders: validOrders,
    });

    if (results) {
      // Reset on success
      setOrders([createEmptyOrder(defaultSymbol)]);
      onOpenChange(false);
    }
  }, [orders, accountId, defaultSymbol, createBatchOrders, onOpenChange]);

  const validOrderCount = orders.filter(
    (o) => o.amount && parseFloat(o.amount) > 0
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Batch Orders
          </DialogTitle>
          <DialogDescription>
            Create multiple orders at once. All orders will be submitted in parallel.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4 py-4">
            {orders.map((order, index) => (
              <OrderItemForm
                key={order.id}
                order={order}
                index={index}
                onUpdate={(updates) => updateOrder(order.id, updates)}
                onRemove={() => removeOrder(order.id)}
                canRemove={orders.length > 1}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t">
          <Button variant="outline" size="sm" onClick={addOrder}>
            <Plus className="h-4 w-4 mr-1" />
            Add Order
          </Button>
          <div className="text-sm text-muted-foreground">
            {validOrderCount} valid order{validOrderCount !== 1 ? "s" : ""}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={batchOrdersCreating || validOrderCount === 0}
          >
            {batchOrdersCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create ${validOrderCount} Order${validOrderCount !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface OrderItemFormProps {
  order: BatchOrderItemForm;
  index: number;
  onUpdate: (updates: Partial<BatchOrderItemForm>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function OrderItemForm({
  order,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: OrderItemFormProps) {
  const isValid = order.amount && parseFloat(order.amount) > 0;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border space-y-3",
        isValid ? "border-border" : "border-dashed border-muted-foreground/30"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">#{index + 1}</Badge>
          <Badge
            variant="outline"
            className={cn(
              order.side === "buy"
                ? "text-green-500 border-green-500/30"
                : "text-red-500 border-red-500/30"
            )}
          >
            {order.side.toUpperCase()}
          </Badge>
        </div>
        {canRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Symbol</Label>
          <Input
            value={order.symbol}
            onChange={(e) => onUpdate({ symbol: e.target.value.toUpperCase() })}
            placeholder="BTC/USDT"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Side</Label>
          <Select
            value={order.side}
            onValueChange={(v) => onUpdate({ side: v as OrderSide })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={order.type}
            onValueChange={(v) => onUpdate({ type: v as OrderType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Amount</Label>
          <Input
            type="number"
            step="0.0001"
            placeholder="0.00"
            value={order.amount}
            onChange={(e) => onUpdate({ amount: e.target.value })}
          />
        </div>
        {order.type !== "market" && (
          <div className="space-y-1">
            <Label className="text-xs">Price</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={order.price}
              onChange={(e) => onUpdate({ price: e.target.value })}
            />
          </div>
        )}
      </div>

      {(order.type === "stop" || order.type === "stop_limit") && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Stop Price</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={order.stopPrice}
              onChange={(e) => onUpdate({ stopPrice: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Time in Force</Label>
            <Select
              value={order.timeInForce}
              onValueChange={(v) => onUpdate({ timeInForce: v as TimeInForce })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_IN_FORCE.map((tif) => (
                  <SelectItem key={tif} value={tif}>
                    {tif}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
