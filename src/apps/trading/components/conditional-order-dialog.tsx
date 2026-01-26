/**
 * Conditional Order Dialog Component
 * Dialog for creating conditional orders
 */

import { useState, useCallback } from "react";
import { useTradingStore } from "../store";
import type {
  OrderSide,
  OrderType,
  ConditionType,
  ConditionOperator,
} from "../types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConditionalOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  defaultSymbol?: string;
}

const CONDITION_TYPES: { value: ConditionType; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "time", label: "Time" },
  { value: "indicator", label: "Indicator" },
];

const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
];

const ORDER_TYPES: OrderType[] = ["market", "limit"];

const INDICATORS = ["RSI", "MACD", "EMA", "SMA", "BB", "VWAP"];

export function ConditionalOrderDialog({
  open,
  onOpenChange,
  accountId,
  defaultSymbol = "BTC/USDT",
}: ConditionalOrderDialogProps) {
  const { createConditionalOrder, conditionalOrderCreating, ticker } =
    useTradingStore();

  // Condition state
  const [conditionType, setConditionType] = useState<ConditionType>("price");
  const [conditionOperator, setConditionOperator] =
    useState<ConditionOperator>("gte");
  const [conditionValue, setConditionValue] = useState("");
  const [conditionSymbol, setConditionSymbol] = useState(defaultSymbol);
  const [indicator, setIndicator] = useState("RSI");

  // Order state
  const [orderSymbol, setOrderSymbol] = useState(defaultSymbol);
  const [orderSide, setOrderSide] = useState<OrderSide>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderPrice, setOrderPrice] = useState("");

  // Expiration (reserved for future use)
  const [hasExpiration] = useState(false);
  const [expiresAt] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!conditionValue || !orderAmount || parseFloat(orderAmount) <= 0) return;

    const result = await createConditionalOrder({
      accountId,
      condition: {
        type: conditionType,
        operator: conditionOperator,
        value: parseFloat(conditionValue),
        symbol: conditionType === "price" ? conditionSymbol : undefined,
        indicator: conditionType === "indicator" ? indicator : undefined,
      },
      order: {
        symbol: orderSymbol,
        side: orderSide,
        type: orderType,
        amount: parseFloat(orderAmount),
        price:
          orderType === "limit" && orderPrice
            ? parseFloat(orderPrice)
            : undefined,
      },
      expiresAt: hasExpiration && expiresAt ? new Date(expiresAt).getTime() : null,
    });

    if (result) {
      // Reset form
      setConditionValue("");
      setOrderAmount("");
      setOrderPrice("");
      onOpenChange(false);
    }
  }, [
    accountId,
    conditionType,
    conditionOperator,
    conditionValue,
    conditionSymbol,
    indicator,
    orderSymbol,
    orderSide,
    orderType,
    orderAmount,
    orderPrice,
    hasExpiration,
    expiresAt,
    createConditionalOrder,
    onOpenChange,
  ]);

  const getConditionDescription = () => {
    if (!conditionValue) return "Set condition trigger";
    const op = CONDITION_OPERATORS.find((o) => o.value === conditionOperator)?.label;

    if (conditionType === "price") {
      return `When ${conditionSymbol} price ${op} $${conditionValue}`;
    } else if (conditionType === "indicator") {
      return `When ${indicator} ${op} ${conditionValue}`;
    } else {
      return `When timestamp ${op} ${conditionValue}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Conditional Order
          </DialogTitle>
          <DialogDescription>
            Create an order that executes when a condition is met
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Condition Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Trigger Condition</Label>

            <Tabs
              value={conditionType}
              onValueChange={(v) => setConditionType(v as ConditionType)}
            >
              <TabsList className="w-full">
                {CONDITION_TYPES.map((type) => (
                  <TabsTrigger key={type.value} value={type.value} className="flex-1">
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="price" className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs">Symbol</Label>
                  <Input
                    value={conditionSymbol}
                    onChange={(e) => setConditionSymbol(e.target.value.toUpperCase())}
                    placeholder="BTC/USDT"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-24">
                    <Label className="text-xs">When price</Label>
                    <Select
                      value={conditionOperator}
                      onValueChange={(v) => setConditionOperator(v as ConditionOperator)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Target Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={ticker?.last?.toString() || "0.00"}
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="indicator" className="space-y-3 mt-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Indicator</Label>
                    <Select value={indicator} onValueChange={setIndicator}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INDICATORS.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={conditionOperator}
                      onValueChange={(v) => setConditionOperator(v as ConditionOperator)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="70"
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="time" className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs">Execute at timestamp (Unix)</Label>
                  <Input
                    type="number"
                    placeholder={Math.floor(Date.now() / 1000 + 3600).toString()}
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: {Math.floor(Date.now() / 1000)}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Visual separator */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex-1 border-t" />
            <ArrowRight className="h-4 w-4" />
            <div className="flex-1 border-t" />
          </div>

          {/* Order Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Order to Execute</Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Symbol</Label>
                <Input
                  value={orderSymbol}
                  onChange={(e) => setOrderSymbol(e.target.value.toUpperCase())}
                  placeholder="BTC/USDT"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Side</Label>
                <Select
                  value={orderSide}
                  onValueChange={(v) => setOrderSide(v as OrderSide)}
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
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Select
                  value={orderType}
                  onValueChange={(v) => setOrderType(v as OrderType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="0.00"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                />
              </div>
              {orderType === "limit" && (
                <div className="space-y-2">
                  <Label className="text-xs">Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="font-medium mb-1">Summary</div>
            <div className="text-muted-foreground">
              {getConditionDescription()}, execute{" "}
              <span
                className={cn(
                  "font-medium",
                  orderSide === "buy" ? "text-green-500" : "text-red-500"
                )}
              >
                {orderSide.toUpperCase()}
              </span>{" "}
              {orderAmount || "?"} {orderSymbol}
              {orderType === "limit" && orderPrice && ` @ $${orderPrice}`}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              conditionalOrderCreating ||
              !conditionValue ||
              !orderAmount ||
              parseFloat(orderAmount) <= 0
            }
          >
            {conditionalOrderCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Conditional Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
