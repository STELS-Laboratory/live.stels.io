/**
 * Enhanced Order Form Component
 * Professional order form with slider, preview panel, validation, and TP/SL
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTradingStore } from "../store";
import { useRealtimeTicker, useRealtimeAccountBalance } from "../hooks";
import { AmountSlider } from "./amount-slider";
import type { 
  OrderSide, 
  OrderType, 
  TimeInForce, 
  StopOrderType,
  TriggerBy,
  TpSlMode,
  PositionIdx,
} from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  ShoppingCart,
  ChevronDown,
  Calculator,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface OrderFormProps {
  nid: string;
  accountId?: string; // For v2.15.0 API methods
  symbol: string;
  exchange?: string;
  market?: string;
  initialPrice?: string;
  onPriceChange?: (price: string) => void;
  /** Enable professional trading features (v2.15.0) */
  enableProfessionalFeatures?: boolean;
}

interface ValidationError {
  field: "price" | "amount" | "stopPrice" | "takeProfit" | "stopLoss";
  message: string;
}

// ============================================
// Constants
// ============================================

const ESTIMATED_FEE_RATE = 0.001; // 0.1% typical fee
const ESTIMATED_SLIPPAGE = 0.0005; // 0.05% slippage estimate

// ============================================
// Component
// ============================================

// Get user address from localStorage for realtime balance
function getUserAddress(): string | null {
  try {
    const privateStore = localStorage.getItem("private-store");
    if (privateStore) {
      const data = JSON.parse(privateStore) as {
        raw?: { info?: { title?: string; address?: string }; address?: string };
      };
      return data?.raw?.info?.title ?? data?.raw?.info?.address ?? data?.raw?.address ?? null;
    }
  } catch {
    // Ignore
  }
  return null;
}

export function OrderForm({
  nid,
  accountId,
  symbol,
  exchange = "bybit",
  market = "spot",
  initialPrice = "",
  onPriceChange,
  enableProfessionalFeatures = false,
}: OrderFormProps) {
  const { 
    createOrder, 
    createOrderWithTpSl,
    createStopOrder,
    orderCreating, 
    balances: rpcBalances 
  } = useTradingStore();

  // Get realtime ticker for price reference
  const { raw: tickerData } = useRealtimeTicker(symbol, exchange, market, { interval: 1000 });

  // Get realtime balance (preferred over RPC)
  const userAddress = useMemo(() => getUserAddress(), []);
  const { balances: realtimeBalances } = useRealtimeAccountBalance(
    userAddress || "",
    exchange,
    nid,
    { interval: 2000, enabled: !!(userAddress && exchange && nid) }
  );

  // Use realtime balances if available, otherwise fallback to RPC
  const balances = useMemo(() => {
    const hasRealtimeData = Object.keys(realtimeBalances).length > 0;
    return hasRealtimeData ? realtimeBalances : rpcBalances;
  }, [realtimeBalances, rpcBalances]);

  // Form state
  const [side, setSide] = useState<OrderSide>("buy");
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState(initialPrice);
  const [stopPrice, setStopPrice] = useState("");
  const [timeInForce, setTimeInForce] = useState<TimeInForce>("GTC");
  const [reduceOnly, setReduceOnly] = useState(false);

  // TP/SL state
  const [showTpSl, setShowTpSl] = useState(false);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  
  // Professional Trading State (v2.15.0)
  // showAdvanced state reserved for future advanced order features
  const [triggerBy, setTriggerBy] = useState<TriggerBy>("LastPrice");
  const [tpslMode, setTpslMode] = useState<TpSlMode>("Full");
  const [positionIdx, setPositionIdx] = useState<PositionIdx>(0);
  const [stopOrderType, setStopOrderType] = useState<StopOrderType>("stop_loss");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [trailingDelta, setTrailingDelta] = useState("");
  const [activationPrice, setActivationPrice] = useState("");

  // Validation state
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showShake, setShowShake] = useState(false);

  // Refs for hotkey focus
  const priceInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Sync price from external source (click-to-fill from orderbook)
  const lastSyncedPriceRef = useRef<string>("");
  useEffect(() => {
    if (initialPrice && initialPrice !== lastSyncedPriceRef.current) {
      lastSyncedPriceRef.current = initialPrice;
      setPrice(initialPrice);
      // Flash the price input to indicate it was filled
      priceInputRef.current?.classList.add("ring-2", "ring-primary");
      setTimeout(() => {
        priceInputRef.current?.classList.remove("ring-2", "ring-primary");
      }, 300);
    }
  }, [initialPrice]);

  // Extract base and quote currencies from symbol
  const [baseCurrency, quoteCurrency] = useMemo(() => {
    const parts = symbol.split("/");
    return [parts[0] || "", parts[1] || "USDT"];
  }, [symbol]);

  // Get available balance (using merged balances)
  const availableBalance = useMemo(() => {
    if (side === "buy") {
      return balances[quoteCurrency]?.free || 0;
    } else {
      return balances[baseCurrency]?.free || 0;
    }
  }, [side, balances, baseCurrency, quoteCurrency]);

  // Calculate max amount based on balance and price
  const maxAmount = useMemo(() => {
    if (side === "buy") {
      const priceValue = parseFloat(price) || tickerData?.last || 0;
      if (priceValue > 0) {
        return availableBalance / priceValue;
      }
      return 0;
    } else {
      return availableBalance;
    }
  }, [side, availableBalance, price, tickerData?.last]);

  // Parse numeric values
  const amountNum = parseFloat(amount) || 0;
  const priceNum = parseFloat(price) || (orderType === "market" ? tickerData?.last : 0) || 0;

  // Calculate order preview values
  const orderPreview = useMemo(() => {
    const effectivePrice = orderType === "market"
      ? (tickerData?.last || 0) * (side === "buy" ? 1 + ESTIMATED_SLIPPAGE : 1 - ESTIMATED_SLIPPAGE)
      : priceNum;

    const total = amountNum * effectivePrice;
    const fees = total * ESTIMATED_FEE_RATE;
    const slippage = orderType === "market" ? total * ESTIMATED_SLIPPAGE : 0;
    const totalWithFees = side === "buy" ? total + fees : total - fees;

    // TP/SL calculations
    const tpPrice = parseFloat(takeProfit) || 0;
    const slPrice = parseFloat(stopLoss) || 0;
    const entryPrice = effectivePrice;

    const tpPnl = tpPrice > 0 && amountNum > 0
      ? (tpPrice - entryPrice) * amountNum * (side === "buy" ? 1 : -1)
      : null;
    const slPnl = slPrice > 0 && amountNum > 0
      ? (slPrice - entryPrice) * amountNum * (side === "buy" ? 1 : -1)
      : null;

    const riskRewardRatio = tpPnl !== null && slPnl !== null && slPnl !== 0
      ? Math.abs(tpPnl / slPnl)
      : null;

    return {
      effectivePrice,
      total,
      fees,
      slippage,
      totalWithFees,
      tpPnl,
      slPnl,
      riskRewardRatio,
    };
  }, [amountNum, priceNum, orderType, tickerData?.last, side, takeProfit, stopLoss]);

  // Validation
  const validateForm = useCallback((): ValidationError[] => {
    const newErrors: ValidationError[] = [];

    // Amount validation
    if (!amount || amountNum <= 0) {
      newErrors.push({ field: "amount", message: "Amount required" });
    } else if (amountNum > maxAmount) {
      newErrors.push({ field: "amount", message: "Insufficient balance" });
    }

    // Price validation for limit orders
    if (orderType !== "market") {
      if (!price || priceNum <= 0) {
        newErrors.push({ field: "price", message: "Price required" });
      }
    }

    // Stop price validation
    if ((orderType === "stop" || orderType === "stop_limit") && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      newErrors.push({ field: "stopPrice", message: "Stop price required" });
    }

    // TP/SL validation
    if (showTpSl) {
      const tp = parseFloat(takeProfit);
      const sl = parseFloat(stopLoss);
      const entry = priceNum || tickerData?.last || 0;

      if (takeProfit && tp > 0) {
        if (side === "buy" && tp <= entry) {
          newErrors.push({ field: "takeProfit", message: "TP must be above entry" });
        } else if (side === "sell" && tp >= entry) {
          newErrors.push({ field: "takeProfit", message: "TP must be below entry" });
        }
      }

      if (stopLoss && sl > 0) {
        if (side === "buy" && sl >= entry) {
          newErrors.push({ field: "stopLoss", message: "SL must be below entry" });
        } else if (side === "sell" && sl <= entry) {
          newErrors.push({ field: "stopLoss", message: "SL must be above entry" });
        }
      }
    }

    return newErrors;
  }, [amount, amountNum, maxAmount, price, priceNum, orderType, stopPrice, showTpSl, takeProfit, stopLoss, side, tickerData?.last]);

  // Update errors on input change
  useEffect(() => {
    if (touched.size > 0) {
      setErrors(validateForm());
    }
  }, [validateForm, touched]);

  // Get error for specific field
  const getFieldError = (field: ValidationError["field"]) => {
    if (!touched.has(field)) return null;
    return errors.find((e) => e.field === field)?.message;
  };

  // Handle field blur
  const handleFieldBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
  };

  // Handle amount from slider
  const handleSliderChange = useCallback((value: number) => {
    setAmount(value > 0 ? value.toString() : "");
  }, []);

  // Set price from ticker
  const handleUseMarketPrice = useCallback(() => {
    if (tickerData) {
      const newPrice = side === "buy" ? tickerData.ask?.toString() : tickerData.bid?.toString();
      if (newPrice) {
        setPrice(newPrice);
        onPriceChange?.(newPrice);
      }
    }
  }, [tickerData, side, onPriceChange]);

  // Use last price
  const handleUseLastPrice = useCallback(() => {
    if (tickerData?.last) {
      const newPrice = tickerData.last.toString();
      setPrice(newPrice);
      onPriceChange?.(newPrice);
    }
  }, [tickerData?.last, onPriceChange]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      setTouched(new Set(["amount", "price", "stopPrice", "takeProfit", "stopLoss"]));

      const validationErrors = validateForm();
      setErrors(validationErrors);

      if (validationErrors.length > 0) {
        setShowShake(true);
        setTimeout(() => setShowShake(false), 400);
        return;
      }

      let success = false;

      // Use professional API if enabled and accountId is provided
      const useProfessionalApi = enableProfessionalFeatures && accountId;

      // Check if this is a stop order type
      const isStopOrder = orderType === "stop" || orderType === "stop_limit" || 
                          orderType === "trailing_stop" || orderType === "take_profit" || 
                          orderType === "take_profit_limit";

      // Use createOrderWithTpSl if TP/SL values are set and professional API is enabled
      if (useProfessionalApi && showTpSl && (takeProfit || stopLoss) && !isStopOrder) {
        const result = await createOrderWithTpSl({
          accountId,
          symbol,
          type: orderType === "market" ? "market" : "limit",
          side,
          amount: amountNum,
          price: orderType !== "market" && priceNum ? priceNum : undefined,
          takeProfitPrice: takeProfit ? parseFloat(takeProfit) : undefined,
          stopLossPrice: stopLoss ? parseFloat(stopLoss) : undefined,
          tpTriggerBy: triggerBy,
          slTriggerBy: triggerBy,
          tpslMode,
          positionIdx: positionIdx !== 0 ? positionIdx : undefined,
          reduceOnly: reduceOnly || undefined,
          timeInForce: orderType !== "market" ? timeInForce : undefined,
        });
        success = !!result;
      }
      // Use createStopOrder for stop orders with professional API
      else if (useProfessionalApi && isStopOrder && triggerPrice) {
        const result = await createStopOrder({
          accountId,
          symbol,
          stopOrderType: stopOrderType,
          side,
          amount: amountNum,
          triggerPrice: parseFloat(triggerPrice),
          price: orderType === "stop_limit" || orderType === "take_profit_limit" ? priceNum : undefined,
          triggerBy,
          positionIdx: positionIdx !== 0 ? positionIdx : undefined,
          reduceOnly: reduceOnly || undefined,
          timeInForce: orderType !== "market" ? timeInForce : undefined,
          trailingDelta: orderType === "trailing_stop" && trailingDelta ? parseFloat(trailingDelta) : undefined,
          activationPrice: orderType === "trailing_stop" && activationPrice ? parseFloat(activationPrice) : undefined,
        });
        success = !!result;
      }
      // Fallback to standard createOrder
      else {
        const params = {
          nid,
          symbol,
          side,
          type: orderType,
          amount: amountNum,
          price: orderType !== "market" && priceNum ? priceNum : undefined,
          stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
          timeInForce: orderType !== "market" ? timeInForce : undefined,
          reduceOnly: reduceOnly || undefined,
        };

        const order = await createOrder(params);
        success = !!order;
      }

      if (success) {
        // Reset form on success
        setAmount("");
        setPrice("");
        setStopPrice("");
        setTakeProfit("");
        setStopLoss("");
        setTriggerPrice("");
        setTrailingDelta("");
        setActivationPrice("");
        setTouched(new Set());
        setErrors([]);
      }
    },
    [nid, accountId, symbol, side, orderType, amountNum, priceNum, stopPrice, timeInForce, reduceOnly, 
     createOrder, createOrderWithTpSl, createStopOrder, validateForm, showTpSl, takeProfit, stopLoss,
     enableProfessionalFeatures, triggerBy, tpslMode, positionIdx, stopOrderType, triggerPrice, 
     trailingDelta, activationPrice]
  );

  // Format balance for display
  const formatBalance = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(2) + "M";
    if (value >= 1000) return (value / 1000).toFixed(2) + "K";
    if (value >= 1) return value.toFixed(4);
    return value.toFixed(8);
  };

  // Check if balance is low
  const isBalanceLow = amountNum > 0 && amountNum > maxAmount * 0.95;

  return (
    <div className={cn("h-full flex flex-col", showShake && "shake-error")}>
      {/* Header */}
      <div className="flex items-center justify-between pb-1 shrink-0">
        <span className="text-xs font-medium flex items-center gap-1.5">
          <ShoppingCart className="h-3.5 w-3.5" />
          Order
        </span>
        {orderType === "market" && (
          <Badge variant="outline" className="text-[10px] h-4 rounded-sm">
            Est. slippage: {(ESTIMATED_SLIPPAGE * 100).toFixed(2)}%
          </Badge>
        )}
      </div>
      {/* Form Content */}
      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Side Tabs */}
          <Tabs value={side} onValueChange={(v) => setSide(v as OrderSide)}>
            <TabsList className="w-full h-8">
              <TabsTrigger
                value="buy"
                className={cn(
                  "flex-1 text-xs gap-1",
                  side === "buy" && "bg-trading-buy-bg text-trading-buy data-[state=active]:bg-trading-buy-bg"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                Buy
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className={cn(
                  "flex-1 text-xs gap-1",
                  side === "sell" && "bg-trading-sell-bg text-trading-sell data-[state=active]:bg-trading-sell-bg"
                )}
              >
                <TrendingDown className="h-3 w-3" />
                Sell
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Balance Preview */}
          <div className={cn(
            "flex items-center justify-between text-[10px] px-1.5 py-1 rounded bg-muted/50",
            isBalanceLow && "balance-warning bg-trading-sell-bg"
          )}>
            <span className="text-muted-foreground">Available</span>
            <span className="font-mono font-medium">
              {formatBalance(availableBalance)} {side === "buy" ? quoteCurrency : baseCurrency}
            </span>
          </div>

          {/* Order Type */}
          <div className="space-y-1">
            <Label className="text-[10px]">Type</Label>
            <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market" className="text-xs">Market</SelectItem>
                <SelectItem value="limit" className="text-xs">Limit</SelectItem>
                <SelectItem value="stop" className="text-xs">Stop Market</SelectItem>
                <SelectItem value="stop_limit" className="text-xs">Stop Limit</SelectItem>
                {enableProfessionalFeatures && (
                  <>
                    <SelectItem value="take_profit" className="text-xs">Take Profit</SelectItem>
                    <SelectItem value="take_profit_limit" className="text-xs">TP Limit</SelectItem>
                    <SelectItem value="trailing_stop" className="text-xs">Trailing Stop</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Price (for limit orders) */}
          {orderType !== "market" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px]">Price ({quoteCurrency})</Label>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 text-[10px] px-1"
                        onClick={handleUseLastPrice}
                      >
                        Last
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Use last traded price</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 text-[10px] px-1"
                        onClick={handleUseMarketPrice}
                      >
                        {side === "buy" ? "Ask" : "Bid"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Use {side === "buy" ? "ask" : "bid"} price</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Input
                ref={priceInputRef}
                type="number"
                step="any"
                placeholder={tickerData?.last?.toString() || "0.00"}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  onPriceChange?.(e.target.value);
                }}
                onBlur={() => handleFieldBlur("price")}
                className={cn(
                  "h-7 font-mono text-sm transition-all",
                  getFieldError("price") && "order-input-error"
                )}
              />
              {getFieldError("price") && (
                <span className="text-[10px] text-trading-sell flex items-center gap-0.5">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("price")}
                </span>
              )}
            </div>
          )}

          {/* Stop Price (for stop orders) */}
          {(orderType === "stop" || orderType === "stop_limit") && (
            <div className="space-y-1">
              <Label className="text-[10px]">Stop Price</Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                onBlur={() => handleFieldBlur("stopPrice")}
                className={cn(
                  "h-7 font-mono text-sm",
                  getFieldError("stopPrice") && "order-input-error"
                )}
              />
              {getFieldError("stopPrice") && (
                <span className="text-[10px] text-trading-sell flex items-center gap-0.5">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("stopPrice")}
                </span>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1">
            <Label className="text-[10px]">Amount ({baseCurrency})</Label>
            <Input
              ref={amountInputRef}
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => handleFieldBlur("amount")}
              className={cn(
                "h-7 font-mono text-sm",
                getFieldError("amount") && "order-input-error"
              )}
            />
            {getFieldError("amount") && (
              <span className="text-[10px] text-trading-sell flex items-center gap-0.5">
                <AlertCircle className="h-3 w-3" />
                {getFieldError("amount")}
              </span>
            )}
          </div>

          {/* Enhanced Amount Slider */}
          <AmountSlider
            value={amountNum}
            max={maxAmount}
            onChange={handleSliderChange}
            currency={baseCurrency}
            disabled={maxAmount <= 0}
            showLabels={true}
            side={side}
          />

          {/* Time in Force - Only for limit orders */}
          {orderType !== "market" && (
            <div className="flex items-center gap-2">
              <Label className="text-[10px] shrink-0">TIF</Label>
              <Select value={timeInForce} onValueChange={(v) => setTimeInForce(v as TimeInForce)}>
                <SelectTrigger className="h-6 text-[10px] flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GTC" className="text-xs">GTC</SelectItem>
                  <SelectItem value="IOC" className="text-xs">IOC</SelectItem>
                  <SelectItem value="FOK" className="text-xs">FOK</SelectItem>
                  <SelectItem value="PO" className="text-xs">Post Only</SelectItem>
                </SelectContent>
              </Select>
              {/* Reduce Only inline */}
              <div className="flex items-center gap-1">
                <Label className="text-[10px]">RO</Label>
                <Switch checked={reduceOnly} onCheckedChange={setReduceOnly} className="scale-[0.6]" />
              </div>
            </div>
          )}

          {/* TP/SL Section */}
          <Collapsible open={showTpSl} onOpenChange={setShowTpSl}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full h-6 text-[10px] justify-between px-1"
              >
                <span className="flex items-center gap-1">
                  <Calculator className="h-3 w-3" />
                  TP/SL
                </span>
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", showTpSl && "rotate-180")}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 pt-1.5">
              {/* Take Profit */}
              <div className="flex items-center gap-2">
                <Label className="text-[10px] text-trading-buy w-8">TP</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Price"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  onBlur={() => handleFieldBlur("takeProfit")}
                  className={cn(
                    "h-6 text-[10px] font-mono flex-1",
                    getFieldError("takeProfit") && "order-input-error"
                  )}
                />
                {orderPreview.tpPnl !== null && (
                  <span className="text-[10px] text-trading-buy font-mono w-16 text-right">
                    +${orderPreview.tpPnl.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stop Loss */}
              <div className="flex items-center gap-2">
                <Label className="text-[10px] text-trading-sell w-8">SL</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Price"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  onBlur={() => handleFieldBlur("stopLoss")}
                  className={cn(
                    "h-6 text-[10px] font-mono flex-1",
                    getFieldError("stopLoss") && "order-input-error"
                  )}
                />
                {orderPreview.slPnl !== null && (
                  <span className="text-[10px] text-trading-sell font-mono w-16 text-right">
                    ${orderPreview.slPnl.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Risk/Reward Ratio */}
              {orderPreview.riskRewardRatio !== null && (
                <div className="flex items-center justify-between text-[10px] px-1 py-0.5 rounded bg-muted/30">
                  <span className="text-muted-foreground">Risk/Reward</span>
                  <span className={cn(
                    "font-mono font-medium",
                    orderPreview.riskRewardRatio >= 2 ? "text-trading-buy" : "text-trading-sell"
                  )}>
                    1:{orderPreview.riskRewardRatio.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Advanced TP/SL Options (v2.15.0) */}
              {enableProfessionalFeatures && (
                <div className="space-y-1.5 pt-1 border-t border-muted">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] w-16">Trigger By</Label>
                    <Select value={triggerBy} onValueChange={(v) => setTriggerBy(v as TriggerBy)}>
                      <SelectTrigger className="h-5 text-[10px] flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LastPrice" className="text-xs">Last Price</SelectItem>
                        <SelectItem value="MarkPrice" className="text-xs">Mark Price</SelectItem>
                        <SelectItem value="IndexPrice" className="text-xs">Index Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] w-16">TP/SL Mode</Label>
                    <Select value={tpslMode} onValueChange={(v) => setTpslMode(v as TpSlMode)}>
                      <SelectTrigger className="h-5 text-[10px] flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full" className="text-xs">Full Position</SelectItem>
                        <SelectItem value="Partial" className="text-xs">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Advanced Stop Order Section (v2.15.0) */}
          {enableProfessionalFeatures && (orderType === "stop" || orderType === "stop_limit" || orderType === "trailing_stop" || orderType === "take_profit" || orderType === "take_profit_limit") && (
            <div className="space-y-1.5 p-2 rounded border border-muted bg-muted/30">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] w-20">Stop Type</Label>
                <Select value={stopOrderType} onValueChange={(v) => setStopOrderType(v as StopOrderType)}>
                  <SelectTrigger className="h-6 text-[10px] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stop_loss" className="text-xs">Stop Loss</SelectItem>
                    <SelectItem value="take_profit" className="text-xs">Take Profit</SelectItem>
                    <SelectItem value="stop_loss_limit" className="text-xs">Stop Loss Limit</SelectItem>
                    <SelectItem value="take_profit_limit" className="text-xs">Take Profit Limit</SelectItem>
                    <SelectItem value="trailing_stop" className="text-xs">Trailing Stop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-[10px] w-20">Trigger Price</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  className="h-6 text-[10px] font-mono flex-1"
                />
              </div>

              {stopOrderType === "trailing_stop" && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] w-20">Trail Delta</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Delta (%)"
                      value={trailingDelta}
                      onChange={(e) => setTrailingDelta(e.target.value)}
                      className="h-6 text-[10px] font-mono flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] w-20">Activation</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Activation price"
                      value={activationPrice}
                      onChange={(e) => setActivationPrice(e.target.value)}
                      className="h-6 text-[10px] font-mono flex-1"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Position Index for Hedge Mode (v2.15.0) */}
          {enableProfessionalFeatures && market !== "spot" && (
            <div className="flex items-center gap-2">
              <Label className="text-[10px]">Position</Label>
              <Select 
                value={positionIdx.toString()} 
                onValueChange={(v) => setPositionIdx(parseInt(v) as PositionIdx)}
              >
                <SelectTrigger className="h-6 text-[10px] flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" className="text-xs">One-Way</SelectItem>
                  <SelectItem value="1" className="text-xs">Hedge - Buy</SelectItem>
                  <SelectItem value="2" className="text-xs">Hedge - Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Glass-morphism Order Preview */}
          {amountNum > 0 && (
            <div className={cn(
              "space-y-2 p-3 rounded-lg border",
              "bg-background/80 backdrop-blur-sm",
              side === "buy" 
                ? "border-trading-buy/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                : "border-trading-sell/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
            )}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Info className="h-3 w-3" />
                  Order Preview
                </span>
                <span className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  side === "buy" 
                    ? "bg-trading-buy/10 text-trading-buy" 
                    : "bg-trading-sell/10 text-trading-sell"
                )}>
                  {side.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-mono font-medium">
                    ${orderPreview.effectivePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono">{amountNum.toFixed(6)} {baseCurrency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">${orderPreview.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Est. Fee (~{(ESTIMATED_FEE_RATE * 100).toFixed(2)}%)</span>
                  <span className="font-mono">-${orderPreview.fees.toFixed(2)}</span>
                </div>
                {orderType === "market" && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Est. Slippage</span>
                    <span className="font-mono">~${orderPreview.slippage.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className={cn(
                "flex items-center justify-between pt-2 border-t text-xs",
                side === "buy" ? "border-trading-buy/20" : "border-trading-sell/20"
              )}>
                <span className="font-semibold">Total Cost</span>
                <span className={cn(
                  "font-mono font-bold text-sm",
                  side === "buy" ? "text-trading-buy" : "text-trading-sell"
                )}>
                  {side === "buy" ? "~" : ""}${orderPreview.totalWithFees.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Enhanced Submit Button */}
          <Button
            type="submit"
            size="sm"
            className={cn(
              "w-full h-10 text-sm font-semibold rounded-lg",
              side === "buy"
                ? "bg-trading-buy hover:bg-trading-buy/90 text-white shadow-lg shadow-trading-buy/25 hover:shadow-trading-buy/40"
                : "bg-trading-sell hover:bg-trading-sell/90 text-white shadow-lg shadow-trading-sell/25 hover:shadow-trading-sell/40"
            )}
            disabled={orderCreating || !amount || amountNum <= 0}
          >
            {orderCreating ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                {side === "buy" ? "Buy" : "Sell"} {baseCurrency}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
